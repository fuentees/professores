"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  Library,
  ListChecks,
  LoaderCircle,
  Minus,
  Plus,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExamWorkspace } from "@/components/painel/exam-workspace";
import {
  EMPTY_TAXONOMY_SELECTION,
  type TaxonomyOptions,
  type TaxonomySelection,
} from "@/components/admin/cascading-taxonomy-select";
import { generateExamPreview, type ExamQuestion } from "@/actions/exam-generator";
import { MAX_QUESTIONS_PER_EXAM } from "@/lib/validations/exam-generator";
import { cn } from "@/lib/utils";
import type { QuestionType } from "@/types/supabase";

type Requested = { easy: number; medium: number; hard: number };
type DifficultyKey = keyof Requested;

const DEFAULT_QUESTION_TYPES: QuestionType[] = ["multiple_choice", "essay", "discursive"];

const QUESTION_TYPE_GROUPS: { label: string; types: QuestionType[] }[] = [
  { label: "Múltipla escolha", types: ["multiple_choice"] },
  { label: "Resposta aberta", types: ["essay", "discursive"] },
  { label: "Verdadeiro ou falso", types: ["true_false"] },
  { label: "Associação", types: ["matching"] },
  { label: "Completar lacunas", types: ["fill_blank"] },
  { label: "Ordenação", types: ["ordering"] },
  { label: "Argumentativa", types: ["argumentative"] },
  { label: "Baseada em imagem", types: ["image_based"] },
  { label: "Mista", types: ["mixed"] },
];

const DIFFICULTY_PRESETS: { label: string; hint: string; counts: Requested }[] = [
  { label: "Equilibrada", hint: "2 fáceis · 5 médias · 3 difíceis", counts: { easy: 2, medium: 5, hard: 3 } },
  { label: "Revisão", hint: "5 fáceis · 4 médias · 1 difícil", counts: { easy: 5, medium: 4, hard: 1 } },
  { label: "Desafiadora", hint: "1 fácil · 4 médias · 5 difíceis", counts: { easy: 1, medium: 4, hard: 5 } },
];

const DIFFICULTY_META: Record<DifficultyKey, { label: string; hint: string; color: string }> = {
  easy: { label: "Fáceis", hint: "Retomada e compreensão", color: "bg-emerald-500" },
  medium: { label: "Médias", hint: "Aplicação do conteúdo", color: "bg-amber-500" },
  hard: { label: "Difíceis", hint: "Análise e desafio", color: "bg-rose-500" },
};

