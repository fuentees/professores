"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FACES = [1, 2, 3, 4, 5, 6];

export function ProbabilitySimulator() {
  const [rolls, setRolls] = useState<number[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  function rollOnce() {
    const value = FACES[Math.floor(Math.random() * FACES.length)];
    setLastRoll(value);
    setRolls((prev) => [...prev, value]);
  }

  function rollMany(times: number) {
    const values = Array.from({ length: times }, () => FACES[Math.floor(Math.random() * FACES.length)]);
    setLastRoll(values[values.length - 1]);
    setRolls((prev) => [...prev, ...values]);
  }

  function reset() {
    setRolls([]);
    setLastRoll(null);
  }

  const total = rolls.length;
  const counts = FACES.map((face) => rolls.filter((r) => r === face).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-primary text-3xl font-bold">
          {lastRoll ?? "?"}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={rollOnce}>Lançar 1 dado</Button>
          <Button variant="outline" onClick={() => rollMany(10)}>
            Lançar 10x
          </Button>
          <Button variant="outline" onClick={() => rollMany(100)}>
            Lançar 100x
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </Button>
        </div>

        <div className="w-full max-w-md space-y-2">
          {FACES.map((face, i) => {
            const count = counts[i];
            const frequency = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={face} className="flex items-center gap-2 text-sm">
                <span className="w-4 shrink-0 font-mono">{face}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                  {count} ({frequency}%)
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Total de lançamentos: {total} · Probabilidade teórica de cada face: 16,7%
        </p>
      </CardContent>
    </Card>
  );
}
