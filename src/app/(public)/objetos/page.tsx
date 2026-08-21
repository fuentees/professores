import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InteractiveHero } from "@/components/interactive/interactive-hero";
import { InteractiveCategoryNav } from "@/components/interactive/interactive-category-nav";
import { InteractiveFilters } from "@/components/interactive/interactive-filters";
import { InteractiveSection } from "@/components/interactive/interactive-section";
import { InteractiveEmptyState } from "@/components/interactive/interactive-empty-state";
import { InteractiveCard, type InteractiveCardData } from "@/components/interactive/interactive-card";
import { LearningObjectCard, type LearningObjectCardData } from "@/components/learning-objects/learning-object-card";
import {
  INTERACTIVE_CATEGORIES,
  CATEGORY_META,
  ACTIVITY_TYPE_CATEGORY,
  type InteractiveCategory,
} from "@/lib/interactive/categories";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { sortGradesByLevel } from "@/lib/pedagogical-order";

export const metadata: Metadata = {
  title: "Recursos interativos",
  description: "Jogos, quizzes e simulações prontos pra usar em sala de aula.",
};

type ObjectRow = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
  activity_type: LearningActivityType | null;
  subject_id: string | null;
  grade_id: string | null;
  subjects: { name: string } | null;
  grades: { name: string } | null;
};

export default async function ObjetosPage({ searchParams }: PageProps<"/objetos">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const disciplina = typeof params.disciplina === "string" ? params.disciplina : "";
  const nivel = typeof params.nivel === "string" ? params.nivel : "";
  const serie = typeof params.serie === "string" ? params.serie : "";
  const categoriaParam = typeof params.categoria === "string" ? params.categoria : "";
  const categoria = INTERACTIVE_CATEGORIES.includes(categoriaParam as InteractiveCategory)
    ? (categoriaParam as InteractiveCategory)
    : null;

  const supabase = await createClient();

  const [{ data: objects }, { data: subjects }, { data: educationLevels }, { data: grades }] = await Promise.all([
    supabase
      .from("learning_objects")
      .select(
        "slug, title, description, cover_url, object_type, activity_type, subject_id, grade_id, subjects(name), grades(name)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .returns<ObjectRow[]>(),
    supabase.from("subjects").select("id, name").order("order_index"),
    supabase.from("education_levels").select("id, name, order_index").order("order_index"),
    supabase.from("grades").select("id, name, education_level_id").order("order_index"),
  ]);

  const educationLevelOptions = (educationLevels ?? []).map((l) => ({ id: l.id, name: l.name, orderIndex: l.order_index }));
  const gradeOptions = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    educationLevelOptions,
  );
  const gradeIdsForLevel = nivel ? new Set(gradeOptions.filter((g) => g.educationLevelId === nivel).map((g) => g.id)) : null;

  const all = objects ?? [];
  const withActivity = all.filter((o) => o.activity_type !== null);
  const legacy = all.filter((o) => o.activity_type === null);

  const toCardData = (o: ObjectRow): InteractiveCardData => ({
    slug: o.slug,
    title: o.title,
    description: o.description,
    coverUrl: o.cover_url,
    activityType: o.activity_type as LearningActivityType,
    subjectName: o.subjects?.name ?? null,
    gradeName: o.grades?.name ?? null,
  });

  const term = q.toLowerCase();
  const matchesQuery = (o: ObjectRow) => !term || o.title.toLowerCase().includes(term) || (o.description ?? "").toLowerCase().includes(term);
  const matchesSubject = (o: ObjectRow) => !disciplina || o.subject_id === disciplina;
  const matchesLevel = (o: ObjectRow) => !gradeIdsForLevel || (o.grade_id !== null && gradeIdsForLevel.has(o.grade_id));
  const matchesGrade = (o: ObjectRow) => !serie || o.grade_id === serie;
  const matchesCategory = (o: ObjectRow) =>
    !categoria || ACTIVITY_TYPE_CATEGORY[o.activity_type as LearningActivityType] === categoria;

  const filtered = withActivity.filter(
    (o) => matchesQuery(o) && matchesSubject(o) && matchesLevel(o) && matchesGrade(o) && matchesCategory(o),
  );

  const hasActiveFilters = Boolean(q || disciplina || nivel || serie || categoria);

  function buildCategoryHref(cat: InteractiveCategory | null): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (disciplina) p.set("disciplina", disciplina);
    if (nivel) p.set("nivel", nivel);
    if (serie) p.set("serie", serie);
    if (cat) p.set("categoria", cat);
    const qs = p.toString();
    return `/objetos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="editorial-surface mx-auto w-full max-w-7xl space-y-8 overflow-hidden px-4 py-10 sm:px-6">
      <InteractiveHero total={withActivity.length} />

      <div className="space-y-4">
        <InteractiveCategoryNav active={categoria} buildHref={buildCategoryHref} />
        <InteractiveFilters
          subjects={(subjects ?? []).map((s) => ({ id: s.id, name: s.name }))}
          educationLevels={educationLevelOptions}
          grades={gradeOptions}
        />
      </div>

      {filtered.length === 0 ? (
        <InteractiveEmptyState hasFilters={hasActiveFilters} />
      ) : hasActiveFilters ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((o) => (
            <InteractiveCard key={o.slug} object={toCardData(o)} />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {INTERACTIVE_CATEGORIES.map((cat) => {
            const items = withActivity
              .filter((o) => ACTIVITY_TYPE_CATEGORY[o.activity_type as LearningActivityType] === cat)
              .slice(0, 4)
              .map(toCardData);
            return (
              <InteractiveSection
                key={cat}
                category={CATEGORY_META[cat]}
                items={items}
                href={buildCategoryHref(cat)}
              />
            );
          })}
        </div>
      )}

      {legacy.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="font-semibold tracking-tight">Outros recursos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {legacy.map((o) => (
              <LearningObjectCard
                key={o.slug}
                object={
                  {
                    slug: o.slug,
                    title: o.title,
                    description: o.description,
                    cover_url: o.cover_url,
                    object_type: o.object_type,
                    activity_type: null,
                  } satisfies LearningObjectCardData
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
