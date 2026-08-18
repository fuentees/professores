import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTaxonomyOptions, deriveTaxonomySelection } from "@/lib/taxonomy";
import { QuestionForm } from "@/components/admin/question-form";
import type { QuestionInput } from "@/lib/validations/question";
import type { Database } from "@/types/supabase";

type QuestionDetailRow = Database["public"]["Tables"]["questions"]["Row"] & {
  question_alternatives: Database["public"]["Tables"]["question_alternatives"]["Row"][];
};

export default async function EditarQuestaoPage({
  params,
}: PageProps<"/admin/questoes/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: question }, taxonomyOptions] = await Promise.all([
    supabase
      .from("questions")
      .select("*, question_alternatives(*)")
      .eq("id", id)
      .maybeSingle()
      .returns<QuestionDetailRow>(),
    loadTaxonomyOptions(),
  ]);

  if (!question) notFound();

  const alternatives = [...question.question_alternatives]
    .sort((a, b) => a.order_index - b.order_index)
    .map((alt) => ({ label: alt.label, body: alt.body, isCorrect: alt.is_correct }));

  const defaultValues: QuestionInput = {
    statement: question.statement,
    questionType: question.question_type,
    difficulty: question.difficulty,
    themeId: question.theme_id ?? "",
    subthemeId: question.subtheme_id ?? "",
    answerKey: question.answer_key ?? "",
    alternatives:
      alternatives.length > 0
        ? alternatives
        : [
            { label: "A", body: "", isCorrect: true },
            { label: "B", body: "", isCorrect: false },
          ],
    status: question.status,
  };

  const initialTaxonomy = deriveTaxonomySelection(taxonomyOptions, question.theme_id ?? "", question.subtheme_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar questão</h1>
        <p className="text-muted-foreground line-clamp-2">{question.statement}</p>
      </div>

      <QuestionForm
        questionId={id}
        defaultValues={defaultValues}
        initialTaxonomy={initialTaxonomy}
        taxonomyOptions={taxonomyOptions}
      />
    </div>
  );
}
