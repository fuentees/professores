import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LearningObjectCard } from "@/components/learning-objects/learning-object-card";

export default async function ObjetosPage() {
  const supabase = await createClient();
  const { data: objects } = await supabase
    .from("learning_objects")
    .select("slug, title, description, cover_url, object_type, activity_type")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <PageHeader
        title="Recursos interativos"
        description="Jogos, simulações, quizzes e outros recursos interativos."
      />

      {!objects || objects.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="Nenhum recurso interativo publicado ainda" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((obj) => (
            <LearningObjectCard key={obj.slug} object={obj} />
          ))}
        </div>
      )}
    </div>
  );
}
