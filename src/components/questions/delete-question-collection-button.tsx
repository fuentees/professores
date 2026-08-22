"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { deleteQuestionCollection } from "@/actions/question-collections";

export function DeleteQuestionCollectionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    const result = await deleteQuestionCollection(id);
    if (result.error) return toast.error(result.error);
    toast.success("Caderno excluído.");
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Excluir ${name}`}><Trash2 /></Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>As questões continuam no banco, mas este caderno não poderá ser recuperado.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Excluir caderno</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
