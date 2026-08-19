"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { getExamGenerationQuota } from "@/lib/access/exam-quota";
import { examFiltersSchema, saveExamSchema } from "@/lib/validations/exam-generator";
import type { QuestionType } from "@/types/supabase";

export type ExamQuestion = {
  id: string;
  statement: string;
  questionType: QuestionType;
  difficulty: "easy" | "medium" | "hard";
  answerKey: string | null;
  alternatives: { id: string; label: string; body: string; isCorrect: boolean }[];
};

type DifficultyBuckets = { easy: number; medium: number; hard: number };

export type GeneratePreviewResult = {
  error: string | null;
  questions?: ExamQuestion[];
  requested?: DifficultyBuckets;
  fulfilled?: DifficultyBuckets;
};

export type SwapResult = { error: string | null; question?: ExamQuestion };
export type SaveExamResult = { error: string | null; id?: string };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function pickQuestionIds(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    themeId: string;
    subthemeId?: string;
    difficulty: "easy" | "medium" | "hard";
    types: QuestionType[];
    count: number;
    excludeIds: string[];
  },
): Promise<string[]> {
  if (params.count <= 0 || params.types.length === 0) return [];

  let query = admin
    .from("questions")
    .select("id")
    .eq("theme_id", params.themeId)
    .eq("difficulty", params.difficulty)
    .eq("status", "active")
    .in("question_type", params.types);

  if (params.subthemeId) query = query.eq("subtheme_id", params.subthemeId);
  if (params.excludeIds.length > 0) query = query.not("id", "in", `(${params.excludeIds.join(",")})`);

  const { data } = await query;
  const ids = (data ?? []).map((q) => q.id);
  return shuffle(ids).slice(0, params.count);
}

async function hydrateQuestions(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<ExamQuestion[]> {
  if (ids.length === 0) return [];

  const [{ data: questions }, { data: alternatives }, { data: answers }] = await Promise.all([
    admin.from("questions").select("id, statement, question_type, difficulty, answer_key").in("id", ids),
    admin
      .from("question_alternatives")
      .select("id, question_id, label, body, is_correct, order_index")
      .in("question_id", ids)
      .order("order_index"),
    // questões importadas do banco de questões não preenchem
    // questions.answer_key (o gabarito delas fica em question_answers,
    // possivelmente um registro por parte A/B/C) — busca aqui pra não
    // aparecer "sem resposta cadastrada" indevidamente no gerador de provas.
    admin.from("question_answers").select("question_id, question_part_id, expected_answer").in("question_id", ids),
  ]);

  const partIds = (answers ?? []).map((a) => a.question_part_id).filter((id): id is string => Boolean(id));
  const { data: parts } =
    partIds.length > 0
      ? await admin.from("question_parts").select("id, label, order_index").in("id", partIds)
      : { data: [] as { id: string; label: string; order_index: number }[] };
  const partById = new Map((parts ?? []).map((p) => [p.id, p]));

  const answersByQuestion = new Map<string, { label: string | null; order: number; text: string }[]>();
  for (const a of answers ?? []) {
    const part = a.question_part_id ? partById.get(a.question_part_id) : undefined;
    const list = answersByQuestion.get(a.question_id) ?? [];
    list.push({
      label: part?.label ?? null,
      order: part?.order_index ?? 0,
      text: a.expected_answer,
    });
    answersByQuestion.set(a.question_id, list);
  }

  return (questions ?? []).map((q) => {
    const fallbackParts = (answersByQuestion.get(q.id) ?? []).sort((a, b) => a.order - b.order);
    const fallbackAnswer =
      fallbackParts.length > 0
        ? fallbackParts.map((p) => (p.label ? `${p.label}: ${p.text}` : p.text)).join("\n")
        : null;

    return {
      id: q.id,
      statement: q.statement,
      questionType: q.question_type,
      difficulty: q.difficulty,
      answerKey: q.answer_key ?? fallbackAnswer,
      alternatives: (alternatives ?? [])
        .filter((a) => a.question_id === q.id)
        .map((a) => ({ id: a.id, label: a.label, body: a.body, isCorrect: a.is_correct })),
    };
  });
}

export async function generateExamPreview(input: unknown): Promise<GeneratePreviewResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para gerar uma prova." };

  const parsed = examFiltersSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Filtros inválidos." };
  const filters = parsed.data;

  const admin = createAdminClient();
  const types = filters.questionTypes;

  const requested: DifficultyBuckets = {
    easy: filters.easyCount,
    medium: filters.mediumCount,
    hard: filters.hardCount,
  };
  const picked: Record<"easy" | "medium" | "hard", string[]> = { easy: [], medium: [], hard: [] };
  const excludeSoFar: string[] = [];

  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const ids = await pickQuestionIds(admin, {
      themeId: filters.themeId,
      subthemeId: filters.subthemeId || undefined,
      difficulty,
      types,
      count: requested[difficulty],
      excludeIds: excludeSoFar,
    });
    picked[difficulty] = ids;
    excludeSoFar.push(...ids);
  }

  const fulfilled: DifficultyBuckets = {
    easy: picked.easy.length,
    medium: picked.medium.length,
    hard: picked.hard.length,
  };

  const allIds = [...picked.easy, ...picked.medium, ...picked.hard];
  const questions = await hydrateQuestions(admin, allIds);

  // hydrateQuestions doesn't preserve order — re-order by the picked sequence
  // (grouped by difficulty: fácil, média, difícil).
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = allIds.map((id) => byId.get(id)).filter((q): q is ExamQuestion => Boolean(q));

  return { error: null, questions: ordered, requested, fulfilled };
}

