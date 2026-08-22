import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionDetail, getQuestionNavigation, type QuestionSearchFilters } from "@/actions/question-bank";
import { fetchQuestionDocumentBlocks } from "@/lib/queries/question-document-blocks";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, BLOOM_TAXONOMY_LABELS, QUESTION_TYPE_LABELS, RUBRIC_LEVEL_LABELS } from "@/lib/labels";
import { CollapsibleSection } from "@/components/questions/collapsible-section";
import { QuestionDocumentRenderer } from "@/components/questions/question-document-renderer";
import { QuestionFavoriteButton } from "@/components/questions/question-favorite-button";
import { QuestionOriginalDownloadButton } from "@/components/questions/question-original-download-button";
import { QuestionSelectionToggle } from "@/components/questions/question-selection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: PageProps<"/painel/banco-de-questoes/[id]">) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const returnQuery = typeof rawSearchParams.retorno === "string" ? rawSearchParams.retorno : "";
  const context = new URLSearchParams(returnQuery);
  const sourceParam = context.get("origem");
  const navigationFilters: QuestionSearchFilters & { educationLevelId?: string } = {
    q: context.get("q") || undefined,
    educationLevelId: context.get("nivel") || undefined,
    gradeId: context.get("serie") || undefined,
    subjectId: context.get("disciplina") || undefined,
    academicPeriodId: context.get("periodo") || undefined,
    difficulty: context.get("complexidade") || undefined,
    bloomLevel: context.get("bloom") || undefined,
    questionType: context.get("tipo") || undefined,
    source: sourceParam === "word" || sourceParam === "manual" ? sourceParam : undefined,
  };
  const result = await getQuestionDetail(id);
  if (result.error || !result.question) notFound();
  const question = result.question;
  const navigation = await getQuestionNavigation(id, navigationFilters);
  const backHref = returnQuery ? `/painel/banco-de-questoes?${returnQuery}` : "/painel/banco-de-questoes";
  const detailHref = (questionId: string) =>
    `/painel/banco-de-questoes/${questionId}${returnQuery ? `?retorno=${encodeURIComponent(returnQuery)}` : ""}`;

  const profile = await getCurrentProfile();
  let initialFavorited = false;
  if (profile) {
    const supabase = await createClient();
    const { data: favorite } = await supabase
      .from("question_favorites")
      .select("id")
      .eq("teacher_id", profile.id)
      .eq("question_id", id)
      .maybeSingle();
    initialFavorited = Boolean(favorite);
  }

  // question_document_blocks/question_assets são admin-only via RLS —
  // mesmo padrão do resto do banco de questões (createAdminClient() +
  // filtro explícito já feito por getQuestionDetail acima).
  const documentBlocks = await fetchQuestionDocumentBlocks(createAdminClient(), id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href={backHref} className="hover:underline">
          Banco de questões
        </Link>
        {question.subjectName && <span> / {question.subjectName}</span>}
        {question.gradeName && <span> / {question.gradeName}</span>}
      </nav>

      {navigation && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
          {navigation.previous ? (
            <Button nativeButton={false} variant="outline" size="sm" render={<Link href={detailHref(navigation.previous.id)}><ArrowLeft />Anterior</Link>} />
          ) : <Button variant="outline" size="sm" disabled><ArrowLeft />Anterior</Button>}
          <span className="text-sm font-medium">Questão {navigation.position} de {navigation.total}</span>
          {navigation.next ? (
            <Button nativeButton={false} variant="outline" size="sm" render={<Link href={detailHref(navigation.next.id)}>Próxima<ArrowRight /></Link>} />
          ) : <Button variant="outline" size="sm" disabled>Próxima<ArrowRight /></Button>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {question.code && <Badge variant="outline" className="font-mono">{question.code}</Badge>}
        <Badge variant="outline">{DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}</Badge>
        {question.bloomPrimaryLevel && (
          <Badge variant="outline">Bloom: {BLOOM_TAXONOMY_LABELS[question.bloomPrimaryLevel]}</Badge>
        )}
        <Badge variant="outline">{QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType}</Badge>
        {question.bnccCodes.map((code) => (
          <Badge key={code} variant="outline" className="font-mono">
            {code}
          </Badge>
        ))}
      </div>

      {question.knowledgeObjects.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground">Objeto de conhecimento</p>
          <ul className="mt-1 list-inside list-disc text-sm">
            {question.knowledgeObjects.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <p className="whitespace-pre-wrap text-justify text-sm leading-relaxed">{question.statement}</p>
        {question.parts.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {question.parts.map((part) => (
              <div key={part.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">Item {part.label}</p>
                <p className="text-muted-foreground">{part.prompt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {documentBlocks.length > 0 && (
        <CollapsibleSection title="Documento original">
          <QuestionDocumentRenderer blocks={documentBlocks} />
        </CollapsibleSection>
      )}

      {question.answers.length > 0 && (
        <CollapsibleSection title="Gabarito">
          <div className="flex flex-col gap-3">
            {question.answers.map((answer, i) => {
              const part = question.parts.find((p) => p.id === answer.partId);
              return (
                <div key={i} className="text-sm">
                  <p className="font-medium">{part ? `Item ${part.label}` : "Resposta esperada"}</p>
                  <p className="text-muted-foreground">{answer.expectedAnswer}</p>
                  {answer.correctionGuidance && (
                    <p className="mt-1 text-xs text-muted-foreground">{answer.correctionGuidance}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {question.rubrics.length > 0 && (
        <CollapsibleSection title="Rubrica de correção">
          <div className="flex flex-col gap-2">
            {question.rubrics.map((rubric, i) => {
              const part = question.parts.find((p) => p.id === rubric.partId);
              return (
                <div key={i} className="flex flex-wrap items-baseline gap-2 rounded-md border p-2 text-sm">
                  {part && <Badge variant="outline">Item {part.label}</Badge>}
                  <Badge variant="outline">{RUBRIC_LEVEL_LABELS[rubric.level] ?? rubric.level}</Badge>
                  {rubric.points !== null && <span className="font-medium">{rubric.points} pts</span>}
                  <span className="text-muted-foreground">{rubric.criteria}</span>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {(question.pedagogicalNote || question.bloomJustification) && (
        <CollapsibleSection title="Nota pedagógica">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            {question.pedagogicalNote && <p>{question.pedagogicalNote}</p>}
            {question.bloomJustification && <p>{question.bloomJustification}</p>}
          </div>
        </CollapsibleSection>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuestionSelectionToggle questionId={question.id} />
        {profile && <QuestionFavoriteButton questionId={question.id} initialFavorited={initialFavorited} />}
        {question.hasOriginalFile && <QuestionOriginalDownloadButton questionId={question.id} />}
      </div>
    </div>
  );
}
