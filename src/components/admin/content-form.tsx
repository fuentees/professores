"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addContentFile, createContent, updateContent } from "@/actions/admin/content";
import { linkContentBnccSkills } from "@/actions/admin/bncc";
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
import { parseMaterialDocx } from "@/lib/parsing/docx/material";
import { validateDocxFile } from "@/lib/storage/file-validation";

export type ContentFormOptions = {
  grades: MultiCheckOption[];
  subjects: MultiCheckOption[];
  curriculumUnits: MultiCheckOption[];
  themes: MultiCheckOption[];
  subthemes: MultiCheckOption[];
  contentTypes: MultiCheckOption[];
  bnccSkills: MultiCheckOption[];
};

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsLabel(searchable: string, label: string): boolean {
  const normalizedLabel = normalizeForMatch(label);
  return ` ${searchable} `.includes(` ${normalizedLabel} `);
}

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
  const [activeTab, setActiveTab] = useState("basico");
  const [readingWord, setReadingWord] = useState(false);
  const [sourceWord, setSourceWord] = useState<File | null>(null);
  const [detectedBnccCodes, setDetectedBnccCodes] = useState<string[]>([]);
  const [matchedBnccSkillIds, setMatchedBnccSkillIds] = useState<string[]>([]);
  const [looksLikeQuestions, setLooksLikeQuestions] = useState(false);

  const form = useForm<ContentInput>({
    resolver: zodResolver(contentSchema),
    defaultValues,
  });
  const values = useWatch({ control: form.control });

  async function handleWordImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setReadingWord(true);
    const validationError = await validateDocxFile(file);
    if (validationError) {
      setReadingWord(false);
      event.target.value = "";
      toast.error(validationError);
      return;
    }

    try {
      const parsed = await parseMaterialDocx(await file.arrayBuffer(), file.name);
      const searchable = normalizeForMatch(`${file.name} ${parsed.title} ${parsed.shortDescription}`);
      const gradeIds = options.grades
        .filter((option) => parsed.gradeNames.some((grade) => normalizeForMatch(grade) === normalizeForMatch(option.label)))
        .map((option) => option.id);
      const subjectIds = options.subjects
        .filter((option) =>
          parsed.subjectNames.length > 0
            ? parsed.subjectNames.some((subject) => normalizeForMatch(subject) === normalizeForMatch(option.label))
            : containsLabel(searchable, option.label),
        )
        .map((option) => option.id);
      const purposeTerms = {
        activity: ["atividade"],
        assessment: ["avaliacao"],
        planning: ["planejamento"],
        support: ["material de apoio", "apoio"],
      }[parsed.purpose];
      const contentType =
        options.contentTypes.find((option) =>
          purposeTerms.some((term) => normalizeForMatch(option.label).includes(term)),
        ) ?? options.contentTypes[0];
      const matchedSkills = options.bnccSkills.filter((skill) =>
        parsed.bnccCodes.some((code) => normalizeForMatch(skill.label).startsWith(normalizeForMatch(code))),
      );

      form.setValue("title", parsed.title, { shouldValidate: true });
      form.setValue("shortDescription", parsed.shortDescription);
      form.setValue("body", parsed.body);
      form.setValue("gradeIds", gradeIds);
      form.setValue("subjectIds", subjectIds);
      form.setValue("difficulty", parsed.difficulty ?? "");
      form.setValue("contentTypeIds", contentType ? [contentType.id] : [], { shouldValidate: true });
      form.setValue("hasAnswerKey", parsed.hasAnswerKey);
      setSourceWord(file);
      setDetectedBnccCodes(parsed.bnccCodes);
      setMatchedBnccSkillIds(matchedSkills.map((skill) => skill.id));
      setLooksLikeQuestions(parsed.looksLikeQuestionDocument);
      setActiveTab("basico");
      toast.success("Word lido. Confira os dados reconhecidos e crie o rascunho.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler este Word.");
      event.target.value = "";
    } finally {
      setReadingWord(false);
    }
  }

  async function onSubmit(values: ContentInput) {
    const submission: ContentInput = contentId
      ? values
      : { ...values, status: "draft", publishAt: "" };
    const result = contentId
      ? await updateContent(contentId, submission)
      : await createContent(submission);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (!contentId && result.id) {
      const [fileResult, bnccResult] = await Promise.all([
        sourceWord ? addContentFile(result.id, sourceWord) : Promise.resolve({ error: null }),
        matchedBnccSkillIds.length > 0
          ? linkContentBnccSkills(result.id, matchedBnccSkillIds)
          : Promise.resolve({ error: null }),
      ]);
      if (fileResult.error || bnccResult.error) {
        toast.warning("Rascunho criado, mas um complemento não pôde ser associado. Revise a próxima tela.");
      } else {
        toast.success("Rascunho criado com o Word original e a BNCC reconhecida.");
      }
      router.push(`/admin/materiais/${result.id}/editar`);
    } else {
      toast.success("Material atualizado.");
      router.refresh();
    }
  }

  function onInvalid(errors: FieldErrors<ContentInput>) {
    if (errors.title) setActiveTab("basico");
    else if (errors.contentTypeIds) setActiveTab("classificacao");
    toast.error("Revise os campos obrigatórios destacados.");
  }

  function submitLabel() {
    if (form.formState.isSubmitting) return "Salvando...";
    if (!contentId) return "Criar rascunho e continuar";
    if (values.status === "published") return "Salvar e publicar";
    if (values.status === "scheduled") return "Salvar agendamento";
    return "Salvar alterações";
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {!contentId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h2 className="font-semibold">Comece anexando o Word</h2>
              <p className="text-sm text-muted-foreground">
                O sistema preenche o formulário e guarda o `.docx` original. Depois, basta conferir e criar o rascunho.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="materialWord">Arquivo Word (.docx)</Label>
              <Input
                id="materialWord"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={readingWord}
                onChange={handleWordImport}
              />
              <p className="text-xs text-muted-foreground">
                Arquivos antigos `.doc` precisam ser salvos como `.docx` no Word antes do envio.
              </p>
            </div>
            {sourceWord && (
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="font-medium">{sourceWord.name}</p>
                <p className="mt-1 text-muted-foreground">
                  Título, texto, finalidade, disciplina, ano e gabarito foram analisados automaticamente.
                </p>
                {detectedBnccCodes.length > 0 && (
                  <p className="mt-1">
                    BNCC encontrada: {detectedBnccCodes.join(", ")} · {matchedBnccSkillIds.length} vinculada
                    {matchedBnccSkillIds.length === 1 ? "" : "s"} ao catálogo atual.
                  </p>
                )}
              </div>
            )}
            {looksLikeQuestions && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                Este arquivo parece conter uma questão individual. Para alimentar o banco de questões com gabarito e alternativas separados, use{" "}
                <Link href="/admin/questoes/importar" className="font-semibold underline underline-offset-2">
                  Importar questões Word
                </Link>.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="basico">Informações</TabsTrigger>
          <TabsTrigger value="classificacao">Classificação</TabsTrigger>
          <TabsTrigger value="conteudo">Texto e instruções</TabsTrigger>
          <TabsTrigger value="acesso">Acesso</TabsTrigger>
          <TabsTrigger value="publicacao">Publicar</TabsTrigger>
        </TabsList>

        <TabsContent value="basico" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" aria-required="true" {...form.register("title")} />
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
                  <Label htmlFor="contentDifficulty">Dificuldade</Label>
                  <Select
                    value={values.difficulty || null}
                    onValueChange={(value) => form.setValue("difficulty", (value ?? "") as never)}
                  >
                    <SelectTrigger id="contentDifficulty" aria-label="Dificuldade" className="w-full">
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
                selected={values.gradeIds ?? []}
                onChange={(ids) => form.setValue("gradeIds", ids)}
                emptyLabel="Nenhuma série cadastrada."
              />
              <MultiCheckList
                label="Disciplinas"
                options={options.subjects}
                selected={values.subjectIds ?? []}
                onChange={(ids) => form.setValue("subjectIds", ids)}
                emptyLabel="Nenhuma disciplina cadastrada."
              />
              <MultiCheckList
                label="Unidades"
                options={options.curriculumUnits}
                selected={values.curriculumUnitIds ?? []}
                onChange={(ids) => form.setValue("curriculumUnitIds", ids)}
                emptyLabel="Nenhuma unidade cadastrada ainda."
              />
              <MultiCheckList
                label="Temas"
                options={options.themes}
                selected={values.themeIds ?? []}
                onChange={(ids) => form.setValue("themeIds", ids)}
                emptyLabel="Nenhum tema cadastrado ainda."
              />
              <MultiCheckList
                label="Subtemas"
                options={options.subthemes}
                selected={values.subthemeIds ?? []}
                onChange={(ids) => form.setValue("subthemeIds", ids)}
                emptyLabel="Nenhum subtema cadastrado ainda."
              />
              <div className="flex flex-col gap-2">
                <Label>Finalidade principal *</Label>
                <Select
                  value={values.contentTypeIds?.[0] ?? null}
                  onValueChange={(value) =>
                    form.setValue("contentTypeIds", value ? [value] : [], { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full" aria-label="Finalidade principal do material">
                    <SelectValue placeholder="Selecione uma finalidade">
                      {(value: string) =>
                        options.contentTypes.find((option) => option.id === value)?.label ??
                        "Selecione uma finalidade"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {options.contentTypes.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Escolha uma só: Atividade, Avaliação, Planejamento ou Material de apoio.
                </p>
              </div>
              {form.formState.errors.contentTypeIds && (
                <p className="text-sm text-destructive sm:col-span-2">
                  {form.formState.errors.contentTypeIds.message}
                </p>
              )}
              <div className="sm:col-span-2">
                <TagInput
                  value={values.tagNames ?? []}
                  onChange={(tags) => form.setValue("tagNames", tags)}
                  label="Subtipo, características e finalidade específica"
                  description="Use marcadores como Lista de exercícios, Simulado, BNCC, SAEB ou Recuperação. O formato é identificado pelos arquivos enviados."
                  placeholder="Ex.: Simulado"
                />
              </div>
              <label className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                <span>
                  <span className="block text-sm font-medium">Possui gabarito</span>
                  <span className="block text-xs text-muted-foreground">
                    Gabarito é uma característica do material, não uma categoria.
                  </span>
                </span>
                <Switch
                  checked={values.hasAnswerKey ?? false}
                  onCheckedChange={(checked) => form.setValue("hasAnswerKey", checked)}
                />
              </label>
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
                  value={values.accessType}
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
                    ["isFeatured", "Destacar na página inicial"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={values[field] ?? false}
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
              {!contentId ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-medium">O material será criado como rascunho.</p>
                  <p className="mt-1 text-muted-foreground">
                    Na próxima tela, envie a capa e os arquivos. Depois volte a esta aba para publicar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Status de publicação</Label>
                    <Select
                      value={values.status}
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

                  {values.status === "scheduled" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="publishAt">Data de publicação</Label>
                      <Input id="publishAt" type="datetime-local" {...form.register("publishAt")} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {submitLabel()}
      </Button>
    </form>
  );
}
