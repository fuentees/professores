import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DIFFICULTY_LABELS,
  BLOOM_TAXONOMY_LABELS,
  RUBRIC_LEVEL_LABELS,
  QUESTION_IMPORT_STATUS_LABELS,
} from "@/lib/labels";
import { ImportReviewActions } from "@/components/admin/import-review-actions";
import { fetchQuestionDocumentBlocks } from "@/lib/queries/question-document-blocks";
import { QuestionDocumentRenderer } from "@/components/questions/question-document-renderer";
import { ReprocessQuestionImport } from "@/components/admin/reprocess-question-import";
import { BnccConflictResolution } from "@/components/admin/bncc-conflict-resolution";

type ImportDetail = {
  id: string;
  file_name: string;
  status: string;
  extracted_code: string | null;
  error_message: string | null;
  question_id: string | null;
};

type QuestionDetail = {
  id: string;
  code: string | null;
  statement: string;
  difficulty: string;
  publication_status: string;
  bloom_primary_level: string | null;
  bloom_justification: string | null;
  pedagogical_note: string | null;
  knowledge_objects: string[] | null;
  book_name: string | null;
  book_unit: string | null;
  original_file_path: string | null;
  subjects: { name: string } | null;
  grades: { name: string } | null;
  academic_periods: { name: string } | null;
  question_parts: { id: string; label: string; prompt: string; order_index: number }[];
  question_answers: { question_part_id: string | null; expected_answer: string; correction_guidance: string | null }[];
  question_rubrics: {
    question_part_id: string | null;
    level: string;
    points: number | null;
    criteria: string;
    order_index: number;
  }[];
  question_assets: { id: string; storage_path: string; original_name: string }[];
  question_bncc_skills: {
    bncc_skills: {
      code: string;
      description: string;
      status: "active" | "inactive";
      source_type: "manual" | "word_import";
      verification_status: "pending" | "verified";
    } | null;
  }[];
};

type ExistingQuestionSummary = {
  id: string;
  code: string | null;
  statement: string;
  difficulty: string;
  updated_at: string;
  subjects: { name: string } | null;
  grades: { name: string } | null;
  question_parts: { id: string }[];
};

type BnccSnapshot = {
  code: string;
  imported_description: string | null;
  catalog_description: string | null;
  resolution: "matched" | "new" | "conflict" | "unmapped" | "missing_description";
};

