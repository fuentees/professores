"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderingConfig } from "@/lib/validations/interactive-activity";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function OrderingPlayer({ config }: { config: OrderingConfig }) {
  // Igual ao MatchingPlayer: começa na ordem original (mesma no servidor e
  // no cliente) e só embaralha depois de montar, pra não dar mismatch de
  // hidratação.
  const [order, setOrder] = useState(config.items);
  // Só no cliente, de propósito (ver comentário em matching-player.tsx).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrder(shuffle(config.items)), [config.items]);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = useMemo(
    () => order.every((item, index) => item.id === config.items[index]?.id),
    [order, config.items],
  );

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  function restart() {
    setOrder(shuffle(config.items));
    setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-2.5">
        {order.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2 rounded-xl border-2 p-3.5 text-sm font-medium ${
              submitted
                ? item.id === config.items[index]?.id
                  ? "border-emerald-600/50 bg-emerald-600/5"
                  : "border-destructive/50 bg-destructive/5"
                : "border-interactive/20 bg-interactive-soft/40"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-interactive text-xs font-semibold text-white">
                {index + 1}
              </span>
              {item.text}
            </span>
            {!submitted && (
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Mover "${item.text || `item ${index + 1}`}" para cima`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Mover "${item.text || `item ${index + 1}`}" para baixo`}
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${isCorrect ? "text-emerald-600" : "text-destructive"}`}>
            {isCorrect ? "Ordem correta!" : "Ainda não está na ordem certa."}
          </p>
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="h-4 w-4" />
            Refazer
          </Button>
        </div>
      ) : (
        <Button onClick={() => setSubmitted(true)} size="lg" className="self-end">
          Verificar ordem
        </Button>
      )}
    </div>
  );
}
