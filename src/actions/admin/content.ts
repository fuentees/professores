"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify, ensureUniqueSlug } from "@/lib/slug";
import { coverStoragePath, contentFileStoragePath, extractStoragePathFromPublicUrl } from "@/lib/storage/paths";
import { validateUploadedFile, validateCoverImage } from "@/lib/storage/file-validation";
import { contentSchema, type ContentInput } from "@/lib/validations/content";

export type ActionResult = { error: string | null; id?: string };

const LIST_PATH = "/admin/materiais";

/**
 * `status = 'scheduled'` is a dead end at the DB level: RLS
 * (`contents_public_read_published`) requires `status = 'published'`
 * literally, ANDed with the `publish_at` future-dating check — a row left
 * at `scheduled` never becomes visible on its own, no matter how far in the
 * past `publish_at` is, because nothing ever flips it to `published` (no
 * cron/edge function exists). The form still offers "Agendado" as an admin
 * intent, but writes translate it to the mechanism that actually works:
 * `status = 'published'` with a future `publish_at`.
 */
function resolveScheduledStatus(
  status: ContentInput["status"],
  publishAt: string | undefined,
): { error: string } | { status: ContentInput["status"]; publishAt: string | null; isFuture: boolean } {
  if (status === "scheduled") {
    if (!publishAt) return { error: "Informe a data de publicação para agendar este material." };
    return { status: "published", publishAt, isFuture: new Date(publishAt) > new Date() };
  }
  return { status, publishAt: publishAt || null, isFuture: false };
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

  const resolved = resolveScheduledStatus(data.status, data.publishAt);
  if ("error" in resolved) return { error: resolved.error };

  const slug = await ensureUniqueSlug(supabase, "contents", slugify(data.title));

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
      status: resolved.status,
      allow_view: data.allowView,
      allow_download: data.allowDownload,
      allow_print: data.allowPrint,
      allow_comments: data.allowComments,
      has_answer_key: data.hasAnswerKey,
      is_featured: data.isFeatured,
      publish_at: resolved.publishAt,
      published_at: resolved.status === "published" && !resolved.isFuture ? new Date().toISOString() : null,
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

  const resolved = resolveScheduledStatus(data.status, data.publishAt);
  if ("error" in resolved) return { error: resolved.error };

  // O slug é definido na criação e nunca é recalculado a partir do título,
  // para não quebrar links já compartilhados/indexados.
  const { data: current } = await supabase.from("contents").select("status").eq("id", id).single();
  const becamePublished =
    resolved.status === "published" && !resolved.isFuture && current?.status !== "published";

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
      status: resolved.status,
      allow_view: data.allowView,
      allow_download: data.allowDownload,
      allow_print: data.allowPrint,
      allow_comments: data.allowComments,
      has_answer_key: data.hasAnswerKey,
      is_featured: data.isFeatured,
      publish_at: resolved.publishAt,
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

  if (status === "scheduled") {
    return {
      error: "Pra agendar, defina a data de publicação na tela de edição completa do material.",
    };
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

  const [{ data: current }, { data: files }] = await Promise.all([
    supabase.from("contents").select("cover_url").eq("id", id).single(),
    supabase.from("content_files").select("storage_path").eq("content_id", id),
  ]);

  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) return { error: error.message };

  if (current?.cover_url) {
    const path = extractStoragePathFromPublicUrl(current.cover_url, "public");
    if (path) await supabase.storage.from("public").remove([path]);
  }
  if (files && files.length > 0) {
    await supabase.storage.from("private").remove(files.map((f) => f.storage_path));
  }

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

  const validationError = validateCoverImage(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: current } = await supabase.from("contents").select("cover_url").eq("id", contentId).single();

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

  if (current?.cover_url) {
    const oldPath = extractStoragePathFromPublicUrl(current.cover_url, "public");
    if (oldPath) await supabase.storage.from("public").remove([oldPath]);
  }

  revalidatePath(LIST_PATH);
  return { error: null };
}

export async function addContentFile(contentId: string, file: File): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const validationError = validateUploadedFile(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const path = contentFileStoragePath(contentId, file.name);

  const { error: uploadError } = await supabase.storage.from("private").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
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
