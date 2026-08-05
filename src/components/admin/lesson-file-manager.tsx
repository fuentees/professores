"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addLessonFile, removeLessonFile } from "@/actions/admin/course";

export type LessonFileRow = { id: string; name: string; file_type: string; file_size: number };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LessonFileManager({ lessonId, files }: { lessonId: string; files: LessonFileRow[] }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await addLessonFile(lessonId, file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Arquivo adicionado.");
  }

  async function handleRemove(fileId: string) {
    const result = await removeLessonFile(fileId);
    if (result.error) toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Materiais complementares da aula</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {files.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>}
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <span className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              {file.name}
              <span className="text-muted-foreground">
                ({file.file_type.toUpperCase()} · {formatSize(file.file_size)})
              </span>
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(file.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Adicionar arquivo"}
        </Button>
      </CardContent>
    </Card>
  );
}
