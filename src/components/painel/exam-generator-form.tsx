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
import { MAX_QUESTIONS_PER_EXAM, EXAM_QUESTION_TYPES } from "@/lib/validations/exam-generator";
import { QUESTION_TYPE_LABELS } from "@/lib/labels";
import type { QuestionType } from "@/types/supabase";

type Requested = { easy: number; medium: number; hard: number };

const DEFAULT_QUESTION_TYPES: QuestionType[] = ["multiple_choice", "essay"];

export function ExamGeneratorForm({
  taxonomyOptions,
  defaultSchoolName = "",
}: {
  taxonomyOptions: TaxonomyOptions;
  defaultSchoolName?: string;
}) {
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>(EMPTY_TAXONOMY_SELECTION);
  // Padrão não-zero de propósito: com os três campos começando em 0, dava
  // pra clicar "Gerar prévia" sem perceber que o total era 0 — o toast de
  // erro passava despercebido e parecia que "não aparecia nenhuma
  // questão". Um valor inicial razoável evita esse tropeço.
  const [easyCount, setEasyCount] = useState(2);
  const [mediumCount, setMediumCount] = useState(5);
  const [hardCount, setHardCount] = useState(3);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(DEFAULT_QUESTION_TYPES);
  const [generating, setGenerating] = useState(false);

  const [preview, setPreview] = useState<{
    questions: ExamQuestion[];
    requested: Requested;
    fulfilled: Requested;
  } | null>(null);

  const total = easyCount + mediumCount + hardCount;
  // Tema/subtema são um refinamento opcional agora — série+disciplina já
  // bastam pra buscar (ver comentário em pickQuestionIds sobre as duas eras
  // de dado: cadastro manual sempre tem tema, questões importadas do banco
  // de questões só têm disciplina/série, sem tema vinculado).
  const filters = {
    gradeId: taxonomy.gradeId,
    subjectId: taxonomy.subjectId,
    themeId: taxonomy.themeId,
    subthemeId: taxonomy.subthemeId,
    questionTypes,
  };

  function toggleType(type: QuestionType, checked: boolean) {
    setQuestionTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)));
  }

  async function handleGenerate() {
    if (!taxonomy.gradeId || !taxonomy.subjectId) {
      toast.error("Selecione a série e a disciplina.");
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
    if (questionTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de questão.");
      return;
    }

    setGenerating(true);
    const result = await generateExamPreview({
      gradeId: taxonomy.gradeId,
      subjectId: taxonomy.subjectId,
      themeId: taxonomy.themeId,
      subthemeId: taxonomy.subthemeId,
      easyCount,
      mediumCount,
      hardCount,
      questionTypes,
    });
    setGenerating(false);

    if (result.error || !result.questions || !result.requested || !result.fulfilled) {
      toast.error(result.error ?? "Não foi possível gerar a prévia.");
      return;
    }

    if (result.questions.length === 0) {
      toast.error("Nenhuma questão encontrada com esses filtros. Tente outra série, disciplina ou dificuldade.");
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
          initialSchoolName={defaultSchoolName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <CascadingTaxonomySelect options={taxonomyOptions} value={taxonomy} onChange={setTaxonomy} />
          <p className="text-xs text-muted-foreground">
            Série e disciplina já bastam pra buscar. Tema e subtema são opcionais e só refinam a busca — várias
            questões do banco de questões (importadas de arquivos) ainda não têm tema vinculado.
          </p>
        </CardContent>
      </Card>

      {taxonomy.gradeId && taxonomy.subjectId && (
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
                {EXAM_QUESTION_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type)}
                      onChange={(e) => toggleType(type, e.target.checked)}
                    />
                    {QUESTION_TYPE_LABELS[type] ?? type}
                  </label>
                ))}
              </div>
            </div>

            {total < 1 && (
              <p className="text-sm font-medium text-destructive">
                Escolha pelo menos 1 questão nas quantidades acima (Fáceis, Médias ou Difíceis) pra gerar a prévia.
              </p>
            )}
            {total > MAX_QUESTIONS_PER_EXAM && (
              <p className="text-sm font-medium text-destructive">
                Máximo de {MAX_QUESTIONS_PER_EXAM} questões por prova — reduza as quantidades acima.
              </p>
            )}
            {questionTypes.length === 0 && (
              <p className="text-sm font-medium text-destructive">Selecione pelo menos um tipo de questão.</p>
            )}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating || total < 1 || total > MAX_QUESTIONS_PER_EXAM || questionTypes.length === 0}
              className="self-start"
            >
              {generating ? "Gerando..." : "Gerar prévia"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
