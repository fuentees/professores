import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import type { TaxonomyOptions } from "@/components/admin/cascading-taxonomy-select";

/**
 * Loads the full nível→série→disciplina→unidade→tema→subtema tree (flat,
 * all active rows) for CascadingTaxonomySelect. Used by both the admin
 * question form and the teacher-facing exam generator.
 */
export async function loadTaxonomyOptions(): Promise<TaxonomyOptions> {
  const supabase = await createClient();

  const [
    { data: educationLevels },
    { data: grades },
    { data: subjects },
    { data: gradeSubjects },
    { data: units },
    { data: themes },
    { data: subthemes },
  ] = await Promise.all([
    supabase.from("education_levels").select("id, name, order_index").order("order_index"),
    supabase.from("grades").select("id, name, education_level_id").order("order_index"),
    supabase.from("subjects").select("id, name").order("order_index"),
    supabase.from("grade_subjects").select("grade_id, subject_id"),
    supabase.from("curriculum_units").select("id, name, grade_id, subject_id").order("order_index"),
    supabase.from("themes").select("id, name, curriculum_unit_id").order("order_index"),
    supabase.from("subthemes").select("id, name, theme_id").order("order_index"),
  ]);

  const educationLevelOptions = (educationLevels ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    orderIndex: l.order_index,
  }));
  const gradeOptions = (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id }));

  return {
    educationLevels: educationLevelOptions,
    grades: sortGradesByLevel(gradeOptions, educationLevelOptions),
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
): {
  educationLevelId: string;
  gradeId: string;
  subjectId: string;
  curriculumUnitId: string;
  themeId: string;
  subthemeId: string;
} {
  const theme = options.themes.find((t) => t.id === themeId);
  const unit = theme ? options.curriculumUnits.find((u) => u.id === theme.curriculumUnitId) : undefined;
  const grade = unit ? options.grades.find((g) => g.id === unit.gradeId) : undefined;

  return {
    educationLevelId: grade?.educationLevelId ?? "",
    gradeId: unit?.gradeId ?? "",
    subjectId: unit?.subjectId ?? "",
    curriculumUnitId: unit?.id ?? "",
    themeId: theme?.id ?? "",
    subthemeId: subthemeId ?? "",
  };
}
