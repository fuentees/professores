import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { ACTIVITY_TYPE_META, getCategoryMeta } from "@/lib/interactive/categories";

type Size = "card" | "hero";

/**
 * Capa/preview de um recurso interativo. Existe especificamente pra
 * resolver o problema de "imagem gigante e feia" na página de detalhe:
 * altura e proporção são sempre controladas por `size`, nunca full-bleed
 * ocupando a tela inteira. Sem `coverUrl`, gera um preview elegante
 * (cor + ícone da categoria) em vez de um retângulo cinza vazio.
 */
export function InteractiveCover({
  activityType,
  coverUrl,
  title,
  size = "card",
  className = "",
}: {
  activityType: LearningActivityType | null;
  coverUrl: string | null;
  title: string;
  size?: Size;
  className?: string;
}) {
  const category = activityType ? getCategoryMeta(activityType) : null;
  const Icon = activityType ? ACTIVITY_TYPE_META[activityType].icon : LayoutGrid;
  const sizeClass = size === "hero" ? "aspect-[16/9] max-h-64 sm:max-h-72" : "aspect-[4/3]";

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border ${sizeClass} ${className}`}>
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 480px"
        />
      ) : (
        <div
          className={`relative flex h-full w-full items-center justify-center ${category?.classes.bgSoft ?? "bg-muted"} ${category?.classes.text ?? "text-muted-foreground"}`}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "16px 16px",
            }}
          />
          <Icon className={size === "hero" ? "relative h-14 w-14" : "relative h-10 w-10"} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
