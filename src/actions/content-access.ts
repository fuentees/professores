"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export type ActionResult = { error: string | null; url?: string };

export async function recordView(contentId: string): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const headerList = await headers();

  await supabase.from("content_views").insert({
    teacher_id: profile?.id ?? null,
    content_id: contentId,
    user_agent: headerList.get("user-agent"),
  });
}

export async function getDownloadUrl(contentFileId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { error: "Faça login para baixar este material." };
  }

  const admin = createAdminClient();

  const { data: file } = await admin
    .from("content_files")
    .select("id, storage_path, allow_download, content_id")
    .eq("id", contentFileId)
    .single();

  if (!file) return { error: "Arquivo não encontrado." };

  const { data: content } = await admin
    .from("contents")
    .select("status, allow_download, access_type")
    .eq("id", file.content_id)
    .single();

  if (!content || content.status !== "published") {
    return { error: "Este material não está disponível." };
  }
  if (!content.allow_download || !file.allow_download) {
    return { error: "O download deste material não é permitido." };
  }
  if (content.access_type === "subscriber_only") {
    const [{ data: activeSubscription }, { data: grant }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("id")
        .eq("teacher_id", profile.id)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle(),
      admin
        .from("access_grants")
        .select("id")
        .eq("teacher_id", profile.id)
        .eq("content_id", file.content_id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle(),
    ]);

    if (!activeSubscription && !grant) {
      return { error: "Este conteúdo é exclusivo para assinantes de um plano pago." };
    }
  }

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(file.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de download." };

  await admin.from("downloads").insert({
    teacher_id: profile.id,
    content_id: file.content_id,
    content_file_id: file.id,
  });

  return { error: null, url: signed.signedUrl };
}

export async function toggleFavorite(contentId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Faça login para favoritar." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("content_id", contentId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("favorites").insert({ teacher_id: profile.id, content_id: contentId });
  }

  revalidatePath("/materiais");
  revalidatePath("/painel/favoritos");
  return { error: null };
}
