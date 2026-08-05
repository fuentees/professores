"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/actions/content-access";

export function DownloadButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [pending, setPending] = useState(false);

  async function handleDownload() {
    setPending(true);
    const result = await getDownloadUrl(fileId);
    setPending(false);

    if (result.error || !result.url) {
      toast.error(result.error ?? "Não foi possível baixar este arquivo.");
      return;
    }

    window.location.href = result.url;
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? "Gerando link..." : fileName}
    </Button>
  );
}
