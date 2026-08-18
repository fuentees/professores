import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";

export const CONTENT_CARD_SELECT = `
  slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
  content_subjects(subjects(name)),
  content_grades(grades(name)),
  content_content_types(content_types(name))
`;

export type ContentCardRow = {
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  access_type: string;
  has_answer_key: boolean;
  created_at: string;
  content_subjects: { subjects: { name: string } | null }[];
  content_grades: { grades: { name: string } | null }[];
  content_content_types: { content_types: { name: string } | null }[];
};

export function mapContentRowToCard(row: ContentCardRow): MaterialCardData {
  return {
    slug: row.slug,
    title: row.title,
    short_description: row.short_description,
    cover_url: row.cover_url,
    access_type: row.access_type,
    has_answer_key: row.has_answer_key,
    isNew: isRecentlyCreated(row.created_at),
    subjectNames: row.content_subjects.map((s) => s.subjects?.name).filter((n): n is string => Boolean(n)),
    gradeNames: row.content_grades.map((g) => g.grades?.name).filter((n): n is string => Boolean(n)),
    typeNames: row.content_content_types
      .map((t) => t.content_types?.name)
      .filter((n): n is string => Boolean(n)),
  };
}

/** Materiais publicados mais recentes, com filtro opcional (destaque, gratuito, etc). */
export async function fetchContentCards(
  supabase: SupabaseClient<Database>,
  options: { featuredOnly?: boolean; freeOnly?: boolean; limit: number },
): Promise<MaterialCardData[]> {
  let query = supabase
    .from("contents")
    .select(CONTENT_CARD_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(options.limit);

  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.freeOnly) query = query.in("access_type", ["public", "free_signup"]);

  const { data } = await query.returns<ContentCardRow[]>();
  return (data ?? []).map(mapContentRowToCard);
}

/** Materiais publicados da mesma disciplina ou série, para "relacionados" na página de detalhe. */
export async function fetchRelatedContentCards(
  supabase: SupabaseClient<Database>,
  options: { excludeContentId: string; subjectIds: string[]; gradeIds: string[]; limit: number },
): Promise<MaterialCardData[]> {
  if (options.subjectIds.length === 0 && options.gradeIds.length === 0) return [];

  const idSets: string[][] = [];
  if (options.subjectIds.length > 0) {
    const { data } = await supabase
      .from("content_subjects")
      .select("content_id")
      .in("subject_id", options.subjectIds);
    idSets.push((data ?? []).map((r) => r.content_id));
  }
  if (options.gradeIds.length > 0) {
    const { data } = await supabase
      .from("content_grades")
      .select("content_id")
      .in("grade_id", options.gradeIds);
    idSets.push((data ?? []).map((r) => r.content_id));
  }

  const relatedIds = [...new Set(idSets.flat())].filter((id) => id !== options.excludeContentId);
  if (relatedIds.length === 0) return [];

  const { data } = await supabase
    .from("contents")
    .select(CONTENT_CARD_SELECT)
    .eq("status", "published")
    .in("id", relatedIds)
    .order("created_at", { ascending: false })
    .limit(options.limit)
    .returns<ContentCardRow[]>();

  return (data ?? []).map(mapContentRowToCard);
}
