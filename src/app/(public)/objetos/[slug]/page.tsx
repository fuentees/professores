import { notFound } from "next/navigation";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OpenObjectButton } from "@/components/learning-objects/open-object-button";
import { ActivityPlayer } from "@/components/interactive/activity-player";
import { interactiveActivitySchema } from "@/lib/validations/interactive-activity";

export default async function LearningObjectDetailPage({
  params,
}: PageProps<"/objetos/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: obj } = await supabase
    .from("learning_objects")
    .select(
      "id, title, description, cover_url, object_type, external_url, storage_path, access_type, activity_type, config",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!obj) notFound();

  const canOpen = await canAccessResource(supabase, profile, { accessType: obj.access_type as ResourceAccessType });

  const activityParsed = obj.activity_type
    ? interactiveActivitySchema.safeParse({ activityType: obj.activity_type, config: obj.config })
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {obj.cover_url ? (
          <Image src={obj.cover_url} alt={obj.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <LayoutGrid className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{obj.object_type}</Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{obj.title}</h1>
        {obj.description && <p className="mt-2 text-muted-foreground">{obj.description}</p>}
      </div>

      <div className="rounded-lg border p-4">
        {!canOpen ? (
          obj.access_type === "subscriber_only" ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Este objeto de aprendizagem é exclusivo para assinantes de um plano pago.
              </p>
              <Button nativeButton={false} render={<Link href="/planos">Conhecer planos</Link>} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Entre com sua conta para acessar este objeto.</p>
              <Button nativeButton={false} render={<Link href="/entrar">Entrar</Link>} />
            </div>
          )
        ) : activityParsed?.success ? (
          <p className="text-sm text-muted-foreground">Interaja com a atividade abaixo.</p>
        ) : (
          <OpenObjectButton objectId={obj.id} externalUrl={obj.external_url} />
        )}
      </div>

      {canOpen && activityParsed?.success && (
        <ActivityPlayer activityType={activityParsed.data.activityType} config={activityParsed.data.config} />
      )}
    </div>
  );
}
