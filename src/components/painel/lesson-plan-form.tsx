"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Clock3, History, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateLessonPlan } from "@/actions/lesson-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name: string };

const INCLUSION_OPTIONS = ["TDAH", "TEA", "DI", "Dislexia", "TOD", "Baixa visão"] as const;

export function LessonPlanForm({
  grades,
  subjects,
  gradeSubjects,
  aiConfigured,
}: {
  grades: Option[];
  subjects: Option[];
  gradeSubjects: { gradeId: string; subjectId: string }[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [inclusionProfiles, setInclusionProfiles] = useState<string[]>([]);

  const availableSubjects = useMemo(() => {
    if (!gradeId) return subjects;
    const ids = new Set(gradeSubjects.filter((item) => item.gradeId === gradeId).map((item) => item.subjectId));
    return ids.size ? subjects.filter((subject) => ids.has(subject.id)) : subjects;
  }, [gradeId, gradeSubjects, subjects]);

  function toggleInclusion(value: string) {
    setInclusionProfiles((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }

  function handleSubmit(formData: FormData) {
    if (!aiConfigured) {
      toast.error("A IA ainda precisa ser configurada pelo responsável do portal.");
      return;
    }
    startTransition(async () => {
      const result = await generateLessonPlan({
        gradeId,
        subjectId,
        theme: formData.get("theme"),
        durationMinutes: formData.get("durationMinutes"),
        classCount: formData.get("classCount"),
        teacherObjectives: formData.get("teacherObjectives"),
        inclusionProfiles,
        classContext: formData.get("classContext"),
        resources: formData.get("resources"),
      });
      if (result.error || !result.id) {
        toast.error(result.error ?? "Não foi possível criar o planejamento.");
        return;
      }
      toast.success("Planejamento criado. Revise antes de usar com a turma.");
      router.push(`/painel/planejamentos/${result.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-bncc-soft px-3 py-1 text-xs font-semibold text-bncc">
            <BookOpenCheck className="size-3.5" /> Planejamento pedagógico
          </div>
          <h1 className="text-2xl font-semibold">Planeje uma aula completa</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Informe o essencial. A IA organiza objetivos, metodologia, tempo, avaliação, inclusão e BNCC para você revisar.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/painel/planejamentos" />}>
          <History /> Meus planejamentos
        </Button>
      </div>

      {!aiConfigured && (
        <div className="rounded-xl border border-assessment/30 bg-assessment-soft p-4 text-sm">
          <strong>Falta ativar a IA.</strong> O responsável pelo portal deve adicionar a variável <code>OPENAI_API_KEY</code> no ambiente da aplicação.
        </div>
      )}

      <Card className="border-l-4 border-l-bncc">
        <CardHeader>
          <CardTitle>Dados da aula</CardTitle>
          <CardDescription>Os campos com * são necessários. Quanto melhor o contexto, mais útil será o resultado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade">Série *</Label>
                <select id="grade" value={gradeId} onChange={(event) => { setGradeId(event.target.value); setSubjectId(""); }} required className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
                  <option value="">Selecione a série</option>
                  {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina *</Label>
                <select id="subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
                  <option value="">Selecione a disciplina</option>
                  {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Tema central da aula *</Label>
              <Input id="theme" name="theme" required minLength={3} maxLength={180} placeholder="Ex.: Frações equivalentes no cotidiano" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duração total *</Label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input id="durationMinutes" name="durationMinutes" type="number" min={10} max={600} defaultValue={50} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classCount">Quantidade de aulas *</Label>
                <Input id="classCount" name="classCount" type="number" min={1} max={20} defaultValue={1} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherObjectives">Objetivos pedagógicos <span className="font-normal text-muted-foreground">(opcional)</span></Label>
              <Textarea id="teacherObjectives" name="teacherObjectives" maxLength={1500} placeholder="O que você espera que os alunos compreendam ou consigam fazer?" />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">A turma tem alunos que precisam de adaptação? <span className="font-normal text-muted-foreground">(opcional)</span></legend>
              <div className="flex flex-wrap gap-2">
                {INCLUSION_OPTIONS.map((option) => {
                  const selected = inclusionProfiles.includes(option);
                  return <button key={option} type="button" onClick={() => toggleInclusion(option)} aria-pressed={selected} className={`rounded-full border px-3 py-1.5 text-sm transition ${selected ? "border-bncc bg-bncc-soft font-medium text-bncc" : "bg-background hover:bg-muted"}`}>{option}</button>;
                })}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="classContext">Contexto da turma <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                <Textarea id="classContext" name="classContext" maxLength={1500} placeholder="Ex.: turma agitada, leitura em consolidação, gosta de atividades em grupo..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resources">Recursos disponíveis <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                <Textarea id="resources" name="resources" maxLength={1000} placeholder="Ex.: projetor, cartolina, material dourado, laboratório..." />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={pending || !aiConfigured || !gradeId || !subjectId} className="w-full sm:w-auto">
              <Sparkles /> {pending ? "Criando planejamento..." : "Gerar planejamento com IA"}
            </Button>
            <p className="text-xs text-muted-foreground">A IA pode errar. Revise o conteúdo e as habilidades BNCC antes de aplicar.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
