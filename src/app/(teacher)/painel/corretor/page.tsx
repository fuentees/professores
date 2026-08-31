import { CorrectionForm } from "@/components/painel/correction-form";
import { loadTaxonomyOptions } from "@/lib/taxonomy";

export default async function CorretorPage() {
  const taxonomy = await loadTaxonomyOptions();
  return <CorrectionForm grades={taxonomy.grades.map(({ id, name }) => ({ id, name }))} subjects={taxonomy.subjects} gradeSubjects={taxonomy.gradeSubjects} aiConfigured={Boolean(process.env.OPENAI_API_KEY?.trim())} />;
}
