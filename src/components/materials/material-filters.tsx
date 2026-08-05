"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = { id: string; name: string };

export function MaterialFilters({
  educationLevels,
  grades,
  subjects,
  contentTypes,
}: {
  educationLevels: FilterOption[];
  grades: FilterOption[];
  subjects: FilterOption[];
  contentTypes: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateParam("q", query || null);
  }

  const hasFilters = [...searchParams.keys()].length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, tema, tag..."
        />
        <Button type="submit">Buscar</Button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={searchParams.get("nivel") ?? undefined}
          onValueChange={(value) => updateParam("nivel", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Nível de ensino" />
          </SelectTrigger>
          <SelectContent>
            {educationLevels.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("serie") ?? undefined}
          onValueChange={(value) => updateParam("serie", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Série/ano" />
          </SelectTrigger>
          <SelectContent>
            {grades.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("disciplina") ?? undefined}
          onValueChange={(value) => updateParam("disciplina", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("tipo") ?? undefined}
          onValueChange={(value) => updateParam("tipo", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo de material" />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => router.push(pathname)}
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
