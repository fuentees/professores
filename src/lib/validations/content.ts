import { z } from "zod";

// No `.default()` here on purpose: the form always supplies complete values
// via `defaultValues`, and giving every field a required, non-optional type
// keeps z.infer's input and output identical — otherwise react-hook-form's
// `useForm<ContentInput>` and zodResolver disagree on which side (pre- or
// post-default) of the schema they're typed against.
export const contentSchema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  subtitle: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  body: z.string().trim().optional(),
  author: z.string().trim().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().or(z.literal("")),

  gradeIds: z.array(z.uuid()),
  subjectIds: z.array(z.uuid()),
  curriculumUnitIds: z.array(z.uuid()),
  themeIds: z.array(z.uuid()),
  subthemeIds: z.array(z.uuid()),
  contentTypeIds: z.array(z.uuid()).min(1, "Selecione ao menos um tipo de material."),
  tagNames: z.array(z.string()),

  accessType: z.enum(["public", "free_signup", "teacher_only", "subscriber_only"]),
  allowView: z.boolean(),
  allowDownload: z.boolean(),
  allowPrint: z.boolean(),
  allowComments: z.boolean(),
  hasAnswerKey: z.boolean(),
  isFeatured: z.boolean(),

  status: z.enum(["draft", "scheduled", "published", "hidden", "archived"]),
  publishAt: z.string().optional().or(z.literal("")),
});

export type ContentInput = z.infer<typeof contentSchema>;
