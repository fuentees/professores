import { createClient } from "@/lib/supabase/server";
import { searchQuestions } from "@/actions/question-bank";
import { QuestionBankFilters, type QuestionBankFiltersData } from "@/components/questions/question-bank-filters";
import { QuestionCard } from "@/components/questions/question-card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchX } from "lucide-react";
import { sortGradesByLevel } from "@/lib/pedagogical-order";

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

  const { questions, total } = await searchQuestions({
    q,
    gradeId,
    gradeIds: gradeIdsForLevel,
    subjectId,
    academicPeriodId,
    difficulty,
    bloomLevel,
    questionType,
  });

  const filtersData: QuestionBankFiltersData = {
    educationLevels: educationLevelOptions,
    grades: gradeOptions,
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name })),
    academicPeriods: (academicPeriods ?? []).map((p) => ({ id: p.id, name: p.name })),
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
