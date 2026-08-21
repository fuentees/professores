import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookMarked,
  BookOpenCheck,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  LayoutGrid,
  RotateCcw,
  Search,
  Shapes,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/common/section-header";
import { MaterialCard } from "@/components/materials/material-card";
import { CourseCard } from "@/components/courses/course-card";
import { LearningObjectCard } from "@/components/learning-objects/learning-object-card";
import { fetchContentCards } from "@/lib/queries/content-cards";

type TaskShortcut = { label: string; icon: typeof HomeIcon; typeName: string };

const TASK_SHORTCUTS: TaskShortcut[] = [
  { label: "Preparar uma aula", icon: HomeIcon, typeName: "Plano de aula" },
  { label: "Praticar conteúdo", icon: Target, typeName: "Lista de exercícios" },
  { label: "Avaliar a turma", icon: ClipboardCheck, typeName: "Avaliação" },
  { label: "Revisar conteúdo", icon: RotateCcw, typeName: "Resumo" },
  { label: "Engajar os alunos", icon: Sparkles, typeName: "Jogo pedagógico" },
  { label: "Trabalho em grupo", icon: Users, typeName: "Projeto" },
  { label: "Recuperação", icon: FileText, typeName: "Atividade de recuperação" },
];

export default async function HomePage() {
  // Usuário já logado não tem por que ver a página comercial de novo — ela
  // existe pra converter visitante anônimo. Sem isso, "/" virava mais uma
  // tela de "início" dentro do mesmo shell, o que confunde (principalmente
  // quem não tem tanta intimidade com o site).
  const profile = await getCurrentProfile();
  if (profile && profile.status === "active") {
    if (profile.role === "admin") redirect("/admin");
    if (profile.role === "teacher") redirect("/painel");
  }

  const supabase = await createClient();

  const [
    { data: educationLevels },
    { data: contentTypes },
    featured,
    recent,
    free,
    { data: courses },
    { data: objects },
    { count: materialsCount },
    { count: objectsCount },
    { count: teachersCount },
  ] = await Promise.all([
    supabase.from("education_levels").select("id, name").order("order_index"),
    supabase.from("content_types").select("id, name"),
    fetchContentCards(supabase, { featuredOnly: true, limit: 4 }),
    fetchContentCards(supabase, { limit: 8 }),
    fetchContentCards(supabase, { freeOnly: true, limit: 4 }),
    supabase
      .from("courses")
      .select("slug, title, description, cover_url, instructor, workload_hours")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("learning_objects")
      .select("slug, title, description, cover_url, object_type, activity_type")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("contents").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("learning_objects").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "teacher")
      .eq("status", "active"),
  ]);

  const typeIdByName = new Map((contentTypes ?? []).map((t) => [t.name, t.id]));
  const shortcuts = TASK_SHORTCUTS.map((s) => ({ ...s, typeId: typeIdByName.get(s.typeName) })).filter(
    (s) => s.typeId,
  );

  const stats = [
    { label: "materiais pedagógicos", value: materialsCount ?? 0 },
    { label: "recursos interativos", value: objectsCount ?? 0 },
    { label: "professores cadastrados", value: teachersCount ?? 0 },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex flex-1 flex-col">
      <section className="editorial-surface relative overflow-hidden border-b px-4 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-interactive/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-bncc/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 sm:px-2 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/85 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <GraduationCap className="h-3.5 w-3.5" />
            Biblioteca digital para professores
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] sm:text-6xl">
            Recursos que transformam a sua <span className="text-primary">próxima aula.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Encontre atividades, avaliações, jogos e recursos prontos para qualquer série e
            disciplina.
          </p>

          <form action="/materiais" method="get" className="flex w-full max-w-2xl flex-col gap-2">
            <label htmlFor="home-search" className="sr-only">
              O que você quer ensinar hoje?
            </label>
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-xl shadow-primary/8">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                id="home-search"
                name="q"
                type="text"
                placeholder="Ex.: atividade sobre frações para o 6º ano"
                className="w-full bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" className="h-10 shrink-0 rounded-xl px-5">
                Buscar <ChevronRight className="size-4" />
              </Button>
            </div>
          </form>

          {stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-primary">
                    {stat.value.toLocaleString("pt-BR")}+
                  </span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          </div>

          <div className="relative hidden min-h-[430px] lg:block" aria-hidden>
            <div className="absolute inset-8 rotate-3 rounded-[2.5rem] bg-primary/10" />
            <div className="absolute inset-x-12 top-5 rounded-3xl border bg-card p-5 shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><BookOpenCheck className="size-5" /></span>
                <div><p className="text-xs font-medium text-primary">PLANO DE AULA</p><p className="font-semibold">Aprendizagem que faz sentido</p></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="h-24 rounded-2xl bg-assessment-soft" />
                <div className="h-24 rounded-2xl bg-bncc-soft" />
                <div className="h-24 rounded-2xl bg-interactive-soft" />
              </div>
              <div className="mt-4 h-2.5 w-4/5 rounded-full bg-muted" />
              <div className="mt-2 h-2.5 w-3/5 rounded-full bg-muted" />
            </div>
            <div className="absolute bottom-8 left-0 flex w-52 -rotate-3 items-center gap-3 rounded-2xl border bg-card p-4 shadow-xl">
              <span className="flex size-10 items-center justify-center rounded-xl bg-interactive-soft text-interactive"><Shapes className="size-5" /></span>
              <div><p className="text-xs text-muted-foreground">Recurso interativo</p><p className="text-sm font-semibold">Pronto para jogar</p></div>
            </div>
            <div className="absolute right-0 bottom-1 flex w-52 rotate-2 items-center gap-3 rounded-2xl border bg-card p-4 shadow-xl">
              <span className="flex size-10 items-center justify-center rounded-xl bg-bncc-soft text-bncc"><BookMarked className="size-5" /></span>
              <div><p className="text-xs text-muted-foreground">Alinhamento</p><p className="text-sm font-semibold">Habilidades BNCC</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <p className="text-sm font-medium text-muted-foreground">Navegue por etapa</p>
        <div className="flex flex-wrap gap-2">
          {(educationLevels ?? []).map((level) => (
            <Link
              key={level.id}
              href={`/materiais?nivel=${level.id}`}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
            >
              {level.name}
            </Link>
          ))}
        </div>
      </section>

      {shortcuts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <p className="text-sm font-medium text-muted-foreground">O que você precisa fazer hoje?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shortcuts.map(({ label, icon: Icon, typeId }) => (
              <Link
                key={label}
                href={`/materiais?tipo=${typeId}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center text-sm font-medium shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8"><Icon className="h-5 w-5 text-primary/70 transition-colors group-hover:text-primary" /></span>
                {label}
              </Link>
            ))}
            <Link
              href="/objetos"
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center text-sm font-medium shadow-sm transition-all hover:-translate-y-1 hover:border-interactive/30 hover:bg-interactive/5 hover:shadow-lg"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-interactive-soft"><LayoutGrid className="h-5 w-5 text-interactive/70 transition-colors group-hover:text-interactive" /></span>
              Recursos interativos
            </Link>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <SectionHeader
            title="Materiais em destaque"
            description="Selecionados pela nossa equipe pedagógica."
            href="/materiais"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <SectionHeader title="Novidades" description="Os últimos materiais publicados." href="/materiais" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 4).map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </section>
      )}

      {objects && objects.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <SectionHeader
            title="Jogos e atividades interativas"
            description="Recursos que os alunos usam direto na plataforma."
            href="/objetos"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {objects.map((obj) => (
              <LearningObjectCard key={obj.slug} object={obj} />
            ))}
          </div>
        </section>
      )}

      {courses && courses.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <SectionHeader title="Cursos em destaque" description="Formação continuada para professores." href="/cursos" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </section>
      )}

      {free.length > 0 && (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6">
          <SectionHeader
            title="Conteúdos gratuitos"
            description="Sem precisar de assinatura para baixar."
            href="/materiais"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {free.map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bncc-soft text-bncc">
              <BookMarked className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-semibold tracking-tight">Alinhado à BNCC</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Conteúdos vinculados às habilidades da Base Nacional Comum Curricular.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-interactive-soft text-interactive">
              <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-semibold tracking-tight">Recursos interativos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Jogos, quizzes e simulações que os alunos usam direto no navegador.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-semibold tracking-tight">Feito para professores</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Biblioteca organizada por nível, série, disciplina e tema — não é gestão escolar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
