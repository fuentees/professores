"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FractionSimulator() {
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);

  const parts = Array.from({ length: denominator }, (_, i) => i < numerator);
  const decimal = (numerator / denominator).toFixed(3);
  const percentage = ((numerator / denominator) * 100).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-6 p-6 sm:p-8">
      <div className="flex overflow-hidden rounded-lg border" style={{ width: "min(100%, 20rem)" }}>
        {parts.map((filled, i) => (
          <div
            key={i}
            className={`aspect-square flex-1 border-r last:border-r-0 ${filled ? "bg-simulation" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-6 text-2xl font-semibold">
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            aria-label="Aumentar numerador"
            onClick={() => setNumerator((n) => Math.min(n + 1, denominator))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span>{numerator}</span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Diminuir numerador"
            onClick={() => setNumerator((n) => Math.max(n - 1, 0))}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-3xl text-muted-foreground">/</span>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            aria-label="Aumentar denominador"
            onClick={() =>
              setDenominator((d) => {
                const next = Math.min(d + 1, 12);
                return next;
              })
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span>{denominator}</span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Diminuir denominador"
            onClick={() =>
              setDenominator((d) => {
                const next = Math.max(d - 1, 1);
                setNumerator((n) => Math.min(n, next));
                return next;
              })
            }
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {numerator}/{denominator} = {decimal} = {percentage}%
      </p>
    </div>
  );
}
