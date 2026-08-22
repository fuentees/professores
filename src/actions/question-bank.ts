"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";
import type { BloomTaxonomyLevel, ContentDifficulty, QuestionType } from "@/types/supabase";
import { getSearchTokens, toPostgrestSearchToken } from "@/lib/search";

export type QuestionCard = {
  id: string;
  code: string | null;
  title: string | null;
  statement: string;
  questionType: string;
  difficulty: string;
  bloomPrimaryLevel: string | null;
  subjectName: string | null;
  gradeName: string | null;
  bnccCodes: string[];
  hasOriginalFile: boolean;
};

export type QuestionSearchFilters = {
  q?: string;
  gradeId?: string;
  /** Quando só o nível de ensino é escolhido (sem série específica). */
  gradeIds?: string[];
  subjectId?: string;
  academicPeriodId?: string;
  difficulty?: string;
  bloomLevel?: string;
  questionType?: string;
  bnccSkillId?: string;
  source?: "word" | "manual";
  page?: number;
  pageSize?: number;
};

const QUESTION_BANK_PAGE_SIZE = 24;

/**
 * `questions`/`question_*` nunca são lidas via RLS pelo professor (vazaria
 * gabarito/rubrica de questões que ele não deveria ver ainda) — mesmo
 * padrão de `hydrateQuestions` no gerador de provas: Server Action com
 * createAdminClient(), filtro explícito em código, nunca RLS direta.
 */
export async function searchQuestions(
  filters: QuestionSearchFilters,
): Promise<{ error: string | null; questions: QuestionCard[]; total: number; page: number; totalPages: number }> {
  const admin = createAdminClient();
  const pageSize = Math.min(5000, Math.max(1, filters.pageSize ?? QUESTION_BANK_PAGE_SIZE));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const from = (page - 1) * pageSize;

  // Filtro por BNCC precisa resolver o conjunto de ids ANTES do .limit() da
  // query principal — senão a busca aplicava esse filtro só nos 24
  // resultados já paginados, podendo devolver menos questões do que
  // realmente existem (ou nenhuma) mesmo havendo mais correspondências.
  let bnccQuestionIds: string[] | null = null;
  if (filters.bnccSkillId) {
    const { data: linkedIds } = await admin
      .from("question_bncc_skills")
      .select("question_id")
      .eq("bncc_skill_id", filters.bnccSkillId);
    bnccQuestionIds = (linkedIds ?? []).map((l) => l.question_id);
    if (bnccQuestionIds.length === 0) return { error: null, questions: [], total: 0, page, totalPages: 0 };
  }

  let query = admin
    .from("questions")
    .select(
      `id, code, title, statement, question_type, difficulty, bloom_primary_level, original_file_path,
      subjects(name), grades(name),
      question_bncc_skills(bncc_skills(code))`,
      { count: "exact" },
    )
    .eq("status", "active")
    .eq("publication_status", "published")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.gradeId) query = query.eq("grade_id", filters.gradeId);
  else if (filters.gradeIds && filters.gradeIds.length > 0) query = query.in("grade_id", filters.gradeIds);
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters.academicPeriodId) query = query.eq("academic_period_id", filters.academicPeriodId);
  // Vêm de query params de URL (texto livre do navegador) — cast seguro:
  // um valor que não bate com nenhum enum simplesmente não encontra nada.
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty as ContentDifficulty);
  if (filters.bloomLevel) query = query.eq("bloom_primary_level", filters.bloomLevel as BloomTaxonomyLevel);
  if (filters.questionType === "open_response") query = query.in("question_type", ["essay", "discursive"]);
  else if (filters.questionType) query = query.eq("question_type", filters.questionType as QuestionType);
  if (filters.source === "word") query = query.not("original_file_path", "is", null);
  if (filters.source === "manual") query = query.is("original_file_path", null);
  if (filters.q) {
    const tokens = getSearchTokens(filters.q).map(toPostgrestSearchToken).filter(Boolean);
    if (tokens.length > 0) {
      const searchableColumns = ["title", "statement", "code", "pedagogical_note", "original_file_path"];
      query = query.or(
        tokens.flatMap((token) => searchableColumns.map((column) => `${column}.ilike.%${token}%`)).join(","),
      );
    }
  }
  if (bnccQuestionIds) query = query.in("id", bnccQuestionIds);

  const { data, count, error } = await query.returns<
    {
      id: string;
      code: string | null;
      title: string | null;
      statement: string;
      question_type: string;
      difficulty: string;
      bloom_primary_level: string | null;
      original_file_path: string | null;
      subjects: { name: string } | null;
      grades: { name: string } | null;
      question_bncc_skills: { bncc_skills: { code: string } | null }[];
    }[]
  >();

  if (error) return { error: error.message, questions: [], total: 0, page, totalPages: 0 };

  const cards: QuestionCard[] = (data ?? []).map((q) => ({
    id: q.id,
    code: q.code,
    title: q.title,
    statement: q.statement,
    questionType: q.question_type,
    difficulty: q.difficulty,
    bloomPrimaryLevel: q.bloom_primary_level,
    subjectName: q.subjects?.name ?? null,
    gradeName: q.grades?.name ?? null,
    bnccCodes: q.question_bncc_skills.map((s) => s.bncc_skills?.code).filter((c): c is string => Boolean(c)),
    hasOriginalFile: Boolean(q.original_file_path),
  }));

  const total = count ?? cards.length;
  return { error: null, questions: cards, total, page, totalPages: Math.ceil(total / pageSize) };
}

