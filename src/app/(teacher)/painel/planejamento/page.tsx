import { LessonPlanForm } from "@/components/painel/lesson-plan-form";
import { loadTaxonomyOptions } from "@/lib/taxonomy";

export default async function PlanejamentoPage() {
  const taxonomy = await loadTaxonomyOptions();
  return (
    <LessonPlanForm
      grades={taxonomy.grades.map(({ id, name }) => ({ id, name }))}
      subjects={taxonomy.subjects}
      gradeSubjects={taxonomy.gradeSubjects}
      aiConfigured={Boolean(process.env.OPENAI_API_KEY?.trim())}
    />
  );
}
