"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createLearningObject, updateLearningObject } from "@/actions/admin/learning-object";
import {
  learningObjectSchema,
  type LearningObjectInput,
} from "@/lib/validations/learning-object";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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

export function LearningObjectForm({
  objectId,
  defaultValues,
}: {
  objectId?: string;
  defaultValues: LearningObjectInput;
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(learningObjectSchema),
    defaultValues,
  });

  async function onSubmit(values: LearningObjectInput) {
    const result = objectId
      ? await updateLearningObject(objectId, values)
      : await createLearningObject(values);

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
              value={form.watch("objectType")}
              onValueChange={(value) => form.setValue("objectType", value ?? "")}
            >
              <SelectTrigger className="w-full">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="externalUrl">Link externo (opcional)</Label>
            <Input id="externalUrl" placeholder="https://..." {...form.register("externalUrl")} />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se o objeto será um arquivo enviado (envie na tela de edição).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo de acesso</Label>
              <Select
                value={form.watch("accessType")}
                onValueChange={(value) => form.setValue("accessType", value ?? "teacher_only")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value ?? "draft")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : objectId ? "Salvar alterações" : "Criar objeto"}
      </Button>
    </form>
  );
}
