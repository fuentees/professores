"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRoundMinus } from "lucide-react";
import { toast } from "sonner";
import { demoteToTeacher, promoteToAdmin } from "@/actions/owner/admins";
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
import { Button } from "@/components/ui/button";

type AdminRoleActionProps = {
  profileId: string;
  fullName: string;
  action: "promote" | "demote";
};

export function AdminRoleAction({ profileId, fullName, action }: AdminRoleActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isPromotion = action === "promote";
  const displayName = fullName || "esta conta";

  function handleConfirm() {
    startTransition(async () => {
      const result = isPromotion
        ? await promoteToAdmin(profileId)
        : await demoteToTeacher(profileId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setOpen(false);
      toast.success(isPromotion ? "Conta promovida a administradora." : "Conta alterada para professora.");
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant={isPromotion ? "default" : "outline"} size="sm">
            {isPromotion ? <ShieldCheck /> : <UserRoundMinus />}
            {isPromotion ? "Promover a admin" : "Rebaixar a professor"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPromotion ? `Promover ${displayName}?` : `Rebaixar ${displayName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPromotion
              ? "A conta será ativada e poderá cadastrar, editar e publicar conteúdos, questões, cursos e recursos do portal. Ela não terá acesso às funções exclusivas do proprietário."
              : "A conta perderá imediatamente o painel administrativo e voltará a ter somente os recursos disponíveis para professores."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            variant={isPromotion ? "default" : "destructive"}
          >
            {pending ? "Alterando..." : isPromotion ? "Confirmar promoção" : "Confirmar rebaixamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
