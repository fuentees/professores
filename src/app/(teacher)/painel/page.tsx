import Link from "next/link";
import {
  BookOpenText,
  CalendarRange,
  ClipboardCheck,
  Download,
  GraduationCap,
  Heart,
  LayoutGrid,
  ScanText,
  SquareStack,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { SectionHeader } from "@/components/common/section-header";
import { fetchContentCards } from "@/lib/queries/content-cards";
import { isRecentlyCreated } from "@/lib/dates";
import { TeacherActionCarousel } from "@/components/painel/teacher-action-carousel";
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
      ? supabase.from("download_events").select("*", { count: "exact", head: true }).eq("teacher_id", profile.id)
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
  const teacherName = profile?.full_name?.trim().split(/\s+/)[0] || "professor(a)";

  return (
    <div className="space-y-8">
      <h1 className="sr-only">Painel do professor</h1>
      <TeacherActionCarousel teacherName={teacherName} />

      <section className="space-y-4" aria-labelledby="quick-actions-title">
        <div>
          <h2 id="quick-actions-title" className="text-lg font-semibold tracking-tight">
            Acessos rápidos
          </h2>
          <p className="text-sm text-muted-foreground">Vá direto para as ferramentas mais usadas no planejamento.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(
            [
              {
                href: "/painel/planejamento",
                label: "Planejar aula",
                description: "Crie um plano completo com BNCC e inclusão.",
                icon: CalendarRange,
                tint: "bg-bncc-soft text-bncc",
              },
              {
                href: "/painel/banco-de-questoes",
                label: "Banco de questões",
                description: "Selecione questões e monte avaliações.",
                icon: SquareStack,
                tint: "bg-assessment-soft text-assessment",
              },
              {
                href: "/painel/corretor",
                label: "Corretor com IA",
                description: "Analise exercícios e redações por foto.",
                icon: ScanText,
                tint: "bg-activity-soft text-activity",
              },
              {
                href: "/materiais",
                label: "Biblioteca de materiais",
                description: "Encontre conteúdos por série e disciplina.",
                icon: BookOpenText,
                tint: "bg-primary/10 text-primary",
              },
              {
                href: "/objetos",
                label: "Recursos interativos",
                description: "Abra jogos e simulações para a turma.",
                icon: LayoutGrid,
                tint: "bg-interactive-soft text-interactive",
              },
              {
                href: "/painel/favoritos",
                label: "Meus favoritos",
                description: "Retome o que você já separou.",
                icon: Heart,
                tint: "bg-primary/10 text-primary",
              },
            ] satisfies {
              href: string;
              label: string;
              description: string;
              icon: LucideIcon;
              tint: string;
            }[]
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-32 flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <span className={`flex size-10 items-center justify-center rounded-xl ${item.tint}`}>
                <item.icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="mt-4">
                <p className="font-semibold tracking-tight group-hover:text-primary">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="activity-summary-title">
        <div>
          <h2 id="activity-summary-title" className="text-lg font-semibold tracking-tight">
            Sua atividade
          </h2>
          <p className="text-sm text-muted-foreground">Um resumo do que você já organizou na plataforma.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Materiais favoritados", value: favoritesCount ?? 0, icon: Heart, tint: "text-primary bg-primary/10" },
            { label: "Cursos em andamento", value: coursesInProgress, icon: GraduationCap, tint: "text-primary bg-primary/10" },
            { label: "Downloads recentes", value: downloadsCount ?? 0, icon: Download, tint: "text-muted-foreground bg-muted" },
            {
              label: "Avaliações salvas",
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
      </section>

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
