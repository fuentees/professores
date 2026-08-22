"use client";

import { useState } from "react";
import { FileDown, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { recordGeneratedMaterialDownload } from "@/actions/content-access";
import type { MaterialDocxData } from "@/lib/export/material-docx";

export function MaterialExportButtons({
  contentId,
  material,
  trackDownload,
}: {
  contentId: string;
  material: MaterialDocxData;
  trackDownload: boolean;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [{ generateMaterialDocx, safeDocxFileName }, { downloadBlob }] = await Promise.all([
        import("@/lib/export/material-docx"),
        import("@/lib/export/exam-docx"),
      ]);
      const blob = await generateMaterialDocx(material);
      downloadBlob(blob, safeDocxFileName(material.title));
      if (trackDownload) {
        const result = await recordGeneratedMaterialDownload(contentId);
        if (result.error) toast.warning(result.error);
      }
    } catch {
      toast.error("Não foi possível gerar o arquivo Word.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {downloading ? "Gerando Word..." : "Baixar em Word"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Imprimir
      </Button>
    </div>
  );
}
