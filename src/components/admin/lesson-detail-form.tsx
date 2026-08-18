"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateLessonDetail } from "@/actions/admin/course";
import { lessonDetailSchema, type LessonDetailInput } from "@/lib/validations/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const LESSON_STATUS_LABELS: Record<string, string> = { active: "Ativa", inactive: "Inativa" };

export function LessonDetailForm({
  lessonId,
  defaultValues,
}: {
  lessonId: string;
  defaultValues: LessonDetailInput;
}) {
  const form = useForm({
    resolver: zodResolver(lessonDetailSchema),
    defaultValues,
  });

  async function onSubmit(values: LessonDetailInput) {
    const result = await updateLessonDetail(lessonId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Aula atualizada.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="videoUrl">URL do vídeo</Label>
            <Input id="videoUrl" placeholder="https://..." {...form.register("videoUrl")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Texto da aula</Label>
            <Textarea id="body" rows={8} {...form.register("body")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input id="durationMinutes" type="number" {...form.register("durationMinutes")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value ?? "active")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => LESSON_STATUS_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
