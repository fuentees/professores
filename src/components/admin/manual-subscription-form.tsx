"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createManualSubscription } from "@/actions/admin/teachers";

export function ManualSubscriptionForm({
  teacherId,
  plans,
}: {
  teacherId: string;
  plans: { id: string; name: string }[];
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!planId) return;

    setPending(true);
    const result = await createManualSubscription(teacherId, planId, expiresAt || null);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Assinatura liberada.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label>Plano</Label>
        <Select value={planId} onValueChange={(value) => setPlanId(value ?? "")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o plano">
              {(value: string) => plans.find((p) => p.id === value)?.name ?? "Selecione o plano"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expiresAt">Expira em (opcional)</Label>
        <Input
          id="expiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || !planId}>
        {pending ? "Liberando..." : "Liberar assinatura"}
      </Button>
    </form>
  );
}
