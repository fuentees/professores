"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export function ProfileForm({ profile }: { profile: CurrentProfile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
        {state?.errors?.fullName && (
          <p className="text-sm text-destructive">{state.errors.fullName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={profile.email} disabled />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-foreground" : "text-destructive"}`}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
