"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { forumReplySchema, forumTopicSchema } from "@/lib/validations/forum";

export type ActionResult = { error: string | null; id?: string };

export async function createTopic(categorySlug: string, input: unknown): Promise<ActionResult> {
  const parsed = forumTopicSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Faça login para criar um tópico." };

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("forum_categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();
  if (!category) return { error: "Categoria não encontrada." };

  const { data: topic, error } = await supabase
    .from("forum_topics")
    .insert({
      category_id: category.id,
      author_id: profile.id,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !topic) return { error: error?.message ?? "Não foi possível criar o tópico." };
  revalidatePath(`/forum/${categorySlug}`);
  return { error: null, id: topic.id };
}

export async function createReply(topicId: string, input: unknown): Promise<ActionResult> {
  const parsed = forumReplySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Faça login para responder." };

  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").insert({
    topic_id: topicId,
    author_id: profile.id,
    body: parsed.data.body,
  });

  if (error) return { error: "Não foi possível enviar a resposta. O tópico pode estar fechado." };
  revalidatePath(`/forum/topico/${topicId}`);
  return { error: null };
}

export async function updateReply(replyId: string, input: unknown): Promise<ActionResult> {
  const parsed = forumReplySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: reply, error } = await supabase
    .from("forum_replies")
    .update({ body: parsed.data.body })
    .eq("id", replyId)
    .select("topic_id")
    .single();

  if (error || !reply) return { error: "Não foi possível editar a resposta." };
  revalidatePath(`/forum/topico/${reply.topic_id}`);
  return { error: null };
}

export async function deleteOwnReply(replyId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: reply } = await supabase
    .from("forum_replies")
    .select("topic_id")
    .eq("id", replyId)
    .single();

  const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
  if (error) return { error: "Não foi possível excluir a resposta." };

  if (reply) revalidatePath(`/forum/topico/${reply.topic_id}`);
  return { error: null };
}
