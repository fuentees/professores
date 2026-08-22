"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BookmarkPlus, Check, Download, FilePlus2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadSelectedQuestions, recordQuestionSelectionDownload } from "@/actions/exam-generator";
import { MAX_QUESTIONS_PER_EXAM } from "@/lib/validations/exam-generator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addQuestionsToCollection,
  createQuestionCollection,
  getQuestionCollections,
  type QuestionCollectionSummary,
} from "@/actions/question-collections";

const STORAGE_KEY = "portal-professor:questoes-selecionadas";

type QuestionSelectionContextValue = {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clear: () => void;
};

const QuestionSelectionContext = createContext<QuestionSelectionContextValue | null>(null);

export function QuestionSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let storedIds: string[] = [];
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        storedIds = stored.filter((id): id is string => typeof id === "string").slice(0, MAX_QUESTIONS_PER_EXAM);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    const timer = window.setTimeout(() => {
      setSelectedIds(storedIds);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  }, [ready, selectedIds]);

  const value = useMemo<QuestionSelectionContextValue>(
    () => ({
      selectedIds,
      isSelected: (id) => selectedIds.includes(id),
      toggle: (id) => {
        setSelectedIds((current) => {
          if (current.includes(id)) return current.filter((selectedId) => selectedId !== id);
          if (current.length >= MAX_QUESTIONS_PER_EXAM) {
            toast.error(`Você pode selecionar até ${MAX_QUESTIONS_PER_EXAM} questões por avaliação.`);
            return current;
          }
          return [...current, id];
        });
      },
      selectMany: (ids) => {
        setSelectedIds((current) => {
          const next = [...current];
          for (const id of ids) if (!next.includes(id) && next.length < MAX_QUESTIONS_PER_EXAM) next.push(id);
          if (new Set([...current, ...ids]).size > MAX_QUESTIONS_PER_EXAM) {
            toast.info(`Foram selecionadas as primeiras ${MAX_QUESTIONS_PER_EXAM} questões.`);
          }
          return next;
        });
      },
      clear: () => setSelectedIds([]),
    }),
    [selectedIds],
  );

  return (
    <QuestionSelectionContext.Provider value={value}>
      {children}
      {ready && <QuestionSelectionTray />}
    </QuestionSelectionContext.Provider>
  );
}

export function useQuestionSelection() {
  const context = useContext(QuestionSelectionContext);
  if (!context) throw new Error("useQuestionSelection precisa estar dentro de QuestionSelectionProvider.");
  return context;
}

export function QuestionSelectionToggle({ questionId }: { questionId: string }) {
  const context = useContext(QuestionSelectionContext);
  // O mesmo QuestionCard também aparece na busca pública, fora do painel.
  // Nesse contexto não há seleção em lote e o controle simplesmente não é exibido.
  if (!context) return null;
  const { isSelected, toggle } = context;
  const selected = isSelected(questionId);

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "secondary" : "outline"}
      aria-pressed={selected}
      onClick={() => toggle(questionId)}
    >
      {selected && <Check />}
      {selected ? "Selecionada" : "Selecionar"}
    </Button>
  );
}

export function QuestionPageSelectionControls({ questionIds }: { questionIds: string[] }) {
  const { selectedIds, selectMany } = useQuestionSelection();
  const allVisibleSelected = questionIds.length > 0 && questionIds.every((id) => selectedIds.includes(id));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <p className="text-sm text-muted-foreground">
        Marque as questões que deseja baixar juntas ou usar em uma avaliação.
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={allVisibleSelected} onClick={() => selectMany(questionIds)}>
          {allVisibleSelected ? "Página selecionada" : "Selecionar esta página"}
        </Button>
      </div>
    </div>
  );
}

