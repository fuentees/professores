"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { loadSelectedQuestions, type ExamQuestion } from "@/actions/exam-generator";
import { MAX_QUESTIONS_PER_EXAM } from "@/lib/validations/exam-generator";

const nameSchema = z.string().trim().min(2, "Dê um nome com pelo menos 2 caracteres.").max(80, "Use no máximo 80 caracteres.");
const idsSchema = z.array(z.uuid()).min(1, "Selecione pelo menos uma questão.").max(MAX_QUESTIONS_PER_EXAM);

export type QuestionCollectionSummary = {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionCollectionDetail = QuestionCollectionSummary & {
  questions: ExamQuestion[];
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

export async function getQuestionCollections(): Promise<QuestionCollectionSummary[]> {
  const profile = await requireActiveProfile();
  if (!profile) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("question_collections")
    .select("id, name, created_at, updated_at, question_collection_items(id)")
    .eq("teacher_id", profile.id)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((collection) => ({
    id: collection.id,
    name: collection.name,
    questionCount: collection.question_collection_items.length,
    createdAt: collection.created_at,
    updatedAt: collection.updated_at,
  }));
}

export async function getQuestionCollectionDetail(
  collectionId: string,
): Promise<{ error: string | null; collection?: QuestionCollectionDetail }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para abrir este caderno." };
  if (!z.uuid().safeParse(collectionId).success) return { error: "Caderno inválido." };

  const admin = createAdminClient();
  const { data: collection } = await admin
    .from("question_collections")
    .select("id, name, created_at, updated_at, question_collection_items(question_id, order_index)")
    .eq("id", collectionId)
    .eq("teacher_id", profile.id)
    .maybeSingle()
    .returns<{
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      question_collection_items: { question_id: string; order_index: number }[];
    }>();
  if (!collection) return { error: "Caderno não encontrado." };

  const questionIds = [...collection.question_collection_items]
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => item.question_id);
  const selected = await loadSelectedQuestions(questionIds);
  if (selected.error || !selected.questions) return { error: selected.error ?? "Não foi possível abrir as questões." };

  return {
    error: null,
    collection: {
      id: collection.id,
      name: collection.name,
      questionCount: selected.questions.length,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
      questions: selected.questions,
    },
  };
}

export async function createQuestionCollection(
  name: string,
  questionIds: string[],
): Promise<{ error: string | null; id?: string }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para salvar um caderno." };
  const parsedName = nameSchema.safeParse(name);
  const parsedIds = idsSchema.safeParse(uniqueIds(questionIds));
  if (!parsedName.success) return { error: parsedName.error.issues[0]?.message ?? "Nome inválido." };
  if (!parsedIds.success) return { error: parsedIds.error.issues[0]?.message ?? "Seleção inválida." };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_question_collection", {
    p_name: parsedName.data,
    p_question_ids: parsedIds.data,
  });
  if (error || !id) return { error: error?.message ?? "Não foi possível salvar o caderno." };
  revalidatePath("/painel/cadernos");
  return { error: null, id };
}

export async function updateQuestionCollection(
  collectionId: string,
  name: string,
  questionIds: string[],
): Promise<{ error: string | null; id?: string }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para editar o caderno." };
  if (!z.uuid().safeParse(collectionId).success) return { error: "Caderno inválido." };
  const parsedName = nameSchema.safeParse(name);
  const parsedIds = idsSchema.safeParse(uniqueIds(questionIds));
  if (!parsedName.success) return { error: parsedName.error.issues[0]?.message ?? "Nome inválido." };
  if (!parsedIds.success) return { error: parsedIds.error.issues[0]?.message ?? "Seleção inválida." };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("update_question_collection", {
    p_collection_id: collectionId,
    p_name: parsedName.data,
    p_question_ids: parsedIds.data,
  });
  if (error || !id) return { error: error?.message ?? "Não foi possível atualizar o caderno." };
  revalidatePath("/painel/cadernos");
  revalidatePath(`/painel/cadernos/${collectionId}`);
  return { error: null, id };
}

export async function addQuestionsToCollection(
  collectionId: string,
  questionIds: string[],
): Promise<{ error: string | null; id?: string }> {
  const detail = await getQuestionCollectionDetail(collectionId);
  if (detail.error || !detail.collection) return { error: detail.error ?? "Caderno não encontrado." };
  const merged = uniqueIds([...detail.collection.questions.map((question) => question.id), ...questionIds]);
  if (merged.length > MAX_QUESTIONS_PER_EXAM) {
    return { error: `Esse caderno ultrapassaria o limite de ${MAX_QUESTIONS_PER_EXAM} questões.` };
  }
  return updateQuestionCollection(collectionId, detail.collection.name, merged);
}

export async function deleteQuestionCollection(collectionId: string): Promise<{ error: string | null }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para excluir o caderno." };
  if (!z.uuid().safeParse(collectionId).success) return { error: "Caderno inválido." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("question_collections")
    .delete()
    .eq("id", collectionId)
    .eq("teacher_id", profile.id)
    .select("id");
  if (error || !data?.length) return { error: "Caderno não encontrado." };
  revalidatePath("/painel/cadernos");
  return { error: null };
}
