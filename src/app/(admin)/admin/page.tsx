import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

async function getStats() {
  const supabase = await createClient();

  const [
    { count: totalTeachers },
    { count: ativos },
    { count: bloqueados },
    { count: publicados },
    { count: rascunhos },
    { count: totalViews },
    { count: totalDownloads },
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
  ]);

  return {
    totalTeachers: totalTeachers ?? 0,
    ativos: ativos ?? 0,
    bloqueados: bloqueados ?? 0,
    publicados: publicados ?? 0,
    rascunhos: rascunhos ?? 0,
    totalViews: totalViews ?? 0,
    totalDownloads: totalDownloads ?? 0,
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
    { label: "Total de visualizações", value: stats.totalViews },
    { label: "Total de downloads", value: stats.totalDownloads },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Visão geral" description="Resumo da atividade do portal." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
