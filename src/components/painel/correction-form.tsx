"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileCheck2, History, ImagePlus, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name: string };

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem válida.");
  if (file.size > 15 * 1024 * 1024) throw new Error("A foto deve ter no máximo 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível abrir a foto."));
      element.src = url;
    });
    // Mantém texto legível sem ultrapassar o limite de corpo das funções
    // serverless depois da conversão para base64.
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a foto.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const regular = canvas.toDataURL("image/jpeg", 0.78);
    return regular.length <= 3_300_000 ? regular : canvas.toDataURL("image/jpeg", 0.6);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CorrectionForm({ grades, subjects, gradeSubjects, aiConfigured }: { grades: Option[]; subjects: Option[]; gradeSubjects: { gradeId: string; subjectId: string }[]; aiConfigured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [correctionType, setCorrectionType] = useState<"exercise" | "essay">("exercise");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableSubjects = useMemo(() => {
    if (!gradeId) return subjects;
    const ids = new Set(gradeSubjects.filter((item) => item.gradeId === gradeId).map((item) => item.subjectId));
    return ids.size ? subjects.filter((subject) => ids.has(subject.id)) : subjects;
  }, [gradeId, gradeSubjects, subjects]);

  async function selectFile(file?: File) {
    if (!file) return;
    setLoadingImage(true);
    try {
      setImageDataUrl(await compressImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar a foto.");
    } finally {
      setLoadingImage(false);
    }
  }

  async function submit(formData: FormData) {
    if (!aiConfigured) {
      toast.error("A IA ainda precisa ser configurada pelo responsável do portal.");
      return;
    }
    if (!imageDataUrl) {
      toast.error("Adicione uma foto para analisar.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/ai/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctionType, gradeId, subjectId, context: formData.get("context"), imageDataUrl }),
      });
      const result = await response.json() as { error?: string; id?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Não foi possível concluir a análise.");
      toast.success("Análise concluída. Revise o resultado antes de usar.");
      router.push(`/painel/correcoes/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a análise.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-activity-soft px-3 py-1 text-xs font-semibold text-activity"><FileCheck2 className="size-3.5" /> Apoio à correção</div>
          <h1 className="text-2xl font-semibold">Corrigir exercício ou redação</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Fotografe o trabalho, confira a leitura e use o feedback como apoio à sua avaliação.</p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/painel/correcoes"><History /> Histórico</Link>} />
      </div>

      {!aiConfigured && <div className="rounded-xl border border-assessment/30 bg-assessment-soft p-4 text-sm"><strong>Falta ativar a IA.</strong> Adicione <code>OPENAI_API_KEY</code> no ambiente da aplicação.</div>}

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card p-1">
        <button type="button" onClick={() => setCorrectionType("exercise")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${correctionType === "exercise" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Exercício</button>
        <button type="button" onClick={() => setCorrectionType("essay")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${correctionType === "essay" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Redação</button>
      </div>

      <Card>
        <CardHeader><CardTitle>{correctionType === "essay" ? "Foto da redação" : "Foto do exercício"}</CardTitle><CardDescription>Use uma foto nítida, bem iluminada e sem cortar o enunciado ou a resposta.</CardDescription></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="correction-grade">Série <span className="font-normal text-muted-foreground">(opcional)</span></Label><select id="correction-grade" value={gradeId} onChange={(event) => { setGradeId(event.target.value); setSubjectId(""); }} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Não informar</option>{grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="correction-subject">Disciplina <span className="font-normal text-muted-foreground">(opcional)</span></Label><select id="correction-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Não informar</option>{availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
            </div>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
            <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-56 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30 p-4 text-center transition hover:border-primary/50 hover:bg-primary/5">
              {loadingImage ? <><LoaderCircle className="mb-3 size-8 animate-spin text-primary" /><span>Preparando foto...</span></> : imageDataUrl ? <NextImage src={imageDataUrl} alt="Foto pronta para análise" width={1200} height={900} unoptimized className="max-h-80 w-auto rounded-lg object-contain" /> : <><div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Camera className="size-7" /></div><strong>Fotografar ou escolher da galeria</strong><span className="mt-1 text-sm text-muted-foreground">JPG, PNG ou WebP · até 15 MB</span></>}
            </button>
            {imageDataUrl && <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><ImagePlus /> Trocar foto</Button>}

            <div className="space-y-2"><Label htmlFor="context">Contexto ou critérios <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="context" name="context" maxLength={1200} placeholder={correctionType === "essay" ? "Ex.: redação dissertativa, nota de 0 a 10, avaliar argumentação e ortografia..." : "Ex.: questão vale 2 pontos; considere o método ensinado em sala..."} /></div>

            <div className="flex gap-2 rounded-xl bg-bncc-soft p-3 text-xs text-bncc"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><span>A foto é enviada somente para análise e não fica armazenada no portal. Evite incluir nome completo ou outros dados pessoais do aluno.</span></div>
            <Button type="submit" size="lg" disabled={!aiConfigured || !imageDataUrl || submitting || loadingImage} className="w-full"><FileCheck2 /> {submitting ? "Analisando imagem..." : "Analisar com IA"}</Button>
            <p className="text-xs text-muted-foreground">A decisão final, a nota e o feedback ao aluno continuam sendo responsabilidade do professor.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
