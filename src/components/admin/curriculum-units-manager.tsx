"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createCurriculumUnit,
  deleteCurriculumUnit,
  setCurriculumUnitStatus,
  updateCurriculumUnit,
} from "@/actions/admin/pedagogical";
import { curriculumUnitSchema, type CurriculumUnitInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";
import type { GradeOption, SubjectOption } from "@/components/admin/grade-subjects-manager";

export type CurriculumUnitRow = CatalogRow & { grade_id: string; subject_id: string };

export function CurriculumUnitsManager({
  rows,
  grades,
  subjects,
}: {
  rows: CurriculumUnitRow[];
  grades: GradeOption[];
  subjects: SubjectOption[];
}) {
  const gradeName = (id: string) => grades.find((g) => g.id === id)?.name ?? "—";
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  return (
    <CatalogManager<CurriculumUnitRow, CurriculumUnitInput>
      title="Unidades"
      emptyLabel="Nenhuma unidade cadastrada ainda."
      rows={rows}
      schema={curriculumUnitSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        gradeId: row?.grade_id ?? grades[0]?.id ?? "",
        subjectId: row?.subject_id ?? subjects[0]?.id ?? "",
      })}
      extraColumns={[
        { header: "Série", render: (row) => gradeName(row.grade_id) },
        { header: "Disciplina", render: (row) => subjectName(row.subject_id) },
      ]}
      renderExtraFields={(form) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Série</Label>
            <Select
              value={form.watch("gradeId")}
              onValueChange={(value) => form.setValue("gradeId", value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Disciplina</Label>
            <Select
              value={form.watch("subjectId")}
              onValueChange={(value) => form.setValue("subjectId", value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      onCreate={createCurriculumUnit}
      onUpdate={updateCurriculumUnit}
      onDelete={deleteCurriculumUnit}
      onSetStatus={setCurriculumUnitStatus}
    />
  );
}
