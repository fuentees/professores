import { notFound } from "next/navigation";
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
  question_bncc_skills: { bncc_skills: { code: string; description: string } | null }[];
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

  const [{ data: warnings }, { data: question }] = await Promise.all([
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
            question_bncc_skills(bncc_skills(code, description))`,
          )
          .eq("id", importRow.question_id)
          .maybeSingle()
          .returns<QuestionDetail>()
      : Promise.resolve({ data: null }),
  ]);

  let originalUrl: string | null = null;
  if (question?.original_file_path) {
    const { data: signed } = await supabase.storage
      .from("private")
      .createSignedUrl(question.original_file_path, 300);
    originalUrl = signed?.signedUrl ?? null;
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
              <p key={i} className="text-sm text-amber-700">
                ⚠ {w.message}
              </p>
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
                  <div className="mt-1 flex flex-wrap gap-2">
                    {question.question_bncc_skills.map(
                      (s, i) =>
                        s.bncc_skills && (
                          <Badge key={i} variant="outline" className="font-mono">
                            {s.bncc_skills.code}
                          </Badge>
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
              <p className="whitespace-pre-wrap text-sm">{question.statement}</p>
              {sortedParts.map((part) => (
                <div key={part.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Item {part.label}</p>
                  <p className="text-muted-foreground">{part.prompt}</p>
                </div>
              ))}
              {question.question_assets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.question_assets.map((asset) => (
                    <Badge key={asset.id} variant="outline">
                      🖼 {asset.original_name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
