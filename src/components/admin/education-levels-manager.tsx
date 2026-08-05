"use client";

import {
  createEducationLevel,
  deleteEducationLevel,
  setEducationLevelStatus,
  updateEducationLevel,
} from "@/actions/admin/pedagogical";
import { educationLevelSchema, type EducationLevelInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export function EducationLevelsManager({ rows }: { rows: CatalogRow[] }) {
  return (
    <CatalogManager<CatalogRow, EducationLevelInput>
      title="Níveis de ensino"
      emptyLabel="Nenhum nível de ensino cadastrado ainda."
      rows={rows}
      schema={educationLevelSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
      })}
      onCreate={createEducationLevel}
      onUpdate={updateEducationLevel}
      onDelete={deleteEducationLevel}
      onSetStatus={setEducationLevelStatus}
    />
  );
}