type ImportEvent = {
  id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

const EVENT_LABELS: Record<string, string> = {
  uploaded: "Arquivo enviado",
  reprocess_started: "Reprocessamento iniciado",
  processed: "Arquivo analisado",
  processing_failed: "Falha no processamento",
  approved: "Importação aprovada",
  rejected: "Importação rejeitada",
  superseded: "Importação substituída",
  bncc_conflict_resolved: "Divergência BNCC resolvida",
  question_fields_updated: "Campos da questão alterados",
  bncc_skill_updated: "Habilidade BNCC alterada",
};

export default async function ImportReviewPage({
  params,
}: PageProps<"/admin/questoes/importacoes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: importRow } = await supabase
    .from("question_imports")
    .select("id, file_name, status, extracted_code, error_message, question_id")
    .eq("id", id)
    .maybeSingle()
    .returns<ImportDetail>();

  if (!importRow) notFound();

  const [{ data: warnings }, { data: question }, { data: bnccSnapshots }, { data: events }] = await Promise.all([
    supabase
      .from("question_import_warnings")
      .select("severity, field, message")
      .eq("import_id", id)
      .order("severity"),
    importRow.question_id
      ? supabase
          .from("questions")
          .select(
            `id, code, statement, difficulty, publication_status, bloom_primary_level, bloom_justification,
            pedagogical_note, knowledge_objects, book_name, book_unit, original_file_path,
            subjects(name), grades(name), academic_periods(name),
            question_parts(id, label, prompt, order_index),
            question_answers(question_part_id, expected_answer, correction_guidance),
            question_rubrics(question_part_id, level, points, criteria, order_index),
            question_assets(id, storage_path, original_name),
            question_bncc_skills(bncc_skills(code, description, status, source_type, verification_status))`,
          )
          .eq("id", importRow.question_id)
          .maybeSingle()
          .returns<QuestionDetail>()
      : Promise.resolve({ data: null }),
    supabase
      .from("question_import_bncc_snapshots")
      .select("code, imported_description, catalog_description, resolution")
      .eq("import_id", id)
      .order("code")
      .returns<BnccSnapshot[]>(),
    supabase
      .from("question_import_events")
      .select("id, actor_id, action, details, created_at")
      .eq("import_id", id)
      .order("created_at", { ascending: false })
      .returns<ImportEvent[]>(),
  ]);

  const actorIds = [...new Set((events ?? []).flatMap((event) => event.actor_id ? [event.actor_id] : []))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const actorNameById = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name]));

  let originalUrl: string | null = null;
  if (question?.original_file_path) {
    const { data: signed } = await supabase.storage
      .from("private")
      .createSignedUrl(question.original_file_path, 300);
    originalUrl = signed?.signedUrl ?? null;
  }

  const documentBlocks = question ? await fetchQuestionDocumentBlocks(supabase, question.id) : [];

  // Quando o importador já sinalizou "código duplicado" (ver question-imports.ts),
  // busca a questão publicada colidente pra comparação lado a lado — sem isso,
  // o admin só via um aviso em texto e tinha que ir procurar manualmente no
  // banco de questões pra decidir se mantém, substitui ou rejeita o rascunho.
  const hasDuplicateCodeWarning = (warnings ?? []).some((w) => w.field === "duplicate_code");
  let existingQuestion: ExistingQuestionSummary | null = null;
  if (hasDuplicateCodeWarning && question?.code) {
    const { data } = await supabase
      .from("questions")
      .select("id, code, statement, difficulty, updated_at, subjects(name), grades(name), question_parts(id)")
      .eq("code", question.code)
      .eq("publication_status", "published")
      .neq("id", question.id)
      .limit(1)
      .maybeSingle()
      .returns<ExistingQuestionSummary>();
    existingQuestion = data;
  }

  const sortedParts = [...(question?.question_parts ?? [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Revisar importação</h1>
          <p className="text-muted-foreground">{importRow.file_name}</p>
        </div>
        <Badge variant="outline">{QUESTION_IMPORT_STATUS_LABELS[importRow.status] ?? importRow.status}</Badge>
      </div>

      {importRow.status === "failed" && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível processar este arquivo: {importRow.error_message ?? "erro desconhecido."}
          </CardContent>
        </Card>
      )}

      {warnings && warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avisos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={w.severity === "error"
                  ? "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  : "rounded-md border border-amber-300/60 bg-amber-50/50 p-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"}
              >
                <span className="font-semibold">{w.severity === "error" ? "Erro que bloqueia a aprovação: " : "Atenção: "}</span>
                {w.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {existingQuestion && question && (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">Comparar com a questão já publicada</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-md border bg-background p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Rascunho importado agora</p>
              <p className="text-sm font-mono">{question.code}</p>
              <p className="text-xs text-muted-foreground">
                {question.subjects?.name ?? "—"} · {question.grades?.name ?? "—"} ·{" "}
                {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty} · {sortedParts.length} item(ns)
              </p>
              <p className="line-clamp-4 text-justify text-sm">{question.statement}</p>
            </div>
            <div className="space-y-2 rounded-md border bg-background p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Já publicada</p>
              <p className="text-sm font-mono">{existingQuestion.code}</p>
              <p className="text-xs text-muted-foreground">
                {existingQuestion.subjects?.name ?? "—"} · {existingQuestion.grades?.name ?? "—"} ·{" "}
                {DIFFICULTY_LABELS[existingQuestion.difficulty] ?? existingQuestion.difficulty} ·{" "}
                {existingQuestion.question_parts.length} item(ns)
              </p>
              <p className="line-clamp-4 text-justify text-sm">{existingQuestion.statement}</p>
              <Link
                href={`/admin/questoes/${existingQuestion.id}/editar`}
                className="inline-block text-sm text-primary underline"
                target="_blank"
              >
                Abrir questão publicada em outra aba →
              </Link>
            </div>
          </CardContent>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Aprovar este rascunho não altera nem substitui a questão publicada acima — as duas ficam
            coexistindo com o mesmo código. Rejeite o rascunho se for de fato a mesma questão, ou aprove se
            for uma versão/variação legítima que deve conviver com a outra.
          </CardContent>
        </Card>
      )}

      {bnccSnapshots && bnccSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparação BNCC do Word com o catálogo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {bnccSnapshots.map((snapshot) => (
              <div key={snapshot.code} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">{snapshot.code}</Badge>
                  <Badge variant={snapshot.resolution === "conflict" ? "destructive" : "secondary"}>
                    {snapshot.resolution === "matched" ? "Igual ao catálogo"
                      : snapshot.resolution === "new" ? "Nova habilidade"
                        : snapshot.resolution === "conflict" ? "Textos diferentes"
                          : snapshot.resolution === "missing_description" ? "Sem descrição"
                            : "Não mapeada"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Texto recebido no Word</p>
                    <p className="mt-1 text-sm">{snapshot.imported_description ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Texto mantido no catálogo</p>
                    <p className="mt-1 text-sm">{snapshot.catalog_description ?? "—"}</p>
                  </div>
                </div>
                {snapshot.resolution === "conflict" && importRow.status === "needs_review" && (
                  <BnccConflictResolution importId={importRow.id} code={snapshot.code} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {question && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados pedagógicos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Código" value={question.code} />
              <Field label="Disciplina" value={question.subjects?.name} />
              <Field label="Série" value={question.grades?.name} />
              <Field label="Trimestre/Bimestre" value={question.academic_periods?.name} />
              <Field label="Livro" value={question.book_name} />
              <Field label="Unidade do livro" value={question.book_unit} />
              <Field label="Complexidade" value={question.difficulty ? DIFFICULTY_LABELS[question.difficulty] : null} />
              <Field
                label="Taxonomia de Bloom"
                value={question.bloom_primary_level ? BLOOM_TAXONOMY_LABELS[question.bloom_primary_level] : null}
              />
              {question.knowledge_objects && question.knowledge_objects.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Objeto de conhecimento</p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {question.knowledge_objects.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
              )}
              {question.question_bncc_skills.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Habilidades BNCC</p>
                  <div className="mt-2 grid gap-2">
                    {question.question_bncc_skills.map(
                      (s, i) =>
                        s.bncc_skills && (
                          <div key={i} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-mono">{s.bncc_skills.code}</Badge>
                              {s.bncc_skills.verification_status === "pending" && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700">
                                  Nova — será ativada ao aprovar
                                </Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{s.bncc_skills.description}</p>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
              {question.pedagogical_note && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Nota pedagógica</p>
                  <p className="text-sm text-muted-foreground">{question.pedagogical_note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Questão</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-justify text-sm">{question.statement}</p>
              {sortedParts.map((part) => (
                <div key={part.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Item {part.label}</p>
                  <p className="text-muted-foreground">{part.prompt}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {documentBlocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documento original (reconstrução)</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionDocumentRenderer blocks={documentBlocks} />
              </CardContent>
            </Card>
          )}

          {(question.question_answers.length > 0 || question.question_rubrics.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Correção</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {question.question_answers.map((answer, i) => (
                  <div key={i} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {answer.question_part_id
                        ? `Resposta esperada — item ${sortedParts.find((p) => p.id === answer.question_part_id)?.label ?? ""}`
                        : "Resposta esperada"}
                    </p>
                    <p className="text-muted-foreground">{answer.expected_answer}</p>
                    {answer.correction_guidance && (
                      <p className="mt-1 text-xs text-muted-foreground">{answer.correction_guidance}</p>
                    )}
                  </div>
                ))}
                {question.question_rubrics.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Rubrica de pontuação</p>
                    {question.question_rubrics
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((rubric, i) => (
                        <div key={i} className="flex flex-wrap items-baseline gap-2 rounded-md border p-2 text-sm">
                          <Badge variant="outline">{RUBRIC_LEVEL_LABELS[rubric.level] ?? rubric.level}</Badge>
                          {rubric.points !== null && <span className="font-medium">{rubric.points} pts</span>}
                          <span className="text-muted-foreground">{rubric.criteria}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Arquivo original</CardTitle>
            </CardHeader>
            <CardContent>
              {originalUrl ? (
                <a href={originalUrl} className="text-sm text-primary underline" target="_blank" rel="noreferrer">
                  Baixar {importRow.file_name}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível gerar o link do arquivo original.</p>
              )}
            </CardContent>
          </Card>

          {(importRow.status === "needs_review" || importRow.status === "approved") && (
            <ImportReviewActions
              importId={importRow.id}
              questionId={question.id}
              alreadyApproved={importRow.status === "approved"}
            />
          )}
        </>
      )}

      {!question && (importRow.status === "failed" || importRow.status === "rejected") && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tentar novamente</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Envie a versão corrigida; o histórico deste arquivo será preservado.</p>
            <ReprocessQuestionImport importId={importRow.id} />
          </CardContent>
        </Card>
      )}

      {events && events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico da importação</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-1 border-l-2 pl-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>{EVENT_LABELS[event.action] ?? event.action}</strong>
                  {event.actor_id ? ` por ${actorNameById.get(event.actor_id) ?? "administrador"}` : ""}
                </span>
                <time className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.created_at))}
                </time>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}
