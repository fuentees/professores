"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { linkGradeSubject, unlinkGradeSubject } from "@/actions/admin/pedagogical";

export type GradeOption = { id: string; name: string };
export type SubjectOption = { id: string; name: string };
export type GradeSubjectLink = { id: string; grade_id: string; subject_id: string };

export function GradeSubjectsManager({
  grades,
  subjects,
  links,
}: {
  grades: GradeOption[];
  subjects: SubjectOption[];
  links: GradeSubjectLink[];
}) {
  const [gradeId, setGradeId] = useState<string>(grades[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  const gradeName = (id: string) => grades.find((g) => g.id === id)?.name ?? "—";
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  async function handleLink() {
    if (!gradeId || !subjectId) return;
    setPending(true);
    const result = await linkGradeSubject({ gradeId, subjectId });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Disciplina vinculada à série.");
  }

  async function handleUnlink(id: string) {
    const result = await unlinkGradeSubject(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Disciplinas por série</h2>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Série</span>
          <Select value={gradeId} onValueChange={(value) => setGradeId(value ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione a série">
                {(value: string) => (value ? gradeName(value) : "Selecione a série")}
              </SelectValue>
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
          <span className="text-sm text-muted-foreground">Disciplina</span>
          <Select value={subjectId} onValueChange={(value) => setSubjectId(value ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione a disciplina">
                {(value: string) => (value ? subjectName(value) : "Selecione a disciplina")}
              </SelectValue>
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

        <Button onClick={handleLink} disabled={pending || !gradeId || !subjectId}>
          Vincular
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum vínculo cadastrado ainda.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Badge key={link.id} variant="secondary" className="gap-1 py-1.5 pr-1">
              {gradeName(link.grade_id)} · {subjectName(link.subject_id)}
              <button
                type="button"
                onClick={() => handleUnlink(link.id)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
