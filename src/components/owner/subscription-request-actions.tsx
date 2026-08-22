"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewSubscriptionRequest } from "@/actions/subscriptions";

export function SubscriptionRequestActions({ requestId }: { requestId: string }) {
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const router = useRouter();
  async function review(decision: "approved" | "rejected") {
    setPending(decision);
    const result = await reviewSubscriptionRequest(requestId, decision);
    setPending(null);
    if (result.error) return toast.error(result.error);
    toast.success(decision === "approved" ? "Assinatura ativada." : "Solicitação recusada.");
    router.refresh();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => review("approved")} disabled={pending !== null}>{pending === "approved" ? "Ativando..." : "Aprovar"}</Button>
      <Button size="sm" variant="outline" onClick={() => review("rejected")} disabled={pending !== null}>{pending === "rejected" ? "Recusando..." : "Recusar"}</Button>
    </div>
  );
}
