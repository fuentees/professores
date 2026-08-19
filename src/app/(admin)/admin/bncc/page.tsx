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

export default async function BnccAdminPage() {
  const supabase = await createClient();

  const [{ data: stages }, { data: areas }, { data: components }, { data: skills }, { data: grades }] =
    await Promise.all([
      supabase.from("bncc_stages").select("*").order("order_index"),
      supabase.from("bncc_knowledge_areas").select("*").order("order_index"),
      supabase.from("bncc_components").select("*").order("order_index"),
      supabase.from("bncc_skills").select("*").order("code"),
      supabase.from("grades").select("id, name").order("order_index"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">BNCC</h1>
        <p className="text-muted-foreground">
          Cadastre etapas, áreas do conhecimento, componentes curriculares e habilidades. Os
          códigos e descrições devem ser copiados do documento oficial da BNCC — nunca inventados.
        </p>
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
            grades={grades ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
