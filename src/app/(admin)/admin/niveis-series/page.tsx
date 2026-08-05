import { createClient } from "@/lib/supabase/server";
import { EducationLevelsManager } from "@/components/admin/education-levels-manager";
import { GradesManager, type GradeRow } from "@/components/admin/grades-manager";

export default async function NiveisSeriesPage() {
  const supabase = await createClient();

  const [{ data: educationLevels }, { data: grades }] = await Promise.all([
    supabase.from("education_levels").select("*").order("order_index"),
    supabase.from("grades").select("*").order("order_index"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Níveis e séries</h1>
        <p className="text-muted-foreground">
          Cadastre os níveis de ensino e as séries/anos vinculados a cada um.
        </p>
      </div>

      <EducationLevelsManager rows={educationLevels ?? []} />

      <GradesManager
        rows={(grades ?? []) as GradeRow[]}
        educationLevels={(educationLevels ?? []).map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}
