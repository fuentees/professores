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
  // Questões importadas do banco de questões costumam ter itens A/B/C
  // estruturados à parte do enunciado (question_parts) — sem isso, a
  // única opção era mostrar o `statement` bruto inteiro (que pode vir com
  // formatação corrida do .docx original), sem separar os itens.
  parts: { id: string; label: string; prompt: string; orderIndex: number }[];
  // Imagens de conteúdo do .docx original (question_document_blocks +
  // question_assets) — extraídas pelo importador desde uma sessão anterior,
  // mas nunca chegavam ao gerador de provas: uma questão com foto (ex.:
  // "observe a imagem a seguir") aparecia sem a imagem em lugar nenhum.
  images: { url: string; altText: string | null }[];
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

/**
 * Questões cadastradas manualmente só têm `theme_id` (subject_id/grade_id
 * ficam null nelas) — quando o professor não escolhe um tema específico
 * (fluxo normal agora que tema é opcional), a única forma de incluir esse
 * acervo na busca por disciplina+série é resolver de antemão quais temas
 * pertencem a essa disciplina+série. Sem isso, ficam invisíveis do mesmo
 * jeito que o acervo importado ficava antes de tema virar opcional.
 */
async function resolveThemeIdsForSubjectGrade(
  admin: ReturnType<typeof createAdminClient>,
  subjectId: string,
  gradeId: string,
): Promise<string[]> {
  const { data: units } = await admin
    .from("curriculum_units")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("grade_id", gradeId);
  const unitIds = (units ?? []).map((u) => u.id);
  if (unitIds.length === 0) return [];

  const { data: themes } = await admin.from("themes").select("id").in("curriculum_unit_id", unitIds);
  return (themes ?? []).map((t) => t.id);
}

async function pickQuestionIds(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    gradeId: string;
    subjectId: string;
    themeId?: string;
    subthemeId?: string;
    /** Temas que pertencem à disciplina+série, resolvidos uma vez fora do
     * loop de dificuldade (ver resolveThemeIdsForSubjectGrade) — só usado
     * quando nenhum tema específico foi escolhido. */
    fallbackThemeIds?: string[];
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
    .eq("difficulty", params.difficulty)
    .eq("status", "active")
    .in("question_type", params.types);

  // Duas eras de dado convivem em `questions`: cadastro manual (sempre com
  // theme_id, subject_id/grade_id ficam null) e importação do banco de
  // questões via .docx (subject_id/grade_id preenchidos, mas o importador
  // nunca vincula tema automaticamente — fica pendente de revisão manual).
  // Filtrar só por um dos dois excluía o outro grupo inteiro. Casa
  // qualquer um dos dois em qualquer cenário (tema escolhido ou não).
  if (params.subthemeId) {
    query = query.eq("subtheme_id", params.subthemeId);
  } else if (params.themeId) {
    query = query.or(
      `theme_id.eq.${params.themeId},and(subject_id.eq.${params.subjectId},grade_id.eq.${params.gradeId})`,
    );
  } else if (params.fallbackThemeIds && params.fallbackThemeIds.length > 0) {
    query = query.or(
      `theme_id.in.(${params.fallbackThemeIds.join(",")}),and(subject_id.eq.${params.subjectId},grade_id.eq.${params.gradeId})`,
    );
  } else {
    query = query.eq("subject_id", params.subjectId).eq("grade_id", params.gradeId);
  }

  if (params.excludeIds.length > 0) query = query.not("id", "in", `(${params.excludeIds.join(",")})`);

  const { data } = await query;
  const ids = (data ?? []).map((q) => q.id);
  return shuffle(ids).slice(0, params.count);
}

// .emf/.wmf (metarquivos do Windows) não renderizam em nenhum navegador nem
// no Word — mesmo tratamento de question-document-blocks.ts (painel do
// professor), aqui aplicado às imagens que entram no gerador de provas.
const UNSUPPORTED_IMAGE_EXTENSIONS = [".emf", ".wmf"];

/**
 * Imagens de conteúdo por questão, na ordem em que apareciam no documento
 * original — só da base_text/statement (nunca da seção de correção, que
 * pode ter imagens só relevantes pro gabarito/rubrica do admin, nunca pra
 * prova impressa/exportada pro aluno).
 */
