import { createClient } from "@/lib/supabase/server";
import { searchQuestions } from "@/actions/question-bank";
import { QuestionBankFilters, type QuestionBankFiltersData } from "@/components/questions/question-bank-filters";
import { QuestionCard } from "@/components/questions/question-card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchX } from "lucide-react";
import { sortGradesByLevel } from "@/lib/pedagogical-order";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionPageSelectionControls } from "@/components/questions/question-selection";

export default async function BancoDeQuestoesPage({
  searchParams,
}: PageProps<"/painel/banco-de-questoes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const educationLevelId = typeof params.nivel === "string" ? params.nivel : undefined;
  const gradeId = typeof params.serie === "string" ? params.serie : undefined;
  const subjectId = typeof params.disciplina === "string" ? params.disciplina : undefined;
  const academicPeriodId = typeof params.periodo === "string" ? params.periodo : undefined;
  const difficulty = typeof params.complexidade === "string" ? params.complexidade : undefined;
  const bloomLevel = typeof params.bloom === "string" ? params.bloom : undefined;
  const questionType = typeof params.tipo === "string" ? params.tipo : undefined;
  const source = params.origem === "word" || params.origem === "manual" ? params.origem : undefined;
  const requestedPage = typeof params.pagina === "string" ? Math.max(1, Number.parseInt(params.pagina, 10) || 1) : 1;

  const supabase = await createClient();

  const [{ data: educationLevels }, { data: grades }, { data: subjects }, { data: academicPeriods }] =
    await Promise.all([
      supabase.from("education_levels").select("id, name, order_index").order("order_index"),
      supabase.from("grades").select("id, name, education_level_id").order("order_index"),
      supabase.from("subjects").select("id, name").order("order_index"),
      supabase.from("academic_periods").select("id, name").order("order_index"),
    ]);

  const educationLevelOptions = (educationLevels ?? []).map((l) => ({ id: l.id, name: l.name, orderIndex: l.order_index }));
  const gradeOptions = sortGradesByLevel(
    (grades ?? []).map((g) => ({ id: g.id, name: g.name, educationLevelId: g.education_level_id })),
    educationLevelOptions,
  );
  const gradeIdsForLevel =
    educationLevelId && !gradeId ? gradeOptions.filter((g) => g.educationLevelId === educationLevelId).map((g) => g.id) : undefined;

  const { questions, total, page, totalPages } = await searchQuestions({
    q,
    gradeId,
    gradeIds: gradeIdsForLevel,
    subjectId,
    academicPeriodId,
    difficulty,
    bloomLevel,
    questionType,
    source,
    page: requestedPage,
  });

  function pageHref(targetPage: number): string {
    const query = new URLSearchParams();
    const entries = {
      q,
      nivel: educationLevelId,
      serie: gradeId,
      disciplina: subjectId,
      periodo: academicPeriodId,
      complexidade: difficulty,
      bloom: bloomLevel,
      tipo: questionType,
      origem: source,
    };
    for (const [key, value] of Object.entries(entries)) if (value) query.set(key, value);
    if (targetPage > 1) query.set("pagina", String(targetPage));
    const serialized = query.toString();
    return serialized ? `/painel/banco-de-questoes?${serialized}` : "/painel/banco-de-questoes";
  }

  const firstVisiblePage = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstVisiblePage + index);

  const filtersData: QuestionBankFiltersData = {
    educationLevels: educationLevelOptions,
    grades: gradeOptions,
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name })),
    academicPeriods: (academicPeriods ?? []).map((p) => ({ id: p.id, name: p.name })),
  };

  const returnQuery = pageHref(page).split("?")[1] ?? "";
  const detailHref = (id: string) =>
    `/painel/banco-de-questoes/${id}${returnQuery ? `?retorno=${encodeURIComponent(returnQuery)}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Banco de questões" description={`${total} questões encontradas`} />

      <QuestionBankFilters data={filtersData} />

      {questions.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhuma questão encontrada"
          description="Tente outro termo de busca ou remova alguns filtros."
        />
      ) : (
        <div className="space-y-4">
          <QuestionPageSelectionControls questionIds={questions.map((question) => question.id)} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} href={detailHref(question.id)} />
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação do banco de questões" className="flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page - 1)}>Anterior</Link>} />
          ) : (
            <Button variant="outline" size="sm" disabled>Anterior</Button>
          )}
          {visiblePages.map((number) => (
            <Button
              key={number}
              nativeButton={false}
              variant={number === page ? "default" : "outline"}
              size="sm"
              aria-current={number === page ? "page" : undefined}
              render={<Link href={pageHref(number)}>{number}</Link>}
            />
          ))}
          {page < totalPages ? (
            <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page + 1)}>Próxima</Link>} />
          ) : (
            <Button variant="outline" size="sm" disabled>Próxima</Button>
          )}
        </nav>
      )}
    </div>
  );
}
