"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityProgress } from "@/components/interactive/activity-progress";
import type { FlashcardsConfig } from "@/lib/validations/interactive-activity";

export function FlashcardsPlayer({ config }: { config: FlashcardsConfig }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = config.cards[index];

  function go(direction: -1 | 1) {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + direction, 0), config.cards.length - 1));
  }

  return (
    <div className="flex flex-col items-center gap-5 p-5 sm:p-6">
      <div className="w-full max-w-md">
        <ActivityProgress current={index + 1} total={config.cards.length} barClassName="bg-flashcard" />
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`flex min-h-48 w-full max-w-md items-center justify-center rounded-2xl border-2 border-flashcard/30 bg-flashcard-soft p-8 text-center text-xl font-semibold text-flashcard transition-transform hover:scale-[1.01] active:scale-[0.99]`}
      >
        {flipped ? card.back : card.front}
      </button>
      <p className="text-xs text-muted-foreground">Clique no cartão para virar</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Cartão anterior" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Reiniciar do primeiro cartão"
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próximo cartão"
          onClick={() => go(1)}
          disabled={index === config.cards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
