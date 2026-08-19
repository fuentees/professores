import { z } from "zod";
import { httpUrlSchema } from "@/lib/validations/url";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  description: z.string().trim().optional(),
  instructor: z.string().trim().optional(),
  workloadHours: z.coerce.number().int().optional(),
  accessType: z.enum(["public", "free_signup", "teacher_only", "subscriber_only"]),
  certificateEnabled: z.boolean(),
  status: z.enum(["draft", "scheduled", "published", "hidden", "archived"]),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const lessonDetailSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  description: z.string().trim().optional(),
  body: z.string().trim().optional(),
  videoUrl: httpUrlSchema,
  durationMinutes: z.coerce.number().int().optional(),
  status: z.enum(["active", "inactive"]),
});
export type LessonDetailInput = z.infer<typeof lessonDetailSchema>;
