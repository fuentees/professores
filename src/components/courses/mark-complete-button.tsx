"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markLessonComplete } from "@/actions/course-access";

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await markLessonComplete(lessonId);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCompleted(true);
    toast.success("Aula concluída.");
  }

  return (
    <Button onClick={handleClick} disabled={pending || completed} variant={completed ? "secondary" : "default"}>
      <CheckCircle2 className="h-4 w-4" />
      {completed ? "Aula concluída" : "Marcar como concluída"}
    </Button>
  );
}
