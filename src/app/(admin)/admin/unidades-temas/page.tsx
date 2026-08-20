import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CurriculumUnitsManager,
  type CurriculumUnitRow,
} from "@/components/admin/curriculum-units-manager";
import { ThemesManager, type ThemeRow } from "@/components/admin/themes-manager";
import { SubthemesManager, type SubthemeRow } from "@/components/admin/subthemes-manager";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import { PageHeader } from "@/components/common/page-header";

export default async function UnidadesTemasPage() {
  const supabase = await createClient();

  const [{ data: units }, { data: themes }, { data: subthemes }, { data: educationLevels }, { data: grades }, { data: subjects }] =
    await Promise.all([
      supabase.from("curriculum_units").select("*").order("order_index"),
      supabase.from("themes").select("*").order("order_index"),
      supabase.from("subthemes").select("*").order("order_index"),
      supabase.from("education_levels").select("id, order_index").order("order_index"),
      supabase.from("grades").select("id, name, education_level_id").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
    ]);

  const sortedGrades = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    (educationLevels ?? []).map((l) => ({ id: l.id, orderIndex: l.order_index })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades, temas e subtemas"
        description="Estrutura em cascata: cada unidade pertence a uma série + disciplina, cada tema a uma unidade, e cada subtema a um tema."
      />

      <Tabs defaultValue="unidades">
        <TabsList>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="temas">Temas</TabsTrigger>
          <TabsTrigger value="subtemas">Subtemas</TabsTrigger>
        </TabsList>

        <TabsContent value="unidades" className="pt-4">
          <CurriculumUnitsManager
            rows={(units ?? []) as CurriculumUnitRow[]}
            grades={sortedGrades}
            subjects={subjects ?? []}
          />
        </TabsContent>

        <TabsContent value="temas" className="pt-4">
          <ThemesManager
            rows={(themes ?? []) as ThemeRow[]}
            curriculumUnits={(units ?? []).map((u) => ({ id: u.id, name: u.name }))}
          />
        </TabsContent>

        <TabsContent value="subtemas" className="pt-4">
          <SubthemesManager
            rows={(subthemes ?? []) as SubthemeRow[]}
            themes={(themes ?? []).map((t) => ({ id: t.id, name: t.name }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
