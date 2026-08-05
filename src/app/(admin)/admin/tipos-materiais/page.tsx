import { createClient } from "@/lib/supabase/server";
import { ContentTypesManager, type ContentTypeRow } from "@/components/admin/content-types-manager";

export default async function TiposMateriaisPage() {
  const supabase = await createClient();
  const { data: contentTypes } = await supabase
    .from("content_types")
    .select("*")
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tipos de material</h1>
        <p className="text-muted-foreground">
          Ex: Atividade, Avaliação, Plano de aula, Simulado, Gabarito...
        </p>
      </div>

      <ContentTypesManager rows={(contentTypes ?? []) as ContentTypeRow[]} />
    </div>
  );
}
