"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FileIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addContentFile, removeContentFile, uploadCoverImage } from "@/actions/admin/content";

export type ContentFileRow = {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentFileManager({
  contentId,
  coverUrl,
  files,
}: {
  contentId: string;
  coverUrl: string | null;
  files: ContentFileRow[];
}) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const result = await uploadCoverImage(contentId, file);
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Capa atualizada.");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const result = await addContentFile(contentId, file);
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Arquivo adicionado.");
  }

  async function handleRemoveFile(fileId: string) {
    const result = await removeContentFile(fileId);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imagem de capa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt="Capa do material"
              width={320}
              height={180}
              className="h-40 w-full rounded-md border object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Sem capa
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadingCover}
            onClick={() => coverInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploadingCover ? "Enviando..." : "Enviar capa"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivos do material</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {files.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>
          )}
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                {file.name}
                <span className="text-muted-foreground">
                  ({file.file_type.toUpperCase()} · {formatSize(file.file_size)})
                </span>
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveFile(file.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <Button
            type="button"
            variant="outline"
            disabled={uploadingFile}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploadingFile ? "Enviando..." : "Adicionar arquivo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
