"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTheme, deleteTheme, setThemeStatus, updateTheme } from "@/actions/admin/pedagogical";
import { themeSchema, type ThemeInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export type ThemeRow = CatalogRow & { curriculum_unit_id: string };
export type CurriculumUnitOption = { id: string; name: string };

export function ThemesManager({
  rows,
  curriculumUnits,
}: {
  rows: ThemeRow[];
  curriculumUnits: CurriculumUnitOption[];
}) {
  const unitName = (id: string) => curriculumUnits.find((u) => u.id === id)?.name ?? "—";

  return (
    <CatalogManager<ThemeRow, ThemeInput>
      title="Temas"
      emptyLabel="Nenhum tema cadastrado ainda."
      rows={rows}
      schema={themeSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        curriculumUnitId: row?.curriculum_unit_id ?? curriculumUnits[0]?.id ?? "",
      })}
      extraColumns={[{ header: "Unidade", render: (row) => unitName(row.curriculum_unit_id) }]}
      renderExtraFields={(form) => (
        <div className="flex flex-col gap-2">
          <Label>Unidade</Label>
          <Select
            value={form.watch("curriculumUnitId")}
            onValueChange={(value) => form.setValue("curriculumUnitId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {curriculumUnits.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      onCreate={createTheme}
      onUpdate={updateTheme}
      onDelete={deleteTheme}
      onSetStatus={setThemeStatus}
    />
  );
}
