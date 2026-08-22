"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChips, type FilterChip } from "@/components/common/filter-chips";
import { DIFFICULTY_LABELS, BLOOM_TAXONOMY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/labels";
import { SlidersHorizontal } from "lucide-react";

export type FilterOption = { id: string; name: string };
export type GradeFilterOption = FilterOption & { educationLevelId: string };

export type QuestionBankFiltersData = {
  educationLevels: FilterOption[];
  grades: GradeFilterOption[];
  subjects: FilterOption[];
  academicPeriods: FilterOption[];
};

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;
const BLOOM_OPTIONS = ["lembrar", "entender", "aplicar", "analisar", "avaliar", "criar"] as const;
const TYPE_OPTIONS = [
  "multiple_choice",
  "open_response",
  "true_false",
  "matching",
  "fill_blank",
  "ordering",
  "argumentative",
  "image_based",
  "mixed",
] as const;

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block px-1 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function QuestionBankFilters({ data }: { data: QuestionBankFiltersData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("pagina");
    if (key === "nivel") params.delete("serie");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFilter("q", query || null);
  }

  const educationLevelId = searchParams.get("nivel") ?? "";
  const gradeId = searchParams.get("serie") ?? "";
  const subjectId = searchParams.get("disciplina") ?? "";
  const academicPeriodId = searchParams.get("periodo") ?? "";
  const difficulty = searchParams.get("complexidade") ?? "";
  const bloom = searchParams.get("bloom") ?? "";
  const type = searchParams.get("tipo") ?? "";
  const source = searchParams.get("origem") ?? "";
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(academicPeriodId || difficulty || bloom || source));
  const availableGrades = educationLevelId ? data.grades.filter((g) => g.educationLevelId === educationLevelId) : data.grades;

  function labelOf(list: FilterOption[], id: string): string | undefined {
    return list.find((o) => o.id === id)?.name;
  }

  const chips: FilterChip[] = [];
  const addChip = (key: string, label: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    chips.push({ key, label, href: `${pathname}${qs ? `?${qs}` : ""}` });
  };
  if (searchParams.get("q")) addChip("q", `"${searchParams.get("q")}"`);
  if (educationLevelId) addChip("nivel", labelOf(data.educationLevels, educationLevelId) ?? educationLevelId);
  if (gradeId) addChip("serie", labelOf(data.grades, gradeId) ?? gradeId);
  if (subjectId) addChip("disciplina", labelOf(data.subjects, subjectId) ?? subjectId);
  if (academicPeriodId) addChip("periodo", labelOf(data.academicPeriods, academicPeriodId) ?? academicPeriodId);
  if (difficulty) addChip("complexidade", DIFFICULTY_LABELS[difficulty] ?? difficulty);
  if (bloom) addChip("bloom", BLOOM_TAXONOMY_LABELS[bloom] ?? bloom);
  if (type) addChip("tipo", QUESTION_TYPE_LABELS[type] ?? type);
  if (source) addChip("origem", source === "word" ? "Importadas do Word" : "Cadastradas manualmente");

  const hasFilters = [...searchParams.keys()].length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código, tema, palavra-chave..."
        />
        <Button type="submit">Buscar</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Etapa de ensino">
        <Select value={educationLevelId || null} onValueChange={(v) => setFilter("nivel", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por nível de ensino">
            <SelectValue placeholder="Nível">{(v: string) => labelOf(data.educationLevels, v) ?? "Nível"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.educationLevels.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </FilterField>

        <FilterField label="Série ou ano">
        <Select value={gradeId || null} onValueChange={(v) => setFilter("serie", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por série">
            <SelectValue placeholder="Série">{(v: string) => labelOf(data.grades, v) ?? "Série"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableGrades.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </FilterField>

        <FilterField label="Disciplina">
        <Select value={subjectId || null} onValueChange={(v) => setFilter("disciplina", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por disciplina">
            <SelectValue placeholder="Disciplina">{(v: string) => labelOf(data.subjects, v) ?? "Disciplina"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.subjects.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </FilterField>

        <FilterField label="Formato da questão">
        <Select value={type || null} onValueChange={(v) => setFilter("tipo", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por tipo de questão">
            <SelectValue placeholder="Todos os formatos">{(v: string) => QUESTION_TYPE_LABELS[v] ?? "Todos os formatos"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </FilterField>
      </div>

      <details
        className="group rounded-lg border border-dashed"
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:content-none">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-assessment" />
            Mais filtros
          </span>
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">Período, complexidade, Bloom e origem</span>
          <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Ocultar</span>
        </summary>
        <div className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Período letivo">
        <Select
          value={academicPeriodId || null}
          onValueChange={(v) => setFilter("periodo", (v as string) ?? null)}
        >
          <SelectTrigger className="w-full" aria-label="Filtrar por trimestre ou bimestre">
            <SelectValue placeholder="Trimestre/Bimestre">
              {(v: string) => labelOf(data.academicPeriods, v) ?? "Trimestre/Bimestre"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.academicPeriods.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </FilterField>

          <FilterField label="Complexidade">
        <Select value={difficulty || null} onValueChange={(v) => setFilter("complexidade", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por complexidade">
            <SelectValue placeholder="Complexidade">
              {(v: string) => DIFFICULTY_LABELS[v] ?? "Complexidade"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </FilterField>

          <FilterField label="Habilidade cognitiva (Bloom)">
        <Select value={bloom || null} onValueChange={(v) => setFilter("bloom", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por taxonomia de Bloom">
            <SelectValue placeholder="Bloom">{(v: string) => BLOOM_TAXONOMY_LABELS[v] ?? "Bloom"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BLOOM_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {BLOOM_TAXONOMY_LABELS[b]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </FilterField>

          <FilterField label="Origem">
        <Select value={source || null} onValueChange={(v) => setFilter("origem", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar pela origem da questão">
            <SelectValue placeholder="Origem">
              {(v: string) => (v === "word" ? "Importada do Word" : "Cadastro manual")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="word">Importada do Word</SelectItem>
            <SelectItem value="manual">Cadastro manual</SelectItem>
          </SelectContent>
        </Select>
          </FilterField>
        </div>
      </details>

      {hasFilters && <FilterChips chips={chips} clearHref={pathname} />}
    </div>
  );
}
