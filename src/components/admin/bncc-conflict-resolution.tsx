"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resolveBnccImportConflict } from "@/actions/admin/question-imports";
import { Button } from "@/components/ui/button";

export function BnccConflictResolution({ importId, code }: { importId: string; code: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"catalog" | "word" | null>(null);

  async function choose(choice: "catalog" | "word") {
    setPending(choice);
    const result = await resolveBnccImportConflict(importId, code, choice);
    setPending(null);
    if (result.error) return toast.error(result.error);
    toast.success(choice === "word" ? "O texto do Word foi adotado no catálogo." : "O texto atual do catálogo foi mantido.");
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
      <Button type="button" size="sm" variant="outline" disabled={pending !== null} onClick={() => choose("catalog")}>
        {pending === "catalog" ? "Salvando..." : "Manter catálogo"}
      </Button>
      <Button type="button" size="sm" disabled={pending !== null} onClick={() => choose("word")}>
        {pending === "word" ? "Salvando..." : "Usar texto do Word"}
      </Button>
    </div>
  );
}
