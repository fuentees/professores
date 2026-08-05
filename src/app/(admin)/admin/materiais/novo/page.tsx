import { createClient } from "@/lib/supabase/server";
import { ContentForm, type ContentFormOptions } from "@/components/admin/content-form";
import type { ContentInput } from "@/lib/validations/content";

async function loadOptions(): Promise<ContentFormOptions> {
  const supabase = await createClient();

  const [{ data: grades }, { data: subjects }, { data: units }, { data: themes }, { data: subthemes }, { data: contentTypes }] =
    await Promise.all([
      supabase.from("grades").select("id, name").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
      supabase.from("curriculum_units").select("id, name").order("order_index"),
      supabase.from("themes").select("id, name").order("order_index"),
      supabase.from("subthemes").select("id, name").order("order_index"),
      supabase.from("content_types").select("id, name").order("order_index"),
    ]);

  return {
    grades: (grades ?? []).map((g) => ({ id: g.id, label: g.name })),
    subjects: (subjects ?? []).map((s) => ({ id: s.id, label: s.name })),
    curriculumUnits: (units ?? []).map((u) => ({ id: u.id, label: u.name })),
    themes: (themes ?? []).map((t) => ({ id: t.id, label: t.name })),
    subthemes: (subthemes ?? []).map((s) => ({ id: s.id, label: s.name })),
    contentTypes: (contentTypes ?? []).map((c) => ({ id: c.id, label: c.name })),
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
      <div>
        <h1 className="text-2xl font-semibold">Novo material</h1>
        <p className="text-muted-foreground">
          Preencha as informações básicas. Depois de criar, você poderá enviar a capa e os
          arquivos do material.
        </p>
      </div>

      <ContentForm defaultValues={DEFAULT_VALUES} options={options} />
    </div>
  );
}
