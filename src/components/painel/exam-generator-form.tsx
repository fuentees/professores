"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  CascadingTaxonomySelect,
  EMPTY_TAXONOMY_SELECTION,
  type TaxonomyOptions,
  type TaxonomySelection,
} from "@/components/admin/cascading-taxonomy-select";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import { generateExamPreview, type ExamQuestion } from "@/actions/exam-generator";
import { MAX_QUESTIONS_PER_EXAM } from "@/lib/validations/exam-generator";

type Requested = { easy: number; medium: number; hard: number };

export function ExamGeneratorForm({ taxonomyOptions }: { taxonomyOptions: TaxonomyOptions }) {
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>(EMPTY_TAXONOMY_SELECTION);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeEssay, setIncludeEssay] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [preview, setPreview] = useState<{
    questions: ExamQuestion[];
    requested: Requested;
    fulfilled: Requested;
  } | null>(null);

  const total = easyCount + mediumCount + hardCount;
  const filters = {
    themeId: taxonomy.themeId,
    subthemeId: taxonomy.subthemeId,
    includeMultipleChoice,
    includeEssay,
  };

  async function handleGenerate() {
    if (!taxonomy.themeId) {
      toast.error("Selecione o tema da aula.");
      return;
    }
    if (total < 1) {
      toast.error("Escolha pelo menos 1 questão.");
      return;
    }
    if (total > MAX_QUESTIONS_PER_EXAM) {
      toast.error(`Máximo de ${MAX_QUESTIONS_PER_EXAM} questões por prova.`);
      return;
    }
    if (!includeMultipleChoice && !includeEssay) {
      toast.error("Selecione pelo menos um tipo de questão.");
      return;
    }

    setGenerating(true);
    const result = await generateExamPreview({
      themeId: taxonomy.themeId,
      subthemeId: taxonomy.subthemeId,
      easyCount,
      mediumCount,
      hardCount,
      includeMultipleChoice,
      includeEssay,
    });
    setGenerating(false);

    if (result.error || !result.questions || !result.requested || !result.fulfilled) {
      toast.error(result.error ?? "Não foi possível gerar a prévia.");
      return;
    }

    if (result.questions.length === 0) {
      toast.error("Nenhuma questão encontrada com esses filtros. Tente outro tema ou dificuldade.");
      return;
    }

    setPreview({ questions: result.questions, requested: result.requested, fulfilled: result.fulfilled });
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
          ← Mudar filtros
        </Button>
        <ExamWorkspace
          mode="create"
          filters={filters}
          initialQuestions={preview.questions}
          initialRequested={preview.requested}
          initialFulfilled={preview.fulfilled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <CascadingTaxonomySelect options={taxonomyOptions} value={taxonomy} onChange={setTaxonomy} />
        </CardContent>
      </Card>

      {taxonomy.themeId && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div>
              <Label>Quantidade de questões por dificuldade</Label>
              <p className="text-sm text-muted-foreground">
                Varie os níveis como quiser. Total: {total} de {MAX_QUESTIONS_PER_EXAM} questões.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="easyCount">Fáceis</Label>
                <Input
                  id="easyCount"
                  type="number"
                  min={0}
                  max={MAX_QUESTIONS_PER_EXAM}
                  value={easyCount}
                  onChange={(e) => setEasyCount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mediumCount">Médias</Label>
                <Input
                  id="mediumCount"
                  type="number"
                  min={0}
                  max={MAX_QUESTIONS_PER_EXAM}
                  value={mediumCount}
                  onChange={(e) => setMediumCount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hardCount">Difíceis</Label>
                <Input
                  id="hardCount"
                  type="number"
                  min={0}
                  max={MAX_QUESTIONS_PER_EXAM}
                  value={hardCount}
                  onChange={(e) => setHardCount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tipo de questão</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeMultipleChoice}
                    onChange={(e) => setIncludeMultipleChoice(e.target.checked)}
                  />
                  Múltipla escolha
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeEssay} onChange={(e) => setIncludeEssay(e.target.checked)} />
                  Dissertativa
                </label>
              </div>
            </div>

            <Button type="button" onClick={handleGenerate} disabled={generating} className="self-start">
              {generating ? "Gerando..." : "Gerar prévia"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
