import type { ExamQuestion } from "@/actions/exam-generator";
import { QUESTION_TYPE_LABELS } from "@/lib/labels";

/**
 * Corpo de uma questão (enunciado + itens A/B/C + alternativas ou linhas
 * pontilhadas), compartilhado entre a prévia interativa (ExamWorkspace) e
 * a folha de impressão (ExamPrintView) — pra não ter duas implementações
 * divergindo. `whitespace-pre-wrap` + `break-words` em tudo: texto
 * extraído de .docx pode vir sem quebras de linha nem espaços em alguns
 * trechos, e sem isso a questão "corria" pra fora do cartão/folha.
 */
export function ExamQuestionBody({
  question,
  mode,
  printAlternativeMarker = false,
}: {
  question: ExamQuestion;
  mode: "preview" | "print";
  /** Impressão usa "(  )" antes da letra pro aluno marcar à mão. */
  printAlternativeMarker?: boolean;
}) {
  const bodyTone = mode === "preview" ? "text-muted-foreground" : "";

  return (
    <>
      <p className="whitespace-pre-wrap break-words font-medium">{question.statement}</p>

      {question.parts.length > 0 && (
        <div className={`flex flex-col gap-2 pl-1 ${bodyTone}`}>
          {question.parts.map((part) => (
            <p key={part.id} className="whitespace-pre-wrap break-words">
              <span className="font-semibold text-foreground">{part.label}) </span>
              {part.prompt}
            </p>
          ))}
        </div>
      )}

      {question.questionType === "multiple_choice" ? (
        <ul className={`flex flex-col gap-1.5 pl-1 ${bodyTone}`}>
          {question.alternatives.map((alt) => (
            <li key={alt.id} className="whitespace-pre-wrap break-words">
              {printAlternativeMarker && <>( &nbsp; ) </>}
              <span className="font-semibold text-foreground">{alt.label}) </span>
              {alt.body}
            </li>
          ))}
        </ul>
      ) : mode === "print" ? (
        <div className="flex flex-col gap-4 pt-1 pl-1">
          <div className="border-b border-dotted pt-4" />
          <div className="border-b border-dotted pt-4" />
          <div className="border-b border-dotted pt-4" />
        </div>
      ) : (
        <p className="pl-1 text-muted-foreground">
          {QUESTION_TYPE_LABELS[question.questionType] ?? "Questão"} (resposta aberta).
        </p>
      )}
    </>
  );
}
