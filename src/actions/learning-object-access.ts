"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export type ActionResult = { error: string | null; url?: string };

export async function getLearningObjectFileUrl(learningObjectId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Faça login para acessar este objeto de aprendizagem." };

  const admin = createAdminClient();
  const { data: obj } = await admin
    .from("learning_objects")
    .select("storage_path, status")
    .eq("id", learningObjectId)
    .single();

  if (!obj || obj.status !== "published" || !obj.storage_path) {
    return { error: "Este objeto de aprendizagem não está disponível." };
  }

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(obj.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de acesso." };
  return { error: null, url: signed.signedUrl };
}
