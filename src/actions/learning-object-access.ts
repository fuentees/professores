"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";

export type ActionResult = { error: string | null; url?: string };

export async function getLearningObjectFileUrl(learningObjectId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data: obj } = await admin
    .from("learning_objects")
    .select("storage_path, status, access_type")
    .eq("id", learningObjectId)
    .single();

  if (!obj || obj.status !== "published" || !obj.storage_path) {
    return { error: "Este objeto de aprendizagem não está disponível." };
  }

  const profile = await getCurrentProfile();
  if (profile && profile.status !== "active") {
    return { error: "Sua conta está bloqueada." };
  }

  const entitled = await canAccessResource(admin, profile, { accessType: obj.access_type as ResourceAccessType });
  if (!entitled) {
    return {
      error:
        obj.access_type === "subscriber_only"
          ? "Este objeto de aprendizagem é exclusivo para assinantes de um plano pago."
          : "Faça login para acessar este objeto de aprendizagem.",
    };
  }

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(obj.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de acesso." };
  return { error: null, url: signed.signedUrl };
}
