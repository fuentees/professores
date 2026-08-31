"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { approveQuestionImports } from "@/actions/admin/question-imports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUESTION_IMPORT_STATUS_LABELS } from "@/lib/labels";

export type ImportManagementRow = {
  id: string;
  fileName: string;
  status: string;
  extractedCode: string | null;
  questionId: string | null;
  errorMessage: string | null;
  createdAt: string;
  warningCount: number;
  errorCount: number;
  bnccNewCount: number;
  bnccConflictCount: number;
};

const STATUS_VARIANT: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  uploaded: "outline",
  processing: "outline",
  needs_review: "secondary",
  approved: "default",
  failed: "destructive",
  rejected: "destructive",
  superseded: "outline",
};

export function QuestionImportManagementTable({ rows }: { rows: ImportManagementRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const readyIds = useMemo(
    () => rows.filter((row) => row.status === "needs_review" && row.errorCount === 0).map((row) => row.id),
    [rows],
  );
  const allReadySelected = readyIds.length > 0 && readyIds.every((id) => selected.includes(id));

  function toggleAllReady() {
    setSelected(allReadySelected ? [] : readyIds);
  }

  async function approveSelected() {
    setPending(true);
    const result = await approveQuestionImports(selected);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.approved > 0) toast.success(`${result.approved} importação(ões) aprovada(s).`);
    if (result.failed.length > 0) toast.warning(`${result.failed.length} não puderam ser aprovadas.`);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {readyIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={allReadySelected} onChange={toggleAllReady} className="size-4 accent-primary" />
            Selecionar as {readyIds.length} importações prontas e sem erros
          </label>
          <Button type="button" disabled={pending || selected.length === 0} onClick={approveSelected}>
            <CheckCheck className="size-4" />
            {pending ? "Aprovando..." : `Aprovar selecionadas (${selected.length})`}
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><span className="sr-only">Selecionar</span></TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Relatório</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhuma importação ainda.</TableCell></TableRow>
            )}
            {rows.map((row) => {
              const ready = row.status === "needs_review" && row.errorCount === 0;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {ready && (
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${row.fileName}`}
                        checked={selected.includes(row.id)}
                        onChange={() => setSelected((current) => current.includes(row.id)
                          ? current.filter((id) => id !== row.id)
                          : [...current, row.id])}
                        className="size-4 accent-primary"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{row.fileName}</p>
                    <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(row.createdAt))}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.extractedCode ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.errorCount > 0 && <Badge variant="destructive">{row.errorCount} erro(s)</Badge>}
                      {row.warningCount > 0 && <Badge variant="outline">{row.warningCount} aviso(s)</Badge>}
                      {row.bnccNewCount > 0 && <Badge variant="secondary">{row.bnccNewCount} BNCC nova(s)</Badge>}
                      {row.bnccConflictCount > 0 && <Badge variant="outline">{row.bnccConflictCount} divergência(s)</Badge>}
                      {row.errorCount + row.warningCount + row.bnccNewCount + row.bnccConflictCount === 0 && (
                        <span className="text-xs text-muted-foreground">Sem ocorrências</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>{QUESTION_IMPORT_STATUS_LABELS[row.status] ?? row.status}</Badge>
                    {row.errorMessage && <p className="mt-1 max-w-xs truncate text-xs text-destructive">{row.errorMessage}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {(row.questionId || row.status === "failed" || row.status === "rejected") && (
                      <Link href={`/admin/questoes/importacoes/${row.id}`} className="text-sm text-primary underline">Ver</Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
