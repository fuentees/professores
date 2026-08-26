import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { startOfCurrentMonthIso } from "@/lib/dates";

export type DownloadQuota = { limit: number | null; used: number };

/**
 * Limite de downloads/mês do plano ativo do professor (`plans.download_limit`).
 * null = sem limite — vale tanto pra quem não tem assinatura ativa quanto pra
 * planos que deixam o campo em branco (opcional por plano, nenhum limite é
 * imposto por padrão). Contas admin (inclui o dono) nunca têm cota.
 */
export async function getDownloadQuota(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  role: "admin" | "teacher",
): Promise<DownloadQuota> {
  if (role === "admin") return { limit: null, used: 0 };

  const now = new Date().toISOString();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)
    .maybeSingle();

  let limit: number | null = null;
  if (subscription) {
    const { data: plan } = await supabase
      .from("plans")
      .select("download_limit")
      .eq("id", subscription.plan_id)
      .maybeSingle();
    limit = plan?.download_limit ?? null;
  }

  const { count } = await supabase
    .from("download_events")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .gte("downloaded_at", startOfCurrentMonthIso());

  return { limit, used: count ?? 0 };
}

export function downloadQuotaExceeded(quota: DownloadQuota): boolean {
  return quota.limit !== null && quota.used >= quota.limit;
}

export const DOWNLOAD_QUOTA_MESSAGE = (limit: number) =>
  `Você atingiu o limite de ${limit} downloads este mês do seu plano. Assine um plano superior para continuar baixando.`;
