"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuestionOriginalUrl } from "@/actions/question-bank";

export function QuestionOriginalDownloadButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await getQuestionOriginalUrl(questionId);
    setLoading(false);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Não foi possível baixar o arquivo.");
      return;
    }
    window.open(result.url, "_blank");
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <FileDown className="h-4 w-4" />
      {loading ? "Gerando link..." : "Baixar Word original"}
    </Button>
  );
}
