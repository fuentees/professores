"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createContent, updateContent } from "@/actions/admin/content";
import { contentSchema, type ContentInput } from "@/lib/validations/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MultiCheckList, type MultiCheckOption } from "@/components/admin/multi-check-list";
import { TagInput } from "@/components/admin/tag-input";
import { DIFFICULTY_LABELS, CONTENT_ACCESS_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/lib/labels";

export type ContentFormOptions = {
  grades: MultiCheckOption[];
  subjects: MultiCheckOption[];
  curriculumUnits: MultiCheckOption[];
  themes: MultiCheckOption[];
  subthemes: MultiCheckOption[];
  contentTypes: MultiCheckOption[];
};

export function ContentForm({
  contentId,
  defaultValues,
  options,
}: {
  contentId?: string;
  defaultValues: ContentInput;
  options: ContentFormOptions;
}) {
  const router = useRouter();

  const form = useForm<ContentInput>({
    resolver: zodResolver(contentSchema),
    defaultValues,
  });

  async function onSubmit(values: ContentInput) {
    const result = contentId
      ? await updateContent(contentId, values)
      : await createContent(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(contentId ? "Material atualizado." : "Material criado.");

    if (!contentId && result.id) {
      router.push(`/admin/materiais/${result.id}/editar`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basico">
        <TabsList>
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="classificacao">Classificação</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="acesso">Acesso e permissões</TabsTrigger>
          <TabsTrigger value="publicacao">Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="basico" className="pt-4">
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
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input id="subtitle" {...form.register("subtitle")} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="shortDescription">Descrição curta</Label>
                <Textarea id="shortDescription" rows={2} {...form.register("shortDescription")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input id="author" {...form.register("author")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Dificuldade</Label>
                  <Select
                    value={form.watch("difficulty") || undefined}
                    onValueChange={(value) => form.setValue("difficulty", (value ?? "") as never)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione">
                        {(value: string) => (value ? DIFFICULTY_LABELS[value] : "Selecione")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classificacao" className="pt-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <MultiCheckList
                label="Séries/anos"
                options={options.grades}
                selected={form.watch("gradeIds")}
                onChange={(ids) => form.setValue("gradeIds", ids)}
                emptyLabel="Nenhuma série cadastrada."
              />
              <MultiCheckList
                label="Disciplinas"
                options={options.subjects}
                selected={form.watch("subjectIds")}
                onChange={(ids) => form.setValue("subjectIds", ids)}
                emptyLabel="Nenhuma disciplina cadastrada."
              />
              <MultiCheckList
                label="Unidades"
                options={options.curriculumUnits}
                selected={form.watch("curriculumUnitIds")}
                onChange={(ids) => form.setValue("curriculumUnitIds", ids)}
                emptyLabel="Nenhuma unidade cadastrada ainda."
              />
              <MultiCheckList
                label="Temas"
                options={options.themes}
                selected={form.watch("themeIds")}
                onChange={(ids) => form.setValue("themeIds", ids)}
                emptyLabel="Nenhum tema cadastrado ainda."
              />
              <MultiCheckList
                label="Subtemas"
                options={options.subthemes}
                selected={form.watch("subthemeIds")}
                onChange={(ids) => form.setValue("subthemeIds", ids)}
                emptyLabel="Nenhum subtema cadastrado ainda."
              />
              <MultiCheckList
                label="Tipos de material"
                options={options.contentTypes}
                selected={form.watch("contentTypeIds")}
                onChange={(ids) => form.setValue("contentTypeIds", ids)}
                emptyLabel="Nenhum tipo cadastrado."
              />
              {form.formState.errors.contentTypeIds && (
                <p className="text-sm text-destructive sm:col-span-2">
                  {form.formState.errors.contentTypeIds.message}
                </p>
              )}
              <div className="sm:col-span-2">
                <TagInput value={form.watch("tagNames")} onChange={(tags) => form.setValue("tagNames", tags)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conteudo" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="body">Texto principal / instruções de utilização</Label>
                <Textarea id="body" rows={12} {...form.register("body")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acesso" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Tipo de acesso</Label>
                <Select
                  value={form.watch("accessType")}
                  onValueChange={(value) => form.setValue("accessType", (value ?? "teacher_only") as never)}
                >
                  <SelectTrigger className="w-full sm:w-72">
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

              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    ["allowView", "Permitir visualização"],
                    ["allowDownload", "Permitir download"],
                    ["allowPrint", "Permitir impressão"],
                    ["allowComments", "Permitir comentários"],
                    ["hasAnswerKey", "Possui gabarito"],
                    ["isFeatured", "Destacar na página inicial"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={form.watch(field)}
                      onCheckedChange={(checked) => form.setValue(field, checked)}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publicacao" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", (value ?? "draft") as never)}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue>{(value: string) => CONTENT_STATUS_LABELS[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="hidden">Oculto</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.watch("status") === "scheduled" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="publishAt">Data de publicação</Label>
                  <Input id="publishAt" type="datetime-local" {...form.register("publishAt")} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : contentId ? "Salvar alterações" : "Criar material"}
      </Button>
    </form>
  );
}
