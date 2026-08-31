import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Gauge, Lightbulb, ListChecks } from "lucide-react";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { correctionOutputSchema } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";

const CONFIDENCE_LABELS = { high: "Alta", medium: "Média", low: "Baixa" } as const;

export default async function CorrecaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: row } = profile ? await supabase.from("ai_corrections").select("id, correction_type, title, output, created_at").eq("id", id).eq("teacher_id", profile.id).maybeSingle() : { data: null };
  if (!row) notFound();
  const parsed = correctionOutputSchema.safeParse(row.output);
  if (!parsed.success) notFound();
  const correction = parsed.data;

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" nativeButton={false} render={<Link href="/painel/correcoes"><ArrowLeft /> Voltar ao histórico</Link>} /><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(row.created_at))}</span></div>
    <header className="rounded-2xl border bg-card p-5 sm:p-7"><span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{row.correction_type === "essay" ? "Análise de redação" : "Correção de exercício"}</span><h1 className="mt-2 text-2xl font-semibold">{correction.title}</h1><p className="mt-3 text-muted-foreground">{correction.overallResult}</p><div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1"><Gauge className="size-4" /> Confiança {CONFIDENCE_LABELS[correction.confidence]}</span>{correction.score !== null && correction.maxScore !== null && <span className="rounded-full bg-assessment-soft px-3 py-1 font-semibold text-assessment">Nota sugerida: {correction.score}/{correction.maxScore}</span>}</div></header>
    {correction.needsTeacherReview && <div className="flex gap-3 rounded-xl border border-assessment/30 bg-assessment-soft p-4 text-sm"><AlertTriangle className="size-5 shrink-0 text-assessment" /><div><strong>Revisão do professor necessária</strong><p className="mt-1 text-muted-foreground">{correction.reviewReason || "Há partes que a IA não conseguiu confirmar com segurança."}</p></div></div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Conteúdo identificado" icon={ListChecks}><p className="whitespace-pre-wrap text-sm leading-relaxed">{correction.transcribedContent}</p></Section>
      <Section title="Resposta ou resolução sugerida" icon={Lightbulb}><p className="whitespace-pre-wrap text-sm leading-relaxed">{correction.suggestedAnswer || "Não aplicável."}</p></Section>
      <Section title="Explicação passo a passo" icon={ListChecks}><ol className="space-y-2 pl-5 text-sm list-decimal">{correction.explanation.map((item) => <li key={item}>{item}</li>)}</ol></Section>
      <Section title="Pontos fortes" icon={CheckCircle2}><ul className="space-y-2 pl-5 text-sm list-disc">{correction.strengths.length ? correction.strengths.map((item) => <li key={item}>{item}</li>) : <li>Nenhum ponto específico identificado.</li>}</ul></Section>
      <Section title="Como melhorar" icon={Lightbulb}><ul className="space-y-2 pl-5 text-sm list-disc">{correction.improvements.length ? correction.improvements.map((item) => <li key={item}>{item}</li>) : <li>Nenhuma melhoria específica identificada.</li>}</ul></Section>
      {correction.criteria.length > 0 && <Section title="Critérios observados" icon={Gauge}><div className="space-y-3">{correction.criteria.map((criterion) => <div key={criterion.name} className="rounded-xl bg-muted/50 p-3"><div className="flex justify-between gap-3"><strong className="text-sm">{criterion.name}</strong>{criterion.score !== null && criterion.maxScore !== null && <span className="text-sm font-semibold">{criterion.score}/{criterion.maxScore}</span>}</div><p className="mt-1 text-sm text-muted-foreground">{criterion.feedback}</p></div>)}</div></Section>}
    </div>
    <p className="text-xs text-muted-foreground">Resultado gerado por IA para apoio. O professor deve conferir a leitura da imagem, os critérios e a decisão final.</p>
  </div>;
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof ListChecks; children: React.ReactNode }) { return <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 flex items-center gap-2 font-semibold"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>{title}</h2>{children}</section>; }