async function fetchQuestionImages(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<Map<string, { url: string; altText: string | null }[]>> {
  const result = new Map<string, { url: string; altText: string | null }[]>();
  if (ids.length === 0) return result;

  const { data: blocks } = await admin
    .from("question_document_blocks")
    .select("question_id, section, content, order_index")
    .in("question_id", ids)
    .eq("block_type", "image")
    .neq("section", "correction")
    .order("order_index");
  if (!blocks || blocks.length === 0) return result;

  const assetIds = [
    ...new Set(
      blocks
        .map((b) => (b.content as { assetId?: string } | null)?.assetId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (assetIds.length === 0) return result;

  const { data: assets } = await admin
    .from("question_assets")
    .select("id, storage_path, alt_text")
    .in("id", assetIds);
  const assetById = new Map((assets ?? []).map((a) => [a.id, a]));

  const paths = (assets ?? [])
    .filter((a) => !UNSUPPORTED_IMAGE_EXTENSIONS.some((ext) => a.storage_path.toLowerCase().endsWith(ext)))
    .map((a) => a.storage_path);

  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await admin.storage.from("private").createSignedUrls(paths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
    }
  }

  // Documentos com um rascunho de questão colado duas/três vezes (ver
  // MID_DRAFT_MARKER/collapseLeadingExactRepeat em extract.ts, que já
  // resolve isso pro texto do enunciado) repetem a MESMA imagem em cada
  // cópia — sem dedupe aqui, a mesma foto apareceria 2-3x seguidas na
  // prova. Uma linha por questão+assetId, na ordem da primeira aparição.
  const seenPerQuestion = new Map<string, Set<string>>();
  for (const block of blocks) {
    const assetId = (block.content as { assetId?: string } | null)?.assetId;
    const asset = assetId ? assetById.get(assetId) : undefined;
    const url = asset ? signedByPath.get(asset.storage_path) : undefined;
    if (!asset || !url || !assetId) continue;

    const seen = seenPerQuestion.get(block.question_id) ?? new Set<string>();
    if (seen.has(assetId)) continue;
    seen.add(assetId);
    seenPerQuestion.set(block.question_id, seen);

    const list = result.get(block.question_id) ?? [];
    list.push({ url, altText: asset.alt_text });
    result.set(block.question_id, list);
  }
  return result;
}

async function hydrateQuestions(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<ExamQuestion[]> {
  if (ids.length === 0) return [];

  const [{ data: questions }, { data: alternatives }, { data: answers }, { data: allParts }, imagesByQuestion] = await Promise.all([
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
    // Itens A/B/C estruturados (ver comentário em ExamQuestion.parts).
    admin
      .from("question_parts")
      .select("id, question_id, label, prompt, order_index")
      .in("question_id", ids)
      .order("order_index"),
    fetchQuestionImages(admin, ids),
  ]);

  const partById = new Map((allParts ?? []).map((p) => [p.id, p]));
  const partsByQuestion = new Map<string, { id: string; label: string; prompt: string; orderIndex: number }[]>();
  for (const p of allParts ?? []) {
    const list = partsByQuestion.get(p.question_id) ?? [];
    list.push({ id: p.id, label: p.label, prompt: p.prompt, orderIndex: p.order_index });
    partsByQuestion.set(p.question_id, list);
  }

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
      parts: (partsByQuestion.get(q.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
      images: imagesByQuestion.get(q.id) ?? [],
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

  // Só resolve os temas da disciplina+série quando o professor não
  // escolheu um tema específico — evita a consulta extra no caso comum.
  const fallbackThemeIds = filters.themeId
    ? undefined
    : await resolveThemeIdsForSubjectGrade(admin, filters.subjectId, filters.gradeId);

  const requested: DifficultyBuckets = {
    easy: filters.easyCount,
    medium: filters.mediumCount,
    hard: filters.hardCount,
  };
  const picked: Record<"easy" | "medium" | "hard", string[]> = { easy: [], medium: [], hard: [] };
  const excludeSoFar: string[] = [];

  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const ids = await pickQuestionIds(admin, {
      gradeId: filters.gradeId,
      subjectId: filters.subjectId,
      themeId: filters.themeId || undefined,
      subthemeId: filters.subthemeId || undefined,
      fallbackThemeIds,
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
  filters: { gradeId: string; subjectId: string; themeId?: string; subthemeId?: string; questionTypes: QuestionType[] },
): Promise<SwapResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para gerar uma prova." };

  const admin = createAdminClient();
  const types = filters.questionTypes;
  const fallbackThemeIds = filters.themeId
    ? undefined
    : await resolveThemeIdsForSubjectGrade(admin, filters.subjectId, filters.gradeId);
  const ids = await pickQuestionIds(admin, {
    gradeId: filters.gradeId,
    subjectId: filters.subjectId,
    themeId: filters.themeId,
    subthemeId: filters.subthemeId,
    fallbackThemeIds,
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
  const quota = await getExamGenerationQuota(supabase, profile.id, profile.role);
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
    p_theme_id: data.themeId || null,
    p_school_name: data.schoolName || null,
    p_instructions: data.instructions || null,
    p_show_answer_key: data.showAnswerKey,
    p_question_ids: data.questionIds,
    p_grade_id: data.gradeId || null,
    p_subject_id: data.subjectId || null,
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
    p_grade_id: data.gradeId || null,
    p_subject_id: data.subjectId || null,
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
  gradeId: string | null;
  subjectId: string | null;
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
    .select("id, title, theme_id, grade_id, subject_id, school_name, instructions, show_answer_key, created_at")
    .eq("id", examId)
    .eq("teacher_id", profile.id)
    .maybeSingle();

  if (!exam) return { error: "Prova não encontrada." };

  // Provas salvas antes desta coluna existir só têm theme_id — resolve
  // disciplina/série pela cadeia tema → unidade curricular pra "editar"/
  // "gerar novamente" continuar funcionando nelas também.
  let gradeId = exam.grade_id;
  let subjectId = exam.subject_id;
  if ((!gradeId || !subjectId) && exam.theme_id) {
    const { data: theme } = await supabase
      .from("themes")
      .select("curriculum_unit_id")
      .eq("id", exam.theme_id)
      .maybeSingle();
    if (theme) {
      const { data: unit } = await supabase
        .from("curriculum_units")
        .select("grade_id, subject_id")
        .eq("id", theme.curriculum_unit_id)
        .maybeSingle();
      if (unit) {
        gradeId = gradeId ?? unit.grade_id;
        subjectId = subjectId ?? unit.subject_id;
      }
    }
  }

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
      gradeId,
      subjectId,
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
