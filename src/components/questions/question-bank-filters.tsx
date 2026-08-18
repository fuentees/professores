"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChips, type FilterChip } from "@/components/common/filter-chips";
import { DIFFICULTY_LABELS, BLOOM_TAXONOMY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/labels";

export type FilterOption = { id: string; name: string };

export type QuestionBankFiltersData = {
  grades: FilterOption[];
  subjects: FilterOption[];
  academicPeriods: FilterOption[];
};

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;
const BLOOM_OPTIONS = ["lembrar", "entender", "aplicar", "analisar", "avaliar", "criar"] as const;
const TYPE_OPTIONS = [
  "multiple_choice",
  "essay",
  "discursive",
  "true_false",
  "matching",
  "fill_blank",
  "ordering",
  "argumentative",
  "image_based",
  "mixed",
] as const;

export function QuestionBankFilters({ data }: { data: QuestionBankFiltersData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFilter("q", query || null);
  }

  const gradeId = searchParams.get("serie") ?? "";
  const subjectId = searchParams.get("disciplina") ?? "";
  const academicPeriodId = searchParams.get("periodo") ?? "";
  const difficulty = searchParams.get("complexidade") ?? "";
  const bloom = searchParams.get("bloom") ?? "";
  const type = searchParams.get("tipo") ?? "";

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
  if (gradeId) addChip("serie", labelOf(data.grades, gradeId) ?? gradeId);
  if (subjectId) addChip("disciplina", labelOf(data.subjects, subjectId) ?? subjectId);
  if (academicPeriodId) addChip("periodo", labelOf(data.academicPeriods, academicPeriodId) ?? academicPeriodId);
  if (difficulty) addChip("complexidade", DIFFICULTY_LABELS[difficulty] ?? difficulty);
  if (bloom) addChip("bloom", BLOOM_TAXONOMY_LABELS[bloom] ?? bloom);
  if (type) addChip("tipo", QUESTION_TYPE_LABELS[type] ?? type);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Select value={gradeId || undefined} onValueChange={(v) => setFilter("serie", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por série">
            <SelectValue placeholder="Série">{(v: string) => labelOf(data.grades, v) ?? "Série"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {data.grades.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subjectId || undefined} onValueChange={(v) => setFilter("disciplina", (v as string) ?? null)}>
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

        <Select
          value={academicPeriodId || undefined}
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

        <Select value={difficulty || undefined} onValueChange={(v) => setFilter("complexidade", (v as string) ?? null)}>
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

        <Select value={bloom || undefined} onValueChange={(v) => setFilter("bloom", (v as string) ?? null)}>
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

        <Select value={type || undefined} onValueChange={(v) => setFilter("tipo", (v as string) ?? null)}>
          <SelectTrigger className="w-full" aria-label="Filtrar por tipo de questão">
            <SelectValue placeholder="Tipo">{(v: string) => QUESTION_TYPE_LABELS[v] ?? "Tipo"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && <FilterChips chips={chips} clearHref={pathname} />}
    </div>
  );
}
