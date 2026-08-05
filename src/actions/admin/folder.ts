"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import { coverStoragePath } from "@/lib/storage/paths";
import { folderSchema } from "@/lib/validations/folder";

export type ActionResult = { error: string | null; id?: string };

const FOLDERS_PATH = "/admin/pastas";

async function syncFolderContents(folderId: string, contentIds: string[]) {
  const supabase = await createClient();
  await supabase.from("folder_contents").delete().eq("folder_id", folderId);
  if (contentIds.length > 0) {
    await supabase.from("folder_contents").insert(
      contentIds.map((contentId, index) => ({
        folder_id: folderId,
        content_id: contentId,
        order_index: index,
      })),
    );
  }
}

export async function createFolder(input: unknown): Promise<ActionResult> {
  const parsed = folderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { data: folder, error } = await supabase
    .from("folders")
    .insert({
      title: data.title,
      slug: slugify(data.title),
      description: data.description || null,
      access_type: data.accessType,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !folder) return { error: error?.message ?? "Não foi possível criar a pasta." };

  await syncFolderContents(folder.id, data.contentIds);
  revalidatePath(FOLDERS_PATH);
  return { error: null, id: folder.id };
}

export async function updateFolder(id: string, input: unknown): Promise<ActionResult> {
  const parsed = folderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { data: current } = await supabase.from("folders").select("status").eq("id", id).single();
  const becamePublished = data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("folders")
    .update({
      title: data.title,
      description: data.description || null,
      access_type: data.accessType,
      status: data.status,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await syncFolderContents(id, data.contentIds);
  revalidatePath(FOLDERS_PATH);
  revalidatePath(`/admin/pastas/${id}/editar`);
  return { error: null, id };
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(FOLDERS_PATH);
  return { error: null };
}

export async function setFolderStatus(
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
  const { data: current } = await supabase.from("folders").select("status").eq("id", id).single();
  const becamePublished = status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("folders")
    .update({ status, ...(becamePublished ? { published_at: new Date().toISOString() } : {}) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(FOLDERS_PATH);
  return { error: null };
}

export async function uploadFolderCover(folderId: string, file: File): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const path = coverStoragePath(folderId, file.name);

  const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("folders").update({ cover_url: publicUrl }).eq("id", folderId);
  if (error) return { error: error.message };

  revalidatePath(FOLDERS_PATH);
  return { error: null };
}