function SectionTitle({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        {number}
      </span>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DifficultyCounter({
  difficulty,
  value,
  onChange,
}: {
  difficulty: DifficultyKey;
  value: number;
  onChange: (value: number) => void;
}) {
  const meta = DIFFICULTY_META[difficulty];

  return (
    <div className="rounded-xl border bg-background p-3.5 shadow-xs">
      <div className="mb-3 flex items-start gap-2.5">
        <span className={cn("mt-1 size-2.5 rounded-full", meta.color)} aria-hidden />
        <div>
          <Label htmlFor={`${difficulty}Count`} className="font-semibold">{meta.label}</Label>
          <p className="text-xs text-muted-foreground">{meta.hint}</p>
        </div>
      </div>
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem] overflow-hidden rounded-lg border">
        <button
          type="button"
          className="flex items-center justify-center border-r bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
          aria-label={`Diminuir questões ${meta.label.toLowerCase()}`}
          disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus className="size-4" />
        </button>
        <Input
          id={`${difficulty}Count`}
          type="number"
          min={0}
          max={MAX_QUESTIONS_PER_EXAM}
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="h-10 rounded-none border-0 text-center text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          className="flex items-center justify-center border-l bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={`Aumentar questões ${meta.label.toLowerCase()}`}
          onClick={() => onChange(Math.min(MAX_QUESTIONS_PER_EXAM, value + 1))}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function ExamGeneratorForm({
  taxonomyOptions,
  defaultSchoolName = "",
}: {
  taxonomyOptions: TaxonomyOptions;
  defaultSchoolName?: string;
}) {
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>(EMPTY_TAXONOMY_SELECTION);
  const [counts, setCounts] = useState<Requested>({ easy: 2, medium: 5, hard: 3 });
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(DEFAULT_QUESTION_TYPES);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{
    questions: ExamQuestion[];
    requested: Requested;
    fulfilled: Requested;
  } | null>(null);

  const total = counts.easy + counts.medium + counts.hard;
  const selectedSubject = taxonomyOptions.subjects.find((item) => item.id === taxonomy.subjectId);
  const selectedGrade = taxonomyOptions.grades.find((item) => item.id === taxonomy.gradeId);
  const availableSubjectIds = useMemo(
    () => new Set(taxonomyOptions.gradeSubjects.map((item) => item.subjectId)),
    [taxonomyOptions.gradeSubjects],
  );
  const availableSubjects = taxonomyOptions.subjects.filter((subject) => availableSubjectIds.has(subject.id));

  const eligibleGradeIds = useMemo(
    () => new Set(
      taxonomyOptions.gradeSubjects
        .filter((item) => item.subjectId === taxonomy.subjectId)
        .map((item) => item.gradeId),
    ),
    [taxonomy.subjectId, taxonomyOptions.gradeSubjects],
  );
  const availableLevels = taxonomyOptions.educationLevels.filter((level) =>
    taxonomyOptions.grades.some(
      (grade) => grade.educationLevelId === level.id && eligibleGradeIds.has(grade.id),
    ),
  );
  const availableGrades = taxonomyOptions.grades.filter(
    (grade) => grade.educationLevelId === taxonomy.educationLevelId && eligibleGradeIds.has(grade.id),
  );
  const availableUnits = taxonomyOptions.curriculumUnits.filter(
    (unit) => unit.gradeId === taxonomy.gradeId && unit.subjectId === taxonomy.subjectId,
  );
  const availableThemes = taxonomyOptions.themes.filter(
    (theme) => theme.curriculumUnitId === taxonomy.curriculumUnitId,
  );
  const availableSubthemes = taxonomyOptions.subthemes.filter(
    (subtheme) => subtheme.themeId === taxonomy.themeId,
  );

  const filters = {
    gradeId: taxonomy.gradeId,
    subjectId: taxonomy.subjectId,
    themeId: taxonomy.themeId,
    subthemeId: taxonomy.subthemeId,
    questionTypes,
  };
  const canGenerate = Boolean(
    taxonomy.gradeId &&
    taxonomy.subjectId &&
    total > 0 &&
    total <= MAX_QUESTIONS_PER_EXAM &&
    questionTypes.length > 0,
  );

  function selectSubject(subjectId: string) {
    const gradeIds = new Set(
      taxonomyOptions.gradeSubjects
        .filter((item) => item.subjectId === subjectId)
        .map((item) => item.gradeId),
    );
    const levels = taxonomyOptions.educationLevels.filter((level) =>
      taxonomyOptions.grades.some(
        (grade) => grade.educationLevelId === level.id && gradeIds.has(grade.id),
      ),
    );
    setTaxonomy({
      ...EMPTY_TAXONOMY_SELECTION,
      subjectId,
      educationLevelId: levels.length === 1 ? levels[0].id : "",
    });
  }

  function selectLevel(educationLevelId: string) {
    setTaxonomy((current) => ({
      ...current,
      educationLevelId,
      gradeId: "",
      curriculumUnitId: "",
      themeId: "",
      subthemeId: "",
    }));
  }

  function selectGrade(gradeId: string) {
    setTaxonomy((current) => ({
      ...current,
      gradeId,
      curriculumUnitId: "",
      themeId: "",
      subthemeId: "",
    }));
  }

  function toggleTypeGroup(types: QuestionType[]) {
    setQuestionTypes((previous) => {
      const allSelected = types.every((type) => previous.includes(type));
      const next = new Set(previous);
      for (const type of types) {
        if (allSelected) next.delete(type);
        else next.add(type);
      }
      return [...next];
    });
  }

  async function handleGenerate() {
    if (!taxonomy.gradeId || !taxonomy.subjectId) {
      toast.error("Selecione a disciplina e o ano/série.");
      return;
    }
    if (total < 1 || total > MAX_QUESTIONS_PER_EXAM) {
      toast.error(`Escolha entre 1 e ${MAX_QUESTIONS_PER_EXAM} questões.`);
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
      easyCount: counts.easy,
      mediumCount: counts.medium,
      hardCount: counts.hard,
      questionTypes,
    });
    setGenerating(false);

    if (result.error || !result.questions || !result.requested || !result.fulfilled) {
      toast.error(result.error ?? "Não foi possível gerar a prévia.");
      return;
    }
    if (result.questions.length === 0) {
      toast.error("Nenhuma questão encontrada. Tente outro conteúdo, tipo ou nível de dificuldade.");
      return;
    }
    setPreview({ questions: result.questions, requested: result.requested, fulfilled: result.fulfilled });
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
          ← Ajustar seleção
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
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-amber-300" aria-hidden />

      <div className="space-y-8 p-5 sm:p-7 lg:p-8">
        <section className="space-y-5">
          <SectionTitle
            number={1}
            title="Escolha o conteúdo"
            description="Comece pela disciplina e pelo ano da turma. O conteúdo específico é opcional."
          />

          <div className="space-y-5 rounded-2xl border bg-muted/20 p-4 sm:p-5">
            <div className="space-y-2">
              <Label htmlFor="exam-subject">Disciplina</Label>
              <Select value={taxonomy.subjectId} onValueChange={(value) => selectSubject(value as string)}>
                <SelectTrigger id="exam-subject" className="h-11 w-full bg-background" aria-label="Disciplina">
                  <SelectValue>{(value: string) => taxonomyOptions.subjects.find((item) => item.id === value)?.name ?? "Selecione a disciplina"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">A lista mostra somente disciplinas com conteúdo disponível no acervo.</p>
            </div>

            {taxonomy.subjectId && (
              <div className="space-y-2">
                <Label>Nível de ensino</Label>
                {availableLevels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableLevels.map((level) => {
                      const selected = taxonomy.educationLevelId === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => selectLevel(level.id)}
                          className={cn(
                            "rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "bg-background hover:border-primary/40 hover:bg-primary/5",
                          )}
                          aria-pressed={selected}
                        >
                          {level.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    Ainda não há anos vinculados a esta disciplina no acervo.
                  </p>
                )}
              </div>
            )}

            {taxonomy.educationLevelId && availableGrades.length > 0 && (
              <div className="space-y-2">
                <Label>Ano/série</Label>
                <div className="flex flex-wrap gap-2">
                  {availableGrades.map((grade) => {
                    const selected = taxonomy.gradeId === grade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => selectGrade(grade.id)}
                        className={cn(
                          "min-w-20 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "bg-background hover:border-primary/40 hover:text-primary",
                        )}
                        aria-pressed={selected}
                      >
                        {grade.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {taxonomy.gradeId && (
              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exam-unit">Unidade temática <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Select
                    value={taxonomy.curriculumUnitId || "all"}
                    onValueChange={(value) => setTaxonomy((current) => ({
                      ...current,
                      curriculumUnitId: value === "all" ? "" : value as string,
                      themeId: "",
                      subthemeId: "",
                    }))}
                    disabled={availableUnits.length === 0}
                  >
                    <SelectTrigger id="exam-unit" className="w-full bg-background">
                      <SelectValue>{(value: string) => value === "all" ? "Todas as unidades" : availableUnits.find((item) => item.id === value)?.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as unidades</SelectItem>
                      {availableUnits.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam-theme">Tema <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Select
                    value={taxonomy.themeId || "all"}
                    onValueChange={(value) => setTaxonomy((current) => ({
                      ...current,
                      themeId: value === "all" ? "" : value as string,
                      subthemeId: "",
                    }))}
                    disabled={!taxonomy.curriculumUnitId || availableThemes.length === 0}
                  >
                    <SelectTrigger id="exam-theme" className="w-full bg-background">
                      <SelectValue>{(value: string) => value === "all" ? "Todos os temas" : availableThemes.find((item) => item.id === value)?.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os temas</SelectItem>
                      {availableThemes.map((theme) => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {taxonomy.themeId && availableSubthemes.length > 0 && (
                  <div className="space-y-2 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                    <Label htmlFor="exam-subtheme">Subtema <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                    <Select
                      value={taxonomy.subthemeId || "all"}
                      onValueChange={(value) => setTaxonomy((current) => ({
                        ...current,
                        subthemeId: value === "all" ? "" : value as string,
                      }))}
                    >
                      <SelectTrigger id="exam-subtheme" className="w-full bg-background">
                        <SelectValue>{(value: string) => value === "all" ? "Todos os subtemas" : availableSubthemes.find((item) => item.id === value)?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os subtemas</SelectItem>
                        {availableSubthemes.map((subtheme) => <SelectItem key={subtheme.id} value={subtheme.id}>{subtheme.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableUnits.length === 0 && (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Sem unidade temática cadastrada: o gerador usará todo o acervo de {selectedSubject?.name} do {selectedGrade?.name}.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className={cn("space-y-5", !taxonomy.gradeId && "pointer-events-none opacity-45")}>
          <SectionTitle
            number={2}
            title="Defina o nível da avaliação"
            description="Escolha uma distribuição pronta ou ajuste cada quantidade."
          />

          <div className="grid gap-2 sm:grid-cols-3">
            {DIFFICULTY_PRESETS.map((preset) => {
              const selected = Object.entries(preset.counts).every(
                ([key, value]) => counts[key as DifficultyKey] === value,
              );
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setCounts(preset.counts)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary bg-primary/8 ring-1 ring-primary/20" : "hover:border-primary/35 hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {selected && <Check className="size-4 text-primary" />}
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{preset.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(DIFFICULTY_META) as DifficultyKey[]).map((difficulty) => (
              <DifficultyCounter
                key={difficulty}
                difficulty={difficulty}
                value={counts[difficulty]}
                onChange={(value) => setCounts((current) => ({ ...current, [difficulty]: value }))}
              />
            ))}
          </div>

          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3",
            total > MAX_QUESTIONS_PER_EXAM ? "border-destructive/40 bg-destructive/5" : "bg-muted/25",
          )}>
            <span className="text-sm text-muted-foreground">Total da avaliação</span>
            <span className={cn("text-lg font-bold", total > MAX_QUESTIONS_PER_EXAM && "text-destructive")}>
              {total} <span className="text-sm font-normal">de {MAX_QUESTIONS_PER_EXAM} questões</span>
            </span>
          </div>
        </section>

        <section className={cn("space-y-5", !taxonomy.gradeId && "pointer-events-none opacity-45")}>
          <SectionTitle
            number={3}
            title="Escolha os tipos de questão"
            description="Você pode combinar formatos objetivos e discursivos."
          />

          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPE_GROUPS.map((group) => {
              const selected = group.types.every((type) => questionTypes.includes(type));
              return (
                <button
                  key={group.label}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleTypeGroup(group.types)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <span className={cn(
                    "flex size-4 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35",
                  )}>
                    {selected && <Check className="size-3" />}
                  </span>
                  {group.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className={cn("space-y-5", !taxonomy.gradeId && "pointer-events-none opacity-45")}>
          <SectionTitle
            number={4}
            title="Confirme como deseja montar"
            description="O sistema sorteia do acervo aprovado e deixa você revisar tudo antes de salvar."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-4">
              <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" />
              </span>
              <Library className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Usar o acervo revisado</p>
              <p className="mt-1 pr-6 text-xs leading-relaxed text-muted-foreground">
                O gerador encontra a melhor combinação com os filtros acima.
              </p>
            </div>
            <Link
              href="/painel/banco-de-questoes"
              className="group rounded-xl border p-4 transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ListChecks className="size-5 text-muted-foreground transition group-hover:text-primary" />
              <p className="mt-3 flex items-center gap-1 text-sm font-semibold">
                Escolher questões manualmente <ArrowRight className="size-3.5" />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Abra o banco, marque exatamente as questões e monte sua avaliação.
              </p>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-muted/35 px-4 py-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Settings2 className="size-3.5 text-primary" /> Troque e reorganize questões</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5 text-primary" /> Word editável e PDF para imprimir</span>
          </div>
        </section>
      </div>

      <div className="border-t bg-muted/25 p-4 sm:px-7 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {selectedSubject && selectedGrade ? (
              <>
                <p className="truncate text-sm font-semibold">{selectedSubject.name} · {selectedGrade.name}</p>
                <p className="text-xs text-muted-foreground">{total} questões · prévia totalmente editável</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione disciplina e ano para continuar.</p>
            )}
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            className="min-w-56 shadow-md shadow-primary/15"
          >
            {generating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? "Montando avaliação..." : `Gerar prévia com ${total} questões`}
          </Button>
        </div>
        {total > MAX_QUESTIONS_PER_EXAM && (
          <p className="mt-2 text-right text-xs font-medium text-destructive">
            Reduza a quantidade para no máximo {MAX_QUESTIONS_PER_EXAM} questões.
          </p>
        )}
        {questionTypes.length === 0 && taxonomy.gradeId && (
          <p className="mt-2 text-right text-xs font-medium text-destructive">
            Selecione pelo menos um tipo de questão.
          </p>
        )}
      </div>
    </div>
  );
}
