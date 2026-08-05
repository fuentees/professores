"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import { coverStoragePath, contentFileStoragePath } from "@/lib/storage/paths";
import { contentSchema, type ContentInput } from "@/lib/validations/content";

export type ActionResult = { error: string | null; id?: string };

const LIST_PATH = "/admin/materiais";

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const supabase = await createClient();
  let slug = base;
  let suffix = 2;

  for (;;) {
    let query = supabase.from("contents").select("id").eq("slug", slug).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query;
    if (!data || data.length === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function findOrCreateTagIds(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const supabase = await createClient();
  const ids: string[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = slugify(name);

    const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const { data: created, error } = await supabase
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single();
    if (!error && created) ids.push(created.id);
  }

  return ids;
}

async function syncRelations(contentId: string, input: ContentInput) {
  const supabase = await createClient();
  const tagIds = await findOrCreateTagIds(input.tagNames);

  const relationTables: Array<{
    table:
      | "content_grades"
      | "content_subjects"
      | "content_units"
      | "content_themes"
      | "content_subthemes"
      | "content_content_types"
      | "content_tags";
    column: string;
    ids: string[];
  }> = [
    { table: "content_grades", column: "grade_id", ids: input.gradeIds },
    { table: "content_subjects", column: "subject_id", ids: input.subjectIds },
    { table: "content_units", column: "curriculum_unit_id", ids: input.curriculumUnitIds },
    { table: "content_themes", column: "theme_id", ids: input.themeIds },
    { table: "content_subthemes", column: "subtheme_id", ids: input.subthemeIds },
    { table: "content_content_types", column: "content_type_id", ids: input.contentTypeIds },
    { table: "content_tags", column: "tag_id", ids: tagIds },
  ];

  for (const { table, column, ids } of relationTables) {
    await supabase.from(table).delete().eq("content_id", contentId);
    if (ids.length > 0) {
      await supabase.from(table).insert(ids.map((id) => ({ content_id: contentId, [column]: id })) as never);
    }
  }
}

export async function createContent(input: unknown): Promise<ActionResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;
  const slug = await ensureUniqueSlug(slugify(data.title));

  const { data: content, error } = await supabase
    .from("contents")
    .insert({
      title: data.title,
      slug,
      subtitle: data.subtitle || null,
      short_description: data.shortDescription || null,
      body: data.body || null,
      author: data.author || null,
      difficulty: data.difficulty || null,
      access_type: data.accessType,
      status: data.status,
      allow_view: data.allowView,
      allow_download: data.allowDownload,
      allow_print: data.allowPrint,
      allow_comments: data.allowComments,
      has_answer_key: data.hasAnswerKey,
      is_featured: data.isFeatured,
      publish_at: data.publishAt || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !content) return { error: error?.message ?? "Não foi possível criar o material." };

  await syncRelations(content.id, data);
  revalidatePath(LIST_PATH);
  return { error: null, id: content.id };
}

export async function updateContent(id: string, input: unknown): Promise<ActionResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;

  // O slug é definido na criação e nunca é recalculado a partir do título,
  // para não quebrar links já compartilhados/indexados.
  const { data: current } = await supabase.from("contents").select("status").eq("id", id).single();
  const becamePublished = data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("contents")
    .update({
      title: data.title,
      subtitle: data.subtitle || null,
      short_description: data.shortDescription || null,
      body: data.body || null,
      author: data.author || null,
      difficulty: data.difficulty || null,
      access_type: data.accessType,
      status: data.status,
      allow_view: data.allowView,
      allow_download: data.allowDownload,
      allow_print: data.allowPrint,
      allow_comments: data.allowComments,
      has_answer_key: data.hasAnswerKey,
      is_featured: data.isFeatured,
      publish_at: data.publishAt || null,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
      archived_at: data.status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await syncRelations(id, data);
  revalidatePath(LIST_PATH);
  revalidatePath(`/admin/materiais/${id}`);
  return { error: null, id };
}

export async function setContentStatus(
  id: string,
  status: "draft" | "scheduled" | "published" | "hidden" | "archived",
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: current } = await supabase.from("contents").select("status").eq("id", id).single();
  const becamePublished = status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("contents")
    .update({
      status,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
      ...(status === "archived" ? { archived_at: new Date().toISOString() } : { archived_at: null }),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(LIST_PATH);
  return { error: null };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("downloads")
    .select("*", { count: "exact", head: true })
    .eq("content_id", id);

  if (count && count > 0) {
    return {
      error: "Este material já possui downloads registrados. Arquive-o em vez de excluir.",
    };
  }

  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(LIST_PATH);
  return { error: null };
}

export async function uploadCoverImage(contentId: string, file: File): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const path = coverStoragePath(contentId, file.name);

  const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("contents").update({ cover_url: publicUrl }).eq("id", contentId);
  if (error) return { error: error.message };

  revalidatePath(LIST_PATH);
  return { error: null };
}

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp3",
  "mp4",
  "zip",
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function addContentFile(contentId: string, file: File): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return { error: `Formato de arquivo não permitido: .${extension}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Arquivo maior que o limite de 50MB." };
  }

  const supabase = await createClient();
  const path = contentFileStoragePath(contentId, file.name);

  const { error: uploadError } = await supabase.storage.from("private").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("content_files").insert({
    content_id: contentId,
    name: file.name,
    storage_path: path,
    file_type: extension,
    mime_type: file.type,
    file_size: file.size,
  });

  if (error) return { error: error.message };
  revalidatePath(LIST_PATH);
  return { error: null };
}

export async function removeContentFile(fileId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("content_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (file) {
    await supabase.storage.from("private").remove([file.storage_path]);
  }

  const { error } = await supabase.from("content_files").delete().eq("id", fileId);
  if (error) return { error: error.message };
  revalidatePath(LIST_PATH);
  return { error: null };
}
