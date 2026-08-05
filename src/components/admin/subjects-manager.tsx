"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createSubject, deleteSubject, setSubjectStatus, updateSubject } from "@/actions/admin/pedagogical";
import { subjectSchema, type SubjectInput } from "@/lib/validations/pedagogical";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";

export type SubjectRow = CatalogRow & {
  short_name: string | null;
  icon: string | null;
  color: string | null;
};

export function SubjectsManager({ rows }: { rows: SubjectRow[] }) {
  return (
    <CatalogManager<SubjectRow, SubjectInput>
      title="Disciplinas"
      emptyLabel="Nenhuma disciplina cadastrada ainda."
      rows={rows}
      schema={subjectSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        orderIndex: row?.order_index ?? 0,
        status: row?.status ?? "active",
        shortName: row?.short_name ?? "",
        icon: row?.icon ?? "",
        color: row?.color ?? "",
      })}
      extraColumns={[
        {
          header: "Cor",
          render: (row) =>
            row.color ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: row.color }}
                />
                {row.color}
              </span>
            ) : (
              "—"
            ),
        },
      ]}
      renderExtraFields={(form) => (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shortName">Nome curto</Label>
            <Input id="shortName" {...form.register("shortName")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="icon">Ícone (lucide-react)</Label>
            <Input id="icon" {...form.register("icon")} placeholder="Calculator" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="color">Cor</Label>
            <Input id="color" {...form.register("color")} placeholder="#2563eb" />
          </div>
        </div>
      )}
      onCreate={createSubject}
      onUpdate={updateSubject}
      onDelete={deleteSubject}
      onSetStatus={setSubjectStatus}
    />
  );
}
