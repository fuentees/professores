import Link from "next/link";
import { loadTaxonomyOptions } from "@/lib/taxonomy";
import { ExamGeneratorForm } from "@/components/painel/exam-generator-form";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { loadSelectedQuestions } from "@/actions/exam-generator";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import { Badge } from "@/components/ui/badge";

export default async function GeradorPage({ searchParams }: PageProps<"/painel/gerador">) {
  const params = await searchParams;
  const selectedIds = typeof params.questoes === "string" ? params.questoes.split(",").filter(Boolean).slice(0, 30) : [];
  const [taxonomyOptions, profile] = await Promise.all([loadTaxonomyOptions(), getCurrentProfile()]);
  const selected = selectedIds.length > 0 ? await loadSelectedQuestions(selectedIds) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Criar avaliação</h1>
          <p className="text-muted-foreground">
            Escolha série, disciplina e tema, configure a dificuldade e a quantidade de questões, e
            revise a prévia antes de salvar.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/painel/provas">Avaliações salvas</Link>}
        />
      </div>

      {selected?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {selected.error} Volte ao banco de questões e faça uma nova seleção.
        </div>
      )}

      {selected?.questions?.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4">
            <Badge>{selected.questions.length} selecionadas</Badge>
            <p className="text-sm text-muted-foreground">
              A avaliação começou exatamente com as questões escolhidas. Você pode remover ou mudar a ordem antes de salvar.
            </p>
          </div>
          <ExamWorkspace
            mode="create"
            curatedSelection
            filters={{
              gradeId: selected.gradeId ?? "",
              subjectId: selected.subjectId ?? "",
              questionTypes: selected.questionTypes ?? [],
            }}
            initialQuestions={selected.questions}
            initialSchoolName={profile?.school_name ?? ""}
            initialTitle="Avaliação personalizada"
          />
        </div>
      ) : !selected?.error ? (
        <ExamGeneratorForm taxonomyOptions={taxonomyOptions} defaultSchoolName={profile?.school_name ?? ""} />
      ) : null}
    </div>
  );
}
