"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <p className="text-xs text-muted-foreground">
          Cartão {index + 1} de {config.cards.length}
        </p>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flex min-h-40 w-full max-w-md items-center justify-center rounded-lg border bg-muted p-6 text-center text-lg font-medium transition-colors hover:bg-accent"
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
      </CardContent>
    </Card>
  );
}
