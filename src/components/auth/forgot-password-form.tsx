"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return <p className="text-center text-sm">{state.message}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/entrar" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
