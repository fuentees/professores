import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FolderForm } from "@/components/admin/folder-form";
import { CoverManager } from "@/components/admin/cover-manager";
import { uploadFolderCover } from "@/actions/admin/folder";
import type { FolderInput } from "@/lib/validations/folder";
import type { Database } from "@/types/supabase";

type FolderDetailRow = Database["public"]["Tables"]["folders"]["Row"] & {
  folder_contents: { content_id: string }[];
};

export default async function EditarPastaPage({
  params,
}: PageProps<"/admin/pastas/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: folder }, { data: contents }] = await Promise.all([
    supabase
      .from("folders")
      .select("*, folder_contents(content_id)")
      .eq("id", id)
      .maybeSingle()
      .returns<FolderDetailRow>(),
    supabase.from("contents").select("id, title").order("title"),
  ]);

  if (!folder) notFound();

  const defaultValues: FolderInput = {
    title: folder.title,
    description: folder.description ?? "",
    accessType: folder.access_type,
    status: folder.status,
    contentIds: folder.folder_contents.map((r) => r.content_id),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar pasta</h1>
        <p className="text-muted-foreground">{folder.title}</p>
      </div>

      <CoverManager entityId={id} coverUrl={folder.cover_url} altLabel="Capa da pasta" onUpload={uploadFolderCover} />

      <FolderForm
        folderId={id}
        defaultValues={defaultValues}
        contentOptions={(contents ?? []).map((c) => ({ id: c.id, label: c.title }))}
      />
    </div>
  );
}
