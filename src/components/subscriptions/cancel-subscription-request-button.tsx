"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionRequest } from "@/actions/subscriptions";

export function CancelSubscriptionRequestButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function handleClick() {
    setPending(true);
    const result = await cancelSubscriptionRequest();
    setPending(false);
    if (result.error) return toast.error(result.error);
    toast.success("Solicitação cancelada.");
    router.refresh();
  }
  return <Button variant="outline" onClick={handleClick} disabled={pending}>{pending ? "Cancelando..." : "Cancelar solicitação"}</Button>;
}
