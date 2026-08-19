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

export const examFiltersSchema = z
  .object({
    themeId: z.uuid("Selecione um tema."),
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

export const saveExamSchema = z.object({
  title: z.string().trim().min(3, "Informe um título para a prova."),
  themeId: z.uuid(),
  schoolName: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  showAnswerKey: z.boolean(),
  questionIds: z.array(z.uuid()).min(1).max(MAX_QUESTIONS_PER_EXAM),
});

export type SaveExamInput = z.infer<typeof saveExamSchema>;
