"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLearningObjectFileUrl } from "@/actions/learning-object-access";

export function OpenObjectButton({
  objectId,
  externalUrl,
}: {
  objectId: string;
  externalUrl: string | null;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setPending(true);
    const result = await getLearningObjectFileUrl(objectId);
    setPending(false);

    if (result.error || !result.url) {
      toast.error(result.error ?? "Não foi possível abrir este objeto.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      <ExternalLink className="h-4 w-4" />
      {pending ? "Abrindo..." : "Acessar objeto"}
    </Button>
  );
}