export type QuestionNavigation = {
  previous: { id: string; label: string } | null;
  next: { id: string; label: string } | null;
  position: number;
  total: number;
};

/** Mantém anterior/próxima dentro da mesma busca que trouxe o professor ao detalhe. */
export async function getQuestionNavigation(
  questionId: string,
  filters: QuestionSearchFilters & { educationLevelId?: string },
): Promise<QuestionNavigation | null> {
  let gradeIds = filters.gradeIds;
  if (filters.educationLevelId && !filters.gradeId) {
    const admin = createAdminClient();
    const { data: grades } = await admin
      .from("grades")
      .select("id")
      .eq("education_level_id", filters.educationLevelId);
    gradeIds = (grades ?? []).map((grade) => grade.id);
  }

  const result = await searchQuestions({ ...filters, gradeIds, page: 1, pageSize: 5000 });
  const index = result.questions.findIndex((question) => question.id === questionId);
  if (result.error || index < 0) return null;

  const label = (question: QuestionCard) => question.code || question.title || "Questão";
  const previous = result.questions[index - 1];
  const next = result.questions[index + 1];
  return {
    previous: previous ? { id: previous.id, label: label(previous) } : null,
    next: next ? { id: next.id, label: label(next) } : null,
    position: index + 1,
    total: result.total,
  };
}

export type QuestionDetail = QuestionCard & {
  knowledgeObjects: string[];
  bookName: string | null;
  bookUnit: string | null;
  pedagogicalNote: string | null;
  bloomJustification: string | null;
  accessType: string;
  parts: { id: string; label: string; prompt: string; orderIndex: number }[];
  answers: { partId: string | null; expectedAnswer: string; correctionGuidance: string | null }[];
  rubrics: { partId: string | null; level: string; points: number | null; criteria: string; orderIndex: number }[];
};

/**
 * Detalhe completo (com gabarito/rubrica) — exige professor autenticado com
 * perfil ativo. `access_type` da questão não entra aqui: ele só governa o
 * download do Word original, não a visibilidade da questão em si.
 */
