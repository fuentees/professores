import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentForm, type ContentFormOptions } from "@/components/admin/content-form";
import { ContentFileManager } from "@/components/admin/content-file-manager";
import { BnccSkillManager } from "@/components/admin/bncc-skill-manager";
import type { ContentInput } from "@/lib/validations/content";
import type { Database } from "@/types/supabase";
import { sortGradesByLevel } from "@/lib/pedagogical-order";

type ContentDetailRow = Database["public"]["Tables"]["contents"]["Row"] & {
  content_grades: { grade_id: string }[];
  content_subjects: { subject_id: string }[];
  content_units: { curriculum_unit_id: string }[];
  content_themes: { theme_id: string }[];
  content_subthemes: { subtheme_id: string }[];
  content_content_types: { content_type_id: string }[];
  content_tags: { tags: { name: string } | null }[];
  content_bncc_skills: { id: string; bncc_skills: { id: string; code: string; description: string } | null }[];
};

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

export default async function EditarMaterialPage({
  params,
}: PageProps<"/admin/materiais/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: content }, options, { data: files }, { data: bnccSkills }] = await Promise.all([
    supabase
      .from("contents")
      .select(
        `*,
        content_grades(grade_id),
        content_subjects(subject_id),
        content_units(curriculum_unit_id),
        content_themes(theme_id),
        content_subthemes(subtheme_id),
        content_content_types(content_type_id),
        content_tags(tags(name)),
        content_bncc_skills(id, bncc_skills(id, code, description))`,
      )
      .eq("id", id)
      .maybeSingle()
      .returns<ContentDetailRow>(),
    loadOptions(),
    supabase
      .from("content_files")
      .select("id, name, file_type, file_size")
      .eq("content_id", id)
      .order("order_index"),
    supabase.from("bncc_skills").select("id, code, description").eq("status", "active").order("code"),
  ]);

  if (!content) notFound();

  const defaultValues: ContentInput = {
    title: content.title,
    subtitle: content.subtitle ?? "",
    shortDescription: content.short_description ?? "",
    body: content.body ?? "",
    author: content.author ?? "",
    difficulty: content.difficulty ?? "",
    gradeIds: content.content_grades.map((r) => r.grade_id),
    subjectIds: content.content_subjects.map((r) => r.subject_id),
    curriculumUnitIds: content.content_units.map((r) => r.curriculum_unit_id),
    themeIds: content.content_themes.map((r) => r.theme_id),
    subthemeIds: content.content_subthemes.map((r) => r.subtheme_id),
    contentTypeIds: content.content_content_types.map((r) => r.content_type_id),
    tagNames: content.content_tags.map((r) => r.tags?.name).filter((n): n is string => Boolean(n)),
    accessType: content.access_type,
    allowView: content.allow_view,
    allowDownload: content.allow_download,
    allowPrint: content.allow_print,
    allowComments: content.allow_comments,
    hasAnswerKey: content.has_answer_key,
    isFeatured: content.is_featured,
    status: content.status,
    publishAt: content.publish_at ?? "",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Preparar e publicar material</h1>
        <p className="text-muted-foreground">{content.title} — revise o texto e a classificação. Capa e anexos são complementos opcionais.</p>
      </div>

      <ContentFileManager contentId={id} coverUrl={content.cover_url} files={files ?? []} />

      <BnccSkillManager
        contentId={id}
        linkedSkills={content.content_bncc_skills
          .filter((r) => r.bncc_skills)
          .map((r) => ({
            linkId: r.id,
            skillId: r.bncc_skills!.id,
            code: r.bncc_skills!.code,
            description: r.bncc_skills!.description,
          }))}
        availableSkills={bnccSkills ?? []}
      />

      <ContentForm contentId={id} defaultValues={defaultValues} options={options} />
    </div>
  );
}