function QuestionSelectionTray() {
  const { selectedIds, clear } = useQuestionSelection();
  const [downloading, setDownloading] = useState(false);
  const pathname = usePathname();
  if (selectedIds.length === 0 || pathname === "/painel/gerador") return null;

  const selectionParam = encodeURIComponent(selectedIds.join(","));

  async function handleDownload() {
    setDownloading(true);
    try {
      const result = await loadSelectedQuestions(selectedIds);
      if (result.error || !result.questions?.length) {
        toast.error(result.error ?? "Não foi possível preparar as questões.");
        return;
      }
      const { generateExamDocx, downloadBlob } = await import("@/lib/export/exam-docx");
      const blob = await generateExamDocx(
        {
          id: selectedIds[0],
          title: "Questões selecionadas",
          themeId: null,
          gradeId: result.gradeId || null,
          subjectId: result.subjectId || null,
          schoolName: null,
          instructions: null,
          showAnswerKey: true,
          createdAt: new Date().toISOString(),
        },
        result.questions,
      );
      downloadBlob(blob, `questoes-selecionadas-${selectedIds.length}.docx`);
      await recordQuestionSelectionDownload(selectedIds);
      toast.success("Arquivo Word preparado com questões e gabarito.");
    } catch {
      toast.error("Não foi possível gerar o arquivo Word.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <aside
      aria-label="Questões selecionadas"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-background/95 p-3 shadow-xl backdrop-blur sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-semibold">{selectedIds.length} {selectedIds.length === 1 ? "questão selecionada" : "questões selecionadas"}</p>
        <p className="text-xs text-muted-foreground">A seleção continua ao trocar de página ou filtro.</p>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          {downloading ? "Preparando..." : "Baixar Word"}
        </Button>
        <Button
          nativeButton={false}
          size="sm"
          render={<Link href={`/painel/gerador?questoes=${selectionParam}`}><FilePlus2 />Criar avaliação</Link>}
        />
        <SaveSelectionDialog questionIds={selectedIds} onSaved={clear} />
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Limpar seleção" onClick={clear}>
          <Trash2 />
        </Button>
      </div>
    </aside>
  );
}

function SaveSelectionDialog({ questionIds, onSaved }: { questionIds: string[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [collections, setCollections] = useState<QuestionCollectionSummary[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setLoadingCollections(true);
    setCollections(await getQuestionCollections());
    setLoadingCollections(false);
  }

  async function handleCreate() {
    setSaving(true);
    const result = await createQuestionCollection(name, questionIds);
    setSaving(false);
    if (result.error) return toast.error(result.error);
    toast.success("Caderno salvo. Você pode retomá-lo quando quiser.");
    setOpen(false);
    setName("");
    onSaved();
  }

  async function handleAdd(collection: QuestionCollectionSummary) {
    setSaving(true);
    const result = await addQuestionsToCollection(collection.id, questionIds);
    setSaving(false);
    if (result.error) return toast.error(result.error);
    toast.success(`Questões adicionadas a “${collection.name}”.`);
    setOpen(false);
    onSaved();
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={handleOpen}>
        <BookmarkPlus />Salvar caderno
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar {questionIds.length} questões</DialogTitle>
            <DialogDescription>
              Crie um caderno para continuar depois ou adicione a um caderno existente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="collectionName">Nome do novo caderno</Label>
              <div className="flex gap-2">
                <Input
                  id="collectionName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Ciências — 2º bimestre"
                  maxLength={80}
                />
                <Button type="button" disabled={saving || name.trim().length < 2} onClick={handleCreate}>
                  Criar
                </Button>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium">Ou adicionar a um caderno existente</p>
              {loadingCollections ? (
                <p className="text-sm text-muted-foreground">Carregando cadernos...</p>
              ) : collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você ainda não tem cadernos salvos.</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {collections.map((collection) => (
                    <Button
                      key={collection.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={saving}
                      onClick={() => handleAdd(collection)}
                    >
                      <span className="truncate">{collection.name}</span>
                      <span className="text-xs text-muted-foreground">{collection.questionCount}/30</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
