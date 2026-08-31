import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";

type CoverageQuestion = {
  id: string;
  subject_id: string | null;
  grade_id: string | null;
  knowledge_objects: string[] | null;
  question_bncc_skills: { id: string }[];
};

export default async function QuestionCoveragePage() {
  const supabase = await createClient();
  const [{ data: questions }, { data: grades }, { data: subjects }, { data: configuredPairs }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, subject_id, grade_id, knowledge_objects, question_bncc_skills(id)")
      .eq("publication_status", "published")
      .eq("status", "active")
      .returns<CoverageQuestion[]>(),
    supabase.from("grades").select("id, name, order_index").eq("status", "active").order("order_index"),
    supabase.from("subjects").select("id, name, order_index").eq("status", "active").order("order_index"),
    supabase.from("grade_subjects").select("grade_id, subject_id"),
  ]);

  const gradeById = new Map((grades ?? []).map((grade) => [grade.id, grade]));
  const subjectById = new Map((subjects ?? []).map((subject) => [subject.id, subject]));
  const counters = new Map<string, { total: number; bncc: number; knowledge: number }>();
  for (const question of questions ?? []) {
    if (!question.grade_id || !question.subject_id) continue;
    const key = `${question.grade_id}:${question.subject_id}`;
    const current = counters.get(key) ?? { total: 0, bncc: 0, knowledge: 0 };
    current.total++;
    if (question.question_bncc_skills.length > 0) current.bncc++;
    if ((question.knowledge_objects?.length ?? 0) > 0) current.knowledge++;
    counters.set(key, current);
  }

  const allPairs = new Map<string, { gradeId: string; subjectId: string }>();
  for (const pair of configuredPairs ?? []) {
    allPairs.set(`${pair.grade_id}:${pair.subject_id}`, { gradeId: pair.grade_id, subjectId: pair.subject_id });
  }
  for (const key of counters.keys()) {
    const [gradeId, subjectId] = key.split(":");
    allPairs.set(key, { gradeId, subjectId });
  }

  const rows = [...allPairs.entries()]
    .map(([key, pair]) => ({
      key,
      grade: gradeById.get(pair.gradeId),
      subject: subjectById.get(pair.subjectId),
      ...(counters.get(key) ?? { total: 0, bncc: 0, knowledge: 0 }),
    }))
    .filter((row) => row.grade && row.subject)
    .sort((a, b) => (a.grade!.order_index - b.grade!.order_index) || (a.subject!.order_index - b.subject!.order_index));

  const total = questions?.length ?? 0;
  const classified = (questions ?? []).filter((question) => question.grade_id && question.subject_id).length;
  const withBncc = (questions ?? []).filter((question) => question.question_bncc_skills.length > 0).length;
  const withKnowledge = (questions ?? []).filter((question) => (question.knowledge_objects?.length ?? 0) > 0).length;
  const gaps = rows.filter((row) => row.total === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobertura do banco de questões"
        description="Veja onde o acervo está completo e quais séries ou disciplinas ainda precisam de conteúdo e BNCC."
        action={<Button variant="outline" nativeButton={false} render={<Link href="/admin/questoes/importacoes">Voltar às importações</Link>} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Questões publicadas" value={total} />
        <Metric label="Com série e disciplina" value={classified} total={total} />
        <Metric label="Com BNCC" value={withBncc} total={total} />
        <Metric label="Com objeto de conhecimento" value={withKnowledge} total={total} />
        <Metric label="Combinações sem conteúdo" value={gaps} danger={gaps > 0} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Série</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Questões</TableHead>
              <TableHead>Com BNCC</TableHead>
              <TableHead>Com objeto</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const complete = row.total > 0 && row.bncc === row.total && row.knowledge === row.total;
              return (
                <TableRow key={row.key} className={row.total === 0 ? "bg-amber-50/40 dark:bg-amber-950/10" : undefined}>
                  <TableCell className="font-medium">{row.grade!.name}</TableCell>
                  <TableCell>{row.subject!.name}</TableCell>
                  <TableCell>{row.total}</TableCell>
                  <TableCell>{row.total ? `${row.bncc}/${row.total}` : "—"}</TableCell>
                  <TableCell>{row.total ? `${row.knowledge}/${row.total}` : "—"}</TableCell>
                  <TableCell>
                    {complete ? (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700"><CheckCircle2 className="size-3.5" />Completa</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 text-amber-700"><AlertTriangle className="size-3.5" />{row.total === 0 ? "Sem conteúdo" : "Incompleta"}</Badge>
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

function Metric({ label, value, total, danger = false }: { label: string; value: number; total?: number; danger?: boolean }) {
  const percentage = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <Card className={danger ? "border-amber-300/70" : undefined}>
      <CardContent className="pt-5">
        <p className="text-2xl font-semibold">{value}{percentage !== null ? <span className="ml-1 text-sm font-normal text-muted-foreground">({percentage}%)</span> : null}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
