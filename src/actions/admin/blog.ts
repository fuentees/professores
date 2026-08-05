"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import { coverStoragePath } from "@/lib/storage/paths";
import { blogPostSchema } from "@/lib/validations/blog";

export type ActionResult = { error: string | null; id?: string };

const BLOG_PATH = "/admin/blog";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

// ---------- Categorias ----------

export async function createBlogCategory(values: { name: string }): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("blog_categories")
    .insert({ name: values.name, slug: slugify(values.name) });
  if (error) return { error: error.message };
  revalidatePath(BLOG_PATH);
  return { error: null };
}

export async function deleteBlogCategory(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(BLOG_PATH);
  return { error: null };
}

// ---------- Posts ----------

export async function createBlogPost(input: unknown): Promise<ActionResult> {
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      title: data.title,
      slug: slugify(data.title),
      excerpt: data.excerpt || null,
      body: data.body || null,
      author: data.author || null,
      category_id: data.categoryId || null,
      status: data.status,
      allow_comments: data.allowComments,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !post) return { error: error?.message ?? "Não foi possível criar o artigo." };
  revalidatePath(BLOG_PATH);
  return { error: null, id: post.id };
}

export async function updateBlogPost(id: string, input: unknown): Promise<ActionResult> {
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: current } = await supabase.from("blog_posts").select("status").eq("id", id).single();
  const becamePublished = data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: data.title,
      excerpt: data.excerpt || null,
      body: data.body || null,
      author: data.author || null,
      category_id: data.categoryId || null,
      status: data.status,
      allow_comments: data.allowComments,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(BLOG_PATH);
  revalidatePath(`/admin/blog/${id}/editar`);
  return { error: null, id };
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(BLOG_PATH);
  return { error: null };
}

export async function uploadBlogPostCover(id: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const path = coverStoragePath(id, file.name);

  const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("blog_posts").update({ cover_url: publicUrl }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(BLOG_PATH);
  return { error: null };
}
