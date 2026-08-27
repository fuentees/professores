import { z } from "zod";

export const MAX_QUESTIONS_PER_EXAM = 30;

// Todos os tipos de questão sorteáveis pelo gerador de provas — inclui os
// tipos importados do banco de questões (ver QuestionType em
// src/types/supabase.ts). exam-print-view.tsx já renderiza qualquer tipo
// fora de multiple_choice com um fallback genérico (linhas pontilhadas +
// texto do gabarito), então nenhuma questão precisa de UI de impressão nova.
export const EXAM_QUESTION_TYPES = [
  "multiple_choice",
  "essay",
  "discursive",
  "true_false",
  "matching",
  "fill_blank",
  "ordering",
  "argumentative",
  "image_based",
  "mixed",
] as const;

// Tema/subtema viraram opcionais: questões cadastradas manualmente sempre
// têm theme_id (subject_id/grade_id ficam null nelas), mas questões
// importadas do banco de questões (.docx) só têm subject_id/grade_id — o
// importador nunca vincula tema automaticamente (fica como aviso pro
// admin resolver manualmente). Exigir tema deixava esse acervo inteiro
// inalcançável pelo gerador, mesmo escolhendo a disciplina/série certas —
// pra algumas disciplinas nem existe "unidade temática" cadastrada, então
// o seletor em cascata trava antes de chegar no tema. Série+disciplina
// bastam pra buscar; tema filtra mais quando disponível.
export const examFiltersSchema = z
  .object({
    gradeId: z.uuid("Selecione a série."),
    subjectId: z.uuid("Selecione a disciplina."),
    themeId: z.uuid().optional().or(z.literal("")),
    subthemeId: z.uuid().optional().or(z.literal("")),
    easyCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    mediumCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    hardCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    questionTypes: z.array(z.enum(EXAM_QUESTION_TYPES)).min(1, "Selecione pelo menos um tipo de questão."),
  })
  .superRefine((data, ctx) => {
    const total = data.easyCount + data.mediumCount + data.hardCount;
    if (total < 1) {
      ctx.addIssue({ code: "custom", path: ["easyCount"], message: "Escolha pelo menos 1 questão." });
    }
    if (total > MAX_QUESTIONS_PER_EXAM) {
      ctx.addIssue({
        code: "custom",
        path: ["easyCount"],
        message: `Máximo de ${MAX_QUESTIONS_PER_EXAM} questões por prova.`,
      });
    }
  });

export type ExamFiltersInput = z.infer<typeof examFiltersSchema>;

// swapExamQuestion é uma Server Action chamável direto (bypassando a UI) —
// sem validar aqui, gradeId/subjectId/themeId/excludeIds vão sem checagem
// nenhuma até virarem string interpolada numa query PostgREST em
// pickQuestionIds (exam-generator.ts). Exigir uuid() em cada campo garante
// que só chegam lá caracteres inofensivos pro filtro .or()/.not(), fechando
// o vetor de injeção — não é o professor autorizado a ver mais dados, é
// impedir que a string do filtro seja reescrita.
export const swapExamQuestionSchema = z.object({
  excludeIds: z.array(z.uuid()),
  difficulty: z.enum(["easy", "medium", "hard"]),
  filters: z.object({
    gradeId: z.uuid("Selecione a série."),
    subjectId: z.uuid("Selecione a disciplina."),
    themeId: z.uuid().optional().or(z.literal("")),
    subthemeId: z.uuid().optional().or(z.literal("")),
    questionTypes: z.array(z.enum(EXAM_QUESTION_TYPES)).min(1, "Selecione pelo menos um tipo de questão."),
  }),
});

export const saveExamSchema = z.object({
  title: z.string().trim().min(3, "Informe um título para a prova."),
  gradeId: z.uuid().optional().or(z.literal("")),
  subjectId: z.uuid().optional().or(z.literal("")),
  themeId: z.uuid().optional().or(z.literal("")),
  schoolName: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  showAnswerKey: z.boolean(),
  questionIds: z.array(z.uuid()).min(1).max(MAX_QUESTIONS_PER_EXAM),
});

export type SaveExamInput = z.infer<typeof saveExamSchema>;
