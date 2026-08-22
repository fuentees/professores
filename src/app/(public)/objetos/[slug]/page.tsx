import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpenObjectButton } from "@/components/learning-objects/open-object-button";
import { InteractiveCover } from "@/components/learning-objects/interactive-cover";
import { ActivityPlayer } from "@/components/interactive/activity-player";
import { InteractiveDetailHero } from "@/components/interactive/interactive-detail-hero";
import { getCategoryMeta } from "@/lib/interactive/categories";
import { interactiveActivitySchema, type LearningActivityType } from "@/lib/validations/interactive-activity";
import { learningObjectCover } from "@/lib/content-cover";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { LearningObjectFavoriteButton } from "@/components/learning-objects/learning-object-favorite-button";
import { InteractiveCard } from "@/components/interactive/interactive-card";
import { LearningObjectCard } from "@/components/learning-objects/learning-object-card";
import { ACTIVITY_TYPE_CATEGORY, INTERACTIVE_CATEGORIES, type InteractiveCategory } from "@/lib/interactive/categories";

type ObjectDetailRow = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
  external_url: string | null;
  storage_path: string | null;
  access_type: string;
  activity_type: LearningActivityType | null;
  config: unknown;
  difficulty: string | null;
  estimated_duration_minutes: number | null;
  subjects: { name: string } | null;
  grades: { name: string } | null;
};

