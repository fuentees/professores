import Link from "next/link";
import { Plus } from "lucide-react";
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
  themes: { name: string } | null;
  subjects: { name: string } | null;
};

export default async function QuestoesPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, code, statement, question_type, difficulty, status, publication_status, themes(name), subjects(name)")
    .order("created_at", { ascending: false })
    .returns<QuestionListRow[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de questões"
        description="Cadastre questões por tema para alimentar o gerador de provas dos professores."
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!questions || questions.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
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