export async function swapExamQuestion(
  excludeIds: string[],
  difficulty: "easy" | "medium" | "hard",
  filters: { themeId: string; subthemeId?: string; questionTypes: QuestionType[] },
): Promise<SwapResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para gerar uma prova." };

  const admin = createAdminClient();
  const types = filters.questionTypes;
  const ids = await pickQuestionIds(admin, {
    themeId: filters.themeId,
    subthemeId: filters.subthemeId,
    difficulty,
    types,
    count: 1,
    excludeIds,
  });

  if (ids.length === 0) {
    return { error: "Não há outra questão disponível com esses filtros." };
  }

  const [question] = await hydrateQuestions(admin, ids);
  return { error: null, question };
}

export async function saveGeneratedExam(input: unknown): Promise<SaveExamResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para salvar a prova." };

  const parsed = saveExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const quota = await getExamGenerationQuota(supabase, profile.id);
  if (quota.limit !== null && quota.used >= quota.limit) {
    return {
      error: `Você atingiu o limite de ${quota.limit} provas geradas este mês. Assine um plano para gerar mais.`,
    };
  }

  // Revalida no servidor: o preview fica no navegador do professor por
  // minutos enquanto ele revisa/troca questões, então os ids recebidos
  // podem se referir a questões desativadas nesse meio tempo.
  const admin = createAdminClient();
  const { data: validQuestions } = await admin
    .from("questions")
    .select("id")
    .in("id", data.questionIds)
    .eq("status", "active");
  const validIds = new Set((validQuestions ?? []).map((q) => q.id));
  if (data.questionIds.some((id) => !validIds.has(id))) {
    return { error: "Uma ou mais questões não estão mais disponíveis. Gere a prévia novamente." };
  }

  // create_generated_exam insere a prova + os vínculos de questão + o
  // evento de cota numa única transação (RPC, security invoker) — uma
  // falha no meio não deixa mais a prova salva pela metade nem loga uma
  // geração que não existe.
  const { data: examId, error } = await supabase.rpc("create_generated_exam", {
    p_title: data.title,
    p_theme_id: data.themeId,
    p_school_name: data.schoolName || null,
    p_instructions: data.instructions || null,
    p_show_answer_key: data.showAnswerKey,
    p_question_ids: data.questionIds,
  });

  if (error || !examId) return { error: error?.message ?? "Não foi possível salvar a prova." };

  revalidatePath("/painel/provas");
  return { error: null, id: examId };
}

export async function updateGeneratedExam(examId: string, input: unknown): Promise<SaveExamResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para editar a prova." };

  const parsed = saveExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;

  const admin = createAdminClient();
  const { data: validQuestions } = await admin
    .from("questions")
    .select("id")
    .in("id", data.questionIds)
    .eq("status", "active");
  const validIds = new Set((validQuestions ?? []).map((q) => q.id));
  if (data.questionIds.some((id) => !validIds.has(id))) {
    return { error: "Uma ou mais questões não estão mais disponíveis. Gere a prévia novamente." };
  }

  const supabase = await createClient();
  const { data: updatedId, error } = await supabase.rpc("update_generated_exam", {
    p_exam_id: examId,
    p_title: data.title,
    p_school_name: data.schoolName || null,
    p_instructions: data.instructions || null,
    p_show_answer_key: data.showAnswerKey,
    p_question_ids: data.questionIds,
  });

  if (error || !updatedId) return { error: error?.message ?? "Prova não encontrada." };

  revalidatePath("/painel/provas");
  revalidatePath(`/painel/provas/${examId}`);
  return { error: null, id: updatedId };
}

export type GeneratedExamDetail = {
  id: string;
  title: string;
  themeId: string | null;
  schoolName: string | null;
  instructions: string | null;
  showAnswerKey: boolean;
  createdAt: string;
};

export type ExamDetailResult = {
  error: string | null;
  exam?: GeneratedExamDetail;
  questions?: ExamQuestion[];
};

/**
 * Busca uma prova salva do professor logado com as questões completas.
 * `questions`/`question_alternatives` não são legíveis via RLS pelo
 * professor (só admin) — por isso a hidratação passa pelo admin client
 * aqui, depois de confirmar (via RLS) que a prova pertence a ele.
 */
export async function getGeneratedExamDetail(examId: string): Promise<ExamDetailResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para ver esta prova." };

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("generated_exams")
    .select("id, title, theme_id, school_name, instructions, show_answer_key, created_at")
    .eq("id", examId)
    .eq("teacher_id", profile.id)
    .maybeSingle();

  if (!exam) return { error: "Prova não encontrada." };

  const { data: links } = await supabase
    .from("generated_exam_questions")
    .select("question_id")
    .eq("exam_id", examId)
    .order("order_index");

  const admin = createAdminClient();
  const questions = await hydrateQuestions(admin, (links ?? []).map((l) => l.question_id));
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = (links ?? [])
    .map((l) => byId.get(l.question_id))
    .filter((q): q is ExamQuestion => Boolean(q));

  return {
    error: null,
    exam: {
      id: exam.id,
      title: exam.title,
      themeId: exam.theme_id,
      schoolName: exam.school_name,
      instructions: exam.instructions,
      showAnswerKey: exam.show_answer_key,
      createdAt: exam.created_at,
    },
    questions: ordered,
  };
}

export async function deleteGeneratedExam(examId: string): Promise<SaveExamResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login." };

  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("generated_exams")
    .delete()
    .eq("id", examId)
    .eq("teacher_id", profile.id)
    .select("id");

  if (error || !deleted || deleted.length === 0) {
    return { error: error?.message ?? "Prova não encontrada." };
  }
  revalidatePath("/painel/provas");
  return { error: null };
}
