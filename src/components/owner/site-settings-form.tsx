"use client";

import { useActionState } from "react";
import { updateSiteSettings, type SiteSettings } from "@/actions/owner/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateSiteSettings, undefined);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="supportEmail">E-mail de suporte</Label>
        <p className="text-sm text-muted-foreground">Aparece no rodapé do site público.</p>
        <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.support_email ?? ""} />
        {state?.errors?.supportEmail && <p className="text-sm text-destructive">{state.errors.supportEmail[0]}</p>}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-medium">Modo de manutenção</span>
            <p className="text-sm text-muted-foreground">
              Tira o site público do ar temporariamente (visitantes veem um aviso). Professores e
              administradores já logados continuam acessando normalmente.
            </p>
          </div>
          <Switch name="maintenanceMode" defaultChecked={settings.maintenance_mode} />
        </label>

        <div className="flex flex-col gap-2">
          <Label htmlFor="maintenanceMessage">Mensagem de manutenção (opcional)</Label>
          <Textarea
            id="maintenanceMessage"
            name="maintenanceMessage"
            defaultValue={settings.maintenance_message ?? ""}
            placeholder="Ex: Voltamos em breve! Estamos fazendo uma manutenção rápida."
            rows={3}
          />
        </div>
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-foreground" : "text-destructive"}`}>{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
