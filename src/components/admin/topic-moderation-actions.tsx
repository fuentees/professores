"use client";

import { toast } from "sonner";
import { Lock, Pin, Trash2, Unlock, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminDeleteTopic, setTopicLocked, setTopicPinned } from "@/actions/admin/forum";

export function TopicModerationActions({
  id,
  isPinned,
  isLocked,
}: {
  id: string;
  isPinned: boolean;
  isLocked: boolean;
}) {
  async function handlePin() {
    const result = await setTopicPinned(id, !isPinned);
    if (result.error) toast.error(result.error);
  }

  async function handleLock() {
    const result = await setTopicLocked(id, !isLocked);
    if (result.error) toast.error(result.error);
  }

  async function handleDelete() {
    const result = await adminDeleteTopic(id);
    if (result.error) toast.error(result.error);
    else toast.success("Tópico removido.");
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={handlePin} title={isPinned ? "Desfixar" : "Fixar"}>
        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={handleLock} title={isLocked ? "Reabrir" : "Fechar"}>
        {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={handleDelete} title="Remover">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
