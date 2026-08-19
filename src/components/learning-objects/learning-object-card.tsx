import Image from "next/image";
import Link from "next/link";
import {
  Brain,
  CheckCheck,
  FileQuestion,
  LayoutGrid,
  Layers,
  ListOrdered,
  PenLine,
  Shuffle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningActivityTypeDb } from "@/types/supabase";

export type LearningObjectCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
  activity_type?: LearningActivityTypeDb | null;
};

/**
 * Sem fonte de fotografia real disponível (nenhuma ferramenta de busca/geração
 * de imagem neste ambiente) — em vez do quadro cinza vazio repetido em todo
 * card sem cover_url, cada tipo de atividade ganha uma capa desenhada
 * (gradiente + ícone) consistente com o selo já mostrado, pra não parecer
 * "faltando imagem" quando na verdade não existe.
 */
const ACTIVITY_COVER: Record<string, { icon: LucideIcon; className: string }> = {
  quiz: { icon: FileQuestion, className: "from-blue-100 to-blue-200 text-blue-600 dark:from-blue-950 dark:to-blue-900 dark:text-blue-300" },
  true_false: { icon: CheckCheck, className: "from-teal-100 to-teal-200 text-teal-600 dark:from-teal-950 dark:to-teal-900 dark:text-teal-300" },
  matching: { icon: Shuffle, className: "from-violet-100 to-violet-200 text-violet-600 dark:from-violet-950 dark:to-violet-900 dark:text-violet-300" },
  memory: { icon: Brain, className: "from-rose-100 to-rose-200 text-rose-600 dark:from-rose-950 dark:to-rose-900 dark:text-rose-300" },
  fill_blank: { icon: PenLine, className: "from-amber-100 to-amber-200 text-amber-600 dark:from-amber-950 dark:to-amber-900 dark:text-amber-300" },
  ordering: { icon: ListOrdered, className: "from-cyan-100 to-cyan-200 text-cyan-600 dark:from-cyan-950 dark:to-cyan-900 dark:text-cyan-300" },
  flashcards: { icon: Layers, className: "from-emerald-100 to-emerald-200 text-emerald-600 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300" },
  simulation: { icon: Sparkles, className: "from-fuchsia-100 to-fuchsia-200 text-fuchsia-600 dark:from-fuchsia-950 dark:to-fuchsia-900 dark:text-fuchsia-300" },
};

export function LearningObjectCard({ object }: { object: LearningObjectCardData }) {
  const cover = object.activity_type ? ACTIVITY_COVER[object.activity_type] : null;
  const Icon = cover?.icon ?? LayoutGrid;

  return (
    <Link
      href={`/objetos/${object.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video bg-muted">
        {object.cover_url ? (
          <Image src={object.cover_url} alt={object.title} fill className="object-cover" />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cover?.className ?? "text-muted-foreground"}`}
          >
            <Icon className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
        <Badge className="absolute left-2 top-2 bg-interactive text-white hover:bg-interactive">
          {object.object_type}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-semibold group-hover:underline">{object.title}</h2>
        {object.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{object.description}</p>
        )}
      </div>
    </Link>
  );
}
