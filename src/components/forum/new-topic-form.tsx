"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createTopic } from "@/actions/forum";
import { forumTopicSchema, type ForumTopicInput } from "@/lib/validations/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewTopicForm({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(forumTopicSchema), defaultValues: { title: "", body: "" } });

  async function onSubmit(values: ForumTopicInput) {
    const result = await createTopic(categorySlug, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Tópico criado.");
    form.reset();
    if (result.id) router.push(`/forum/topico/${result.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novo tópico</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea id="body" rows={4} {...form.register("body")} />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
            {form.formState.isSubmitting ? "Publicando..." : "Publicar tópico"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
