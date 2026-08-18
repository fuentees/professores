import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LearningObjectForm } from "@/components/admin/learning-object-form";
import { CoverManager } from "@/components/admin/cover-manager";
import { LearningObjectFileManager } from "@/components/admin/learning-object-file-manager";
import { uploadLearningObjectCover } from "@/actions/admin/learning-object";
import type { LearningObjectInput } from "@/lib/validations/learning-object";

export default async function EditarObjetoPage({
  params,
}: PageProps<"/admin/objetos/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: obj } = await supabase.from("learning_objects").select("*").eq("id", id).maybeSingle();
  if (!obj) notFound();

  const defaultValues: LearningObjectInput = {
    title: obj.title,
    description: obj.description ?? "",
    objectType: obj.object_type,
    externalUrl: obj.external_url ?? "",
    accessType: obj.access_type,
    status: obj.status,
    activityType: obj.activity_type,
    config: obj.config,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar objeto de aprendizagem</h1>
        <p className="text-muted-foreground">{obj.title}</p>
      </div>

      <CoverManager
        entityId={id}
        coverUrl={obj.cover_url}
        altLabel="Capa do objeto"
        onUpload={uploadLearningObjectCover}
      />

      {!obj.external_url && !obj.activity_type && (
        <LearningObjectFileManager objectId={id} hasFile={Boolean(obj.storage_path)} />
      )}

      <LearningObjectForm objectId={id} defaultValues={defaultValues} />
    </div>
  );
}
