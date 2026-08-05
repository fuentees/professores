"use client";

import {
  createForumCategory,
  deleteForumCategory,
  setForumCategoryStatus,
  updateForumCategory,
} from "@/actions/admin/forum";
import { forumCategorySchema, type ForumCategoryInput } from "@/lib/validations/forum";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export function ForumCategoriesManager({ rows }: { rows: CatalogRow[] }) {
  return (
    <CatalogManager<CatalogRow, ForumCategoryInput>
      title="Categorias do fórum"
      emptyLabel="Nenhuma categoria cadastrada ainda."
      rows={rows}
      schema={forumCategorySchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
      })}
      onCreate={createForumCategory}
      onUpdate={updateForumCategory}
      onDelete={deleteForumCategory}
      onSetStatus={setForumCategoryStatus}
    />
  );
}
