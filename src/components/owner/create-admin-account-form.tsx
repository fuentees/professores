"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { createAdminAccount } from "@/actions/owner/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateAdminAccountForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createAdminAccount, undefined);

  useEffect(() => {
    if (!state?.success) return;
    toast.success(state.message);
    formRef.current?.reset();
    router.refresh();
  }, [router, state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adminFullName">Nome completo</Label>
          <Input id="adminFullName" name="fullName" autoComplete="off" required />
          {state?.errors?.fullName && <p className="text-sm text-destructive">{state.errors.fullName[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">E-mail de acesso</Label>
          <Input id="adminEmail" name="email" type="email" autoComplete="off" required />
          {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminTemporaryPassword">Senha temporária</Label>
          <Input
            id="adminTemporaryPassword"
            name="temporaryPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres, com uma letra e um número.</p>
          {state?.errors?.temporaryPassword && (
            <p className="text-sm text-destructive">{state.errors.temporaryPassword[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminConfirmPassword">Confirmar senha temporária</Label>
          <Input
            id="adminConfirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          {state?.errors?.confirmPassword && (
            <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
          )}
        </div>
      </div>

      {state?.message && !state.success && (
        <p className="text-sm text-destructive" role="alert">{state.message}</p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Nenhum e-mail será enviado. Entregue a senha temporária com segurança e peça para a pessoa alterá-la após o primeiro acesso.
        </p>
        <Button type="submit" disabled={pending} className="shrink-0">
          <ShieldPlus />
          {pending ? "Criando administrador..." : "Criar administrador"}
        </Button>
      </div>
    </form>
  );
}
