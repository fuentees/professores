"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { createLearningObject, updateLearningObject } from "@/actions/admin/learning-object";
import {
  learningObjectSchema,
  type LearningObjectInput,
} from "@/lib/validations/learning-object";
import {
  interactiveActivitySchema,
  type LearningActivityType,
} from "@/lib/validations/interactive-activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CONTENT_ACCESS_TYPE_LABELS, CONTENT_STATUS_LABELS, LEARNING_ACTIVITY_TYPE_LABELS } from "@/lib/labels";
import { InteractiveActivityBuilder, emptyConfigFor } from "@/components/admin/interactive-activity-builder";
import { ActivityPlayer } from "@/components/interactive/activity-player";
import { InteractiveTypeBadge } from "@/components/interactive/interactive-type-badge";

const OBJECT_TYPES = [
  "Jogo",
  "Simulação",
  "Quiz",
  "Mapa interativo",
  "Atividade digital",
  "Flashcards",
  "Vídeo",
  "Infográfico",
  "Apresentação interativa",
  "Laboratório virtual",
  "Link educacional",
];

type Mode = "resource" | LearningActivityType;

const ACTIVITY_TYPES: LearningActivityType[] = [
  "quiz",
  "true_false",
  "matching",
  "memory",
  "fill_blank",
  "ordering",
  "flashcards",
  "simulation",
];

export function LearningObjectForm({
  objectId,
  defaultValues,
}: {
  objectId?: string;
  defaultValues: LearningObjectInput;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>((defaultValues.activityType as Mode) ?? "resource");
  const [config, setConfig] = useState<unknown>(
    defaultValues.config ?? (defaultValues.activityType ? emptyConfigFor(defaultValues.activityType as LearningActivityType) : null),
  );
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm({
    resolver: zodResolver(learningObjectSchema),
    defaultValues,
  });
  const objectType = useWatch({ control: form.control, name: "objectType" });
  const accessType = useWatch({ control: form.control, name: "accessType" });
  const status = useWatch({ control: form.control, name: "status" });
  const title = useWatch({ control: form.control, name: "title" });

  function handleModeChange(next: Mode) {
    setMode(next);
    setShowPreview(false);
    if (next !== "resource") {
      setConfig(emptyConfigFor(next));
    } else {
      setConfig(null);
    }
  }

  async function onSubmit(values: LearningObjectInput) {
    const payload: LearningObjectInput = {
      ...values,
      activityType: mode === "resource" ? null : mode,
      config: mode === "resource" ? null : config,
    };

    if (mode !== "resource") {
      const parsed = interactiveActivitySchema.safeParse({ activityType: mode, config });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos da atividade.");
        return;
      }
    }

    const result = objectId
      ? await updateLearningObject(objectId, payload)
      : await createLearningObject(payload);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(objectId ? "Objeto atualizado." : "Objeto criado.");

    if (!objectId && result.id) {
      router.push(`/admin/objetos/${result.id}/editar`);
    } else {
      router.refresh();
    }
  }

  const activityPreviewParsed =
    mode !== "resource" ? interactiveActivitySchema.safeParse({ activityType: mode, config }) : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição / instrução de uso</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de objeto</Label>
            <Select
              value={objectType}
              onValueChange={(value) => form.setValue("objectType", value ?? "")}
            >
              <SelectTrigger className="w-full" aria-label="Tipo de objeto">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {OBJECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo de acesso</Label>
              <Select
                value={accessType}
                onValueChange={(value) => form.setValue("accessType", value ?? "teacher_only")}
              >
                <SelectTrigger className="w-full" aria-label="Tipo de acesso">
                  <SelectValue>{(value: string) => CONTENT_ACCESS_TYPE_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="free_signup">Gratuito com cadastro</SelectItem>
                  <SelectItem value="teacher_only">Exclusivo para professores</SelectItem>
                  <SelectItem value="subscriber_only">Exclusivo para assinantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => form.setValue("status", value ?? "draft")}
              >
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue>{(value: string) => CONTENT_STATUS_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>Conteúdo do objeto</Label>
            <Select value={mode} onValueChange={(v) => handleModeChange((v as Mode) ?? "resource")}>
              <SelectTrigger className="w-full sm:w-96" aria-label="Conteúdo do objeto">
                <SelectValue>
                  {(v: string) => (v === "resource" ? "Arquivo enviado ou link externo" : LEARNING_ACTIVITY_TYPE_LABELS[v])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resource">Arquivo enviado ou link externo</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LEARNING_ACTIVITY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode !== "resource" && (
              <p className="text-xs text-muted-foreground">
                Categoria exibida pro professor: <InteractiveTypeBadge activityType={mode} className="ml-1 align-middle" />
              </p>
            )}
          </div>

          {mode === "resource" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="externalUrl">Link externo (opcional)</Label>
              <Input id="externalUrl" placeholder="https://..." {...form.register("externalUrl")} />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se o objeto será um arquivo enviado (envie na tela de edição).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <InteractiveActivityBuilder activityType={mode} config={config} onChange={setConfig} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Ocultar pré-visualização" : "Pré-visualizar"}
              </Button>

              {showPreview &&
                (activityPreviewParsed?.success ? (
                  <ActivityPlayer
                    activityType={mode}
                    config={activityPreviewParsed.data.config}
                    title={title || "Pré-visualização"}
                  />
                ) : (
                  <p className="text-sm text-destructive">
                    {activityPreviewParsed?.error.issues[0]?.message ?? "Preencha a atividade para pré-visualizar."}
                  </p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : objectId ? "Salvar alterações" : "Criar objeto"}
      </Button>
    </form>
  );
}
