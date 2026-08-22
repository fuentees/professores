import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, LayoutGrid, Search, SquareStack } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSearchTokens, matchesSearch } from "@/lib/search";
import { isRecentlyCreated } from "@/lib/dates";
import { searchQuestions } from "@/actions/question-bank";
import { Button } from "@/components/ui/button";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { LearningObjectCard, type LearningObjectCardData } from "@/components/learning-objects/learning-object-card";
import { CourseCard, type CourseCardData } from "@/components/courses/course-card";
import { QuestionCard } from "@/components/questions/question-card";
import type { LearningActivityTypeDb } from "@/types/supabase";

export const metadata: Metadata = {
  title: "Buscar no portal",
  description: "Encontre materiais, questões, recursos interativos e cursos em uma única busca.",
};

type MaterialRow = {
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

type ObjectRow = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
  activity_type: LearningActivityTypeDb | null;
  subjects: { name: string } | null;
  grades: { name: string } | null;
};

type CourseRow = CourseCardData;

function SearchSection({
  title,
  description,
  count,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  const sectionId = `search-section-${title.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className="space-y-4" aria-labelledby={sectionId}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 id={sectionId} className="font-semibold tracking-tight">
              {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
            </h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {count > 0 && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function NoResults({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum {label} encontrado para esta busca.</p>;
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const tokens = getSearchTokens(q);
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const canSearchQuestions = Boolean(profile && profile.status === "active");

  let materialQuery = supabase
    .from("contents")
    .select(
      `slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
      content_subjects(subjects(name)),
      content_grades(grades(name)),
      content_content_types(content_types(name))`,
      { count: "exact" },
    )
    .eq("status", "published")
    .limit(6);

  if (tokens.length > 0) {
    materialQuery = materialQuery.textSearch("search_vector", tokens.join(" OR "), {
      type: "websearch",
      config: "portuguese",
    });
  } else if (q) {
    materialQuery = materialQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  } else {
    materialQuery = materialQuery.order("created_at", { ascending: false });
  }

  const [
    { data: materialRows, count: materialCount },
    { data: objectRows },
    { data: courseRows },
    questionResult,
  ] = await Promise.all([
    materialQuery.returns<MaterialRow[]>(),
    supabase
      .from("learning_objects")
      .select("slug, title, description, cover_url, object_type, activity_type, subjects(name), grades(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .returns<ObjectRow[]>(),
    supabase
      .from("courses")
      .select("slug, title, description, cover_url, instructor, workload_hours")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .returns<CourseRow[]>(),
    canSearchQuestions && q
      ? searchQuestions({ q })
      : Promise.resolve({ error: null, questions: [], total: 0 }),
  ]);

  const materials: MaterialCardData[] = (materialRows ?? []).map((material) => ({
    slug: material.slug,
    title: material.title,
    short_description: material.short_description,
    cover_url: material.cover_url,
    access_type: material.access_type,
    has_answer_key: material.has_answer_key,
    isNew: isRecentlyCreated(material.created_at),
    subjectNames: material.content_subjects.map((item) => item.subjects?.name).filter((name): name is string => Boolean(name)),
    gradeNames: material.content_grades.map((item) => item.grades?.name).filter((name): name is string => Boolean(name)),
    typeNames: material.content_content_types.map((item) => item.content_types?.name).filter((name): name is string => Boolean(name)),
  }));

  const matchingObjects = q
    ? (objectRows ?? []).filter((object) =>
        matchesSearch(
          [object.title, object.description, object.subjects?.name, object.grades?.name].filter(Boolean).join(" "),
          tokens,
        ),
      )
    : objectRows ?? [];
  const objects: LearningObjectCardData[] = matchingObjects.slice(0, 8).map((object) => ({
    slug: object.slug,
    title: object.title,
    description: object.description,
    cover_url: object.cover_url,
    object_type: object.object_type,
    activity_type: object.activity_type,
    subject_name: object.subjects?.name,
    grade_name: object.grades?.name,
  }));

  const matchingCourses = q
    ? (courseRows ?? []).filter((course) =>
        matchesSearch([course.title, course.description, course.instructor].filter(Boolean).join(" "), tokens),
      )
    : courseRows ?? [];
  const courses = matchingCourses.slice(0, 6);
  const questions = questionResult.questions.slice(0, 6);
  const totalVisible = (materialCount ?? 0) + matchingObjects.length + matchingCourses.length + questionResult.total;
  const encodedQuery = encodeURIComponent(q);

  return (
    <div className="editorial-surface min-h-[calc(100vh-4.5rem)] overflow-hidden">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Search className="size-7" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Encontre tudo em um só lugar</h1>
            <p className="mt-2 text-muted-foreground">
              Pesquise materiais, questões, jogos, simulações e cursos sem precisar escolher uma área antes.
            </p>
          </div>
          <form action="/buscar" method="get" className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="global-search" className="sr-only">O que você precisa?</label>
            <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-4 shadow-sm">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="global-search"
                name="q"
                defaultValue={q}
                placeholder="Ex.: frações, História do Brasil ou 6º ano"
                className="h-12 w-full bg-transparent text-sm outline-none"
                autoFocus={!q}
              />
            </div>
            <Button type="submit" className="h-12 rounded-xl px-7">Buscar</Button>
          </form>
          {q && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {totalVisible} resultado{totalVisible === 1 ? "" : "s"} para <strong className="text-foreground">“{q}”</strong>
            </p>
          )}
        </header>

        {!q ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Materiais", "Atividades, avaliações e planos de aula", "/materiais", BookOpen],
              ["Recursos interativos", "Jogos, quizzes e simulações", "/objetos", LayoutGrid],
              ["Banco de questões", "Questões prontas para suas avaliações", "/painel/banco-de-questoes", SquareStack],
              ["Cursos", "Formação continuada para professores", "/cursos", GraduationCap],
            ].map(([title, description, href, Icon]) => (
              <Link key={String(href)} href={String(href)} className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
                <Icon className="mb-3 size-6 text-primary" />
                <h2 className="font-semibold">{String(title)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{String(description)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <SearchSection title="Materiais" description="Atividades, avaliações e planejamento para baixar ou imprimir." count={materialCount ?? 0} href={`/materiais?q=${encodedQuery}`} icon={BookOpen}>
              {materials.length === 0 ? <NoResults label="material" /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{materials.map((material, index) => <MaterialCard key={material.slug} material={material} eager={index < 3} />)}</div>}
            </SearchSection>

            <SearchSection title="Recursos interativos" description="Jogos, quizzes, flashcards e simulações para usar direto no navegador." count={matchingObjects.length} href={`/objetos?q=${encodedQuery}`} icon={LayoutGrid}>
              {objects.length === 0 ? <NoResults label="recurso interativo" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{objects.map((object) => <LearningObjectCard key={object.slug} object={object} />)}</div>}
            </SearchSection>

            <SearchSection title="Cursos" description="Formação continuada e desenvolvimento profissional." count={matchingCourses.length} href="/cursos" icon={GraduationCap}>
              {courses.length === 0 ? <NoResults label="curso" /> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course, index) => <CourseCard key={course.slug} course={course} eager={index < 3} />)}</div>}
            </SearchSection>

            {canSearchQuestions ? (
              <SearchSection title="Banco de questões" description="Questões publicadas para montar atividades e avaliações." count={questionResult.total} href={`/painel/banco-de-questoes?q=${encodedQuery}`} icon={SquareStack}>
                {questions.length === 0 ? <NoResults label="questão" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{questions.map((question) => <QuestionCard key={question.id} question={question} />)}</div>}
              </SearchSection>
            ) : (
              <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-assessment-soft/60 p-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">Busque também no banco de questões</h2>
                  <p className="text-sm text-muted-foreground">Entre como professor para encontrar questões e montar avaliações.</p>
                </div>
                <Button nativeButton={false} render={<Link href={`/entrar?redirect=/buscar%3Fq%3D${encodedQuery}`}>Entrar para ver questões</Link>} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
