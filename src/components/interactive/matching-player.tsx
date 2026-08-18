"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchingConfig } from "@/lib/validations/interactive-activity";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MatchingPlayer({ config }: { config: MatchingConfig }) {
  const rightItems = useMemo(() => shuffle(config.pairs), [config.pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const isComplete = Object.keys(matched).length === config.pairs.length;

  function handleRightClick(rightId: string) {
    if (!selectedLeft) return;
    if (selectedLeft === rightId) {
      setMatched((prev) => ({ ...prev, [selectedLeft]: rightId }));
      setSelectedLeft(null);
    } else {
      setWrongFlash(rightId);
      setTimeout(() => setWrongFlash(null), 500);
      setSelectedLeft(null);
    }
  }

  function restart() {
    setMatched({});
    setSelectedLeft(null);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {config.pairs.map((pair) => {
              const isMatched = Boolean(matched[pair.id]);
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setSelectedLeft(pair.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-40 ${
                    selectedLeft === pair.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  {pair.left}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {rightItems.map((pair) => {
              const isMatched = Object.values(matched).includes(pair.id);
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleRightClick(pair.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-40 ${
                    wrongFlash === pair.id ? "border-destructive bg-destructive/5" : "hover:bg-accent"
                  }`}
                >
                  {pair.right}
                </button>
              );
            })}
          </div>
        </div>

        {isComplete && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-600">Todos os pares foram associados corretamente!</p>
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
