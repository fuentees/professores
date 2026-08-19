import { createClient } from "@/lib/supabase/server";
import { SubjectsManager, type SubjectRow } from "@/components/admin/subjects-manager";
import { GradeSubjectsManager } from "@/components/admin/grade-subjects-manager";
import { sortGradesByLevel } from "@/lib/pedagogical-order";

export default async function DisciplinasPage() {
  const supabase = await createClient();

  const [{ data: subjects }, { data: educationLevels }, { data: grades }, { data: links }] = await Promise.all([
    supabase.from("subjects").select("*").order("order_index"),
    supabase.from("education_levels").select("id, order_index").order("order_index"),
    supabase.from("grades").select("id, name, education_level_id").order("order_index"),
    supabase.from("grade_subjects").select("*"),
  ]);

  const sortedGrades = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    (educationLevels ?? []).map((l) => ({ id: l.id, orderIndex: l.order_index })),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Disciplinas</h1>
        <p className="text-muted-foreground">
          Cadastre as disciplinas do portal e vincule quais séries as utilizam.
        </p>
      </div>

      <SubjectsManager rows={(subjects ?? []) as SubjectRow[]} />

      <GradeSubjectsManager
        grades={sortedGrades}
        subjects={(subjects ?? []).map((s) => ({ id: s.id, name: s.name }))}
        links={links ?? []}
      />
    </div>
  );
}
