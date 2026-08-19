import { notFound } from "next/navigation";
import Link from "next/link";
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

export default async function LearningObjectDetailPage({
  params,
}: PageProps<"/objetos/[slug]">) {
  const { slug } = await params;
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

  const canOpen = await canAccessResource(supabase, profile, { accessType: obj.access_type as ResourceAccessType });

  const activityParsed = obj.activity_type
    ? interactiveActivitySchema.safeParse({ activityType: obj.activity_type, config: obj.config })
    : null;
  const activityType = obj.activity_type as LearningActivityType | null;

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
        <InteractiveDetailHero
          title={obj.title}
          description={obj.description}
          activityType={activityType}
          coverUrl={obj.cover_url}
          subjectName={obj.subjects?.name ?? null}
          gradeName={obj.grades?.name ?? null}
          difficulty={obj.difficulty}
          estimatedDurationMinutes={obj.estimated_duration_minutes}
          action={
            canOpen && activityParsed?.success ? (
              <p className={`text-sm font-medium ${category.classes.text}`}>
                Interaja com a atividade logo abaixo.
              </p>
            ) : null
          }
        />

        {accessGate}

        {canOpen && activityParsed?.success && (
          <ActivityPlayer activityType={activityParsed.data.activityType} config={activityParsed.data.config} title={obj.title} />
        )}
      </div>
    );
  }

  // Recurso "estático" legado (upload/link externo) — sem categoria de
  // jogo, mas com a mesma correção de tamanho de capa (nunca full-bleed).
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <InteractiveCover activityType={null} coverUrl={obj.cover_url} title={obj.title} size="hero" />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{obj.object_type}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{obj.title}</h1>
        {obj.description && <p className="mt-2 text-muted-foreground">{obj.description}</p>}
      </div>

      {accessGate}

      {canOpen && (
        <div className="rounded-lg border p-4">
          <OpenObjectButton objectId={obj.id} externalUrl={obj.external_url} />
        </div>
      )}
    </div>
  );
}
