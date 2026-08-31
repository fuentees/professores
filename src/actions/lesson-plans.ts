"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { createStructuredResponse, AiConfigurationError, AiProviderError } from "@/lib/ai/openai";
import { lessonPlanJsonSchema } from "@/lib/ai/json-schemas";
import {
  lessonPlanInputSchema,
  lessonPlanOutputSchema,
  type LessonPlanOutput,
} from "@/lib/ai/schemas";
import { hasReachedAiRateLimit } from "@/lib/ai/usage";

type BnccCandidate = {
  id: string;
  code: string;
  description: string;
  thematic_unit: string | null;
  knowledge_object: string | null;
  bncc_components: { name: string } | null;
};

export type GenerateLessonPlanResult = {
  error: string | null;
  id?: string;
  bnccSkillsFound?: number;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isMatchingComponent(subjectName: string, componentName: string) {
  const subject = normalize(subjectName);
  const component = normalize(componentName);
  if (subject.includes(component) || component.includes(subject)) return true;
  const aliases: Record<string, string[]> = {
    portugues: ["linguaportuguesa"],
    linguaportuguesa: ["portugues"],
    artes: ["arte"],
    ciencias: ["cienciasdanatureza"],
    ingles: ["linguainglesa"],
    educacaofisica: ["educacaofisica"],
  };
  return (aliases[subject] ?? []).includes(component);
}

function friendlyAiError(error: unknown) {
  if (error instanceof AiConfigurationError || error instanceof AiProviderError) return error.message;
  if (error instanceof Error && error.name === "TimeoutError") return "A IA demorou mais que o esperado. Tente novamente.";
  return "Não foi possível gerar o planejamento agora.";
}

export async function generateLessonPlan(input: unknown): Promise<GenerateLessonPlanResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para criar um planejamento." };

  const parsed = lessonPlanInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados informados." };
  const data = parsed.data;
  const admin = createAdminClient();

  if (await hasReachedAiRateLimit(admin, profile.id)) {
    return { error: "Você fez muitas gerações em pouco tempo. Aguarde uma hora para continuar." };
  }

  const [{ data: subject }, { data: grade }, { data: candidateRows }] = await Promise.all([
    admin.from("subjects").select("id, name").eq("id", data.subjectId).eq("status", "active").maybeSingle(),
    admin.from("grades").select("id, name").eq("id", data.gradeId).eq("status", "active").maybeSingle(),
    admin
      .from("bncc_skills")
      .select("id, code, description, thematic_unit, knowledge_object, bncc_components(name)")
      .eq("grade_id", data.gradeId)
      .eq("status", "active")
      .limit(120)
      .returns<BnccCandidate[]>(),
  ]);

  if (!subject || !grade) return { error: "Disciplina ou série não encontrada." };

  const candidates = (candidateRows ?? []).filter((skill) =>
    skill.bncc_components?.name ? isMatchingComponent(subject.name, skill.bncc_components.name) : false,
  );
  const candidateByCode = new Map(candidates.map((skill) => [skill.code.toUpperCase(), skill]));
  const bnccContext = candidates.length
    ? candidates.map((skill) =>
        `${skill.code} — ${skill.description}${skill.knowledge_object ? ` | Objeto: ${skill.knowledge_object}` : ""}`,
      ).join("\n")
    : "Nenhuma habilidade BNCC cadastrada para esta combinação. Retorne bnccCodes como lista vazia.";

  try {
    const response = await createStructuredResponse({
      profileId: profile.id,
      schemaName: "lesson_plan",
      jsonSchema: lessonPlanJsonSchema,
      validator: lessonPlanOutputSchema,
      instructions: [
        "Você é um especialista em planejamento pedagógico brasileiro.",
        "Crie um plano de aula prático, executável e apropriado à série informada, em português do Brasil.",
        "Use apenas códigos BNCC que apareçam na lista fornecida. Nunca invente, complete ou altere códigos.",
        "Se a lista estiver vazia ou nenhuma habilidade for pertinente, retorne bnccCodes vazio.",
        "Distribua o tempo entre as etapas de modo compatível com a duração total.",
        "Adaptações inclusivas devem ser específicas, respeitosas e úteis; não faça diagnósticos.",
        "O professor revisará o resultado antes de usar.",
      ].join(" "),
      content: [{
        type: "input_text",
        text: [
          `Disciplina: ${subject.name}`,
          `Série: ${grade.name}`,
          `Tema central: ${data.theme}`,
          `Duração total: ${data.durationMinutes} minutos em ${data.classCount} aula(s)` ,
          `Objetivos informados pelo professor: ${data.teacherObjectives || "não informado"}`,
          `Perfis de inclusão: ${data.inclusionProfiles.join(", ") || "nenhum informado"}`,
          `Contexto da turma: ${data.classContext || "não informado"}`,
          `Recursos disponíveis: ${data.resources || "não informado"}`,
          "Habilidades BNCC permitidas:",
          bnccContext,
        ].join("\n"),
      }],
    });

    const safeCodes = [...new Set(response.data.bnccCodes.map((code) => code.toUpperCase()))]
      .filter((code) => candidateByCode.has(code));
    const output: LessonPlanOutput = { ...response.data, bnccCodes: safeCodes };

    const { data: plan, error: insertError } = await admin
      .from("lesson_plans")
      .insert({
        teacher_id: profile.id,
        title: output.title,
        subject_id: subject.id,
        grade_id: grade.id,
        theme: data.theme,
        duration_minutes: data.durationMinutes,
        class_count: data.classCount,
        inclusion_profiles: data.inclusionProfiles,
        class_context: data.classContext || null,
        teacher_objectives: data.teacherObjectives || null,
        output,
        model: response.model,
      })
      .select("id")
      .single();

    if (insertError || !plan) return { error: "O planejamento foi gerado, mas não pôde ser salvo." };

    const skillLinks = safeCodes.map((code) => ({
      lesson_plan_id: plan.id,
      bncc_skill_id: candidateByCode.get(code)!.id,
    }));
    if (skillLinks.length) await admin.from("lesson_plan_bncc_skills").insert(skillLinks);

    await admin.from("ai_generation_events").insert({
      teacher_id: profile.id,
      feature: "lesson_plan",
      resource_id: plan.id,
      model: response.model,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
    });

    revalidatePath("/painel/planejamentos");
    revalidatePath("/painel");
    return { error: null, id: plan.id, bnccSkillsFound: candidates.length };
  } catch (error) {
    return { error: friendlyAiError(error), bnccSkillsFound: candidates.length };
  }
}

export async function updateLessonPlan(planId: string, output: unknown): Promise<{ error: string | null }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para editar o planejamento." };
  if (!/^[0-9a-f-]{36}$/i.test(planId)) return { error: "Planejamento inválido." };

  const parsed = lessonPlanOutputSchema.safeParse(output);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise o conteúdo." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .update({ title: parsed.data.title, output: parsed.data })
    .eq("id", planId)
    .eq("teacher_id", profile.id)
    .select("id");
  if (error || !data?.length) return { error: "Planejamento não encontrado." };

  revalidatePath("/painel/planejamentos");
  revalidatePath(`/painel/planejamentos/${planId}`);
  return { error: null };
}

export async function deleteLessonPlan(planId: string): Promise<{ error: string | null }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login." };
  if (!/^[0-9a-f-]{36}$/i.test(planId)) return { error: "Planejamento inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", planId)
    .eq("teacher_id", profile.id)
    .select("id");
  if (error || !data?.length) return { error: "Planejamento não encontrado." };
  revalidatePath("/painel/planejamentos");
  return { error: null };
}
