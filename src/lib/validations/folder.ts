import { z } from "zod";

export const folderSchema = z.object({
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres."),
  description: z.string().trim().optional(),
  accessType: z.enum(["public", "free_signup", "teacher_only", "subscriber_only"]),
  status: z.enum(["draft", "scheduled", "published", "hidden", "archived"]),
  contentIds: z.array(z.uuid()),
});

export type FolderInput = z.infer<typeof folderSchema>;
