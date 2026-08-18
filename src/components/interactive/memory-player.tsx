"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MemoryConfig } from "@/lib/validations/interactive-activity";

type Card2 = { cardId: string; pairId: string; content: string };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(config: MemoryConfig): Card2[] {
  const cards: Card2[] = config.pairs.flatMap((pair) => [
    { cardId: `${pair.id}-a`, pairId: pair.id, content: pair.a },
    { cardId: `${pair.id}-b`, pairId: pair.id, content: pair.b },
  ]);
  return shuffle(cards);
}

export function MemoryPlayer({ config }: { config: MemoryConfig }) {
  const [deck, setDeck] = useState(() => buildDeck(config));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  const isComplete = matchedPairs.size === config.pairs.length;

  function handleFlip(card: Card2) {
    if (flipped.length === 2 || flipped.includes(card.cardId) || matchedPairs.has(card.pairId)) return;

    const next = [...flipped, card.cardId];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = next;
      const first = deck.find((c) => c.cardId === firstId);
      const second = deck.find((c) => c.cardId === secondId);
      if (first && second && first.pairId === second.pairId) {
        setTimeout(() => {
          setMatchedPairs((prev) => new Set(prev).add(first.pairId));
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  function restart() {
    setDeck(buildDeck(config));
    setFlipped([]);
    setMatchedPairs(new Set());
    setMoves(0);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <p className="text-xs text-muted-foreground">Jogadas: {moves}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {deck.map((card) => {
            const isFaceUp = flipped.includes(card.cardId) || matchedPairs.has(card.pairId);
            return (
              <button
                key={card.cardId}
                type="button"
                onClick={() => handleFlip(card)}
                disabled={matchedPairs.has(card.pairId)}
                className={`flex aspect-square items-center justify-center rounded-lg border p-2 text-center text-xs font-medium transition-colors ${
                  matchedPairs.has(card.pairId)
                    ? "border-emerald-600/50 bg-emerald-600/5 text-emerald-700"
                    : isFaceUp
                      ? "border-primary bg-primary/5"
                      : "bg-muted hover:bg-accent"
                }`}
              >
                {isFaceUp ? card.content : "?"}
              </button>
            );
          })}
        </div>

        {isComplete && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-600">Concluído em {moves} jogadas!</p>
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
