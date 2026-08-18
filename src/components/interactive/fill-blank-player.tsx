"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FillBlankConfig } from "@/lib/validations/interactive-activity";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function FillBlankPlayer({ config }: { config: FillBlankConfig }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = config.sentences.filter((s) => normalize(values[s.id] ?? "") === normalize(s.answer)).length;

  function restart() {
    setValues({});
    setSubmitted(false);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        {config.sentences.map((sentence) => {
          const [before, after] = sentence.text.split("___");
          const isCorrect = submitted && normalize(values[sentence.id] ?? "") === normalize(sentence.answer);
          return (
            <div key={sentence.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span>{before}</span>
              <Input
                aria-label={`Resposta para: ${before}___${after ?? ""}`}
                value={values[sentence.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [sentence.id]: e.target.value }))}
                disabled={submitted}
                className={`inline-block w-40 ${
                  submitted ? (isCorrect ? "border-emerald-600" : "border-destructive") : ""
                }`}
              />
              <span>{after}</span>
              {submitted && !isCorrect && (
                <span className="text-xs text-muted-foreground">(resposta: {sentence.answer})</span>
              )}
            </div>
          );
        })}

        {submitted ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Resultado: {score} / {config.sentences.length}
            </p>
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
          </div>
        ) : (
          <Button onClick={() => setSubmitted(true)} className="self-end">
            Corrigir
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
