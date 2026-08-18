"use client";

import { useState } from "react";
import { Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import type { ExamQuestion, GeneratedExamDetail } from "@/actions/exam-generator";

const DIFFICULTY_LABELS: Record<ExamQuestion["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

export function ExamPrintView({ exam, questions }: { exam: GeneratedExamDetail; questions: ExamQuestion[] }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          ← Voltar para visualização
        </Button>
        <ExamWorkspace
          mode="edit"
          examId={exam.id}
          filters={{ themeId: exam.themeId ?? "", includeMultipleChoice: true, includeEssay: true }}
          initialQuestions={questions}
          initialTitle={exam.title}
          initialSchoolName={exam.schoolName ?? ""}
          initialInstructions={exam.instructions ?? ""}
          initialShowAnswerKey={exam.showAnswerKey}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-semibold">{exam.title}</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
            disabled={!exam.themeId}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 rounded-lg border bg-background p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="space-y-1 border-b pb-4">
          <h2 className="text-xl font-bold">{exam.title}</h2>
          {exam.schoolName && <p className="text-sm text-muted-foreground">{exam.schoolName}</p>}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <span>Nome: _______________________________________</span>
            <span>Data: ____/____/______</span>
          </div>
          {exam.instructions && <p className="mt-2 text-sm text-muted-foreground">{exam.instructions}</p>}
        </div>

        <div className="space-y-5">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2 break-inside-avoid">
              <p className="text-sm font-medium">
                {index + 1}. {question.statement}
              </p>
              {question.questionType === "multiple_choice" ? (
                <ul className="flex flex-col gap-1 pl-4 text-sm">
                  {question.alternatives.map((alt) => (
                    <li key={alt.id}>
                      ( &nbsp; ) {alt.label}) {alt.body}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3 pl-4">
                  <div className="border-b border-dotted pt-4" />
                  <div className="border-b border-dotted pt-4" />
                  <div className="border-b border-dotted pt-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {exam.showAnswerKey && (
          <div className="space-y-2 border-t pt-4 break-before-page">
            <h3 className="font-semibold">GABARITO</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {questions.map((question) => (
                <li key={question.id}>
                  <span className="text-muted-foreground">[{DIFFICULTY_LABELS[question.difficulty]}] </span>
                  {question.questionType === "multiple_choice" ? (
                    <>{question.alternatives.find((a) => a.isCorrect)?.label ?? "—"}</>
                  ) : (
                    <>{question.answerKey || "Sem resposta esperada cadastrada."}</>
                  )}
                  {question.questionType === "multiple_choice" && question.answerKey && (
                    <span className="block text-muted-foreground">{question.answerKey}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
