"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoverManager({
  entityId,
  coverUrl,
  altLabel,
  onUpload,
}: {
  entityId: string;
  coverUrl: string | null;
  altLabel: string;
  onUpload: (id: string, file: File) => Promise<{ error: string | null }>;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await onUpload(entityId, file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Capa atualizada.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Imagem de capa</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={altLabel}
            width={320}
            height={180}
            className="h-40 w-full max-w-sm rounded-md border object-cover"
          />
        ) : (
          <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Sem capa
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Enviar capa"}
        </Button>
      </CardContent>
    </Card>
  );
}
