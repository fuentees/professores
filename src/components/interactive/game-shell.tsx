"use client";

import { useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { ACTIVITY_TYPE_META, getCategoryMeta } from "@/lib/interactive/categories";

/**
 * Moldura compartilhada por todos os players de jogo/quiz/simulação:
 * cabeçalho colorido por categoria (em vez de "página branca com texto e
 * botões") + botão de tela cheia, útil pra quem projeta o recurso na TV/
 * projetor da sala. O player em si (children) continua com sua própria
 * lógica interna intacta.
 */
export function GameShell({
  activityType,
  title,
  children,
}: {
  activityType: LearningActivityType;
  title: string;
  children: React.ReactNode;
}) {
  const category = getCategoryMeta(activityType);
  const typeLabel = ACTIVITY_TYPE_META[activityType].label;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-xl border ${isFullscreen ? "flex h-screen flex-col bg-background p-6" : ""}`}
    >
      <div className={`flex items-center justify-between gap-3 ${category.classes.bgSoft} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${category.classes.text}`}>{typeLabel}</span>
          <span className="hidden text-sm font-medium sm:inline">· {title}</span>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium ${category.classes.text} hover:bg-background/60`}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Modo apresentação (tela cheia)"}
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        </button>
      </div>
      <div className={isFullscreen ? "flex flex-1 items-center justify-center overflow-auto p-4" : "p-0"}>
        <div className={isFullscreen ? "w-full max-w-3xl" : "w-full"}>{children}</div>
      </div>
    </div>
  );
}
