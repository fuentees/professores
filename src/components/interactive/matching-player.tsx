"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // Ordem inicial igual no servidor e no cliente (sem embaralhar) pra não
  // dar mismatch de hidratação — o embaralhamento real só acontece depois
  // de montar, só no cliente.
  const [rightItems, setRightItems] = useState(config.pairs);
  // Exceção deliberada à regra: precisa rodar só no cliente (Math.random
  // diverge de servidor pra cliente) — é exatamente o padrão recomendado
  // pelo React pra evitar mismatch de hidratação nesse cenário.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRightItems(shuffle(config.pairs)), [config.pairs]);
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
    setRightItems(shuffle(config.pairs));
    setMatched({});
    setSelectedLeft(null);
  }

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <p className="text-xs text-muted-foreground">
        {Object.keys(matched).length} de {config.pairs.length} associados — toque num item da esquerda e depois no par certo à direita.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2.5">
          {config.pairs.map((pair) => {
            const isMatched = Boolean(matched[pair.id]);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isMatched}
                onClick={() => setSelectedLeft(pair.id)}
                className={`rounded-xl border-2 p-3.5 text-left text-sm font-medium transition-colors disabled:opacity-40 ${
                  selectedLeft === pair.id ? "border-interactive bg-interactive-soft" : "border-border hover:bg-accent"
                }`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2.5">
          {rightItems.map((pair) => {
            const isMatched = Object.values(matched).includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleRightClick(pair.id)}
                className={`rounded-xl border-2 p-3.5 text-left text-sm font-medium transition-colors disabled:opacity-40 ${
                  wrongFlash === pair.id ? "border-destructive bg-destructive/5" : "border-border hover:bg-accent"
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
    </div>
  );
}
