"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify, ensureUniqueSlug } from "@/lib/slug";
import { coverStoragePath, contentFileStoragePath, extractStoragePathFromPublicUrl } from "@/lib/storage/paths";
import { validateUploadedFile, validateCoverImage } from "@/lib/storage/file-validation";
import { learningObjectSchema } from "@/lib/validations/learning-object";
import { interactiveActivitySchema } from "@/lib/validations/interactive-activity";

export type ActionResult = { error: string | null; id?: string };

const PATH = "/admin/objetos";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

function validateActivityConfig(activityType: unknown, config: unknown): string | null {
  if (!activityType) return null;
  const parsed = interactiveActivitySchema.safeParse({ activityType, config });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Configuração da atividade inválida.";
  return null;
}

export async function createLearningObject(input: unknown): Promise<ActionResult> {
  const parsed = learningObjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const activityError = validateActivityConfig(parsed.data.activityType, parsed.data.config);
  if (activityError) return { error: activityError };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;
  const slug = await ensureUniqueSlug(supabase, "learning_objects", slugify(data.title));

  const { data: obj, error } = await supabase
    .from("learning_objects")
    .insert({
      title: data.title,
      slug,
      description: data.description || null,
      object_type: data.objectType,
      external_url: data.externalUrl || null,
      access_type: data.accessType,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      activity_type: data.activityType ?? null,
      config: data.config ?? null,
    })
    .select("id")
    .single();

  if (error || !obj) return { error: error?.message ?? "Não foi possível criar o objeto." };
  revalidatePath(PATH);
  return { error: null, id: obj.id };
}

export async function updateLearningObject(id: string, input: unknown): Promise<ActionResult> {
  const parsed = learningObjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const activityError = validateActivityConfig(parsed.data.activityType, parsed.data.config);
  if (activityError) return { error: activityError };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: current } = await supabase
    .from("learning_objects")
    .select("status")
    .eq("id", id)
    .single();
  const becamePublished = data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("learning_objects")
    .update({
      title: data.title,
      description: data.description || null,
      object_type: data.objectType,
      external_url: data.externalUrl || null,
      access_type: data.accessType,
      status: data.status,
      activity_type: data.activityType ?? null,
      config: data.config ?? null,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null, id };
}

export async function deleteLearningObject(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("learning_objects")
    .select("cover_url, storage_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("learning_objects").delete().eq("id", id);
  if (error) return { error: error.message };

  if (current?.cover_url) {
    const path = extractStoragePathFromPublicUrl(current.cover_url, "public");
    if (path) await supabase.storage.from("public").remove([path]);
  }
  if (current?.storage_path) {
    await supabase.storage.from("private").remove([current.storage_path]);
  }

  revalidatePath(PATH);
  return { error: null };
}

export async function setLearningObjectStatus(
  id: string,
  status: "draft" | "scheduled" | "published" | "hidden" | "archived",
): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("learning_objects")
    .select("status")
    .eq("id", id)
    .single();
  const becamePublished = status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("learning_objects")
    .update({ status, ...(becamePublished ? { published_at: new Date().toISOString() } : {}) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null };
}

export async function uploadLearningObjectCover(id: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const validationError = validateCoverImage(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: current } = await supabase.from("learning_objects").select("cover_url").eq("id", id).single();

  const path = coverStoragePath(id, file.name);

  const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("learning_objects").update({ cover_url: publicUrl }).eq("id", id);
  if (error) return { error: error.message };

  if (current?.cover_url) {
    const oldPath = extractStoragePathFromPublicUrl(current.cover_url, "public");
    if (oldPath) await supabase.storage.from("public").remove([oldPath]);
  }

  revalidatePath(PATH);
  return { error: null };
}

export async function uploadLearningObjectFile(id: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const validationError = validateUploadedFile(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: current } = await supabase.from("learning_objects").select("storage_path").eq("id", id).single();

  const path = contentFileStoragePath(id, file.name);

  const { error: uploadError } = await supabase.storage.from("private").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("learning_objects").update({ storage_path: path }).eq("id", id);
  if (error) return { error: error.message };

  if (current?.storage_path) {
    await supabase.storage.from("private").remove([current.storage_path]);
  }

  revalidatePath(PATH);
  return { error: null };
}
