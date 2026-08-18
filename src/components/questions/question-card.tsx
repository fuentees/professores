import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, BLOOM_TAXONOMY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/labels";
import type { QuestionCard as QuestionCardData } from "@/actions/question-bank";

const DIFFICULTY_DOT: Record<string, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-red-500",
};

export function QuestionCard({ question }: { question: QuestionCardData }) {
  return (
    <Link
      href={`/painel/banco-de-questoes/${question.id}`}
      className="group flex flex-col gap-2 rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        {question.code && <span className="font-mono text-xs text-muted-foreground">{question.code}</span>}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[question.difficulty] ?? "bg-muted"}`} />
          {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}
        </span>
      </div>

      <p className="line-clamp-3 text-sm font-medium group-hover:underline">{question.statement}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1 pt-2 text-xs">
        {question.subjectName && <Badge variant="outline">{question.subjectName}</Badge>}
        {question.gradeName && <Badge variant="outline">{question.gradeName}</Badge>}
        {question.bnccCodes.slice(0, 1).map((code) => (
          <Badge key={code} variant="outline" className="font-mono">
            {code}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{question.bloomPrimaryLevel ? `Bloom: ${BLOOM_TAXONOMY_LABELS[question.bloomPrimaryLevel]}` : ""}</span>
        <span>{QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType}</span>
      </div>
    </Link>
  );
}
