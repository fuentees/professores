import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { hasSubscriberAccess } from "@/lib/access/subscriber-access";
import { MarkCompleteButton } from "@/components/courses/mark-complete-button";
import { LessonFileDownloadButton } from "@/components/courses/lesson-file-download-button";
import { Button } from "@/components/ui/button";

type LessonWithCourse = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  video_url: string | null;
  module_id: string;
  module: { course: { id: string; access_type: string } | null } | null;
};

export default async function LessonPage({
  params,
}: PageProps<"/cursos/[slug]/aulas/[lessonId]">) {
  const { slug, lessonId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/entrar?redirect=/cursos/${slug}/aulas/${lessonId}`);

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("id, title, description, body, video_url, module_id, module:course_modules(course:courses(id, access_type))")
    .eq("id", lessonId)
    .maybeSingle()
    .returns<LessonWithCourse>();

  if (!lesson) notFound();

  const course = lesson.module?.course;
  let canSeeContent = true;
  if (course && course.access_type === "subscriber_only") {
    canSeeContent = await hasSubscriberAccess(supabase, profile.id, { courseId: course.id });
  }

  const [{ data: files }, { data: progress }] = await Promise.all([
    supabase.from("lesson_files").select("id, name").eq("lesson_id", lessonId).order("order_index"),
    supabase
      .from("lesson_progress")
      .select("completed_at")
      .eq("teacher_id", profile.id)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/cursos/${slug}`} className="text-sm text-muted-foreground hover:underline">
        ← Voltar ao curso
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {lesson.description && <p className="mt-1 text-muted-foreground">{lesson.description}</p>}
      </div>

      {!canSeeContent ? (
        <div className="flex flex-col gap-3 rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Esta aula é exclusiva para assinantes de um plano pago.
          </p>
          <Button
            size="sm"
            className="mx-auto"
            nativeButton={false}
            render={<Link href="/planos">Conhecer planos</Link>}
          />
        </div>
      ) : (
        <>
          {lesson.video_url && (
            <div className="aspect-video overflow-hidden rounded-lg border bg-black">
              <iframe src={lesson.video_url} className="h-full w-full" allowFullScreen title={lesson.title} />
            </div>
          )}

          {lesson.body && (
            <div className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed">
              {lesson.body}
            </div>
          )}

          {files && files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <LessonFileDownloadButton key={file.id} fileId={file.id} fileName={file.name} />
              ))}
            </div>
          )}

          <MarkCompleteButton lessonId={lessonId} initialCompleted={Boolean(progress?.completed_at)} />
        </>
      )}
    </div>
  );
}
