"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Printer, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteLessonPlan, updateLessonPlan } from "@/actions/lesson-plans";
import type { LessonPlanOutput } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PlanMeta = {
  id: string;
  subjectName: string;
  gradeName: string;
  theme: string;
  durationMinutes: number;
  classCount: number;
};

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LessonPlanEditor({ meta, initialOutput }: { meta: PlanMeta; initialOutput: LessonPlanOutput }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [output, setOutput] = useState(initialOutput);
  const [draft, setDraft] = useState(initialOutput);

  function setLines(key: "learningObjectives" | "contents" | "methodology" | "resources" | "teacherNotes", value: string) {
    setDraft((current) => ({ ...current, [key]: splitLines(value) }));
  }

  function save() {
    startTransition(async () => {
      const result = await updateLessonPlan(meta.id, draft);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOutput(draft);
      setEditing(false);
      toast.success("Planejamento atualizado.");
    });
  }

  function remove() {
    if (!window.confirm("Excluir este planejamento? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteLessonPlan(meta.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Planejamento excluído.");
      router.push("/painel/planejamentos");
    });
  }

  async function downloadWord() {
    const { generateLessonPlanDocx, downloadLessonPlanBlob } = await import("@/lib/export/lesson-plan-docx");
    const blob = await generateLessonPlanDocx({ ...meta, output });
    downloadLessonPlanBlob(blob, `${slugify(output.title) || "planejamento"}.docx`);
  }

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => { setDraft(output); setEditing(false); }} disabled={pending}><X /> Cancelar</Button>
          <Button onClick={save} disabled={pending}><Save /> {pending ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
          <Field label="Título"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
          <Field label="Resumo"><Textarea rows={4} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></Field>
          <Field label="Habilidades BNCC (uma por linha)"><Textarea value={draft.bnccCodes.join("\n")} onChange={(event) => setDraft({ ...draft, bnccCodes: splitLines(event.target.value) })} /></Field>
          <Field label="Objetivos de aprendizagem (um por linha)"><Textarea rows={6} value={draft.learningObjectives.join("\n")} onChange={(event) => setLines("learningObjectives", event.target.value)} /></Field>
          <Field label="Conteúdos (um por linha)"><Textarea rows={5} value={draft.contents.join("\n")} onChange={(event) => setLines("contents", event.target.value)} /></Field>
          <Field label="Metodologia (uma etapa por linha)"><Textarea rows={7} value={draft.methodology.join("\n")} onChange={(event) => setLines("methodology", event.target.value)} /></Field>
          <Field label="Recursos (um por linha)"><Textarea rows={5} value={draft.resources.join("\n")} onChange={(event) => setLines("resources", event.target.value)} /></Field>

          <div className="space-y-3">
            <h2 className="font-semibold">Desenvolvimento da aula</h2>
            {draft.schedule.map((item, index) => <div key={index} className="grid gap-2 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_120px_2fr]">
              <Input aria-label={`Etapa ${index + 1}`} value={item.phase} onChange={(event) => setDraft((current) => ({ ...current, schedule: current.schedule.map((row, rowIndex) => rowIndex === index ? { ...row, phase: event.target.value } : row) }))} />
              <Input aria-label={`Minutos da etapa ${index + 1}`} type="number" min={1} value={item.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, schedule: current.schedule.map((row, rowIndex) => rowIndex === index ? { ...row, durationMinutes: Number(event.target.value) } : row) }))} />
              <Textarea aria-label={`Ações da etapa ${index + 1}`} value={item.actions} onChange={(event) => setDraft((current) => ({ ...current, schedule: current.schedule.map((row, rowIndex) => rowIndex === index ? { ...row, actions: event.target.value } : row) }))} />
            </div>)}
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Avaliação</h2>
            {draft.assessment.map((item, index) => <div key={index} className="grid gap-2 rounded-xl bg-muted/50 p-3 sm:grid-cols-3">
              <Textarea aria-label={`Critério ${index + 1}`} value={item.criterion} onChange={(event) => setDraft((current) => ({ ...current, assessment: current.assessment.map((row, rowIndex) => rowIndex === index ? { ...row, criterion: event.target.value } : row) }))} />
              <Textarea aria-label={`Evidência ${index + 1}`} value={item.evidence} onChange={(event) => setDraft((current) => ({ ...current, assessment: current.assessment.map((row, rowIndex) => rowIndex === index ? { ...row, evidence: event.target.value } : row) }))} />
              <Textarea aria-label={`Instrumento ${index + 1}`} value={item.instrument} onChange={(event) => setDraft((current) => ({ ...current, assessment: current.assessment.map((row, rowIndex) => rowIndex === index ? { ...row, instrument: event.target.value } : row) }))} />
            </div>)}
          </div>

          <Field label="Atividade para casa"><Textarea value={draft.homework} onChange={(event) => setDraft({ ...draft, homework: event.target.value })} /></Field>
          <Field label="Orientações ao professor (uma por linha)"><Textarea rows={5} value={draft.teacherNotes.join("\n")} onChange={(event) => setLines("teacherNotes", event.target.value)} /></Field>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Editar</Button>
        <Button variant="outline" onClick={downloadWord}><Download /> Baixar Word</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer /> Imprimir / PDF</Button>
        <Button variant="destructive" onClick={remove} disabled={pending}><Trash2 /> Excluir</Button>
      </div>

      <article className="mx-auto max-w-5xl rounded-2xl border bg-white p-6 text-slate-900 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none sm:p-10">
        <header className="border-b-2 border-primary pb-6 text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">PLANEJAMENTO DE AULA</p>
          <h1 className="mt-2 text-3xl font-bold text-[#172b4d]">{output.title}</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-600">
            <span><strong>Disciplina:</strong> {meta.subjectName}</span><span><strong>Série:</strong> {meta.gradeName}</span>
            <span><strong>Duração:</strong> {meta.durationMinutes} min · {meta.classCount} aula(s)</span>
          </div>
        </header>
        <div className="mt-7 space-y-7">
          <PlanSection title="Tema e visão geral"><p>{meta.theme}</p><p className="mt-2 text-slate-700">{output.summary}</p></PlanSection>
          {output.bnccCodes.length > 0 && <PlanSection title="Alinhamento à BNCC"><div className="flex flex-wrap gap-2">{output.bnccCodes.map((code) => <span key={code} className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">{code}</span>)}</div></PlanSection>}
          <ListSection title="Objetivos de aprendizagem" items={output.learningObjectives} />
          <ListSection title="Conteúdos" items={output.contents} />
          <ListSection title="Metodologia" items={output.methodology} ordered />
          <ListSection title="Recursos" items={output.resources} />
          <PlanSection title="Desenvolvimento da aula"><div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="bg-orange-50"><th className="border p-2">Etapa</th><th className="border p-2">Tempo</th><th className="border p-2">Ações</th></tr></thead><tbody>{output.schedule.map((item, index) => <tr key={index}><td className="border p-2 font-medium">{item.phase}</td><td className="border p-2">{item.durationMinutes} min</td><td className="border p-2">{item.actions}</td></tr>)}</tbody></table></div></PlanSection>
          <PlanSection title="Avaliação"><div className="grid gap-3 md:grid-cols-2">{output.assessment.map((item, index) => <div key={index} className="rounded-xl border p-4"><h3 className="font-semibold">{item.criterion}</h3><p className="mt-2 text-sm"><strong>Evidência:</strong> {item.evidence}</p><p className="mt-1 text-sm"><strong>Instrumento:</strong> {item.instrument}</p></div>)}</div></PlanSection>
          {output.adaptations.length > 0 && <PlanSection title="Adaptações e inclusão"><div className="space-y-3">{output.adaptations.map((item) => <div key={item.profile}><h3 className="font-semibold">{item.profile}</h3><ul className="ml-5 list-disc">{item.strategies.map((strategy) => <li key={strategy}>{strategy}</li>)}</ul></div>)}</div></PlanSection>}
          {output.homework && <PlanSection title="Atividade para casa"><p>{output.homework}</p></PlanSection>}
          <ListSection title="Orientações ao professor" items={output.teacherNotes} />
        </div>
        <p className="mt-10 border-t pt-4 text-xs text-slate-500">Planejamento gerado com apoio de IA. Revise e adapte à realidade da turma antes de aplicar.</p>
      </article>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>; }
function PlanSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="mb-3 text-xl font-bold text-[#a33a1d]">{title}</h2>{children}</section>; }
function ListSection({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) { if (!items.length) return null; const Tag = ordered ? "ol" : "ul"; return <PlanSection title={title}><Tag className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</Tag></PlanSection>; }
