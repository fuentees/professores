"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePrintSettings, uploadSchoolLogo, removeSchoolLogo } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export function PrintSettingsForm({ profile }: { profile: CurrentProfile }) {
  const [state, action, pending] = useActionState(updatePrintSettings, undefined);
  const [logoUrl, setLogoUrl] = useState(profile.school_logo_url);
  const [uploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(async () => {
      const result = await uploadSchoolLogo(file);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLogoUrl(result.url ?? null);
      toast.success("Logo enviada com sucesso.");
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveLogo() {
    startUpload(async () => {
      const result = await removeSchoolLogo();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLogoUrl(null);
      toast.success("Logo removida.");
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Logo da escola</Label>
        <p className="text-sm text-muted-foreground">
          Aparece no cabeçalho das avaliações quando você imprimir.
        </p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo enviada pelo usuário, sem otimização necessária aqui
            <img src={logoUrl} alt="Logo da escola" className="h-16 w-16 rounded-md border object-contain p-1" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
              Sem logo
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileChange}
              className="max-w-56"
            />
            {logoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} disabled={uploading} className="w-fit">
                Remover logo
              </Button>
            )}
          </div>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="schoolName">Nome da escola</Label>
          <Input id="schoolName" name="schoolName" defaultValue={profile.school_name ?? ""} />
          {state?.errors?.schoolName && <p className="text-sm text-destructive">{state.errors.schoolName[0]}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="schoolPhone">Telefone da escola</Label>
          <Input id="schoolPhone" name="schoolPhone" defaultValue={profile.school_phone ?? ""} />
          {state?.errors?.schoolPhone && <p className="text-sm text-destructive">{state.errors.schoolPhone[0]}</p>}
        </div>

        {state?.message && (
          <p className={`text-sm ${state.success ? "text-foreground" : "text-destructive"}`}>{state.message}</p>
        )}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Salvando..." : "Salvar dados de impressão"}
        </Button>
      </form>
    </div>
  );
}
