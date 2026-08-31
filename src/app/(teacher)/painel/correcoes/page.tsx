import Link from "next/link";
import { FileCheck2, Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

export default async function CorrecoesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: corrections } = profile ? await supabase.from("ai_corrections").select("id, title, correction_type, created_at").eq("teacher_id", profile.id).order("created_at", { ascending: false }).limit(100) : { data: [] };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Histórico de correções</h1><p className="text-sm text-muted-foreground">Consulte novamente as análises que você decidiu salvar.</p></div><Button nativeButton={false} render={<Link href="/painel/corretor"><Plus /> Nova análise</Link>} /></div>
    {!corrections?.length ? <EmptyState icon={FileCheck2} title="Nenhuma correção ainda" description="Fotografe um exercício ou uma redação para começar." action={<Button nativeButton={false} render={<Link href="/painel/corretor">Usar o corretor</Link>} />} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{corrections.map((item) => <Link key={item.id} href={`/painel/correcoes/${item.id}`} className="group"><Card className="h-full transition group-hover:-translate-y-0.5 group-hover:ring-primary/30"><CardContent className="space-y-3"><div className="flex size-10 items-center justify-center rounded-xl bg-activity-soft text-activity"><FileCheck2 /></div><div><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.correction_type === "essay" ? "Redação" : "Exercício"}</span><h2 className="mt-1 font-semibold leading-snug group-hover:text-primary">{item.title}</h2></div><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p></CardContent></Card></Link>)}</div>}
  </div>;
}
