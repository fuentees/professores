"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { questionSchema } from "@/lib/validations/question";

export type ActionResult = { error: string | null; id?: string };

const LIST_PATH = "/admin/questoes";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

async function syncAlternatives(
  questionId: string,
  alternatives: { label: string; body: string; isCorrect: boolean }[],
) {
  const supabase = await createClient();
  await supabase.from("question_alternatives").delete().eq("question_id", questionId);
  if (alternatives.length === 0) return;

  await supabase.from("question_alternatives").insert(
    alternatives.map((alt, index) => ({
      question_id: questionId,
      label: alt.label,
      body: alt.body,
      is_correct: alt.isCorrect,
      order_index: index,
    })),
  );
}

export async function createQuestion(input: unknown): Promise<ActionResult> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      statement: data.statement,
      question_type: data.questionType,
      difficulty: data.difficulty,
      theme_id: data.themeId,
      subtheme_id: data.subthemeId || null,
      answer_key: data.answerKey || null,
      status: data.status,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !question) return { error: error?.message ?? "Não foi possível criar a questão." };

  if (data.questionType === "multiple_choice") {
    await syncAlternatives(question.id, data.alternatives);
  }

  revalidatePath(LIST_PATH);
  return { error: null, id: question.id };
}

export async function updateQuestion(id: string, input: unknown): Promise<ActionResult> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  // Este formulário genérico só grava `status`, nunca `publication_status`
  // — é o único jeito de completar uma questão importada (tema é
  // obrigatório aqui, e a tela de revisão de importação não deixa
  // atribuí-lo), mas não é o fluxo de aprovação. Sem essa checagem, ativar
  // por aqui uma questão ainda em rascunho de importação (publication_
  // status='draft') a deixava sorteável no gerador de provas sem nunca ter
  // passado por "Aprovar" — conteúdo/gabarito não revisado indo pro aluno.
  if (data.status === "active") {
    const { data: current } = await supabase
      .from("questions")
      .select("publication_status")
      .eq("id", id)
      .maybeSingle();
    if (current?.publication_status === "draft") {
      return {
        error:
          "Esta questão ainda não foi aprovada na importação. Revise e aprove em Questões → Importações antes de ativá-la.",
      };
    }
  }

  const { error } = await supabase
    .from("questions")
    .update({
      statement: data.statement,
      question_type: data.questionType,
      difficulty: data.difficulty,
      theme_id: data.themeId,
      subtheme_id: data.subthemeId || null,
      answer_key: data.answerKey || null,
      status: data.status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await syncAlternatives(id, data.questionType === "multiple_choice" ? data.alternatives : []);

  revalidatePath(LIST_PATH);
  revalidatePath(`/admin/questoes/${id}/editar`);
  return { error: null, id };
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();

  // Questões importadas têm imagens extraídas (assets) no bucket privado —
  // sem essa limpeza, a exclusão do banco deixa órfãos no Storage pra
  // sempre. O .docx original NÃO é removido aqui de propósito: ele é
  // histórico da importação (question_imports.storage_path), não da
  // questão — "nunca perder o documento original" vale mesmo que a questão
  // gerada a partir dele seja depois apagada.
  const { data: assets } = await supabase.from("question_assets").select("storage_path").eq("question_id", id);

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: error.message };

  if (assets && assets.length > 0) {
    await supabase.storage.from("private").remove(assets.map((a) => a.storage_path));
  }

  revalidatePath(LIST_PATH);
  return { error: null };
}
