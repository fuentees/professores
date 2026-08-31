"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { reprocessQuestionImport } from "@/actions/admin/question-imports";
import { Button } from "@/components/ui/button";

export function ReprocessQuestionImport({ importId }: { importId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    const result = await reprocessQuestionImport(importId, file);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (!result.importId || !result.questionId) {
      toast.error("O novo arquivo não pôde ser processado. O anterior foi mantido.");
      return;
    }
    toast.success("Arquivo corrigido processado sem duplicar o rascunho.");
    router.push(`/admin/questoes/importacoes/${result.importId}`);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button type="button" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>
        <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Reprocessando..." : "Enviar Word corrigido"}
      </Button>
    </>
  );
}
