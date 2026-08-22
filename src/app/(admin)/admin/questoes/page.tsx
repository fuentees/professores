import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteQuestionButton } from "@/components/admin/delete-question-button";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/common/page-header";

type QuestionListRow = {
  id: string;
  code: string | null;
  statement: string;
  question_type: string;
  difficulty: string;
  status: string;
  publication_status: string;
  original_file_path: string | null;
  themes: { name: string } | null;
  subjects: { name: string } | null;
};

function sourceFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export default async function QuestoesPage({
  searchParams,
}: PageProps<"/admin/questoes">) {
  const params = await searchParams;
  const source = params.origem === "word" || params.origem === "manual" ? params.origem : undefined;
  const supabase = await createClient();

  let query = supabase
    .from("questions")
    .select(
      "id, code, statement, question_type, difficulty, status, publication_status, original_file_path, themes(name), subjects(name)",
    )
    .order("created_at", { ascending: false });

  if (source === "word") query = query.not("original_file_path", "is", null);
  if (source === "manual") query = query.is("original_file_path", null);

  const [{ data: questions }, { count: totalCount }, { count: wordCount }] = await Promise.all([
    query.returns<QuestionListRow[]>(),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .not("original_file_path", "is", null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de questões"
        description={`${totalCount ?? 0} questões cadastradas, sendo ${wordCount ?? 0} importadas de arquivos Word.`}
        action={
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/questoes/importacoes">Importações</Link>}
            />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/questoes/importar">Importar Word</Link>}
            />
            <Button
              nativeButton={false}
              render={
                <Link href="/admin/questoes/novo">
                  <Plus className="h-4 w-4" />
                  Nova questão
                </Link>
              }
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2" aria-label="Filtrar questões pela origem">
        <Button
          variant={!source ? "default" : "outline"}
          nativeButton={false}
          render={<Link href="/admin/questoes">Todas ({totalCount ?? 0})</Link>}
        />
        <Button
          variant={source === "word" ? "default" : "outline"}
          nativeButton={false}
          render={
            <Link href="/admin/questoes?origem=word">
              <FileText className="size-4" />
              Importadas do Word ({wordCount ?? 0})
            </Link>
          }
        />
        <Button
          variant={source === "manual" ? "default" : "outline"}
          nativeButton={false}
          render={
            <Link href="/admin/questoes?origem=manual">
              Cadastro manual ({Math.max(0, (totalCount ?? 0) - (wordCount ?? 0))})
            </Link>
          }
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Enunciado</TableHead>
              <TableHead>Disciplina / Tema</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dificuldade</TableHead>
              <TableHead>Publicação</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!questions || questions.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Nenhuma questão cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
            {questions?.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{question.code ?? "—"}</TableCell>
                <TableCell className="max-w-md truncate font-medium">{question.statement}</TableCell>
                <TableCell className="text-muted-foreground">
                  {question.subjects?.name ?? question.themes?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {QUESTION_TYPE_LABELS[question.question_type] ?? question.question_type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}
                </TableCell>
                <TableCell>
                  <Badge variant={question.publication_status === "published" ? "default" : "outline"}>
                    {CONTENT_STATUS_LABELS[question.publication_status] ?? question.publication_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {question.original_file_path ? (
                    <div className="flex max-w-48 items-center gap-2">
                      <Badge variant="outline">Word</Badge>
                      <span className="truncate text-xs text-muted-foreground" title={sourceFileName(question.original_file_path)}>
                        {sourceFileName(question.original_file_path)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Manual</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/questoes/${question.id}/editar`}>Editar</Link>}
                  />
                  <DeleteQuestionButton id={question.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
