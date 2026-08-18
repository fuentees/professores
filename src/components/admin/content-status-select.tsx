"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setContentStatus } from "@/actions/admin/content";
import type { ContentStatus } from "@/types/supabase";

const LABELS: Record<ContentStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

const VARIANTS: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
  hidden: "outline",
  archived: "secondary",
};

export function ContentStatusSelect({ id, status }: { id: string; status: ContentStatus }) {
  async function handleChange(value: string | null) {
    if (!value) return;
    const result = await setContentStatus(id, value as ContentStatus);
    if (result.error) toast.error(result.error);
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-36" size="sm">
        <Badge variant={VARIANTS[status]}>
          <SelectValue>{LABELS[status]}</SelectValue>
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABELS)
          // "Agendado" precisa de uma data — só disponível na tela de edição
          // completa do material, não faz sentido nesse seletor rápido.
          .filter(([value]) => value !== "scheduled")
          .map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
