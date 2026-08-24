import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendSparkline } from "@/components/common/trend-sparkline";
import { PageHeader } from "@/components/common/page-header";
import { bucketByDay } from "@/lib/trend";

function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { date: string; count: number }[];
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {trend && (
          <div className="mt-3">
            <TrendSparkline data={trend} label={label} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const BILLING_LABELS: Record<string, string> = { free: "Gratuito", monthly: "Mensal", yearly: "Anual" };

// Fora do componente: Server Component roda uma vez por request, não é
// "render" no sentido do React Compiler, mas a regra de pureza reclama de
// Date.now() chamado diretamente dentro da função do componente.
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function DonoPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = daysAgoIso(30);

  const [
    { count: teacherCount },
    { data: newTeachers },
    { count: activeSubCount },
    { data: newSubs },
    { count: planCount },
    { count: questionCount },
    { count: examCount },
    { data: activeSubs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    supabase
      .from("profiles")
      .select("created_at")
      .eq("role", "teacher")
      .gte("created_at", thirtyDaysAgo),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("subscriptions")
      .select("starts_at")
      .eq("status", "active")
      .gte("starts_at", thirtyDaysAgo),
    supabase.from("plans").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("generated_exams").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("plan_id, plans(name, price, billing_period)").eq("status", "active"),
  ]);

  const newTeacherCount = newTeachers?.length ?? 0;
  const newSubCount = newSubs?.length ?? 0;
  const teacherTrend = bucketByDay((newTeachers ?? []).map((t) => t.created_at), 30);
  const subTrend = bucketByDay((newSubs ?? []).map((s) => s.starts_at), 30);

  const byPlan = new Map<string, { name: string; price: number; billingPeriod: string; count: number }>();
  for (const sub of activeSubs ?? []) {
    const plan = sub.plans as unknown as { name: string; price: number; billing_period: string } | null;
    if (!plan) continue;
    const existing = byPlan.get(sub.plan_id);
    if (existing) {
      existing.count++;
    } else {
      byPlan.set(sub.plan_id, { name: plan.name, price: plan.price, billingPeriod: plan.billing_period, count: 1 });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Visão geral" description="Indicadores de negócio da plataforma — professores, assinaturas e uso." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Professores cadastrados"
          value={teacherCount ?? 0}
          hint={`+${newTeacherCount} nos últimos 30 dias`}
          trend={teacherTrend}
        />
        <StatCard
          label="Assinaturas ativas"
          value={activeSubCount ?? 0}
          hint={`+${newSubCount} nos últimos 30 dias`}
          trend={subTrend}
        />
        <StatCard label="Planos ativos" value={planCount ?? 0} />
        <StatCard label="Questões publicadas" value={questionCount ?? 0} />
        <StatCard label="Avaliações salvas" value={examCount ?? 0} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Assinaturas ativas por plano</h2>
        {byPlan.size === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa no momento.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Assinantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...byPlan.values()].map((plan) => (
                  <TableRow key={plan.name}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.price > 0 ? `R$ ${plan.price.toFixed(2)} / ${BILLING_LABELS[plan.billingPeriod]}` : "Gratuito"}
                    </TableCell>
                    <TableCell>{plan.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/dono/planos" className="text-primary hover:underline">
          Gerenciar planos →
        </Link>
        <Link href="/dono/assinaturas" className="text-primary hover:underline">
          Ver todas as assinaturas →
        </Link>
        <Link href="/dono/administradores" className="text-primary hover:underline">
          Gerenciar administradores →
        </Link>
        <Link href="/dono/configuracoes" className="text-primary hover:underline">
          Configurações do site →
        </Link>
      </div>
    </div>
  );
}
