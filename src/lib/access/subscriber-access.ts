import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type GrantTarget = { contentId: string } | { courseId: string } | Record<string, never>;

/**
 * Whether a teacher can access `subscriber_only` content: either an active
 * subscription, or an individual grant for this specific content/course.
 * Learning objects have no per-object grant column yet, so callers pass `{}`
 * and only the subscription check applies.
 */
export async function hasSubscriberAccess(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  grantTarget: GrantTarget = {},
): Promise<boolean> {
  const now = new Date().toISOString();

  const subscriptionQuery = supabase
    .from("subscriptions")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)
    .maybeSingle();

  const grantQuery =
    "contentId" in grantTarget
      ? supabase
          .from("access_grants")
          .select("id")
          .eq("teacher_id", teacherId)
          .eq("content_id", grantTarget.contentId)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .limit(1)
          .maybeSingle()
      : "courseId" in grantTarget
        ? supabase
            .from("access_grants")
            .select("id")
            .eq("teacher_id", teacherId)
            .eq("course_id", grantTarget.courseId)
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .limit(1)
            .maybeSingle()
        : null;

  const [{ data: activeSubscription }, grantResult] = await Promise.all([
    subscriptionQuery,
    grantQuery ?? Promise.resolve({ data: null }),
  ]);

  return Boolean(activeSubscription || grantResult?.data);
}
