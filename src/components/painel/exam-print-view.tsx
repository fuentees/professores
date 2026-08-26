"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Printer, Pencil, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import { ExamQuestionBody } from "@/components/painel/exam-question-body";
import { recordExamDownload, type ExamQuestion, type GeneratedExamDetail } from "@/actions/exam-generator";
import { EXAM_QUESTION_TYPES } from "@/lib/validations/exam-generator";

// Toda prova tem disciplina/série (direto na prova, ou — pra provas salvas
// antes dessa coluna existir — resolvido pelo tema em getGeneratedExamDetail).
// Só o tema em si pode faltar de verdade.
function canEdit(exam: GeneratedExamDetail): boolean {
  return Boolean(exam.gradeId && exam.subjectId);
}

const DIFFICULTY_LABELS: Record<ExamQuestion["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

type PrintSettings = { schoolLogoUrl: string | null; schoolPhone: string | null };

export function ExamPrintView({
  exam,
  questions,
  printSettings,
}: {
  exam: GeneratedExamDetail;
  questions: ExamQuestion[];
  printSettings?: PrintSettings;
}) {
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadWord() {
    setDownloading(true);
    try {
      const authorization = await recordExamDownload(exam.id);
      if (authorization.error) {
        toast.error(authorization.error);
        return;
      }
      const { generateExamDocx, downloadBlob } = await import("@/lib/export/exam-docx");
      const blob = await generateExamDocx(exam, questions, printSettings);
      downloadBlob(blob, `${exam.title || "avaliacao"}.docx`);
    } catch {
      toast.error("Não foi possível gerar o arquivo Word.");
    } finally {
      setDownloading(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          ← Voltar para visualização
        </Button>
        <ExamWorkspace
          mode="edit"
          examId={exam.id}
          filters={{
            gradeId: exam.gradeId ?? "",
            subjectId: exam.subjectId ?? "",
            themeId: exam.themeId ?? "",
            questionTypes: [...EXAM_QUESTION_TYPES],
          }}
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
            disabled={!canEdit(exam)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button type="button" variant="outline" onClick={handleDownloadWord} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Baixar Word
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 rounded-lg border bg-background p-8 print:max-w-none print:space-y-6 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="space-y-3 border-b-2 border-foreground/80 pb-4">
          <div className="flex items-start gap-4">
            {printSettings?.schoolLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- logo enviada pelo usuário, tamanho fixo pequeno
              <img
                src={printSettings.schoolLogoUrl}
                alt="Logo da escola"
                className="h-14 w-14 shrink-0 rounded-md border object-contain p-1 print:h-12 print:w-12"
              />
            )}
            <div className="space-y-0.5">
              {exam.schoolName && <p className="text-sm font-semibold uppercase tracking-wide">{exam.schoolName}</p>}
              <h2 className="text-xl font-bold">{exam.title}</h2>
              {printSettings?.schoolPhone && (
                <p className="text-xs text-muted-foreground print:text-foreground">Tel: {printSettings.schoolPhone}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 pt-1 text-sm sm:grid-cols-2">
            <span>Nome: _______________________________________</span>
            <span>Data: ____/____/______</span>
            <span>Turma: ___________</span>
            <span>Nota: ___________</span>
          </div>
          {exam.instructions && (
            <p className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-sm text-muted-foreground print:rounded-none print:bg-transparent print:p-0 print:text-foreground">
              {exam.instructions}
            </p>
          )}
        </div>

        <div className="space-y-6 print:space-y-5">
          {questions.map((question, index) => (
            <div key={question.id} className="flex gap-3 break-inside-avoid">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-foreground/60 text-xs font-bold">
                {index + 1}
              </span>
              <div className="flex-1 space-y-2 pt-0.5 text-sm">
                <ExamQuestionBody question={question} mode="print" printAlternativeMarker />
              </div>
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
