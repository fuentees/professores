import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

export const AI_GENERATIONS_PER_HOUR = 20;

export async function hasReachedAiRateLimit(
  admin: ReturnType<typeof createAdminClient>,
  teacherId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_generation_events")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .gte("created_at", since);
  return (count ?? 0) >= AI_GENERATIONS_PER_HOUR;
}
