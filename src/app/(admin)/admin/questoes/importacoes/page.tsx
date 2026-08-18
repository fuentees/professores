import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUESTION_IMPORT_STATUS_LABELS } from "@/lib/labels";

const STATUS_VARIANT: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  uploaded: "outline",
  processing: "outline",
  needs_review: "secondary",
  approved: "default",
  failed: "destructive",
  rejected: "destructive",
};

export default async function ImportacoesPage() {
  const supabase = await createClient();
  const { data: imports } = await supabase
    .from("question_imports")
    .select("id, file_name, status, extracted_code, question_id, error_message, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importações</h1>
        <p className="text-muted-foreground">Histórico de arquivos .docx enviados para o banco de questões.</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Código extraído</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!imports || imports.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Nenhuma importação ainda.
                </TableCell>
              </TableRow>
            )}
            {imports?.map((imp) => (
              <TableRow key={imp.id}>
                <TableCell className="font-medium">{imp.file_name}</TableCell>
                <TableCell className="text-muted-foreground">{imp.extracted_code ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[imp.status] ?? "outline"}>
                    {QUESTION_IMPORT_STATUS_LABELS[imp.status] ?? imp.status}
                  </Badge>
                  {imp.error_message && (
                    <p className="mt-1 max-w-xs truncate text-xs text-destructive">{imp.error_message}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {imp.question_id && (imp.status === "needs_review" || imp.status === "approved") && (
                    <Link href={`/admin/questoes/importacoes/${imp.id}`} className="text-sm text-primary underline">
                      Ver
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
