import { createClient } from "@/lib/supabase/server";
import { ContentTypesManager, type ContentTypeRow } from "@/components/admin/content-types-manager";
import { PageHeader } from "@/components/common/page-header";

export default async function TiposMateriaisPage() {
  const supabase = await createClient();
  const { data: contentTypes } = await supabase
    .from("content_types")
    .select("id, name, slug, description, status")
    .order("order_index");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de material"
        description="Quatro finalidades principais, sem duplicar formato, subtipo ou gabarito."
      />

      <ContentTypesManager rows={(contentTypes ?? []) as ContentTypeRow[]} />
    </div>
  );
}
