import Link from "next/link";
import { X } from "lucide-react";

export type FilterChip = { key: string; label: string; href: string };

export function FilterChips({ chips, clearHref }: { chips: FilterChip[]; clearHref?: string }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs hover:bg-accent"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </Link>
      ))}
      {clearHref && (
        <Link href={clearHref} className="text-xs text-muted-foreground underline hover:text-foreground">
          Limpar filtros
        </Link>
      )}
    </div>
  );
}
