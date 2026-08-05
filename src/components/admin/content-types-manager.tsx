"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  createContentType,
  deleteContentType,
  setContentTypeStatus,
  updateContentType,
} from "@/actions/admin/pedagogical";
import { contentTypeSchema, type ContentTypeInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export type ContentTypeRow = CatalogRow & { icon: string | null };

export function ContentTypesManager({ rows }: { rows: ContentTypeRow[] }) {
  return (
    <CatalogManager<ContentTypeRow, ContentTypeInput>
      title="Tipos de material"
      emptyLabel="Nenhum tipo de material cadastrado ainda."
      rows={rows}
      schema={contentTypeSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        icon: row?.icon ?? "",
      })}
      extraColumns={[{ header: "Ícone", render: (row) => row.icon || "—" }]}
      renderExtraFields={(form) => (
        <div className="flex flex-col gap-2">
          <Label htmlFor="icon">Ícone (lucide-react)</Label>
          <Input id="icon" {...form.register("icon")} placeholder="FileText" />
        </div>
      )}
      onCreate={createContentType}
      onUpdate={updateContentType}
      onDelete={deleteContentType}
      onSetStatus={setContentTypeStatus}
    />
  );
}
