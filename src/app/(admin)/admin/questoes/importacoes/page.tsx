import Link from "next/link";
import { BarChart3, Download, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import {
  QuestionImportManagementTable,
  type ImportManagementRow,
} from "@/components/admin/question-import-management-table";

export default async function ImportacoesPage() {
  const supabase = await createClient();
  const [{ data: imports }, { data: warnings }, { data: snapshots }] = await Promise.all([
    supabase
      .from("question_imports")
      .select("id, file_name, status, extracted_code, question_id, error_message, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("question_import_warnings").select("import_id, severity"),
    supabase.from("question_import_bncc_snapshots").select("import_id, resolution"),
  ]);

  const warningCounts = new Map<string, { warnings: number; errors: number }>();
  for (const warning of warnings ?? []) {
    const current = warningCounts.get(warning.import_id) ?? { warnings: 0, errors: 0 };
    if (warning.severity === "error") current.errors++;
    else current.warnings++;
    warningCounts.set(warning.import_id, current);
  }
  const bnccCounts = new Map<string, { newCount: number; conflictCount: number }>();
  for (const snapshot of snapshots ?? []) {
    const current = bnccCounts.get(snapshot.import_id) ?? { newCount: 0, conflictCount: 0 };
    if (snapshot.resolution === "new") current.newCount++;
    if (snapshot.resolution === "conflict") current.conflictCount++;
    bnccCounts.set(snapshot.import_id, current);
  }

  const rows: ImportManagementRow[] = (imports ?? []).map((item) => ({
    id: item.id,
    fileName: item.file_name,
    status: item.status,
    extractedCode: item.extracted_code,
    questionId: item.question_id,
    errorMessage: item.error_message,
    createdAt: item.created_at,
    warningCount: warningCounts.get(item.id)?.warnings ?? 0,
    errorCount: warningCounts.get(item.id)?.errors ?? 0,
    bnccNewCount: bnccCounts.get(item.id)?.newCount ?? 0,
    bnccConflictCount: bnccCounts.get(item.id)?.conflictCount ?? 0,
  }));

  const pending = rows.filter((row) => row.status === "needs_review").length;
  const ready = rows.filter((row) => row.status === "needs_review" && row.errorCount === 0).length;
  const blocked = rows.filter((row) => row.status === "needs_review" && row.errorCount > 0).length;
  const approved = rows.filter((row) => row.status === "approved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importações"
        description="Acompanhe o processamento, revise ocorrências e aprove em lote somente os arquivos seguros."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<a href="/api/admin/modelo-questao-word"><Download className="size-4" />Modelo Word</a>} />
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/questoes/cobertura"><BarChart3 className="size-4" />Cobertura</Link>} />
            <Button nativeButton={false} render={<Link href="/admin/questoes/importar"><Upload className="size-4" />Importar Word</Link>} />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Aguardando revisão" value={pending} />
        <Metric label="Prontas para aprovar" value={ready} tone="success" />
        <Metric label="Bloqueadas por erro" value={blocked} tone="danger" />
        <Metric label="Aprovadas" value={approved} />
      </div>

      <QuestionImportManagementTable rows={rows} />
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" }) {
  return (
    <Card className={tone === "danger" ? "border-destructive/30" : tone === "success" ? "border-emerald-300/70" : undefined}>
      <CardContent className="pt-5">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
