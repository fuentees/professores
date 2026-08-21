import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { TrendSparkline } from "@/components/common/trend-sparkline";
import { bucketByDay } from "@/lib/trend";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function getStats() {
  const supabase = await createClient();
  const thirtyDaysAgo = daysAgoIso(30);

  const [
    { count: totalTeachers },
    { count: ativos },
    { count: bloqueados },
    { count: publicados },
    { count: rascunhos },
    { count: totalViews },
    { count: totalDownloads },
    { data: recentViews },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "teacher")
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "teacher")
      .eq("status", "blocked"),
    supabase.from("contents").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("contents").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("content_views").select("*", { count: "exact", head: true }),
    supabase.from("downloads").select("*", { count: "exact", head: true }),
    supabase.from("content_views").select("viewed_at").gte("viewed_at", thirtyDaysAgo),
  ]);

  return {
    totalTeachers: totalTeachers ?? 0,
    ativos: ativos ?? 0,
    bloqueados: bloqueados ?? 0,
    publicados: publicados ?? 0,
    rascunhos: rascunhos ?? 0,
    totalViews: totalViews ?? 0,
    totalDownloads: totalDownloads ?? 0,
    viewsTrend: bucketByDay((recentViews ?? []).map((v) => v.viewed_at), 30),
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Professores cadastrados", value: stats.totalTeachers },
    { label: "Professores ativos", value: stats.ativos },
    { label: "Professores bloqueados", value: stats.bloqueados },
    { label: "Materiais publicados", value: stats.publicados },
    { label: "Materiais em rascunho", value: stats.rascunhos },
    { label: "Total de downloads", value: stats.totalDownloads },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Visão geral" description="Resumo da atividade do portal." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de visualizações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{stats.totalViews}</p>
          <p className="mt-1 text-xs text-muted-foreground">Visualizações de conteúdo nos últimos 30 dias</p>
          <div className="mt-3">
            <TrendSparkline data={stats.viewsTrend} label="Visualizações" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cadastre materiais em <strong>Materiais → Novo material</strong> e vincule à
          classificação pedagógica para que apareçam na biblioteca pública.
        </CardContent>
      </Card>
    </div>
  );
}
