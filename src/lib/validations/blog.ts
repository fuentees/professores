import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  excerpt: z.string().trim().optional(),
  body: z.string().trim().optional(),
  author: z.string().trim().optional(),
  categoryId: z.uuid().optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "published", "hidden", "archived"]),
  allowComments: z.boolean(),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;
