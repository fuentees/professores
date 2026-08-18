import { loadTaxonomyOptions } from "@/lib/taxonomy";
import { QuestionForm } from "@/components/admin/question-form";
import { EMPTY_TAXONOMY_SELECTION } from "@/components/admin/cascading-taxonomy-select";
import type { QuestionInput } from "@/lib/validations/question";

const DEFAULT_VALUES: QuestionInput = {
  statement: "",
  questionType: "multiple_choice",
  difficulty: "medium",
  themeId: "",
  subthemeId: "",
  answerKey: "",
  alternatives: [
    { label: "A", body: "", isCorrect: true },
    { label: "B", body: "", isCorrect: false },
  ],
  status: "active",
};

export default async function NovaQuestaoPage() {
  const taxonomyOptions = await loadTaxonomyOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova questão</h1>
        <p className="text-muted-foreground">
          Preencha o enunciado, classifique por tema/dificuldade e, se for múltipla escolha,
          adicione as alternativas.
        </p>
      </div>

      <QuestionForm
        defaultValues={DEFAULT_VALUES}
        initialTaxonomy={EMPTY_TAXONOMY_SELECTION}
        taxonomyOptions={taxonomyOptions}
      />
    </div>
  );
}
