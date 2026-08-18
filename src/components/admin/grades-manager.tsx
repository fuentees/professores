"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGrade, deleteGrade, setGradeStatus, updateGrade } from "@/actions/admin/pedagogical";
import { gradeSchema, type GradeInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export type GradeRow = CatalogRow & { education_level_id: string };
export type EducationLevelOption = { id: string; name: string };

export function GradesManager({
  rows,
  educationLevels,
}: {
  rows: GradeRow[];
  educationLevels: EducationLevelOption[];
}) {
  const levelName = (id: string) => educationLevels.find((l) => l.id === id)?.name ?? "—";

  return (
    <CatalogManager<GradeRow, GradeInput>
      title="Séries e anos"
      emptyLabel="Nenhuma série cadastrada ainda."
      rows={rows}
      schema={gradeSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        educationLevelId: row?.education_level_id ?? educationLevels[0]?.id ?? "",
      })}
      extraColumns={[
        { header: "Nível de ensino", render: (row) => levelName(row.education_level_id) },
      ]}
      renderExtraFields={(form) => (
        <div className="flex flex-col gap-2">
          <Label>Nível de ensino</Label>
          <Select
            value={form.watch("educationLevelId")}
            onValueChange={(value) => form.setValue("educationLevelId", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um nível">
                {(value: string) => (value ? levelName(value) : "Selecione um nível")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {educationLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      onCreate={createGrade}
      onUpdate={updateGrade}
      onDelete={deleteGrade}
      onSetStatus={setGradeStatus}
    />
  );
}
