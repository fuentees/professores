"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadLearningObjectFile } from "@/actions/admin/learning-object";

export function LearningObjectFileManager({
  objectId,
  hasFile,
}: {
  objectId: string;
  hasFile: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadLearningObjectFile(objectId, file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Arquivo enviado.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Arquivo do objeto</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileIcon className="h-4 w-4" />
          {hasFile ? "Arquivo enviado. Envie outro para substituir." : "Nenhum arquivo enviado ainda."}
        </p>
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Enviar arquivo"}
        </Button>
      </CardContent>
    </Card>
  );
}
