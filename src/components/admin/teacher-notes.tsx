"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTeacherNote } from "@/actions/admin/teachers";

export type TeacherNoteRow = {
  id: string;
  body: string;
  created_at: string;
  author: { full_name: string; email: string } | null;
};

export function TeacherNotes({ teacherId, notes }: { teacherId: string; notes: TeacherNoteRow[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    startTransition(async () => {
      const result = await addTeacherNote(teacherId, body);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBody("");
      textareaRef.current?.focus();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ex.: Professora ligou em 24/08 reclamando de não conseguir baixar — orientei a renovar o plano."
          maxLength={2000}
          rows={3}
        />
        <Button type="button" size="sm" className="self-end" disabled={pending || body.trim().length < 2} onClick={handleSubmit}>
          {pending ? "Salvando..." : "Salvar anotação"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {notes.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <StickyNote className="size-4" />
            Nenhuma anotação ainda.
          </p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border p-3 text-sm">
            <p className="whitespace-pre-wrap">{note.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {note.author?.full_name || note.author?.email || "Admin"} ·{" "}
              {new Date(note.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
