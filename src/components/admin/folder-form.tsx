"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createFolder, updateFolder } from "@/actions/admin/folder";
import { folderSchema, type FolderInput } from "@/lib/validations/folder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MultiCheckList, type MultiCheckOption } from "@/components/admin/multi-check-list";

export function FolderForm({
  folderId,
  defaultValues,
  contentOptions,
}: {
  folderId?: string;
  defaultValues: FolderInput;
  contentOptions: MultiCheckOption[];
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(folderSchema),
    defaultValues,
  });

  async function onSubmit(values: FolderInput) {
    const result = folderId ? await updateFolder(folderId, values) : await createFolder(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(folderId ? "Pasta atualizada." : "Pasta criada.");

    if (!folderId && result.id) {
      router.push(`/admin/pastas/${result.id}/editar`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo de acesso</Label>
              <Select
                value={form.watch("accessType")}
                onValueChange={(value) => form.setValue("accessType", value ?? "teacher_only")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="free_signup">Gratuito com cadastro</SelectItem>
                  <SelectItem value="teacher_only">Exclusivo para professores</SelectItem>
                  <SelectItem value="subscriber_only">Exclusivo para assinantes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value ?? "draft")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <MultiCheckList
            label="Materiais nesta pasta"
            options={contentOptions}
            selected={form.watch("contentIds")}
            onChange={(ids) => form.setValue("contentIds", ids)}
            emptyLabel="Nenhum material publicado ainda."
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : folderId ? "Salvar alterações" : "Criar pasta"}
      </Button>
    </form>
  );
}
