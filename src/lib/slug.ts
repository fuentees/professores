import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type TablesWithSlug = "contents" | "courses" | "learning_objects" | "folders" | "blog_posts" | "blog_categories" | "forum_categories" | "plans";

/**
 * Appends "-2", "-3", ... to `base` until it doesn't collide with an
 * existing row, since the DB only enforces the `unique` constraint at
 * insert time (a raw duplicate-key error otherwise reaches the admin UI).
 */
export async function ensureUniqueSlug(
  supabase: SupabaseClient<Database>,
  table: TablesWithSlug,
  base: string,
  ignoreId?: string,
): Promise<string> {
  let slug = base;
  let suffix = 2;

  for (;;) {
    let query = supabase.from(table).select("id").eq("slug", slug).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query;
    if (!data || data.length === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}
