import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/** Gerações/mês para professores sem assinatura ativa (sem "plano grátis" formal hoje). */
export const FREE_TIER_EXAM_LIMIT = 3;

export type ExamGenerationQuota = { limit: number | null; used: number };

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Limite efetivo de provas geradas por mês para o professor: usa
 * `plans.exam_generation_monthly_limit` da assinatura ativa (null = sem
 * limite), ou o limite grátis fixo se não houver assinatura ativa.
 *
 * Contas admin (role "admin", inclui o dono) nunca têm cota — o limite
 * grátis existe pra monetizar professores comuns, não pra travar quem
 * administra a própria plataforma.
 */
export async function getExamGenerationQuota(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  role: "admin" | "teacher",
): Promise<ExamGenerationQuota> {
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

  let limit: number | null = FREE_TIER_EXAM_LIMIT;
  if (subscription) {
    const { data: plan } = await supabase
      .from("plans")
      .select("exam_generation_monthly_limit")
      .eq("id", subscription.plan_id)
      .maybeSingle();
    limit = plan ? plan.exam_generation_monthly_limit : FREE_TIER_EXAM_LIMIT;
  }

  // Conta o log append-only de gerações, não linhas vivas em
  // generated_exams — apagar uma prova não pode devolver cota (ver
  // exam_generation_events na migration 20260818120000).
  const { count } = await supabase
    .from("exam_generation_events")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .gte("created_at", startOfCurrentMonthIso());

  return { limit, used: count ?? 0 };
}
