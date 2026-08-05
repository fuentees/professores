"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import { coverStoragePath, contentFileStoragePath } from "@/lib/storage/paths";
import { learningObjectSchema } from "@/lib/validations/learning-object";

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

export async function createLearningObject(input: unknown): Promise<ActionResult> {
  const parsed = learningObjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: obj, error } = await supabase
    .from("learning_objects")
    .insert({
      title: data.title,
      slug: slugify(data.title),
      description: data.description || null,
      object_type: data.objectType,
      external_url: data.externalUrl || null,
      access_type: data.accessType,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
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
  const { error } = await supabase.from("learning_objects").delete().eq("id", id);
  if (error) return { error: error.message };
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

  const supabase = await createClient();
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
  revalidatePath(PATH);
  return { error: null };
}

export async function uploadLearningObjectFile(id: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const path = contentFileStoragePath(id, file.name);

  const { error: uploadError } = await supabase.storage.from("private").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("learning_objects").update({ storage_path: path }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { error: null };
}
