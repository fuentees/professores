"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscription, revokeContentAccess } from "@/actions/admin/teachers";

export function CancelSubscriptionButton({ id }: { id: string }) {
  async function handleClick() {
    const result = await cancelSubscription(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Cancelar
    </Button>
  );
}

export function RevokeAccessButton({ id }: { id: string }) {
  async function handleClick() {
    const result = await revokeContentAccess(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Revogar
    </Button>
  );
}
