import { createClient } from "@/lib/supabase/server";
import { MaterialFilters, type FilterOption } from "@/components/materials/material-filters";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  const tipo = typeof params.tipo === "string" ? params.tipo : "";
  const page = Math.max(1, Number(params.pagina) || 1);

  const supabase = await createClient();

  const [{ data: educationLevels }, { data: grades }, { data: subjects }, { data: contentTypes }] =
    await Promise.all([
      supabase.from("education_levels").select("id, name").order("order_index"),
      supabase.from("grades").select("id, name").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
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

  let contentIdsFromType: string[] | null = null;
  if (tipo) {
    const { data } = await supabase
      .from("content_content_types")
      .select("content_id")
      .eq("content_type_id", tipo);
    contentIdsFromType = (data ?? []).map((r) => r.content_id);
  }

  const filteredIds = await intersectContentIds([
    contentIdsFromGrade,
    contentIdsFromSubject,
    contentIdsFromType,
  ]);

  let query = supabase
    .from("contents")
    .select(
      `id, slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
      content_subjects(subjects(name)),
      content_grades(grades(name)),
      content_content_types(content_types(name))`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);
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
    if (tipo) p.set("tipo", tipo);
    if (targetPage > 1) p.set("pagina", String(targetPage));
    const qs = p.toString();
    return `/materiais${qs ? `?${qs}` : ""}`;
  };

  const educationLevelOptions: FilterOption[] = (educationLevels ?? []).map((l) => ({
    id: l.id,
    name: l.name,
  }));
  const gradeOptions: FilterOption[] = (grades ?? []).map((g) => ({ id: g.id, name: g.name }));
  const subjectOptions: FilterOption[] = (subjects ?? []).map((s) => ({ id: s.id, name: s.name }));
  const contentTypeOptions: FilterOption[] = (contentTypes ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Materiais</h1>
        <p className="text-muted-foreground">{total} materiais encontrados</p>
      </div>

      <MaterialFilters
        educationLevels={educationLevelOptions}
        grades={gradeOptions}
        subjects={subjectOptions}
        contentTypes={contentTypeOptions}
      />

      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum material encontrado com esses filtros.
        </div>
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
