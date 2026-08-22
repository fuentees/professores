"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestSubscription } from "@/actions/subscriptions";

export function SubscriptionRequestButton({ planId, planName }: { planId: string; planName: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setPending(true);
    const result = await requestSubscription(planId);
    setPending(false);
    if (result.error) return toast.error(result.error);
    toast.success(`Solicitação do ${planName} enviada.`);
    router.push("/painel/assinatura");
  }

  return <Button onClick={handleClick} disabled={pending}>{pending ? "Enviando..." : "Solicitar este plano"}</Button>;
}
