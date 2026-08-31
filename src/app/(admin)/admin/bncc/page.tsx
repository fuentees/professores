import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleEntityManager } from "@/components/admin/simple-entity-manager";
import { BnccSkillsManager, type BnccSkillRow } from "@/components/admin/bncc-skills-manager";
import {
  createBnccComponentFromParent,
  createBnccKnowledgeAreaFromParent,
  createBnccStage,
  deleteBnccComponent,
  deleteBnccKnowledgeArea,
  deleteBnccStage,
} from "@/actions/admin/bncc";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import { PageHeader } from "@/components/common/page-header";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

export default async function BnccAdminPage() {
  const supabase = await createClient();

  const [{ data: stages }, { data: areas }, { data: components }, { data: skills }, { data: educationLevels }, { data: grades }] =
    await Promise.all([
      supabase.from("bncc_stages").select("*").order("order_index"),
      supabase.from("bncc_knowledge_areas").select("*").order("order_index"),
      supabase.from("bncc_components").select("*").order("order_index"),
      supabase.from("bncc_skills").select("*").order("code"),
      supabase.from("education_levels").select("id, order_index").order("order_index"),
      supabase.from("grades").select("id, name, education_level_id").order("order_index"),
    ]);

  const sortedGrades = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    (educationLevels ?? []).map((l) => ({ id: l.id, orderIndex: l.order_index })),
  );
  const pendingSkills = (skills ?? []).filter((skill) => skill.verification_status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="BNCC"
        description="As habilidades dos arquivos Word alimentam este catálogo automaticamente. Você também pode cadastrar ou revisar dados manualmente."
      />

      <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${(skills?.length ?? 0) < 100 ? "border-assessment/30 bg-assessment-soft" : "border-activity/30 bg-activity-soft"}`}>
        <div className="flex gap-3">
          {(skills?.length ?? 0) < 100 ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-assessment" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-activity" />}
          <div>
            <p className="font-semibold">{skills?.length ?? 0} habilidades cadastradas</p>
            <p className="text-sm text-muted-foreground">
              {pendingSkills > 0
                ? `${pendingSkills} habilidade(s) aguardam a aprovação da importação que as trouxe.`
                : (skills?.length ?? 0) < 100
                  ? "O catálogo cresce a cada Word aprovado. O planejador usa somente habilidades verificadas."
                  : "Continue revisando a cobertura por série e componente antes de liberar novas turmas."}
            </p>
          </div>
        </div>
        <a href="https://basenacionalcomum.mec.gov.br/download-da-bncc" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Abrir planilha oficial <ExternalLink className="size-4" /></a>
      </div>

      <Tabs defaultValue="etapas">
        <TabsList>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="areas">Áreas do conhecimento</TabsTrigger>
          <TabsTrigger value="componentes">Componentes</TabsTrigger>
          <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="pt-4">
          <SimpleEntityManager
            title="Etapas"
            emptyLabel="Nenhuma etapa cadastrada ainda."
            rows={stages ?? []}
            onCreate={createBnccStage}
            onDelete={deleteBnccStage}
          />
        </TabsContent>

        <TabsContent value="areas" className="pt-4">
          <SimpleEntityManager
            title="Áreas do conhecimento"
            emptyLabel="Nenhuma área cadastrada ainda."
            rows={areas ?? []}
            parentLabel="Etapa"
            parentOptions={stages ?? []}
            parentColumnKey="stage_id"
            onCreate={createBnccKnowledgeAreaFromParent}
            onDelete={deleteBnccKnowledgeArea}
          />
        </TabsContent>

        <TabsContent value="componentes" className="pt-4">
          <SimpleEntityManager
            title="Componentes curriculares"
            emptyLabel="Nenhum componente cadastrado ainda."
            rows={components ?? []}
            parentLabel="Área do conhecimento"
            parentOptions={areas ?? []}
            parentColumnKey="knowledge_area_id"
            onCreate={createBnccComponentFromParent}
            onDelete={deleteBnccComponent}
          />
        </TabsContent>

        <TabsContent value="habilidades" className="pt-4">
          <BnccSkillsManager
            rows={(skills ?? []) as BnccSkillRow[]}
            components={components ?? []}
            grades={sortedGrades}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
