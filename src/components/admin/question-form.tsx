"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createQuestion, updateQuestion } from "@/actions/admin/questions";
import { questionSchema, type QuestionInput } from "@/lib/validations/question";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { QUESTION_TYPE_LABELS } from "@/lib/labels";
import {
  CascadingTaxonomySelect,
  type TaxonomyOptions,
  type TaxonomySelection,
} from "@/components/admin/cascading-taxonomy-select";

const DIFFICULTY_LABELS: Record<QuestionInput["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

const STATUS_LABELS: Record<QuestionInput["status"], string> = {
  active: "Ativa",
  inactive: "Inativa",
};

export function QuestionForm({
  questionId,
  defaultValues,
  initialTaxonomy,
  taxonomyOptions,
}: {
  questionId?: string;
  defaultValues: QuestionInput;
  initialTaxonomy: TaxonomySelection;
  taxonomyOptions: TaxonomyOptions;
}) {
  const router = useRouter();
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>(initialTaxonomy);

  const form = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "alternatives" });
  const questionType = form.watch("questionType");

  function handleTaxonomyChange(next: TaxonomySelection) {
    setTaxonomy(next);
    form.setValue("themeId", next.themeId, { shouldValidate: true });
    form.setValue("subthemeId", next.subthemeId);
  }

  async function onSubmit(values: QuestionInput) {
    const result = questionId ? await updateQuestion(questionId, values) : await createQuestion(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(questionId ? "Questão atualizada." : "Questão criada.");

    if (!questionId && result.id) {
      router.push(`/admin/questoes/${result.id}/editar`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="statement">Enunciado</Label>
            <Textarea id="statement" rows={4} {...form.register("statement")} />
            {form.formState.errors.statement && (
              <p className="text-sm text-destructive">{form.formState.errors.statement.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo de questão</Label>
              <Select
                value={form.watch("questionType")}
                onValueChange={(value) =>
                  form.setValue("questionType", (value as QuestionInput["questionType"]) ?? "multiple_choice")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: QuestionInput["questionType"]) => QUESTION_TYPE_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                  <SelectItem value="essay">Dissertativa</SelectItem>
                  <SelectItem value="discursive">Discursiva</SelectItem>
                  <SelectItem value="true_false">Verdadeiro ou falso</SelectItem>
                  <SelectItem value="matching">Associação</SelectItem>
                  <SelectItem value="fill_blank">Completar lacunas</SelectItem>
                  <SelectItem value="ordering">Ordenação</SelectItem>
                  <SelectItem value="argumentative">Argumentativa</SelectItem>
                  <SelectItem value="image_based">Baseada em imagem</SelectItem>
                  <SelectItem value="mixed">Mista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Dificuldade</Label>
              <Select
                value={form.watch("difficulty")}
                onValueChange={(value) =>
                  form.setValue("difficulty", (value as QuestionInput["difficulty"]) ?? "medium")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: QuestionInput["difficulty"]) => DIFFICULTY_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <CascadingTaxonomySelect options={taxonomyOptions} value={taxonomy} onChange={handleTaxonomyChange} />
          {form.formState.errors.themeId && (
            <p className="mt-2 text-sm text-destructive">{form.formState.errors.themeId.message}</p>
          )}
        </CardContent>
      </Card>

      {questionType === "multiple_choice" && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Label>Alternativas</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input className="w-16" placeholder="A" {...form.register(`alternatives.${index}.label`)} />
                <Input
                  className="flex-1"
                  placeholder="Texto da alternativa"
                  {...form.register(`alternatives.${index}.body`)}
                />
                <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctAlternative"
                    checked={form.watch(`alternatives.${index}.isCorrect`)}
                    onChange={() => {
                      fields.forEach((_, i) => form.setValue(`alternatives.${i}.isCorrect`, i === index));
                    }}
                  />
                  Correta
                </label>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                append({
                  label: String.fromCharCode(65 + fields.length),
                  body: "",
                  isCorrect: fields.length === 0,
                })
              }
            >
              Adicionar alternativa
            </Button>
            {form.formState.errors.alternatives?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.alternatives.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="answerKey">
              {questionType === "essay" ? "Resposta esperada" : "Explicação / gabarito (opcional)"}
            </Label>
            <Textarea id="answerKey" rows={4} {...form.register("answerKey")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", (value as QuestionInput["status"]) ?? "active")}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue>{(value: QuestionInput["status"]) => STATUS_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : questionId ? "Salvar alterações" : "Criar questão"}
      </Button>
    </form>
  );
}
