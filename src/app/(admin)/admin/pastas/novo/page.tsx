import { createClient } from "@/lib/supabase/server";
import { FolderForm } from "@/components/admin/folder-form";
import type { FolderInput } from "@/lib/validations/folder";

const DEFAULT_VALUES: FolderInput = {
  title: "",
  description: "",
  accessType: "teacher_only",
  status: "draft",
  contentIds: [],
};

export default async function NovaPastaPage() {
  const supabase = await createClient();
  const { data: contents } = await supabase
    .from("contents")
    .select("id, title")
    .order("title");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova pasta</h1>
        <p className="text-muted-foreground">
          Depois de criar, você poderá enviar a imagem de capa.
        </p>
      </div>

      <FolderForm
        defaultValues={DEFAULT_VALUES}
        contentOptions={(contents ?? []).map((c) => ({ id: c.id, label: c.title }))}
      />
    </div>
  );
}
