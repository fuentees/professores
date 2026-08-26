"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resetTeacherPassword } from "@/actions/admin/teachers";

export function ResetPasswordButton({ profileId, fullName }: { profileId: string; fullName: string }) {
  const [pending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetTeacherPassword(profileId);
      if (result.error || !result.password) {
        toast.error(result.error ?? "Não foi possível redefinir a senha.");
        return;
      }
      setCopied(false);
      setNewPassword(result.password);
    });
  }

  async function handleCopy() {
    if (!newPassword) return;
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success("Senha copiada.");
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="outline" size="sm">
              <KeyRound className="size-4" />
              Redefinir senha
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir a senha de {fullName || "este professor"}?</AlertDialogTitle>
            <AlertDialogDescription>
              A senha atual deixa de funcionar imediatamente. Você vai receber uma senha temporária nova pra
              repassar com segurança — peça pra pessoa trocá-la após o próximo acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={pending}>
              {pending ? "Redefinindo..." : "Redefinir senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={newPassword !== null} onOpenChange={(open) => !open && setNewPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova senha temporária</DialogTitle>
            <DialogDescription>
              Ela só aparece esta vez. Copie e repasse com segurança pra {fullName || "o professor"}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <span className="flex-1 font-mono text-sm select-all">{newPassword}</span>
            <Button type="button" size="icon-sm" variant="ghost" onClick={handleCopy} aria-label="Copiar senha">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
