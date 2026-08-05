"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCourse, updateCourse } from "@/actions/admin/course";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export function CourseForm({
  courseId,
  defaultValues,
}: {
  courseId?: string;
  defaultValues: CourseInput;
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  async function onSubmit(values: CourseInput) {
    const result = courseId ? await updateCourse(courseId, values) : await createCourse(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(courseId ? "Curso atualizado." : "Curso criado.");

    if (!courseId && result.id) {
      router.push(`/admin/cursos/${result.id}/editar`);
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
              <Label htmlFor="instructor">Instrutor</Label>
              <Input id="instructor" {...form.register("instructor")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workloadHours">Carga horária (h)</Label>
              <Input id="workloadHours" type="number" {...form.register("workloadHours")} />
            </div>
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

          <label className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm">Emitir certificado ao concluir</span>
            <Switch
              checked={form.watch("certificateEnabled")}
              onCheckedChange={(checked) => form.setValue("certificateEnabled", checked)}
            />
          </label>
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : courseId ? "Salvar alterações" : "Criar curso"}
      </Button>
    </form>
  );
}
