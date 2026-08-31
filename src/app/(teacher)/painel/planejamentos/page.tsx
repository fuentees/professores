import Link from "next/link";
import { BookOpenCheck, CalendarDays, Plus, Timer } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

export default async function PlanejamentosPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: plans } = profile ? await supabase
    .from("lesson_plans")
    .select("id, title, theme, duration_minutes, class_count, created_at, subject_id, grade_id")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100) : { data: [] };
  const subjectIds = [...new Set((plans ?? []).map((plan) => plan.subject_id).filter((id): id is string => Boolean(id)))];
  const gradeIds = [...new Set((plans ?? []).map((plan) => plan.grade_id).filter((id): id is string => Boolean(id)))];
  const [{ data: subjects }, { data: grades }] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : { data: [] },
    gradeIds.length ? supabase.from("grades").select("id, name").in("id", gradeIds) : { data: [] },
  ]);
  const subjectNames = new Map((subjects ?? []).map((item) => [item.id, item.name]));
  const gradeNames = new Map((grades ?? []).map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Meus planejamentos</h1>
          <p className="text-sm text-muted-foreground">Abra, edite, imprima ou baixe qualquer plano que você criou.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/painel/planejamento"><Plus /> Novo planejamento</Link>} />
      </div>

      {!plans?.length ? (
        <EmptyState icon={BookOpenCheck} title="Nenhum planejamento ainda" description="Crie seu primeiro plano de aula e mantenha tudo organizado aqui." action={<Button nativeButton={false} render={<Link href="/painel/planejamento">Criar planejamento</Link>} />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/painel/planejamentos/${plan.id}`} className="group">
              <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:ring-primary/30">
                <CardContent className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-bncc-soft text-bncc"><BookOpenCheck /></div>
                  <div>
                    <h2 className="font-semibold leading-snug group-hover:text-primary">{plan.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plan.theme}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{subjectNames.get(plan.subject_id ?? "") ?? "Disciplina"} · {gradeNames.get(plan.grade_id ?? "") ?? "Série"}</span>
                    <span className="inline-flex items-center gap-1"><Timer className="size-3" /> {plan.duration_minutes} min</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {new Intl.DateTimeFormat("pt-BR").format(new Date(plan.created_at))}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
