import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, BLOOM_TAXONOMY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/labels";
import { subjectBadgeClassName } from "@/lib/subject-colors";
import type { QuestionCard as QuestionCardData } from "@/actions/question-bank";

const DIFFICULTY_DOT: Record<string, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500",
};

/** Título curto pro card quando a questão não tem `title` cadastrado. */
function fallbackTitle(statement: string): string {
  const trimmed = statement.trim();
  return trimmed.length > 90 ? `${trimmed.slice(0, 90).trimEnd()}…` : trimmed;
}

export function QuestionCard({ question }: { question: QuestionCardData }) {
  const displayTitle = question.title?.trim() || fallbackTitle(question.statement);

  return (
    <Link
      href={`/painel/banco-de-questoes/${question.id}`}
      className="group flex flex-col gap-3 rounded-lg border-l-4 border-y border-r p-4 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: "var(--assessment)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge className="bg-assessment-soft text-assessment hover:bg-assessment-soft">
          {QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[question.difficulty] ?? "bg-muted"}`} />
          {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}
        </span>
      </div>

      <p className="line-clamp-2 text-sm font-semibold tracking-tight group-hover:underline">{displayTitle}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1 text-xs">
        {question.code && <span className="font-mono text-muted-foreground">{question.code}</span>}
        {question.subjectName && (
          <Badge className={subjectBadgeClassName(question.subjectName)}>{question.subjectName}</Badge>
        )}
        {question.gradeName && <Badge variant="outline">{question.gradeName}</Badge>}
        {question.bnccCodes.slice(0, 1).map((code) => (
          <Badge key={code} variant="outline" className="border-bncc/30 bg-bncc-soft font-mono text-bncc">
            {code}
          </Badge>
        ))}
      </div>

      {question.bloomPrimaryLevel && (
        <p className="text-xs text-muted-foreground">Bloom: {BLOOM_TAXONOMY_LABELS[question.bloomPrimaryLevel]}</p>
      )}
    </Link>
  );
}
