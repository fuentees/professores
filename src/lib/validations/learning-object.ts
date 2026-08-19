import { z } from "zod";
import { httpUrlSchema } from "@/lib/validations/url";

export const learningObjectSchema = z.object({
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres."),
  description: z.string().trim().optional(),
  objectType: z.string().trim().min(2, "Informe o tipo do objeto."),
  externalUrl: httpUrlSchema,
  accessType: z.enum(["public", "free_signup", "teacher_only", "subscriber_only"]),
  status: z.enum(["draft", "scheduled", "published", "hidden", "archived"]),
  // Atividade interativa (opcional): quando presente, ambos vêm juntos e já
  // foram validados pelo `interactiveActivitySchema` antes de chegar aqui.
  activityType: z
    .enum(["quiz", "true_false", "matching", "memory", "fill_blank", "ordering", "flashcards", "simulation"])
    .nullable()
    .optional(),
  config: z.unknown().nullable().optional(),
});

export type LearningObjectInput = z.infer<typeof learningObjectSchema>;
