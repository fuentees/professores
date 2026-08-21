"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChips, type FilterChip } from "@/components/common/filter-chips";

export type FilterOption = { id: string; name: string };
export type GradeOption = FilterOption & { educationLevelId: string };
export type CurriculumUnitOption = FilterOption & { gradeId: string; subjectId: string };
export type ThemeOption = FilterOption & { curriculumUnitId: string };
export type SubthemeOption = FilterOption & { themeId: string };
export type GradeSubjectPair = { gradeId: string; subjectId: string };

export type MaterialFiltersData = {
  educationLevels: FilterOption[];
  grades: GradeOption[];
  subjects: FilterOption[];
  gradeSubjects: GradeSubjectPair[];
  curriculumUnits: CurriculumUnitOption[];
  themes: ThemeOption[];
  subthemes: SubthemeOption[];
  contentTypes: FilterOption[];
};

type FilterKey = "nivel" | "serie" | "disciplina" | "unidade" | "tema" | "subtema" | "tipo";

const DOWNSTREAM: Record<FilterKey, FilterKey[]> = {
  nivel: ["serie", "disciplina", "unidade", "tema", "subtema"],
  serie: ["disciplina", "unidade", "tema", "subtema"],
  disciplina: ["unidade", "tema", "subtema"],
  unidade: ["tema", "subtema"],
  tema: ["subtema"],
  subtema: [],
  tipo: [],
};

export function MaterialFilters({ data }: { data: MaterialFiltersData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const nivel = searchParams.get("nivel") ?? "";
  const serie = searchParams.get("serie") ?? "";
  const disciplina = searchParams.get("disciplina") ?? "";
  const unidade = searchParams.get("unidade") ?? "";
  const tema = searchParams.get("tema") ?? "";
  const subtema = searchParams.get("subtema") ?? "";
  const tipo = searchParams.get("tipo") ?? "";

  function setFilter(key: FilterKey, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    for (const downstreamKey of DOWNSTREAM[key]) params.delete(downstreamKey);
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  const availableGrades = nivel ? data.grades.filter((g) => g.educationLevelId === nivel) : data.grades;
  const availableSubjects = serie
    ? data.subjects.filter((s) => data.gradeSubjects.some((gs) => gs.gradeId === serie && gs.subjectId === s.id))
    : data.subjects;
  const availableUnits =
    serie && disciplina
      ? data.curriculumUnits.filter((u) => u.gradeId === serie && u.subjectId === disciplina)
      : [];
  const availableThemes = unidade ? data.themes.filter((t) => t.curriculumUnitId === unidade) : [];
  const availableSubthemes = tema ? data.subthemes.filter((s) => s.themeId === tema) : [];

  const hasFilters = [...searchParams.keys()].length > 0;

  function labelOf(list: FilterOption[], id: string): string | undefined {
    return list.find((item) => item.id === id)?.name;
  }

  function chipHref(key: FilterKey): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    for (const downstreamKey of DOWNSTREAM[key]) params.delete(downstreamKey);
    params.delete("pagina");
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  const chips: FilterChip[] = [];
  if (searchParams.get("q")) {
    chips.push({
      key: "q",
      label: `"${searchParams.get("q")}"`,
      href: (() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        params.delete("pagina");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
      })(),
    });
  }
  if (nivel) chips.push({ key: "nivel", label: labelOf(data.educationLevels, nivel) ?? nivel, href: chipHref("nivel") });
  if (serie) chips.push({ key: "serie", label: labelOf(data.grades, serie) ?? serie, href: chipHref("serie") });
  if (disciplina)
    chips.push({ key: "disciplina", label: labelOf(data.subjects, disciplina) ?? disciplina, href: chipHref("disciplina") });
  if (unidade)
    chips.push({ key: "unidade", label: labelOf(data.curriculumUnits, unidade) ?? unidade, href: chipHref("unidade") });
  if (tema) chips.push({ key: "tema", label: labelOf(data.themes, tema) ?? tema, href: chipHref("tema") });
  if (subtema)
    chips.push({ key: "subtema", label: labelOf(data.subthemes, subtema) ?? subtema, href: chipHref("subtema") });
  if (tipo) chips.push({ key: "tipo", label: labelOf(data.contentTypes, tipo) ?? tipo, href: chipHref("tipo") });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card/95 p-4 shadow-sm backdrop-blur">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, tema, descrição, palavra-chave..."
          className="h-10 rounded-xl bg-background/60 px-4"
        />
        <Button type="submit" className="h-10 rounded-xl px-6 shadow-sm">Buscar</Button>
      </form>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:bg-background/50">
        <Select value={nivel || undefined} onValueChange={(v) => setFilter("nivel", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por nível de ensino">
            <SelectValue placeholder="Nível">
              {(v: string) => labelOf(data.educationLevels, v) ?? "Nível"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.educationLevels.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={serie || undefined} onValueChange={(v) => setFilter("serie", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por série ou ano">
            <SelectValue placeholder="Série/ano">{(v: string) => labelOf(data.grades, v) ?? "Série/ano"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableGrades.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={disciplina || undefined} onValueChange={(v) => setFilter("disciplina", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por disciplina">
            <SelectValue placeholder="Disciplina">
              {(v: string) => labelOf(data.subjects, v) ?? "Disciplina"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSubjects.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={unidade || undefined}
          onValueChange={(v) => setFilter("unidade", (v as string) ?? null)}
          disabled={!serie || !disciplina}
        >
          <SelectTrigger className="w-full" aria-label="Filtrar por unidade temática">
            <SelectValue placeholder="Unidade temática">
              {(v: string) => labelOf(data.curriculumUnits, v) ?? "Unidade temática"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableUnits.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tema || undefined} onValueChange={(v) => setFilter("tema", (v as string) ?? null)} disabled={!unidade}>
          <SelectTrigger className="w-full" aria-label="Filtrar por tema">
            <SelectValue placeholder="Tema">{(v: string) => labelOf(data.themes, v) ?? "Tema"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableThemes.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={subtema || undefined}
          onValueChange={(v) => setFilter("subtema", (v as string) ?? null)}
          disabled={!tema || availableSubthemes.length === 0}
        >
          <SelectTrigger className="w-full" aria-label="Filtrar por subtema">
            <SelectValue placeholder="Subtema">{(v: string) => labelOf(data.subthemes, v) ?? "Subtema"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSubthemes.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipo || undefined} onValueChange={(v) => setFilter("tipo", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por tipo de material">
            <SelectValue placeholder="Tipo">{(v: string) => labelOf(data.contentTypes, v) ?? "Tipo"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.contentTypes.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && <FilterChips chips={chips} clearHref={pathname} />}
    </div>
  );
}
