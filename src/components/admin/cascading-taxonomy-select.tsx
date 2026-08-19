"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TaxonomyOptions = {
  educationLevels: { id: string; name: string; orderIndex: number }[];
  grades: { id: string; name: string; educationLevelId: string }[];
  subjects: { id: string; name: string }[];
  gradeSubjects: { gradeId: string; subjectId: string }[];
  curriculumUnits: { id: string; name: string; gradeId: string; subjectId: string }[];
  themes: { id: string; name: string; curriculumUnitId: string }[];
  subthemes: { id: string; name: string; themeId: string }[];
};

export type TaxonomySelection = {
  educationLevelId: string;
  gradeId: string;
  subjectId: string;
  curriculumUnitId: string;
  themeId: string;
  subthemeId: string;
};

export const EMPTY_TAXONOMY_SELECTION: TaxonomySelection = {
  educationLevelId: "",
  gradeId: "",
  subjectId: "",
  curriculumUnitId: "",
  themeId: "",
  subthemeId: "",
};

/**
 * Encadeia série → disciplina → unidade temática → tema → subtema. Cada
 * nível só habilita depois do anterior escolhido, e trocar um nível limpa
 * os seguintes (mesma ideia de MultiCheckList, mas de valor único e
 * dependente entre si — por isso não reaproveita aquele componente).
 */
export function CascadingTaxonomySelect({
  options,
  value,
  onChange,
}: {
  options: TaxonomyOptions;
  value: TaxonomySelection;
  onChange: (value: TaxonomySelection) => void;
}) {
  const availableGrades = value.educationLevelId
    ? options.grades.filter((g) => g.educationLevelId === value.educationLevelId)
    : options.grades;
  const availableSubjects = value.gradeId
    ? options.subjects.filter((s) =>
        options.gradeSubjects.some((gs) => gs.gradeId === value.gradeId && gs.subjectId === s.id),
      )
    : [];
  const availableUnits = options.curriculumUnits.filter(
    (u) => u.gradeId === value.gradeId && u.subjectId === value.subjectId,
  );
  const availableThemes = options.themes.filter((t) => t.curriculumUnitId === value.curriculumUnitId);
  const availableSubthemes = options.subthemes.filter((s) => s.themeId === value.themeId);

  function set(partial: Partial<TaxonomySelection>) {
    onChange({ ...value, ...partial });
  }

  function labelOf(list: { id: string; name: string }[], id: string): string {
    return list.find((item) => item.id === id)?.name ?? id;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label>Nível de ensino</Label>
        <Select
          value={value.educationLevelId}
          onValueChange={(v) =>
            set({
              educationLevelId: (v as string) ?? "",
              gradeId: "",
              subjectId: "",
              curriculumUnitId: "",
              themeId: "",
              subthemeId: "",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => (v ? labelOf(options.educationLevels, v) : "Selecione o nível")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.educationLevels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Série/ano</Label>
        <Select
          value={value.gradeId}
          onValueChange={(v) =>
            set({ gradeId: (v as string) ?? "", subjectId: "", curriculumUnitId: "", themeId: "", subthemeId: "" })
          }
          disabled={!value.educationLevelId}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v ? labelOf(options.grades, v) : value.educationLevelId ? "Selecione a série" : "Escolha o nível primeiro"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableGrades.map((g) => (
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
          value={value.subjectId}
          onValueChange={(v) =>
            set({ subjectId: (v as string) ?? "", curriculumUnitId: "", themeId: "", subthemeId: "" })
          }
          disabled={!value.gradeId}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v ? labelOf(options.subjects, v) : value.gradeId ? "Selecione a disciplina" : "Escolha a série primeiro"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSubjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Unidade temática</Label>
        <Select
          value={value.curriculumUnitId}
          onValueChange={(v) => set({ curriculumUnitId: (v as string) ?? "", themeId: "", subthemeId: "" })}
          disabled={!value.subjectId}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v
                  ? labelOf(options.curriculumUnits, v)
                  : value.subjectId
                    ? "Selecione a unidade"
                    : "Escolha a disciplina primeiro"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableUnits.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tema da aula</Label>
        <Select
          value={value.themeId}
          onValueChange={(v) => set({ themeId: (v as string) ?? "", subthemeId: "" })}
          disabled={!value.curriculumUnitId}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v
                  ? labelOf(options.themes, v)
                  : value.curriculumUnitId
                    ? "Selecione o tema"
                    : "Escolha a unidade primeiro"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableThemes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2 sm:w-[calc(50%-0.5rem)]">
        <Label>Subtema (opcional)</Label>
        <Select
          value={value.subthemeId}
          onValueChange={(v) => set({ subthemeId: (v as string) ?? "" })}
          disabled={!value.themeId || availableSubthemes.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v
                  ? labelOf(options.subthemes, v)
                  : availableSubthemes.length
                    ? "Todos os subtemas"
                    : "Nenhum subtema cadastrado"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSubthemes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
