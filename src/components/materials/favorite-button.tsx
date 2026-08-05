"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/actions/content-access";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  contentId,
  initialFavorited,
}: {
  contentId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setFavorited((prev) => !prev);
    startTransition(async () => {
      const result = await toggleFavorite(contentId);
      if (result.error) {
        setFavorited((prev) => !prev);
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      <Heart className={cn("h-4 w-4", favorited && "fill-current text-destructive")} />
      {favorited ? "Favoritado" : "Favoritar"}
    </Button>
  );
}
