import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryMeta } from "@/lib/interactive/categories";
import { InteractiveCard, type InteractiveCardData } from "@/components/interactive/interactive-card";

/** Bloco "Quizzes em destaque" / "Jogos em destaque" etc. da home da área
 * interativa — título com acento na cor da categoria + grid de cards. */
export function InteractiveSection({
  category,
  items,
  href,
}: {
  category: CategoryMeta;
  items: InteractiveCardData[];
  href: string;
}) {
  if (items.length === 0) return null;
  const Icon = category.icon;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.classes.bgSoft} ${category.classes.text}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">{category.pluralLabel} em destaque</h2>
            <p className="text-xs text-muted-foreground">{category.description}</p>
          </div>
        </div>
        <Link href={href} className={`flex shrink-0 items-center gap-1 text-sm font-medium ${category.classes.text} hover:underline`}>
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <InteractiveCard key={item.slug} object={item} />
        ))}
      </div>
    </section>
  );
}
