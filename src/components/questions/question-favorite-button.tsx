"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleQuestionFavorite } from "@/actions/question-bank";
import { cn } from "@/lib/utils";

export function QuestionFavoriteButton({
  questionId,
  initialFavorited,
}: {
  questionId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setFavorited((prev) => !prev);
    startTransition(async () => {
      const result = await toggleQuestionFavorite(questionId);
      if (result.error) {
        setFavorited((prev) => !prev);
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      <Heart className={cn("h-4 w-4", favorited && "fill-current text-destructive")} />
      {favorited ? "Favoritada" : "Favoritar"}
    </Button>
  );
}
