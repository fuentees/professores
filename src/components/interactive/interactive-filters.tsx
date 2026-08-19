"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterChips, type FilterChip } from "@/components/common/filter-chips";

export type InteractiveFilterOption = { id: string; name: string };
export type InteractiveGradeOption = InteractiveFilterOption & { educationLevelId: string };

export function InteractiveFilters({
  subjects,
  educationLevels,
  grades,
}: {
  subjects: InteractiveFilterOption[];
  educationLevels: InteractiveFilterOption[];
  grades: InteractiveGradeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  const disciplina = searchParams.get("disciplina") ?? "";
  const nivel = searchParams.get("nivel") ?? "";
  const serie = searchParams.get("serie") ?? "";
  const availableGrades = nivel ? grades.filter((g) => g.educationLevelId === nivel) : grades;

  function setFilter(key: "disciplina" | "nivel" | "serie", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "nivel") params.delete("serie");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  function labelOf(list: InteractiveFilterOption[], id: string): string | undefined {
    return list.find((item) => item.id === id)?.name;
  }

  function chipHref(key: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  const chips: FilterChip[] = [];
  if (searchParams.get("q")) {
    chips.push({ key: "q", label: `"${searchParams.get("q")}"`, href: chipHref("q") });
  }
  if (disciplina) chips.push({ key: "disciplina", label: labelOf(subjects, disciplina) ?? disciplina, href: chipHref("disciplina") });
  if (nivel) chips.push({ key: "nivel", label: labelOf(educationLevels, nivel) ?? nivel, href: chipHref("nivel") });
  if (serie) chips.push({ key: "serie", label: labelOf(grades, serie) ?? serie, href: chipHref("serie") });

  // A categoria (?categoria=) tem sua própria navegação por chips
  // (InteractiveCategoryNav) — não duplicamos ela aqui, só limpamos os
  // filtros secundários (busca/disciplina/nível/série).
  const clearParams = new URLSearchParams(searchParams.toString());
  clearParams.delete("q");
  clearParams.delete("disciplina");
  clearParams.delete("nivel");
  clearParams.delete("serie");
  const clearHref = `${pathname}${clearParams.toString() ? `?${clearParams.toString()}` : ""}`;

  const disciplinaSelect = (
    <Select value={disciplina || undefined} onValueChange={(v) => setFilter("disciplina", (v as string) ?? null)}>
      <SelectTrigger className="w-full" aria-label="Filtrar por disciplina">
        <SelectValue placeholder="Disciplina">{(v: string) => labelOf(subjects, v) ?? "Disciplina"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {subjects.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const nivelSelect = (
    <Select value={nivel || undefined} onValueChange={(v) => setFilter("nivel", (v as string) ?? null)}>
      <SelectTrigger className="w-full" aria-label="Filtrar por nível de ensino">
        <SelectValue placeholder="Nível">{(v: string) => labelOf(educationLevels, v) ?? "Nível"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {educationLevels.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const serieSelect = (
    <Select value={serie || undefined} onValueChange={(v) => setFilter("serie", (v as string) ?? null)}>
      <SelectTrigger className="w-full" aria-label="Filtrar por série ou ano">
        <SelectValue placeholder="Série/ano">{(v: string) => labelOf(grades, v) ?? "Série/ano"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableGrades.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const selects = (
    <>
      {disciplinaSelect}
      {nivelSelect}
      {serieSelect}
    </>
  );

  const activeCount = (disciplina ? 1 : 0) + (nivel ? 1 : 0) + (serie ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar quiz, jogo, simulação..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>

        {/* Desktop: selects inline. Telas menores: ficam dentro do Sheet. */}
        <div className="hidden gap-2 lg:flex">
          <div className="w-40">{disciplinaSelect}</div>
          <div className="w-36">{nivelSelect}</div>
          <div className="w-36">{serieSelect}</div>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-accent lg:hidden"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filtrar recursos interativos</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-6">
              {selects}
              <Button onClick={() => setSheetOpen(false)}>Ver resultados</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {chips.length > 0 && <FilterChips chips={chips} clearHref={clearHref} />}
    </div>
  );
}
