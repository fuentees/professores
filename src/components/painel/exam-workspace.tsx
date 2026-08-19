"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  generateExamPreview,
  swapExamQuestion,
  saveGeneratedExam,
  updateGeneratedExam,
  type ExamQuestion,
} from "@/actions/exam-generator";
import { QUESTION_TYPE_LABELS } from "@/lib/labels";
import type { QuestionType } from "@/types/supabase";

const DIFFICULTY_LABELS: Record<ExamQuestion["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

type DifficultyBuckets = { easy: number; medium: number; hard: number };

function countByDifficulty(questions: ExamQuestion[]): DifficultyBuckets {
  return {
    easy: questions.filter((q) => q.difficulty === "easy").length,
    medium: questions.filter((q) => q.difficulty === "medium").length,
    hard: questions.filter((q) => q.difficulty === "hard").length,
  };
}

export function ExamWorkspace({
  filters,
  initialQuestions,
  initialRequested,
  initialFulfilled,
  initialTitle = "",
  initialSchoolName = "",
  initialInstructions = "",
  initialShowAnswerKey = true,
  mode,
  examId,
}: {
  filters: { gradeId: string; subjectId: string; themeId?: string; subthemeId?: string; questionTypes: QuestionType[] };
  initialQuestions: ExamQuestion[];
  initialRequested?: DifficultyBuckets;
  initialFulfilled?: DifficultyBuckets;
  initialTitle?: string;
  initialSchoolName?: string;
  initialInstructions?: string;
  initialShowAnswerKey?: boolean;
  mode: "create" | "edit";
  examId?: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>(initialQuestions);
  const [requested, setRequested] = useState<DifficultyBuckets | undefined>(initialRequested);
  const [fulfilled, setFulfilled] = useState<DifficultyBuckets | undefined>(initialFulfilled);
  const [title, setTitle] = useState(initialTitle);
  const [schoolName, setSchoolName] = useState(initialSchoolName);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [showAnswerKey, setShowAnswerKey] = useState(initialShowAnswerKey);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [reshuffling, setReshuffling] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSwap(question: ExamQuestion) {
    setSwappingId(question.id);
    const result = await swapExamQuestion(
      questions.map((q) => q.id),
      question.difficulty,
      filters,
    );
    setSwappingId(null);

    if (result.error || !result.question) {
      toast.error(result.error ?? "Não foi possível trocar esta questão.");
      return;
    }
    setQuestions((prev) => prev.map((q) => (q.id === question.id ? result.question! : q)));
  }

  async function handleReshuffle() {
    setReshuffling(true);
    const counts = countByDifficulty(questions);
    const result = await generateExamPreview({
      gradeId: filters.gradeId,
      subjectId: filters.subjectId,
      themeId: filters.themeId || "",
      subthemeId: filters.subthemeId || "",
      easyCount: counts.easy,
      mediumCount: counts.medium,
      hardCount: counts.hard,
      questionTypes: filters.questionTypes,
    });
    setReshuffling(false);

    if (result.error || !result.questions) {
      toast.error(result.error ?? "Não foi possível gerar novamente.");
      return;
    }
    setQuestions(result.questions);
    setRequested(result.requested);
    setFulfilled(result.fulfilled);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Informe um título para a prova.");
      return;
    }
    if (questions.length === 0) {
      toast.error("Adicione pelo menos uma questão.");
      return;
    }

    setSaving(true);
    const payload = {
      title,
      gradeId: filters.gradeId,
      subjectId: filters.subjectId,
      themeId: filters.themeId,
      schoolName,
      instructions,
      showAnswerKey,
      questionIds: questions.map((q) => q.id),
    };
    const result =
      mode === "create" ? await saveGeneratedExam(payload) : await updateGeneratedExam(examId!, payload);
    setSaving(false);

    if (result.error || !result.id) {
      toast.error(result.error ?? "Não foi possível salvar a prova.");
      return;
    }

    toast.success(mode === "create" ? "Prova salva." : "Prova atualizada.");
    router.push(`/painel/provas/${result.id}`);
  }

  const hasPartialFulfillment =
    requested &&
    fulfilled &&
    (fulfilled.easy < requested.easy || fulfilled.medium < requested.medium || fulfilled.hard < requested.hard);

  return (
    <div className="space-y-6">
      {hasPartialFulfillment && requested && fulfilled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Nem todas as questões pedidas foram encontradas com esses filtros: {fulfilled.easy} de {requested.easy}{" "}
          fáceis, {fulfilled.medium} de {requested.medium} médias, {fulfilled.hard} de {requested.hard}{" "}
          difíceis. Cadastre mais questões ou ajuste os filtros (série, disciplina, tema).
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prévia da prova ({questions.length} questões)</h2>
        <Button type="button" variant="outline" size="sm" onClick={handleReshuffle} disabled={reshuffling}>
          <RefreshCw className="h-4 w-4" />
          {reshuffling ? "Sorteando..." : "Gerar novamente"}
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  {index + 1}. {question.statement}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSwap(question)}
                    disabled={swappingId === question.id}
                  >
                    {swappingId === question.id ? "Trocando..." : "Trocar"}
                  </Button>
                </div>
              </div>

              {question.questionType === "multiple_choice" ? (
                <ul className="flex flex-col gap-1 pl-4 text-sm text-muted-foreground">
                  {question.alternatives.map((alt) => (
                    <li key={alt.id}>
                      {alt.label}) {alt.body}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pl-4 text-sm text-muted-foreground">
                  {QUESTION_TYPE_LABELS[question.questionType] ?? "Questão"} (resposta aberta).
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="examTitle">Título da prova</Label>
            <Input
              id="examTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Avaliação bimestral — Matemática"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="examSchool">Escola (opcional)</Label>
              <Input id="examSchool" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </div>
            <label className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">Incluir gabarito ao imprimir</span>
              <Switch checked={showAnswerKey} onCheckedChange={setShowAnswerKey} />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="examInstructions">Instruções para o aluno (opcional)</Label>
            <Textarea
              id="examInstructions"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : mode === "create" ? "Salvar prova" : "Salvar alterações"}
      </Button>
    </div>
  );
}
