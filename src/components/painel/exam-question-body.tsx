import type { ExamQuestion } from "@/actions/exam-generator";

/**
 * Linhas pontilhadas pro aluno escrever à mão na impressão. `count` maior
 * pro corpo da questão sem itens (resposta única, geralmente mais longa)
 * e menor por item A/B/C (cada um já é um pedaço menor da resposta) — sem
 * isso, uma questão discursiva de verdade ("explique...") ficava com só 3
 * linhas curtas coladas, sem espaço real pra escrever.
 */
function AnswerLines({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-6 pt-2 pl-1 print:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border-b border-dotted pt-6 print:pt-5" />
      ))}
    </div>
  );
}

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
  const isWritten = question.questionType !== "multiple_choice";

  return (
    <>
      <p className="whitespace-pre-wrap break-words text-justify font-medium">{question.statement}</p>

      {question.images.length > 0 && (
        <div className="flex flex-col gap-2 pl-1">
          {question.images.map((image, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- URL assinada dinâmica (ver exam-print-view.tsx, mesmo padrão da logo)
            <img
              key={i}
              src={image.url}
              alt={image.altText ?? `Imagem da questão ${i + 1}`}
              className="max-h-72 w-auto max-w-full rounded-md border object-contain print:max-h-56"
            />
          ))}
        </div>
      )}

      {question.parts.length > 0 && (
        <div className={`flex flex-col gap-5 pl-1 ${bodyTone}`}>
          {question.parts.map((part) => (
            <div key={part.id}>
              <p className="whitespace-pre-wrap break-words text-justify">
                <span className="font-semibold text-foreground">{part.label}) </span>
                {part.prompt}
              </p>
              {isWritten && mode === "print" && <AnswerLines count={3} />}
            </div>
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
      ) : question.parts.length === 0 && mode === "print" ? (
        <AnswerLines count={6} />
      ) : question.parts.length === 0 ? (
        <p className="pl-1 text-muted-foreground">O aluno responderá por escrito.</p>
      ) : null}
    </>
  );
}
