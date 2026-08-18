import Link from "next/link";
import {
  BookMarked,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  LayoutGrid,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const [
    { data: educationLevels },
    { data: contentTypes },
    featured,
    recent,
    free,
    { data: courses },
    { data: objects },
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
      .select("slug, title, description, cover_url, object_type")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const typeIdByName = new Map((contentTypes ?? []).map((t) => [t.name, t.id]));
  const shortcuts = TASK_SHORTCUTS.map((s) => ({ ...s, typeId: typeIdByName.get(s.typeName) })).filter(
    (s) => s.typeId,
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b bg-gradient-to-b from-muted/40 to-background px-4 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Biblioteca digital para professores
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sua próxima aula começa aqui.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Encontre atividades, avaliações, jogos e recursos prontos para qualquer série e
            disciplina.
          </p>

          <form action="/materiais" method="get" className="flex w-full max-w-xl flex-col gap-2">
            <label htmlFor="home-search" className="sr-only">
              O que você quer ensinar hoje?
            </label>
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-sm">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                id="home-search"
                name="q"
                type="text"
                placeholder="Ex.: atividade sobre frações para o 6º ano"
                className="w-full bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
        <p className="text-sm font-medium text-muted-foreground">Navegue por etapa</p>
        <div className="flex flex-wrap gap-2">
          {(educationLevels ?? []).map((level) => (
            <Link
              key={level.id}
              href={`/materiais?nivel=${level.id}`}
              className="rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              {level.name}
            </Link>
          ))}
        </div>
      </section>

      {shortcuts.length > 0 && (
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
          <p className="text-sm font-medium text-muted-foreground">O que você precisa fazer hoje?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shortcuts.map(({ label, icon: Icon, typeId }) => (
              <Link
                key={label}
                href={`/materiais?tipo=${typeId}`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm transition-colors hover:bg-accent"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                {label}
              </Link>
            ))}
            <Link
              href="/objetos"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm transition-colors hover:bg-accent"
            >
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              Recursos interativos
            </Link>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
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
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
          <SectionHeader title="Novidades" description="Os últimos materiais publicados." href="/materiais" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 4).map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </section>
      )}

      {objects && objects.length > 0 && (
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
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
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
          <SectionHeader title="Cursos em destaque" description="Formação continuada para professores." href="/cursos" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </section>
      )}

      {free.length > 0 && (
        <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
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

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <BookMarked className="h-6 w-6 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Alinhado à BNCC</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Conteúdos vinculados às habilidades da Base Nacional Comum Curricular.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Recursos interativos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Jogos, quizzes e simulações que os alunos usam direto no navegador.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Feito para professores</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Biblioteca organizada por nível, série, disciplina e tema — não é gestão escolar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
