"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify, ensureUniqueSlug } from "@/lib/slug";
import { friendlyDeleteError } from "@/lib/supabase/errors";
import { forumCategorySchema } from "@/lib/validations/forum";

export type ActionResult = { error: string | null };

const FORUM_PATH = "/admin/forum";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

// ---------- Categorias (compatível com o CatalogManager) ----------

export async function createForumCategory(input: unknown): Promise<ActionResult> {
  const parsed = forumCategorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const slug = await ensureUniqueSlug(supabase, "forum_categories", slugify(parsed.data.name));
  const { error } = await supabase.from("forum_categories").insert({
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    order_index: parsed.data.orderIndex,
    status: parsed.data.status,
  });
  if (error) return { error: error.message };
  revalidatePath(FORUM_PATH);
  return { error: null };
}

export async function updateForumCategory(id: string, input: unknown): Promise<ActionResult> {
  const parsed = forumCategorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_categories")
    .update({
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description || null,
      order_index: parsed.data.orderIndex,
      status: parsed.data.status,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(FORUM_PATH);
  return { error: null };
}

export async function deleteForumCategory(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_categories").delete().eq("id", id);
  if (error) {
    return {
      error: friendlyDeleteError(error, "Não é possível excluir: existem tópicos vinculados a esta categoria."),
    };
  }
  revalidatePath(FORUM_PATH);
  return { error: null };
}

export async function setForumCategoryStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_categories").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(FORUM_PATH);
  return { error: null };
}

// ---------- Moderação de tópicos ----------

export async function setTopicPinned(id: string, pinned: boolean): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_topics").update({ is_pinned: pinned }).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function setTopicLocked(id: string, locked: boolean): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_topics").update({ is_locked: locked }).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function adminDeleteTopic(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_topics").update({ status: "inactive" }).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function adminDeleteReply(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").update({ status: "inactive" }).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
