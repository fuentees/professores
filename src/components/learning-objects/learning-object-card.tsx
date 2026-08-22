import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningActivityTypeDb } from "@/types/supabase";
import { InteractiveCard } from "@/components/interactive/interactive-card";
import { learningObjectCover } from "@/lib/content-cover";

export type LearningObjectCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
  activity_type?: LearningActivityTypeDb | null;
  subject_name?: string | null;
  grade_name?: string | null;
};

/**
 * Objetos com `activity_type` (quiz/jogo/simulação/flashcard/atividade) são
 * recursos interativos de verdade — ganham o card rico por categoria
 * (InteractiveCard). Sem `activity_type`, é um recurso "estático" legado
 * (upload/link externo, ex: vídeo, infográfico) — mantém o card genérico
 * mais simples abaixo, já que não pertence a nenhuma categoria de jogo.
 */
export function LearningObjectCard({ object, href }: { object: LearningObjectCardData; href?: string }) {
  if (object.activity_type) {
    return (
      <InteractiveCard
        href={href}
        object={{
          slug: object.slug,
          title: object.title,
          description: object.description,
          coverUrl: object.cover_url ?? learningObjectCover(object.slug),
          activityType: object.activity_type,
          subjectName: object.subject_name,
          gradeName: object.grade_name,
        }}
      />
    );
  }

  const coverUrl = object.cover_url ?? learningObjectCover(object.slug);

  return (
    <Link
      href={href ?? `/objetos/${object.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video bg-muted">
        {coverUrl ? (
          <Image src={coverUrl} alt={object.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <LayoutGrid className="h-10 w-10" strokeWidth={1.5} />
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
