import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Busca server-rendered (GET, sem JS): reenvia a página com `q` atualizado
 * e preserva os demais filtros ativos via inputs escondidos. Submeter uma
 * nova busca sempre reseta a paginação (não inclui `page`).
 */
export function TableSearchForm({
  basePath,
  defaultValue,
  placeholder,
  hiddenParams,
}: {
  basePath: string;
  defaultValue: string;
  placeholder: string;
  hiddenParams?: Record<string, string | undefined>;
}) {
  return (
    <form action={basePath} method="get" className="flex w-full max-w-sm items-center gap-2">
      {Object.entries(hiddenParams ?? {})
        .filter((entry): entry is [string, string] => entry[1] !== undefined)
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 dark:bg-input/30">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <label className="sr-only" htmlFor={`${basePath}-search`}>
          {placeholder}
        </label>
        <Input
          id={`${basePath}-search`}
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Buscar
      </Button>
    </form>
  );
}
