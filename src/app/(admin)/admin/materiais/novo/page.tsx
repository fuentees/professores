import { createClient } from "@/lib/supabase/server";
import { ContentForm, type ContentFormOptions } from "@/components/admin/content-form";
import type { ContentInput } from "@/lib/validations/content";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

async function loadOptions(): Promise<ContentFormOptions> {
  const supabase = await createClient();

  const [{ data: educationLevels }, { data: grades }, { data: subjects }, { data: units }, { data: themes }, { data: subthemes }, { data: contentTypes }, { data: bnccSkills }] =
    await Promise.all([
      supabase.from("education_levels").select("id, order_index").order("order_index"),
      supabase.from("grades").select("id, name, education_level_id").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
      supabase.from("curriculum_units").select("id, name").order("order_index"),
      supabase.from("themes").select("id, name").order("order_index"),
      supabase.from("subthemes").select("id, name").order("order_index"),
      supabase.from("content_types").select("id, name").eq("status", "active").order("order_index"),
      supabase.from("bncc_skills").select("id, code, description").eq("status", "active").order("code"),
    ]);

  const educationLevelOrders = (educationLevels ?? []).map((l) => ({ id: l.id, orderIndex: l.order_index }));
  const sortedGrades = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    educationLevelOrders,
  );

  return {
    grades: sortedGrades.map((g) => ({ id: g.id, label: g.name })),
    subjects: (subjects ?? []).map((s) => ({ id: s.id, label: s.name })),
    curriculumUnits: (units ?? []).map((u) => ({ id: u.id, label: u.name })),
    themes: (themes ?? []).map((t) => ({ id: t.id, label: t.name })),
    subthemes: (subthemes ?? []).map((s) => ({ id: s.id, label: s.name })),
    contentTypes: (contentTypes ?? []).map((c) => ({ id: c.id, label: c.name })),
    bnccSkills: (bnccSkills ?? []).map((skill) => ({
      id: skill.id,
      label: `${skill.code} — ${skill.description}`,
    })),
  };
}

const DEFAULT_VALUES: ContentInput = {
  title: "",
  subtitle: "",
  shortDescription: "",
  body: "",
  author: "",
  difficulty: "",
  gradeIds: [],
  subjectIds: [],
  curriculumUnitIds: [],
  themeIds: [],
  subthemeIds: [],
  contentTypeIds: [],
  tagNames: [],
  accessType: "teacher_only",
  allowView: true,
  allowDownload: true,
  allowPrint: true,
  allowComments: false,
  hasAnswerKey: false,
  isFeatured: false,
  status: "draft",
  publishAt: "",
};

export default async function NovoMaterialPage() {
  const options = await loadOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-semibold">Publicar novo material</h1>
        <p className="text-muted-foreground">
          Anexe um Word para preencher o material automaticamente, confira a classificação e publique.
        </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/admin/questoes/importar">
              <FileUp className="size-4" />
              Importar questões Word
            </Link>
          }
        />
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
        <div><span className="font-semibold text-primary">1. Anexe</span><p className="mt-1 text-muted-foreground">Escolha o Word preparado pela equipe.</p></div>
        <div><span className="font-semibold text-primary">2. Confira</span><p className="mt-1 text-muted-foreground">Revise o que o sistema reconheceu automaticamente.</p></div>
        <div><span className="font-semibold text-primary">3. Publique</span><p className="mt-1 text-muted-foreground">Crie o rascunho e publique quando estiver pronto.</p></div>
      </div>

      <ContentForm defaultValues={DEFAULT_VALUES} options={options} />
    </div>
  );
}
