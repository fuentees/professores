"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleLearningObjectFavorite } from "@/actions/learning-objects";

export function LearningObjectFavoriteButton({ objectId, initialFavorited }: { objectId: string; initialFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    const result = await toggleLearningObjectFavorite(objectId);
    setPending(false);
    if (result.error || result.favorited === undefined) return toast.error(result.error ?? "Não foi possível atualizar.");
    setFavorited(result.favorited);
    toast.success(result.favorited ? "Recurso salvo para usar depois." : "Recurso removido dos itens salvos.");
  }

  return (
    <Button type="button" variant={favorited ? "secondary" : "outline"} onClick={handleToggle} disabled={pending} aria-pressed={favorited}>
      {favorited ? <BookmarkCheck /> : <Bookmark />}
      {pending ? "Salvando..." : favorited ? "Salvo para depois" : "Salvar para depois"}
    </Button>
  );
}
