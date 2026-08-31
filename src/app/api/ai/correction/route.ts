import { NextResponse } from "next/server";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStructuredResponse, AiConfigurationError, AiProviderError } from "@/lib/ai/openai";
import { correctionJsonSchema } from "@/lib/ai/json-schemas";
import { correctionInputSchema, correctionOutputSchema } from "@/lib/ai/schemas";
import { hasReachedAiRateLimit } from "@/lib/ai/usage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const profile = await requireActiveProfile();
  if (!profile) return NextResponse.json({ error: "Faça login para usar o corretor." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const parsed = correctionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revise os dados." }, { status: 400 });
  }

  const data = parsed.data;
  const mime = data.imageDataUrl.slice(5, data.imageDataUrl.indexOf(";"));
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    return NextResponse.json({ error: "Envie uma foto JPG, PNG ou WebP." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (await hasReachedAiRateLimit(admin, profile.id)) {
    return NextResponse.json(
      { error: "Você fez muitas análises em pouco tempo. Aguarde uma hora para continuar." },
      { status: 429 },
    );
  }

  const [{ data: subject }, { data: grade }] = await Promise.all([
    data.subjectId ? admin.from("subjects").select("id, name").eq("id", data.subjectId).maybeSingle() : { data: null },
    data.gradeId ? admin.from("grades").select("id, name").eq("id", data.gradeId).maybeSingle() : { data: null },
  ]);

  const modeInstructions = data.correctionType === "essay"
    ? [
        "Analise a redação sem presumir que ela segue o ENEM, a menos que o contexto diga isso.",
        "Avalie clareza, coerência, coesão, argumentação, adequação linguística e atendimento ao tema.",
        "Não atribua nota se a imagem estiver incompleta ou se não houver critérios suficientes; use null.",
      ]
    : [
        "Identifique o enunciado e a resposta do aluno, resolva a questão e explique passo a passo.",
        "Se não houver resposta do aluno visível, apresente a solução sugerida e marque revisão do professor.",
        "Não atribua nota quando o valor da questão ou o critério não estiver visível; use null.",
      ];

  try {
    const response = await createStructuredResponse({
      profileId: profile.id,
      schemaName: "teacher_correction",
      jsonSchema: correctionJsonSchema,
      validator: correctionOutputSchema,
      maxOutputTokens: 4500,
      instructions: [
        "Você auxilia professores brasileiros a revisar atividades, nunca substitui o julgamento pedagógico final.",
        "Transcreva somente o que estiver legível e sinalize incerteza. Não invente partes cortadas ou ilegíveis.",
        "Dê feedback respeitoso, específico e acionável, apropriado à série.",
        "Quando houver ambiguidade, baixa legibilidade ou conteúdo sensível, marque needsTeacherReview como true.",
        ...modeInstructions,
      ].join(" "),
      content: [
        {
          type: "input_text",
          text: [
            `Tipo: ${data.correctionType === "essay" ? "redação" : "exercício"}`,
            `Disciplina: ${subject?.name ?? "não informada"}`,
            `Série: ${grade?.name ?? "não informada"}`,
            `Contexto ou critérios do professor: ${data.context || "não informado"}`,
            "Analise a imagem anexada.",
          ].join("\n"),
        },
        { type: "input_image", image_url: data.imageDataUrl, detail: "high" },
      ],
    });

    const { data: correction, error: saveError } = await admin
      .from("ai_corrections")
      .insert({
        teacher_id: profile.id,
        correction_type: data.correctionType,
        subject_id: subject?.id ?? null,
        grade_id: grade?.id ?? null,
        title: response.data.title,
        teacher_context: data.context || null,
        output: response.data,
        model: response.model,
      })
      .select("id")
      .single();

    if (saveError || !correction) {
      return NextResponse.json({ error: "A correção foi concluída, mas não pôde ser salva." }, { status: 500 });
    }

    await admin.from("ai_generation_events").insert({
      teacher_id: profile.id,
      feature: data.correctionType === "essay" ? "essay_correction" : "exercise_correction",
      resource_id: correction.id,
      model: response.model,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
    });

    return NextResponse.json({ id: correction.id, correction: response.data });
  } catch (error) {
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof AiProviderError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "A IA demorou mais que o esperado. Tente novamente." }, { status: 504 });
    }
    return NextResponse.json({ error: "Não foi possível analisar a imagem agora." }, { status: 500 });
  }
}
