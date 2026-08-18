import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TaxonomyOptions } from "@/components/admin/cascading-taxonomy-select";

/**
 * Loads the full série→disciplina→unidade→tema→subtema tree (flat, all
 * active rows) for CascadingTaxonomySelect. Used by both the admin
 * question form and the teacher-facing exam generator.
 */
export async function loadTaxonomyOptions(): Promise<TaxonomyOptions> {
  const supabase = await createClient();

  const [{ data: grades }, { data: subjects }, { data: gradeSubjects }, { data: units }, { data: themes }, { data: subthemes }] =
    await Promise.all([
      supabase.from("grades").select("id, name").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
      supabase.from("grade_subjects").select("grade_id, subject_id"),
      supabase.from("curriculum_units").select("id, name, grade_id, subject_id").order("order_index"),
      supabase.from("themes").select("id, name, curriculum_unit_id").order("order_index"),
      supabase.from("subthemes").select("id, name, theme_id").order("order_index"),
    ]);

  return {
    grades: (grades ?? []).map((g) => ({ id: g.id, name: g.name })),
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name })),
    gradeSubjects: (gradeSubjects ?? []).map((gs) => ({ gradeId: gs.grade_id, subjectId: gs.subject_id })),
    curriculumUnits: (units ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      gradeId: u.grade_id,
      subjectId: u.subject_id,
    })),
    themes: (themes ?? []).map((t) => ({ id: t.id, name: t.name, curriculumUnitId: t.curriculum_unit_id })),
    subthemes: (subthemes ?? []).map((s) => ({ id: s.id, name: s.name, themeId: s.theme_id })),
  };
}

/** Deriva a seleção em cascata completa a partir de um themeId/subthemeId já salvos. */
export function deriveTaxonomySelection(
  options: TaxonomyOptions,
  themeId: string,
  subthemeId: string | null,
): { gradeId: string; subjectId: string; curriculumUnitId: string; themeId: string; subthemeId: string } {
  const theme = options.themes.find((t) => t.id === themeId);
  const unit = theme ? options.curriculumUnits.find((u) => u.id === theme.curriculumUnitId) : undefined;

  return {
    gradeId: unit?.gradeId ?? "",
    subjectId: unit?.subjectId ?? "",
    curriculumUnitId: unit?.id ?? "",
    themeId: theme?.id ?? "",
    subthemeId: subthemeId ?? "",
  };
}
