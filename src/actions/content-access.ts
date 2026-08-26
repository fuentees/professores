"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";
import { getDownloadQuota, downloadQuotaExceeded, DOWNLOAD_QUOTA_MESSAGE } from "@/lib/access/download-quota";

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
  const admin = createAdminClient();

  const { data: file } = await admin
    .from("content_files")
    .select("id, name, storage_path, allow_download, content_id")
    .eq("id", contentFileId)
    .single();

  if (!file) return { error: "Arquivo não encontrado." };

  const { data: content } = await admin
    .from("contents")
    .select("id, title, slug, status, allow_download, access_type")
    .eq("id", file.content_id)
    .single();

  if (!content || content.status !== "published") {
    return { error: "Este material não está disponível." };
  }
  if (!content.allow_download || !file.allow_download) {
    return { error: "O download deste material não é permitido." };
  }

  const profile = await getCurrentProfile();
  if (profile && profile.status !== "active") {
    return { error: "Sua conta está bloqueada." };
  }

  const entitled = await canAccessResource(
    admin,
    profile,
    { accessType: content.access_type as ResourceAccessType },
    { contentId: file.content_id },
  );
  if (!entitled) {
    return {
      error:
        content.access_type === "subscriber_only"
          ? "Este conteúdo é exclusivo para assinantes de um plano pago."
          : "Faça login para baixar este material.",
    };
  }

  if (profile) {
    const quota = await getDownloadQuota(admin, profile.id, profile.role);
    if (downloadQuotaExceeded(quota)) return { error: DOWNLOAD_QUOTA_MESSAGE(quota.limit!) };
  }

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(file.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de download." };

  await admin.from("download_events").insert({
    teacher_id: profile?.id ?? null,
    resource_type: "material",
    resource_id: content.id,
    resource_title: content.title,
    resource_href: `/materiais/${content.slug}`,
    file_name: file.name,
  });

  return { error: null, url: signed.signedUrl };
}

/**
 * Autoriza (checa cota) e registra o Word gerado no próprio navegador para
 * materiais sem anexo. O chamador deve aguardar `error: null` antes de
 * gerar/salvar o arquivo — é essa checagem que faz o limite do plano valer
 * pra downloads sem arquivo físico no storage.
 */
export async function recordGeneratedMaterialDownload(contentId: string): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para baixar este material." };

  const admin = createAdminClient();
  const { data: content } = await admin
    .from("contents")
    .select("id, title, slug, status, allow_download, access_type")
    .eq("id", contentId)
    .maybeSingle();

  if (!content || content.status !== "published") return { error: "Este material não está disponível." };
  if (!content.allow_download) return { error: "O download deste material não é permitido." };

  const entitled = await canAccessResource(
    admin,
    profile,
    { accessType: content.access_type as ResourceAccessType },
    { contentId },
  );
  if (!entitled) return { error: "Seu plano não permite baixar este material." };

  const quota = await getDownloadQuota(admin, profile.id, profile.role);
  if (downloadQuotaExceeded(quota)) return { error: DOWNLOAD_QUOTA_MESSAGE(quota.limit!) };

  const { error } = await admin.from("download_events").insert({
    teacher_id: profile.id,
    resource_type: "material",
    resource_id: content.id,
    resource_title: content.title,
    resource_href: `/materiais/${content.slug}`,
    file_name: `${content.title}.docx`,
  });

  if (error) return { error: "O arquivo foi gerado, mas não foi possível registrá-lo no histórico." };
  revalidatePath("/painel");
  revalidatePath("/painel/downloads");
  return { error: null };
}

export async function toggleFavorite(contentId: string): Promise<ActionResult> {
  const profile = await requireActiveProfile();
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
