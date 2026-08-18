"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { approveQuestionImport, rejectQuestionImport } from "@/actions/admin/question-imports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ImportReviewActions({
  importId,
  questionId,
  alreadyApproved,
}: {
  importId: string;
  questionId: string;
  alreadyApproved: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setPending("approve");
    const result = await approveQuestionImport(importId);
    setPending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Questão publicada no banco de questões.");
    router.refresh();
  }

  async function handleReject() {
    if (!confirm("Rejeitar esta importação? O rascunho gerado será apagado (o arquivo original é mantido).")) return;
    setPending("reject");
    const result = await rejectQuestionImport(importId);
    setPending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Importação rejeitada.");
    router.push("/admin/questoes/importacoes");
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 pt-6">
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href={`/admin/questoes/${questionId}/editar`}>Editar campos</Link>}
        />
        {!alreadyApproved && (
          <>
            <Button type="button" onClick={handleApprove} disabled={pending !== null}>
              {pending === "approve" ? "Aprovando..." : "Aprovar"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleReject} disabled={pending !== null}>
              {pending === "reject" ? "Rejeitando..." : "Rejeitar importação"}
            </Button>
          </>
        )}
        {alreadyApproved && <p className="text-sm text-muted-foreground">Já publicada no banco de questões.</p>}
      </CardContent>
    </Card>
  );
}
