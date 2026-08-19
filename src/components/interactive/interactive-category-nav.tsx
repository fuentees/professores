import Link from "next/link";
import { INTERACTIVE_CATEGORIES, CATEGORY_META, type InteractiveCategory } from "@/lib/interactive/categories";

/**
 * Navegação por chips entre "Todos" e cada categoria — renderiza como
 * links normais (sem JS), então funciona com o filtro server-side já
 * existente na página (searchParams).
 */
export function InteractiveCategoryNav({
  active,
  buildHref,
}: {
  active: InteractiveCategory | null;
  buildHref: (category: InteractiveCategory | null) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categoria de recurso interativo">
      <Link
        href={buildHref(null)}
        role="tab"
        aria-selected={!active}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          !active ? "border-transparent bg-foreground text-background" : "border-border hover:bg-accent"
        }`}
      >
        Todos
      </Link>
      {INTERACTIVE_CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const isActive = active === cat;
        const Icon = meta.icon;
        return (
          <Link
            key={cat}
            href={buildHref(cat)}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive ? meta.classes.chipActive : meta.classes.chipInactive
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.pluralLabel}
          </Link>
        );
      })}
    </div>
  );
}