export async function getQuestionDetail(id: string): Promise<{ error: string | null; question?: QuestionDetail }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para ver esta questão." };

  type QuestionDetailRow = {
    id: string;
    code: string | null;
    title: string | null;
    statement: string;
    question_type: string;
    difficulty: string;
    bloom_primary_level: string | null;
    bloom_justification: string | null;
    pedagogical_note: string | null;
    knowledge_objects: string[] | null;
    book_name: string | null;
    book_unit: string | null;
    access_type: string;
    original_file_path: string | null;
    subjects: { name: string } | null;
    grades: { name: string } | null;
    question_bncc_skills: { bncc_skills: { code: string } | null }[];
    question_parts: { id: string; label: string; prompt: string; order_index: number }[];
    question_answers: { question_part_id: string | null; expected_answer: string; correction_guidance: string | null }[];
    question_rubrics: {
      question_part_id: string | null;
      level: string;
      points: number | null;
      criteria: string;
      order_index: number;
    }[];
  };

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select(
      `id, code, title, statement, question_type, difficulty, bloom_primary_level, bloom_justification,
      pedagogical_note, knowledge_objects, book_name, book_unit, access_type, original_file_path,
      subjects(name), grades(name),
      question_bncc_skills(bncc_skills(code)),
      question_parts(id, label, prompt, order_index),
      question_answers(question_part_id, expected_answer, correction_guidance),
      question_rubrics(question_part_id, level, points, criteria, order_index)`,
    )
    .eq("id", id)
    .eq("status", "active")
    .eq("publication_status", "published")
    .maybeSingle()
    .returns<QuestionDetailRow>();

  if (!question) return { error: "Questão não encontrada." };

  return {
    error: null,
    question: {
      id: question.id,
      code: question.code,
      title: question.title,
      statement: question.statement,
      questionType: question.question_type,
      difficulty: question.difficulty,
      bloomPrimaryLevel: question.bloom_primary_level,
      subjectName: question.subjects?.name ?? null,
      gradeName: question.grades?.name ?? null,
      bnccCodes: question.question_bncc_skills.map((s) => s.bncc_skills?.code).filter((c): c is string => Boolean(c)),
      knowledgeObjects: question.knowledge_objects ?? [],
      bookName: question.book_name,
      bookUnit: question.book_unit,
      pedagogicalNote: question.pedagogical_note,
      bloomJustification: question.bloom_justification,
      accessType: question.access_type,
      hasOriginalFile: Boolean(question.original_file_path),
      parts: question.question_parts
        .sort((a, b) => a.order_index - b.order_index)
        .map((p) => ({ id: p.id, label: p.label, prompt: p.prompt, orderIndex: p.order_index })),
      answers: question.question_answers.map((a) => ({
        partId: a.question_part_id,
        expectedAnswer: a.expected_answer,
        correctionGuidance: a.correction_guidance,
      })),
      rubrics: question.question_rubrics
        .sort((a, b) => a.order_index - b.order_index)
        .map((r) => ({
          partId: r.question_part_id,
          level: r.level,
          points: r.points,
          criteria: r.criteria,
          orderIndex: r.order_index,
        })),
    },
  };
}

export async function getQuestionOriginalUrl(id: string): Promise<{ error: string | null; url?: string }> {
  const profile = await getCurrentProfile();
  if (profile && profile.status !== "active") return { error: "Sua conta está bloqueada." };

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select("id, code, title, original_file_path, access_type")
    .eq("id", id)
    .eq("status", "active")
    .eq("publication_status", "published")
    .maybeSingle();

  if (!question || !question.original_file_path) return { error: "Arquivo original não disponível." };

  const entitled = await canAccessResource(admin, profile, {
    accessType: question.access_type as ResourceAccessType,
  });
  if (!entitled) return { error: "Faça login para baixar o arquivo original." };

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(question.original_file_path, 60);
  if (error || !signed) return { error: "Não foi possível gerar o link de download." };

  if (profile) {
    await admin.from("download_events").insert({
      teacher_id: profile.id,
      resource_type: "question",
      resource_id: question.id,
      resource_title: question.title || question.code || "Questão",
      resource_href: `/painel/banco-de-questoes/${question.id}`,
      file_name: question.original_file_path.split("/").pop() ?? "questao.docx",
    });
    revalidatePath("/painel");
    revalidatePath("/painel/downloads");
  }

  return { error: null, url: signed.signedUrl };
}

export async function toggleQuestionFavorite(questionId: string): Promise<{ error: string | null }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para favoritar." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("question_favorites")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    await supabase.from("question_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("question_favorites").insert({ teacher_id: profile.id, question_id: questionId });
  }

  revalidatePath("/painel/banco-de-questoes");
  return { error: null };
}