type ObjectNavigationRow = {
  id: string;
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

export async function generateMetadata({ params }: PageProps<"/objetos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: obj } = await supabase
    .from("learning_objects")
    .select("title, description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!obj) return {};
  return {
    title: obj.title,
    description: obj.description ?? undefined,
    openGraph: {
      title: obj.title,
      description: obj.description ?? undefined,
      images: [obj.cover_url ?? learningObjectCover(slug)],
    },
  };
}

export default async function LearningObjectDetailPage({
  params,
  searchParams,
}: PageProps<"/objetos/[slug]">) {
  const { slug } = await params;
  const rawSearchParams = await searchParams;
  const rawReturnQuery = typeof rawSearchParams.retorno === "string" ? rawSearchParams.retorno : "";
  const rawContext = new URLSearchParams(rawReturnQuery);
  const context = new URLSearchParams();
  for (const key of ["q", "disciplina", "nivel", "serie", "categoria"] as const) {
    const value = rawContext.get(key);
    if (value) context.set(key, value);
  }
  const returnQuery = context.toString();
  const backHref = returnQuery ? `/objetos?${returnQuery}` : "/objetos";
  const detailHref = (targetSlug: string) =>
    `/objetos/${targetSlug}${returnQuery ? `?retorno=${encodeURIComponent(returnQuery)}` : ""}`;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: obj } = await supabase
    .from("learning_objects")
    .select(
      `id, title, description, cover_url, object_type, external_url, storage_path, access_type,
      activity_type, config, difficulty, estimated_duration_minutes,
      subjects(name), grades(name)`,
    )
    .eq("slug", slug)
    .maybeSingle()
    .returns<ObjectDetailRow>();

  if (!obj) notFound();

  const [{ data: allObjects }, { data: grades }, favoriteResult] = await Promise.all([
    supabase
      .from("learning_objects")
      .select("id, slug, title, description, cover_url, object_type, activity_type, subject_id, grade_id, subjects(name), grades(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .returns<ObjectNavigationRow[]>(),
    supabase.from("grades").select("id, education_level_id"),
    profile
      ? supabase
          .from("learning_object_favorites")
          .select("id")
          .eq("teacher_id", profile.id)
          .eq("learning_object_id", obj.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const objects = allObjects ?? [];
  const q = (context.get("q") ?? "").toLocaleLowerCase("pt-BR");
  const subjectId = context.get("disciplina") ?? "";
  const levelId = context.get("nivel") ?? "";
  const gradeId = context.get("serie") ?? "";
  const categoryValue = context.get("categoria") ?? "";
  const category = INTERACTIVE_CATEGORIES.includes(categoryValue as InteractiveCategory)
    ? (categoryValue as InteractiveCategory)
    : null;
  const levelGradeIds = levelId
    ? new Set((grades ?? []).filter((grade) => grade.education_level_id === levelId).map((grade) => grade.id))
    : null;
  const matchesContext = (item: ObjectNavigationRow) =>
    (!q || item.title.toLocaleLowerCase("pt-BR").includes(q) || (item.description ?? "").toLocaleLowerCase("pt-BR").includes(q)) &&
    (!subjectId || item.subject_id === subjectId) &&
    (!gradeId || item.grade_id === gradeId) &&
    (!levelGradeIds || (item.grade_id !== null && levelGradeIds.has(item.grade_id))) &&
    (!category || (item.activity_type !== null && ACTIVITY_TYPE_CATEGORY[item.activity_type] === category));
  const contextualObjects = objects.filter(matchesContext);
  const navigationObjects = contextualObjects.some((item) => item.slug === slug) ? contextualObjects : objects;
  const currentIndex = navigationObjects.findIndex((item) => item.slug === slug);
  const previousObject = currentIndex > 0 ? navigationObjects[currentIndex - 1] : null;
  const nextObject = currentIndex >= 0 && currentIndex < navigationObjects.length - 1 ? navigationObjects[currentIndex + 1] : null;

  const relatedObjects = objects
    .filter((item) => item.slug !== slug)
    .map((item) => ({
      item,
      score:
        (item.subject_id && item.subject_id === objects.find((candidate) => candidate.slug === slug)?.subject_id ? 4 : 0) +
        (item.grade_id && item.grade_id === objects.find((candidate) => candidate.slug === slug)?.grade_id ? 3 : 0) +
        (item.activity_type && obj.activity_type && ACTIVITY_TYPE_CATEGORY[item.activity_type] === ACTIVITY_TYPE_CATEGORY[obj.activity_type] ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item);

  const coverUrl = obj.cover_url ?? learningObjectCover(slug);

  const canOpen = await canAccessResource(supabase, profile, { accessType: obj.access_type as ResourceAccessType });

  const activityParsed = obj.activity_type
    ? interactiveActivitySchema.safeParse({ activityType: obj.activity_type, config: obj.config })
    : null;
  const activityType = obj.activity_type as LearningActivityType | null;
  const initialFavorited = Boolean(favoriteResult.data);

  const navigation = currentIndex >= 0 && navigationObjects.length > 1 && (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
      {previousObject ? (
        <Button nativeButton={false} variant="outline" size="sm" render={<Link href={detailHref(previousObject.slug)}><ArrowLeft />Anterior</Link>} />
      ) : (
        <Button variant="outline" size="sm" disabled><ArrowLeft />Anterior</Button>
      )}
      <span className="text-sm font-medium">Recurso {currentIndex + 1} de {navigationObjects.length}</span>
      {nextObject ? (
        <Button nativeButton={false} variant="outline" size="sm" render={<Link href={detailHref(nextObject.slug)}>Próximo<ArrowRight /></Link>} />
      ) : (
        <Button variant="outline" size="sm" disabled>Próximo<ArrowRight /></Button>
      )}
    </div>
  );

  const breadcrumb = (
    <nav aria-label="Caminho do recurso" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <Link href={backHref} className="inline-flex items-center gap-1 hover:text-foreground hover:underline"><ArrowLeft className="size-4" />Recursos interativos</Link>
      {obj.subjects?.name && <span>/ {obj.subjects.name}</span>}
      {obj.grades?.name && <span>/ {obj.grades.name}</span>}
    </nav>
  );

  const continuation = canOpen && (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-interactive/20 bg-interactive-soft/40 p-4">
      <div>
        <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-interactive" />Terminou este recurso?</p>
        <p className="text-sm text-muted-foreground">Continue no próximo ou volte para escolher outro.</p>
      </div>
      {nextObject ? (
        <Button nativeButton={false} render={<Link href={detailHref(nextObject.slug)}>Próximo recurso<ArrowRight /></Link>} />
      ) : (
        <Button nativeButton={false} variant="outline" render={<Link href={backHref}>Explorar outros recursos</Link>} />
      )}
    </div>
  );

  const related = relatedObjects.length > 0 && (
    <section className="space-y-4 border-t pt-8">
      <div>
        <h2 className="text-lg font-semibold">Recursos relacionados</h2>
        <p className="text-sm text-muted-foreground">Outras opções próximas da disciplina, série ou formato deste recurso.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {relatedObjects.map((item) =>
          item.activity_type ? (
            <InteractiveCard
              key={item.slug}
              href={detailHref(item.slug)}
              object={{
                slug: item.slug,
                title: item.title,
                description: item.description,
                coverUrl: item.cover_url ?? learningObjectCover(item.slug),
                activityType: item.activity_type,
                subjectName: item.subjects?.name,
                gradeName: item.grades?.name,
              }}
            />
          ) : (
            <LearningObjectCard
              key={item.slug}
              href={detailHref(item.slug)}
              object={{
                slug: item.slug,
                title: item.title,
                description: item.description,
                cover_url: item.cover_url,
                object_type: item.object_type,
              }}
            />
          ),
        )}
      </div>
    </section>
  );

  const accessGate = !canOpen && (
    <div className="rounded-lg border p-4">
      {obj.access_type === "subscriber_only" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Este recurso é exclusivo para assinantes de um plano pago.
          </p>
          <Button nativeButton={false} render={<Link href="/planos">Conhecer planos</Link>} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Entre com sua conta para acessar este recurso.</p>
          <Button nativeButton={false} render={<Link href="/entrar">Entrar</Link>} />
        </div>
      )}
    </div>
  );

  // Recurso interativo (quiz/jogo/simulação/flashcard/atividade) — hero
  // compacto com identidade de categoria + player logo abaixo.
  if (activityType) {
    const category = getCategoryMeta(activityType);
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
        {breadcrumb}
        {navigation}
        <InteractiveDetailHero
          title={obj.title}
          description={obj.description}
          activityType={activityType}
          coverUrl={coverUrl}
          subjectName={obj.subjects?.name ?? null}
          gradeName={obj.grades?.name ?? null}
          difficulty={obj.difficulty}
          estimatedDurationMinutes={obj.estimated_duration_minutes}
          action={
            canOpen && activityParsed?.success ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className={`text-sm font-medium ${category.classes.text}`}>Interaja com a atividade logo abaixo.</p>
                {profile && <LearningObjectFavoriteButton objectId={obj.id} initialFavorited={initialFavorited} />}
                {profile && <Link href="/painel/favoritos" className="text-sm text-muted-foreground hover:underline">Ver itens salvos</Link>}
              </div>
            ) : null
          }
        />

        {accessGate}

        {canOpen && activityParsed?.success && (
          <ActivityPlayer activityType={activityParsed.data.activityType} config={activityParsed.data.config} title={obj.title} />
        )}
        {continuation}
        {related}
      </div>
    );
  }

  // Recurso "estático" legado (upload/link externo) — sem categoria de
  // jogo, mas com a mesma correção de tamanho de capa (nunca full-bleed).
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      {breadcrumb}
      {navigation}
      <InteractiveCover activityType={null} coverUrl={coverUrl} title={obj.title} size="hero" />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{obj.object_type}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{obj.title}</h1>
        {obj.description && <p className="mt-2 text-muted-foreground">{obj.description}</p>}
      </div>

      {profile && (
        <div className="flex flex-wrap items-center gap-3">
          <LearningObjectFavoriteButton objectId={obj.id} initialFavorited={initialFavorited} />
          <Link href="/painel/favoritos" className="text-sm text-muted-foreground hover:underline">Ver itens salvos</Link>
        </div>
      )}

      {accessGate}

      {canOpen && (
        <div className="rounded-lg border p-4">
          <OpenObjectButton objectId={obj.id} externalUrl={obj.external_url} />
        </div>
      )}
      {continuation}
      {related}
    </div>
  );
}
