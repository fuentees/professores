import Link from "next/link";
import { loadTaxonomyOptions } from "@/lib/taxonomy";
import { ExamGeneratorForm } from "@/components/painel/exam-generator-form";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { loadSelectedQuestions } from "@/actions/exam-generator";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Library, NotebookTabs } from "lucide-react";

export default async function GeradorPage({ searchParams }: PageProps<"/painel/gerador">) {
  const params = await searchParams;
  const selectedIds = typeof params.questoes === "string" ? params.questoes.split(",").filter(Boolean).slice(0, 30) : [];
  const [taxonomyOptions, profile] = await Promise.all([loadTaxonomyOptions(), getCurrentProfile()]);
  const selected = selectedIds.length > 0 ? await loadSelectedQuestions(selectedIds) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <ClipboardCheck className="size-4" />
            GERADOR DE AVALIAÇÕES
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monte sua prova com segurança</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Escolha o conteúdo e o nível. Depois, revise, troque e organize cada questão antes de baixar.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/painel/banco-de-questoes"><Library />Banco de questões</Link>}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/painel/provas"><NotebookTabs />Provas salvas</Link>}
          />
        </div>
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
