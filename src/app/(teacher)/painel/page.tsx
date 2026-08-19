import Link from "next/link";
import { ClipboardCheck, Download, GraduationCap, Heart, LayoutGrid, SquareStack } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { SectionHeader } from "@/components/common/section-header";
import { fetchContentCards } from "@/lib/queries/content-cards";
import { isRecentlyCreated } from "@/lib/dates";
import type { LucideIcon } from "lucide-react";

type FeaturedRow = {
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

type LessonProgressRow = {
  completed_at: string | null;
  course_lessons: { course_modules: { course_id: string } | null } | null;
};

/** Recomendação simples por regra: pega a disciplina mais favoritada pelo
 * professor e sugere materiais recentes dela que ele ainda não favoritou. */
async function fetchRecommendations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
): Promise<MaterialCardData[]> {
  const { data: favoriteSubjects } = await supabase
    .from("favorites")
    .select("contents(content_subjects(subject_id))")
    .eq("teacher_id", teacherId)
    .limit(20)
    .returns<{ contents: { content_subjects: { subject_id: string }[] } | null }[]>();

  const subjectCounts = new Map<string, number>();
  for (const fav of favoriteSubjects ?? []) {
    for (const cs of fav.contents?.content_subjects ?? []) {
      subjectCounts.set(cs.subject_id, (subjectCounts.get(cs.subject_id) ?? 0) + 1);
    }
  }
  const topSubjectId = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topSubjectId) return [];

  const { data: favoriteContentIds } = await supabase
    .from("favorites")
    .select("content_id")
    .eq("teacher_id", teacherId);
  const excludeIds = new Set((favoriteContentIds ?? []).map((f) => f.content_id));

  const { data: subjectContentIds } = await supabase
    .from("content_subjects")
    .select("content_id")
    .eq("subject_id", topSubjectId);
  const candidateIds = (subjectContentIds ?? [])
    .map((r) => r.content_id)
    .filter((id) => !excludeIds.has(id));
  if (candidateIds.length === 0) return [];

  const { data } = await supabase
    .from("contents")
    .select(
      `slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
      content_subjects(subjects(name)),
      content_grades(grades(name)),
      content_content_types(content_types(name))`,
    )
    .eq("status", "published")
    .in("id", candidateIds)
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<FeaturedRow[]>();

  return (data ?? []).map((c) => ({
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
}

export default async function PainelPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [
    { count: favoritesCount },
    { count: downloadsCount },
    { count: examsCount },
    { data: lessonProgress },
    featured,
    recommendations,
  ] = await Promise.all([
    profile
      ? supabase.from("favorites").select("*", { count: "exact", head: true }).eq("teacher_id", profile.id)
      : Promise.resolve({ count: 0 }),
    profile
      ? supabase.from("downloads").select("*", { count: "exact", head: true }).eq("teacher_id", profile.id)
      : Promise.resolve({ count: 0 }),
    profile
      ? supabase.from("generated_exams").select("*", { count: "exact", head: true }).eq("teacher_id", profile.id)
      : Promise.resolve({ count: 0 }),
    profile
      ? supabase
          .from("lesson_progress")
          .select("completed_at, course_lessons(course_modules(course_id))")
          .eq("teacher_id", profile.id)
          .returns<LessonProgressRow[]>()
      : Promise.resolve({ data: [] as LessonProgressRow[] }),
    fetchContentCards(supabase, { featuredOnly: true, limit: 3 }),
    profile ? fetchRecommendations(supabase, profile.id) : Promise.resolve([]),
  ]);

  const coursesInProgress = new Set(
    (lessonProgress ?? [])
      .filter((p) => !p.completed_at)
      .map((p) => p.course_lessons?.course_modules?.course_id)
      .filter((id): id is string => Boolean(id)),
  ).size;

  const materials = featured;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {profile?.full_name || "professor(a)"}</h1>
        <p className="text-muted-foreground">
          Aqui você acompanha novidades, materiais recentes e seus favoritos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Materiais favoritados", value: favoritesCount ?? 0, icon: Heart, tint: "text-primary bg-primary/10" },
            { label: "Cursos em andamento", value: coursesInProgress, icon: GraduationCap, tint: "text-primary bg-primary/10" },
            { label: "Downloads recentes", value: downloadsCount ?? 0, icon: Download, tint: "text-muted-foreground bg-muted" },
            {
              label: "Provas geradas",
              value: examsCount ?? 0,
              icon: ClipboardCheck,
              tint: "text-assessment bg-assessment-soft",
            },
          ] satisfies { label: string; value: number; icon: LucideIcon; tint: string }[]
        ).map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tint}`}>
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/painel/banco-de-questoes"
          className="group flex items-center gap-4 rounded-lg border p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-assessment-soft text-assessment">
            <SquareStack className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold tracking-tight group-hover:underline">Banco de questões</p>
            <p className="text-sm text-muted-foreground">Monte provas com questões prontas por habilidade BNCC.</p>
          </div>
        </Link>
        <Link
          href="/objetos"
          className="group flex items-center gap-4 rounded-lg border p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-interactive-soft text-interactive">
            <LayoutGrid className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold tracking-tight group-hover:underline">Recursos interativos</p>
            <p className="text-sm text-muted-foreground">Jogos e simulações prontos para usar em aula.</p>
          </div>
        </Link>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title="Sugerido para você"
            description="Com base nos materiais que você favoritou."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {recommendations.map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Materiais em destaque</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum material em destaque no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {materials.map((material) => (
                <MaterialCard key={material.slug} material={material} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
