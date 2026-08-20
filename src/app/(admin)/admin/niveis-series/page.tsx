import { createClient } from "@/lib/supabase/server";
import { EducationLevelsManager } from "@/components/admin/education-levels-manager";
import { GradesManager, type GradeRow } from "@/components/admin/grades-manager";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import { PageHeader } from "@/components/common/page-header";

export default async function NiveisSeriesPage() {
  const supabase = await createClient();

  const [{ data: educationLevels }, { data: grades }] = await Promise.all([
    supabase.from("education_levels").select("*").order("order_index"),
    supabase.from("grades").select("*").order("order_index"),
  ]);

  // Cada nível reinicia seu order_index em 0 — ordenar só por order_index
  // intercala séries de níveis diferentes. Agrupa por nível primeiro.
  const sortedGrades = sortGradesByLevel(
    ((grades ?? []) as GradeRow[]).map((g) => ({ ...g, educationLevelId: g.education_level_id })),
    (educationLevels ?? []).map((l) => ({ id: l.id, orderIndex: l.order_index })),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="Níveis e séries"
        description="Cadastre os níveis de ensino e as séries/anos vinculados a cada um."
      />

      <EducationLevelsManager rows={educationLevels ?? []} />

      <GradesManager
        rows={sortedGrades}
        educationLevels={(educationLevels ?? []).map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}
