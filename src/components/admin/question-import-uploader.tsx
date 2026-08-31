"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileWarning, Loader2, Trash2, Upload, XCircle } from "lucide-react";
import { importQuestionDocx } from "@/actions/admin/question-imports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FileStatus = "pending" | "processing" | "needs_review" | "failed" | "error";

type FileEntry = {
  file: File;
  status: FileStatus;
  importId?: string;
  message?: string;
  summary?: { warnings: number; errors: number; bnccFound: number; bnccLinked: number };
};

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "Aguardando",
  processing: "Processando...",
  needs_review: "Revisar",
  failed: "Erro",
  error: "Erro",
};

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === "processing") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "needs_review") return <FileWarning className="h-4 w-4 text-amber-600" />;
  if (status === "failed" || status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />;
}

export function QuestionImportUploader() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const docxFiles = [...files].filter((f) => f.name.toLowerCase().endsWith(".docx"));
    setEntries((prev) => {
      const known = new Set(prev.map((entry) => `${entry.file.name}:${entry.file.size}:${entry.file.lastModified}`));
      const unique = docxFiles.filter((file) => !known.has(`${file.name}:${file.size}:${file.lastModified}`));
      return [...prev, ...unique.map((file) => ({ file, status: "pending" as FileStatus }))];
    });
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    if (event.dataTransfer.files) addFiles(event.dataTransfer.files);
  }

  async function processAll() {
    setProcessing(true);
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].status !== "pending") continue;
      setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, status: "processing" } : e)));

      try {
        const result = await importQuestionDocx(entries[i].file);
        setEntries((prev) =>
          prev.map((e, idx) => {
            if (idx !== i) return e;
            if (result.error) return { ...e, status: "error", message: result.error };
            if (!result.questionId) {
              return { ...e, status: "failed", message: "Não foi possível interpretar este documento." };
            }
            return { ...e, status: "needs_review", importId: result.importId, summary: result.summary };
          }),
        );
      } catch (err) {
        setEntries((prev) =>
          prev.map((e, idx) =>
            idx === i ? { ...e, status: "error", message: err instanceof Error ? err.message : "Erro inesperado." } : e,
          ),
        );
      }
    }
    setProcessing(false);
  }

  const doneCount = entries.filter((e) => e.status === "needs_review").length;
  const errorCount = entries.filter((e) => e.status === "error" || e.status === "failed").length;
  const blockingCount = entries.filter((entry) => (entry.summary?.errors ?? 0) > 0).length;
  const warningCount = entries.reduce((total, entry) => total + (entry.summary?.warnings ?? 0), 0);
  const bnccNewOrLinked = entries.reduce((total, entry) => total + (entry.summary?.bnccLinked ?? 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent
          className="flex flex-col items-center gap-3 border-2 border-dashed py-10 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Arraste arquivos .docx aqui, ou</p>
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Selecionar arquivos
          </Button>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                  <span className="flex items-center gap-2">
                    <StatusIcon status={entry.status} />
                    {entry.file.name}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {entry.status === "needs_review" && entry.importId ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {(entry.summary?.errors ?? 0) > 0 && <span className="text-xs font-medium text-destructive">{entry.summary!.errors} erro(s)</span>}
                        {(entry.summary?.warnings ?? 0) > 0 && <span className="text-xs">{entry.summary!.warnings} aviso(s)</span>}
                        <Link href={`/admin/questoes/importacoes/${entry.importId}`} className="text-primary underline">Revisar</Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{STATUS_LABEL[entry.status]}{entry.message ? `: ${entry.message}` : ""}</span>
                        {entry.status === "pending" && (
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${entry.file.name}`} onClick={() => setEntries((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button type="button" onClick={processAll} disabled={processing || entries.every((e) => e.status !== "pending")}>
                {processing ? "Analisando..." : "Analisar arquivos"}
              </Button>
              {(doneCount > 0 || errorCount > 0) && (
                <p className="text-sm text-muted-foreground">
                  {doneCount} analisado{doneCount === 1 ? "" : "s"}
                  {errorCount > 0 ? `, ${errorCount} com erro` : ""}
                </p>
              )}
            </div>

            {doneCount > 0 && (
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
                <div><strong>{doneCount}</strong><p className="text-xs text-muted-foreground">processados</p></div>
                <div><strong className={blockingCount ? "text-destructive" : undefined}>{blockingCount}</strong><p className="text-xs text-muted-foreground">com erro bloqueante</p></div>
                <div><strong>{warningCount}</strong><p className="text-xs text-muted-foreground">avisos para revisar</p></div>
                <div><strong>{bnccNewOrLinked}</strong><p className="text-xs text-muted-foreground">vínculos BNCC</p></div>
                <div className="sm:col-span-4">
                  <Link href="/admin/questoes/importacoes" className="font-medium text-primary underline">Abrir relatório completo e aprovação em massa →</Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
