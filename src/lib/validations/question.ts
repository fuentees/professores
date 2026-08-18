import { z } from "zod";

const alternativeSchema = z.object({
  label: z.string().trim().min(1, "Informe o rótulo da alternativa."),
  body: z.string().trim().min(1, "Informe o texto da alternativa."),
  isCorrect: z.boolean(),
});

export const QUESTION_TYPES = [
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

export const questionSchema = z
  .object({
    statement: z.string().trim().min(10, "Informe um enunciado com pelo menos 10 caracteres."),
    questionType: z.enum(QUESTION_TYPES),
    difficulty: z.enum(["easy", "medium", "hard"]),
    themeId: z.uuid("Selecione um tema."),
    subthemeId: z.uuid().optional().or(z.literal("")),
    answerKey: z.string().trim().optional(),
    alternatives: z.array(alternativeSchema),
    status: z.enum(["active", "inactive"]),
  })
  .superRefine((data, ctx) => {
    if (data.questionType !== "multiple_choice") return;

    if (data.alternatives.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["alternatives"],
        message: "Adicione pelo menos 2 alternativas.",
      });
    }

    const correctCount = data.alternatives.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["alternatives"],
        message: "Marque exatamente uma alternativa como correta.",
      });
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
export type AlternativeInput = z.infer<typeof alternativeSchema>;
