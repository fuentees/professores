import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MaterialFilters, type MaterialFiltersData } from "@/components/materials/material-filters";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchX } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Materiais",
  description: "Planos de aula, avaliações e atividades prontas por disciplina e série.",
};

const PAGE_SIZE = 12;

type ContentListRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  access_type: string;
  has_answer_key: boolean;
  created_at: string;
  content_subjects: { subjects: { name: string } | null }[];
  content_grades: { grades: { name: string } | null }[];
  content_content_types: { content_types: { name: string } | null }[];
};

async function intersectContentIds(
  idLists: (string[] | null)[],
): Promise<string[] | null> {
  const activeLists = idLists.filter((list): list is string[] => list !== null);
  if (activeLists.length === 0) return null;

  let result = new Set(activeLists[0]);
  for (const list of activeLists.slice(1)) {
    const other = new Set(list);
    result = new Set([...result].filter((id) => other.has(id)));
  }
  return [...result];
}

export default async function MateriaisPage({
  searchParams,
}: PageProps<"/materiais">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const nivel = typeof params.nivel === "string" ? params.nivel : "";
  const serie = typeof params.serie === "string" ? params.serie : "";
  const disciplina = typeof params.disciplina === "string" ? params.disciplina : "";
  const unidade = typeof params.unidade === "string" ? params.unidade : "";
  const tema = typeof params.tema === "string" ? params.tema : "";
  const subtema = typeof params.subtema === "string" ? params.subtema : "";
  const tipo = typeof params.tipo === "string" ? params.tipo : "";
  const habilidade = typeof params.habilidade === "string" ? params.habilidade : "";
  const page = Math.max(1, Number(params.pagina) || 1);

  const supabase = await createClient();

  const [
    { data: educationLevels },
    { data: grades },
    { data: subjects },
    { data: gradeSubjects },
    { data: curriculumUnits },
    { data: themes },
    { data: subthemes },
    { data: contentTypes },
  ] = await Promise.all([
    supabase.from("education_levels").select("id, name, order_index").order("order_index"),
    supabase.from("grades").select("id, name, education_level_id").order("order_index"),
    supabase.from("subjects").select("id, name").order("order_index"),
    supabase.from("grade_subjects").select("grade_id, subject_id"),
    supabase.from("curriculum_units").select("id, name, grade_id, subject_id").order("order_index"),
    supabase.from("themes").select("id, name, curriculum_unit_id").order("order_index"),
    supabase.from("subthemes").select("id, name, theme_id").order("order_index"),
    supabase.from("content_types").select("id, name").order("order_index"),
  ]);

  let gradeIdsForLevel: string[] | null = null;
  if (nivel) {
    const { data } = await supabase.from("grades").select("id").eq("education_level_id", nivel);
    gradeIdsForLevel = (data ?? []).map((g) => g.id);
  }

  let contentIdsFromGrade: string[] | null = null;
  if (serie || gradeIdsForLevel) {
    let query = supabase.from("content_grades").select("content_id");
    if (serie) query = query.eq("grade_id", serie);
    else if (gradeIdsForLevel) query = query.in("grade_id", gradeIdsForLevel);
    const { data } = await query;
    contentIdsFromGrade = (data ?? []).map((r) => r.content_id);
  }

  let contentIdsFromSubject: string[] | null = null;
  if (disciplina) {
    const { data } = await supabase
      .from("content_subjects")
      .select("content_id")
      .eq("subject_id", disciplina);
    contentIdsFromSubject = (data ?? []).map((r) => r.content_id);
  }

  let contentIdsFromUnit: string[] | null = null;
  if (unidade) {
    const { data } = await supabase
      .from("content_units")
      .select("content_id")
      .eq("curriculum_unit_id", unidade);
    contentIdsFromUnit = (data ?? []).map((r) => r.content_id);
  }

  let contentIdsFromTheme: string[] | null = null;
  if (tema) {
    const { data } = await supabase.from("content_themes").select("content_id").eq("theme_id", tema);
    contentIdsFromTheme = (data ?? []).map((r) => r.content_id);
  }

  let contentIdsFromSubtheme: string[] | null = null;
  if (subtema) {
    const { data } = await supabase
      .from("content_subthemes")
      .select("content_id")
      .eq("subtheme_id", subtema);
    contentIdsFromSubtheme = (data ?? []).map((r) => r.content_id);
  }

  let contentIdsFromType: string[] | null = null;
  if (tipo) {
    const { data } = await supabase
      .from("content_content_types")
      .select("content_id")
      .eq("content_type_id", tipo);
    contentIdsFromType = (data ?? []).map((r) => r.content_id);
  }

  let bnccSkill: { code: string; description: string } | null = null;
  let contentIdsFromBnccSkill: string[] | null = null;
  if (habilidade) {
    const [{ data: links }, { data: skill }] = await Promise.all([
      supabase.from("content_bncc_skills").select("content_id").eq("bncc_skill_id", habilidade),
      supabase.from("bncc_skills").select("code, description").eq("id", habilidade).maybeSingle(),
    ]);
    contentIdsFromBnccSkill = (links ?? []).map((r) => r.content_id);
    bnccSkill = skill;
  }

  const filteredIds = await intersectContentIds([
    contentIdsFromGrade,
    contentIdsFromSubject,
    contentIdsFromUnit,
    contentIdsFromTheme,
    contentIdsFromSubtheme,
    contentIdsFromType,
    contentIdsFromBnccSkill,
  ]);

  let query = supabase
    .from("contents")
    .select(
      `id, slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
      content_subjects(subjects(name)),
      content_grades(grades(name)),
      content_content_types(content_types(name))`,
      { count: "exact" },
    );

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch", config: "portuguese" });
  } else {
    query = query.order("created_at", { ascending: false });
  }
  if (filteredIds) query = query.in("id", filteredIds);

  const from = (page - 1) * PAGE_SIZE;
  const { data: contents, count } = await query
    .range(from, from + PAGE_SIZE - 1)
    .returns<ContentListRow[]>();

  const materials: MaterialCardData[] = (contents ?? []).map((c) => ({
    slug: c.slug,
    title: c.title,
    short_description: c.short_description,
    cover_url: c.cover_url,
    access_type: c.access_type,
    has_answer_key: c.has_answer_key,
    isNew: isRecentlyCreated(c.created_at),
    subjectNames: c.content_subjects.map((s) => s.subjects?.name).filter((n): n is string => Boolean(n)),
    gradeNames: c.content_grades.map((g) => g.grades?.name).filter((n): n is string => Boolean(n)),
    typeNames: c.content_content_types
      .map((t) => t.content_types?.name)
      .filter((n): n is string => Boolean(n)),
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (nivel) p.set("nivel", nivel);
    if (serie) p.set("serie", serie);
    if (disciplina) p.set("disciplina", disciplina);
    if (unidade) p.set("unidade", unidade);
    if (tema) p.set("tema", tema);
    if (subtema) p.set("subtema", subtema);
    if (tipo) p.set("tipo", tipo);
    if (habilidade) p.set("habilidade", habilidade);
    if (targetPage > 1) p.set("pagina", String(targetPage));
    const qs = p.toString();
    return `/materiais${qs ? `?${qs}` : ""}`;
  };

  const buildHrefWithout = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (nivel) p.set("nivel", nivel);
    if (serie) p.set("serie", serie);
    if (disciplina) p.set("disciplina", disciplina);
    if (unidade) p.set("unidade", unidade);
    if (tema) p.set("tema", tema);
    if (subtema) p.set("subtema", subtema);
    if (tipo) p.set("tipo", tipo);
    if (habilidade) p.set("habilidade", habilidade);
    p.delete(key);
    const qs = p.toString();
    return `/materiais${qs ? `?${qs}` : ""}`;
  };

  const educationLevelOptions = (educationLevels ?? []).map((l) => ({ id: l.id, name: l.name, orderIndex: l.order_index }));
  const filtersData: MaterialFiltersData = {
    educationLevels: educationLevelOptions,
    grades: sortGradesByLevel(
      (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
      educationLevelOptions,
    ),
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name })),
    gradeSubjects: (gradeSubjects ?? []).map((gs) => ({ gradeId: gs.grade_id, subjectId: gs.subject_id })),
    curriculumUnits: (curriculumUnits ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      gradeId: u.grade_id,
      subjectId: u.subject_id,
    })),
    themes: (themes ?? []).map((t) => ({ id: t.id, name: t.name, curriculumUnitId: t.curriculum_unit_id })),
    subthemes: (subthemes ?? []).map((s) => ({ id: s.id, name: s.name, themeId: s.theme_id })),
    contentTypes: (contentTypes ?? []).map((c) => ({ id: c.id, name: c.name })),
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <PageHeader title="Materiais" description={`${total} materiais encontrados`} />

      {bnccSkill && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Filtrado pela habilidade BNCC</span>
          <span className="font-mono font-medium">{bnccSkill.code}</span>
          <span className="text-muted-foreground">— {bnccSkill.description}</span>
          <Link href={buildHrefWithout("habilidade")} className="ml-auto text-xs underline">
            Remover filtro
          </Link>
        </div>
      )}

      <MaterialFilters data={filtersData} />

      {materials.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum material encontrado"
          description="Tente outro termo de busca ou remova alguns filtros."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.slug} material={material} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page <= 1 ? (
            <Button variant="outline" disabled>
              Anterior
            </Button>
          ) : (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={buildPageHref(page - 1)}>Anterior</Link>}
            />
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page >= totalPages ? (
            <Button variant="outline" disabled>
              Próxima
            </Button>
          ) : (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={buildPageHref(page + 1)}>Próxima</Link>}
            />
          )}
        </div>
      )}
    </div>
  );
}
