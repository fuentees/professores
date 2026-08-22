"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FilePlus2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExamQuestionBody } from "@/components/painel/exam-question-body";
import { useQuestionSelection } from "@/components/questions/question-selection";
import { loadSelectedQuestions, recordQuestionSelectionDownload, type ExamQuestion } from "@/actions/exam-generator";
import { updateQuestionCollection, type QuestionCollectionDetail } from "@/actions/question-collections";
import { MAX_QUESTIONS_PER_EXAM } from "@/lib/validations/exam-generator";
import { DIFFICULTY_LABELS } from "@/lib/labels";

export function QuestionCollectionEditor({ collection }: { collection: QuestionCollectionDetail }) {
  const { selectedIds, clear } = useQuestionSelection();
  const [name, setName] = useState(collection.name);
  const [questions, setQuestions] = useState<ExamQuestion[]>(collection.questions);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [adding, setAdding] = useState(false);

  const questionIds = questions.map((question) => question.id);
  const assessmentHref = `/painel/gerador?questoes=${encodeURIComponent(questionIds.join(","))}`;

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateQuestionCollection(collection.id, name, questionIds);
    setSaving(false);
    if (result.error) return toast.error(result.error);
    toast.success("Caderno atualizado.");
  }

  async function handleAddSelection() {
    const missingIds = selectedIds.filter((id) => !questionIds.includes(id));
    if (missingIds.length === 0) return toast.info("As questões selecionadas já estão neste caderno.");
    if (questions.length + missingIds.length > MAX_QUESTIONS_PER_EXAM) {
      return toast.error(`O caderno pode ter até ${MAX_QUESTIONS_PER_EXAM} questões.`);
    }
    setAdding(true);
    const result = await loadSelectedQuestions(missingIds);
    setAdding(false);
    if (result.error || !result.questions) return toast.error(result.error ?? "Não foi possível adicionar a seleção.");
    setQuestions((current) => [...current, ...result.questions!]);
    clear();
    toast.success(`${result.questions.length} questões adicionadas. Clique em “Salvar alterações”.`);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { generateExamDocx, downloadBlob } = await import("@/lib/export/exam-docx");
      const blob = await generateExamDocx(
        {
          id: collection.id,
          title: name.trim() || collection.name,
          themeId: null,
          gradeId: null,
          subjectId: null,
          schoolName: null,
          instructions: null,
          showAnswerKey: true,
          createdAt: collection.createdAt,
        },
        questions,
      );
      downloadBlob(blob, `${(name.trim() || "caderno-de-questoes").replace(/[^a-zA-Z0-9À-ÿ -]/g, "").trim()}.docx`);
      await recordQuestionSelectionDownload(questionIds);
      toast.success("Caderno baixado em Word com gabarito.");
    } catch {
      toast.error("Não foi possível gerar o Word.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="collectionTitle">Nome do caderno</Label>
            <Input id="collectionTitle" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleSave} disabled={saving || questions.length === 0 || name.trim().length < 2}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownload} disabled={downloading || questions.length === 0}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}{downloading ? "Preparando..." : "Baixar Word"}
            </Button>
            <Button nativeButton={false} variant="outline" disabled={questions.length === 0} render={<Link href={assessmentHref}><FilePlus2 />Criar avaliação</Link>} />
            <Button nativeButton={false} variant="ghost" render={<Link href="/painel/banco-de-questoes"><Plus />Buscar mais questões</Link>} />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm">Você tem {selectedIds.length} questões selecionadas no banco.</p>
              <Button type="button" size="sm" onClick={handleAddSelection} disabled={adding}>
                {adding ? <Loader2 className="animate-spin" /> : <Plus />}{adding ? "Adicionando..." : "Adicionar ao caderno"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Questões do caderno</h2>
        <Badge variant="outline">{questions.length} de {MAX_QUESTIONS_PER_EXAM}</Badge>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Adicione pelo menos uma questão antes de salvar.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="flex items-start gap-3 pt-6">
                <span className="text-sm font-semibold">{index + 1}.</span>
                <div className="min-w-0 flex-1 text-sm"><ExamQuestionBody question={question} mode="preview" /></div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <Badge variant="outline">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
                  <div className="flex gap-1">
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Mover questão ${index + 1} para cima`} disabled={index === 0} onClick={() => moveQuestion(index, -1)}><ArrowUp /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Mover questão ${index + 1} para baixo`} disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 1)}><ArrowDown /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remover questão ${index + 1}`} onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}><Trash2 /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
