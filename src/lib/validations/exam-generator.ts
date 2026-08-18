import { z } from "zod";

export const MAX_QUESTIONS_PER_EXAM = 30;

export const examFiltersSchema = z
  .object({
    themeId: z.uuid("Selecione um tema."),
    subthemeId: z.uuid().optional().or(z.literal("")),
    easyCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    mediumCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    hardCount: z.coerce.number().int().min(0).max(MAX_QUESTIONS_PER_EXAM),
    includeMultipleChoice: z.boolean(),
    includeEssay: z.boolean(),
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
    if (!data.includeMultipleChoice && !data.includeEssay) {
      ctx.addIssue({
        code: "custom",
        path: ["includeMultipleChoice"],
        message: "Selecione pelo menos um tipo de questão.",
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
