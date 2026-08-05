"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createSubtheme,
  deleteSubtheme,
  setSubthemeStatus,
  updateSubtheme,
} from "@/actions/admin/pedagogical";
import { subthemeSchema, type SubthemeInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export type SubthemeRow = CatalogRow & { theme_id: string };
export type ThemeOption = { id: string; name: string };

export function SubthemesManager({ rows, themes }: { rows: SubthemeRow[]; themes: ThemeOption[] }) {
  const themeName = (id: string) => themes.find((t) => t.id === id)?.name ?? "—";

  return (
    <CatalogManager<SubthemeRow, SubthemeInput>
      title="Subtemas"
      emptyLabel="Nenhum subtema cadastrado ainda."
      rows={rows}
      schema={subthemeSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        themeId: row?.theme_id ?? themes[0]?.id ?? "",
      })}
      extraColumns={[{ header: "Tema", render: (row) => themeName(row.theme_id) }]}
      renderExtraFields={(form) => (
        <div className="flex flex-col gap-2">
          <Label>Tema</Label>
          <Select
            value={form.watch("themeId")}
            onValueChange={(value) => form.setValue("themeId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      onCreate={createSubtheme}
      onUpdate={updateSubtheme}
      onDelete={deleteSubtheme}
      onSetStatus={setSubthemeStatus}
    />
  );
}
