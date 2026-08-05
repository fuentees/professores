import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonDetailForm } from "@/components/admin/lesson-detail-form";
import { LessonFileManager } from "@/components/admin/lesson-file-manager";
import type { LessonDetailInput } from "@/lib/validations/course";

export default async function EditarAulaPage({
  params,
}: PageProps<"/admin/cursos/aulas/[lessonId]">) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const [{ data: lesson }, { data: files }] = await Promise.all([
    supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle(),
    supabase.from("lesson_files").select("id, name, file_type, file_size").eq("lesson_id", lessonId).order("order_index"),
  ]);

  if (!lesson) notFound();

  const defaultValues: LessonDetailInput = {
    title: lesson.title,
    description: lesson.description ?? "",
    body: lesson.body ?? "",
    videoUrl: lesson.video_url ?? "",
    durationMinutes: lesson.duration_minutes ?? undefined,
    status: lesson.status,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar aula</h1>
        <p className="text-muted-foreground">{lesson.title}</p>
      </div>

      <LessonDetailForm lessonId={lessonId} defaultValues={defaultValues} />

      <LessonFileManager lessonId={lessonId} files={files ?? []} />
    </div>
  );
}
