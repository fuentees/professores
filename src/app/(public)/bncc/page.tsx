import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BnccSearchForm } from "@/components/bncc/bncc-search-form";

type SkillRow = {
  id: string;
  code: string;
  description: string;
  thematic_unit: string | null;
  knowledge_object: string | null;
  bncc_components: { name: string; bncc_knowledge_areas: { name: string; bncc_stages: { name: string } | null } | null } | null;
  grades: { name: string } | null;
};

export default async function BnccPage({
  searchParams,
}: PageProps<"/bncc">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let query = supabase
    .from("bncc_skills")
    .select(
      `id, code, description, thematic_unit, knowledge_object,
      bncc_components(name, bncc_knowledge_areas(name, bncc_stages(name))),
      grades(name)`,
    )
    .order("code");

  if (q) query = query.or(`code.ilike.%${q}%,description.ilike.%${q}%`);

  const { data: skills } = await query.returns<SkillRow[]>();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">BNCC</h1>
        <p className="text-muted-foreground">
          Consulte habilidades da Base Nacional Comum Curricular e veja os materiais
          relacionados.
        </p>
      </div>

      <BnccSearchForm />

      {(!skills || skills.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma habilidade encontrada.
        </div>
      )}

      <div className="space-y-3">
        {skills?.map((skill) => (
          <Card key={skill.id}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {skill.code}
                </Badge>
                {skill.grades && <Badge variant="secondary">{skill.grades.name}</Badge>}
                {skill.bncc_components && <Badge variant="secondary">{skill.bncc_components.name}</Badge>}
              </div>
              <p className="text-sm">{skill.description}</p>
              {(skill.thematic_unit || skill.knowledge_object) && (
                <p className="text-xs text-muted-foreground">
                  {skill.thematic_unit}
                  {skill.thematic_unit && skill.knowledge_object ? " · " : ""}
                  {skill.knowledge_object}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
