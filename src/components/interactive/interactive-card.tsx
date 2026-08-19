import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { getCategoryMeta } from "@/lib/interactive/categories";
import { InteractiveTypeBadge } from "@/components/interactive/interactive-type-badge";
import { InteractiveCover } from "@/components/learning-objects/interactive-cover";

export type InteractiveCardData = {
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  activityType: LearningActivityType;
  subjectName?: string | null;
  gradeName?: string | null;
};

/**
 * Card "produto" pra um recurso interativo (quiz/jogo/simulação/flashcard/
 * atividade) — substitui o antigo card genérico branco+texto+badge por algo
 * com identidade de categoria (cor + ícone + CTA específico), sem imagem
 * gigante: a capa usa InteractiveCover em tamanho "card" (proporção fixa).
 */
export function InteractiveCard({ object }: { object: InteractiveCardData }) {
  const category = getCategoryMeta(object.activityType);
  const meta = [object.subjectName, object.gradeName].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/objetos/${object.slug}`}
      className={`group flex flex-col overflow-hidden rounded-xl border ${category.classes.border} bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <InteractiveCover
        activityType={object.activityType}
        coverUrl={object.coverUrl}
        title={object.title}
        size="card"
        className="rounded-none border-0 border-b"
      />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <InteractiveTypeBadge activityType={object.activityType} className="self-start" />

        <h3 className="line-clamp-2 font-semibold tracking-tight group-hover:underline">{object.title}</h3>

        {object.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{object.description}</p>
        )}

        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}

        <div className={`mt-auto flex items-center gap-1 pt-2 text-sm font-medium ${category.classes.text}`}>
          {category.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
