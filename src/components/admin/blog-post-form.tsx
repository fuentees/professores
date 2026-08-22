"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBlogPost, updateBlogPost } from "@/actions/admin/blog";
import { blogPostSchema, type BlogPostInput } from "@/lib/validations/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CONTENT_STATUS_LABELS } from "@/lib/labels";

export function BlogPostForm({
  postId,
  defaultValues,
  categories,
}: {
  postId?: string;
  defaultValues: BlogPostInput;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const status = useWatch({ control: form.control, name: "status" });
  const allowComments = useWatch({ control: form.control, name: "allowComments" });

  async function onSubmit(values: BlogPostInput) {
    const result = postId ? await updateBlogPost(postId, values) : await createBlogPost(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(postId ? "Artigo atualizado." : "Artigo criado.");

    if (!postId && result.id) {
      router.push(`/admin/blog/${result.id}/editar`);
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
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea id="excerpt" rows={2} {...form.register("excerpt")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Texto</Label>
            <Textarea id="body" rows={10} {...form.register("body")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="author">Autor</Label>
              <Input id="author" {...form.register("author")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => form.setValue("categoryId", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione">
                    {(value: string) => categories.find((c) => c.id === value)?.name ?? "Selecione"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => form.setValue("status", value ?? "draft")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => CONTENT_STATUS_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">Permitir comentários</span>
              <Switch
                checked={allowComments}
                onCheckedChange={(checked) => form.setValue("allowComments", checked)}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : postId ? "Salvar alterações" : "Criar artigo"}
      </Button>
    </form>
  );
}
