"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteOwnReply, updateReply } from "@/actions/forum";

export type ReplyData = {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
};

export function ReplyItem({ reply, isOwn }: { reply: ReplyData; isOwn: boolean }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(reply.body);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    const result = await updateReply(reply.id, { body });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setEditing(false);
  }

  async function handleDelete() {
    const result = await deleteOwnReply(reply.id);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {reply.authorName} · {new Date(reply.created_at).toLocaleString("pt-BR")}
        </span>
        {isOwn && !editing && (
          <div className="flex gap-2">
            <button type="button" className="hover:underline" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button type="button" className="hover:underline" onClick={handleDelete}>
              Excluir
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={pending}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
      )}
    </div>
  );
}
