"use client";

import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrueFalseConfig } from "@/lib/validations/interactive-activity";

export function TrueFalsePlayer({ config }: { config: TrueFalseConfig }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = config.statements.every((s) => answers[s.id] !== undefined);

  function restart() {
    setAnswers({});
    setSubmitted(false);
  }

  const score = config.statements.filter((s) => answers[s.id] === s.isTrue).length;

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6">
      {config.statements.map((statement) => {
        const answer = answers[statement.id];
        const isCorrect = submitted && answer === statement.isTrue;
        const isWrong = submitted && answer !== undefined && answer !== statement.isTrue;
        return (
          <div
            key={statement.id}
            className={`flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
              isCorrect ? "border-emerald-600/50 bg-emerald-600/5" : isWrong ? "border-destructive/50 bg-destructive/5" : "border-border"
            }`}
          >
            <p className="text-sm font-medium">{statement.statement}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="lg"
                variant={answer === true ? "default" : "outline"}
                disabled={submitted}
                onClick={() => setAnswers((prev) => ({ ...prev, [statement.id]: true }))}
              >
                Verdadeiro
              </Button>
              <Button
                size="lg"
                variant={answer === false ? "default" : "outline"}
                disabled={submitted}
                onClick={() => setAnswers((prev) => ({ ...prev, [statement.id]: false }))}
              >
                Falso
              </Button>
              {submitted && (isCorrect ? <Check className="h-5 w-5 text-emerald-600" /> : <X className="h-5 w-5 text-destructive" />)}
            </div>
          </div>
        );
      })}

      {submitted ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Resultado: {score} / {config.statements.length}
          </p>
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="h-4 w-4" />
            Refazer
          </Button>
        </div>
      ) : (
        <Button onClick={() => setSubmitted(true)} disabled={!allAnswered} size="lg" className="self-end">
          Corrigir
        </Button>
      )}
    </div>
  );
}
