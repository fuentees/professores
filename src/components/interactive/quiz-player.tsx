"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityProgress } from "@/components/interactive/activity-progress";
import type { QuizConfig } from "@/lib/validations/interactive-activity";

export function QuizPlayer({ config }: { config: QuizConfig }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const question = config.questions[step];
  const isLast = step === config.questions.length - 1;

  function confirmAnswer() {
    if (!selected) return;
    setAnswers((prev) => ({ ...prev, [question.id]: selected }));
    if (isLast) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
      setSelected(null);
    }
  }

  function restart() {
    setStep(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  }

  if (finished) {
    const score = config.questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Resultado</p>
        <p className="text-5xl font-bold text-primary">
          {score} / {config.questions.length}
        </p>
        <Button onClick={restart} variant="outline">
          <RotateCcw className="h-4 w-4" />
          Refazer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <ActivityProgress current={step + 1} total={config.questions.length} barClassName="bg-primary" />
      <p className="text-lg font-medium">{question.prompt}</p>
      <div className="flex flex-col gap-2.5">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition-colors ${
              selected === option.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
      <Button onClick={confirmAnswer} disabled={!selected} size="lg" className="self-end">
        {isLast ? "Finalizar" : "Próxima"}
      </Button>
    </div>
  );
}
