import { createClient } from "@/lib/supabase/server";
import { SubjectsManager, type SubjectRow } from "@/components/admin/subjects-manager";
import { GradeSubjectsManager } from "@/components/admin/grade-subjects-manager";

export default async function DisciplinasPage() {
  const supabase = await createClient();

  const [{ data: subjects }, { data: grades }, { data: links }] = await Promise.all([
    supabase.from("subjects").select("*").order("order_index"),
    supabase.from("grades").select("id, name").order("order_index"),
    supabase.from("grade_subjects").select("*"),
  ]);

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
        grades={grades ?? []}
        subjects={(subjects ?? []).map((s) => ({ id: s.id, name: s.name }))}
        links={links ?? []}
      />
    </div>
  );
}
