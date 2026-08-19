import { Clock } from "lucide-react";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { DIFFICULTY_LABELS } from "@/lib/labels";
import { InteractiveTypeBadge } from "@/components/interactive/interactive-type-badge";
import { InteractiveCover } from "@/components/learning-objects/interactive-cover";

/**
 * Topo da página de detalhe de um recurso interativo. Substitui o antigo
 * bloco de imagem gigante (aspect-video em largura total) por um layout
 * lado a lado: texto à esquerda, preview compacto à direita — a capa nunca
 * domina a tela (ver InteractiveCover, tamanho "hero" com altura máxima).
 */
export function InteractiveDetailHero({
  title,
  description,
  activityType,
  coverUrl,
  subjectName,
  gradeName,
  difficulty,
  estimatedDurationMinutes,
  action,
}: {
  title: string;
  description: string | null;
  activityType: LearningActivityType;
  coverUrl: string | null;
  subjectName: string | null;
  gradeName: string | null;
  difficulty: string | null;
  estimatedDurationMinutes: number | null;
  action: React.ReactNode;
}) {
  const meta = [subjectName, gradeName].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
      <div className="flex flex-col gap-3">
        <InteractiveTypeBadge activityType={activityType} className="self-start" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {meta && <span>{meta}</span>}
          {difficulty && <span>{DIFFICULTY_LABELS[difficulty] ?? difficulty}</span>}
          {estimatedDurationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {estimatedDurationMinutes} min
            </span>
          )}
        </div>

        <div className="pt-1">{action}</div>
      </div>

      <InteractiveCover activityType={activityType} coverUrl={coverUrl} title={title} size="hero" />
    </div>
  );
}
