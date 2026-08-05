import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Fetches the signed-in user's profile row. `cache()` de-dupes calls within
 * the same render pass so layouts and pages can each call this without
 * triggering repeat queries.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return profile;
});
