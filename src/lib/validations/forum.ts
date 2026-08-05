import { z } from "zod";

export const forumTopicSchema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  body: z.string().trim().min(5, "Escreva uma mensagem com pelo menos 5 caracteres."),
});
export type ForumTopicInput = z.infer<typeof forumTopicSchema>;

export const forumReplySchema = z.object({
  body: z.string().trim().min(2, "Escreva uma resposta."),
});
export type ForumReplyInput = z.infer<typeof forumReplySchema>;

export const forumCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  description: z.string().trim().optional(),
  orderIndex: z.coerce.number().int(),
  status: z.enum(["active", "inactive"]),
});
export type ForumCategoryInput = z.infer<typeof forumCategorySchema>;
