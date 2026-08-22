"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";

export async function toggleLearningObjectFavorite(
  learningObjectId: string,
): Promise<{ error: string | null; favorited?: boolean }> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para salvar este recurso." };
  if (!z.uuid().safeParse(learningObjectId).success) return { error: "Recurso inválido." };

  const supabase = await createClient();
  const { data: object } = await supabase
    .from("learning_objects")
    .select("id")
    .eq("id", learningObjectId)
    .eq("status", "published")
    .maybeSingle();
  if (!object) return { error: "Recurso não encontrado." };

  const { data: existing } = await supabase
    .from("learning_object_favorites")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("learning_object_id", learningObjectId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("learning_object_favorites").delete().eq("id", existing.id);
    if (error) return { error: "Não foi possível remover dos itens salvos." };
  } else {
    const { error } = await supabase.from("learning_object_favorites").insert({
      teacher_id: profile.id,
      learning_object_id: learningObjectId,
    });
    if (error) return { error: "Não foi possível salvar este recurso." };
  }

  revalidatePath("/painel/favoritos");
  revalidatePath("/objetos");
  return { error: null, favorited: !existing };
}
