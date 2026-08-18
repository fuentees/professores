"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { hasSubscriberAccess } from "@/lib/access/subscriber-access";

export type ActionResult = { error: string | null; url?: string };

type LessonFileWithCourse = {
  storage_path: string;
  lesson: {
    status: string;
    module: {
      course: { id: string; status: string; access_type: string } | null;
    } | null;
  } | null;
};

export async function markLessonComplete(lessonId: string): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para acompanhar seu progresso." };

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      teacher_id: profile.id,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    },
    { onConflict: "teacher_id,lesson_id" },
  );

  if (error) return { error: error.message };
  revalidatePath("/painel");
  return { error: null };
}

export async function getLessonFileDownloadUrl(lessonFileId: string): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para baixar este arquivo." };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("lesson_files")
    .select(
      "storage_path, lesson:course_lessons(status, module:course_modules(course:courses(id, status, access_type)))",
    )
    .eq("id", lessonFileId)
    .single()
    .returns<LessonFileWithCourse>();

  if (!file) return { error: "Arquivo não encontrado." };

  const course = file.lesson?.module?.course;
  if (!course || course.status !== "published" || file.lesson?.status !== "active") {
    return { error: "Esta aula não está disponível." };
  }
  if (course.access_type === "subscriber_only") {
    const entitled = await hasSubscriberAccess(admin, profile.id, { courseId: course.id });
    if (!entitled) {
      return { error: "Este curso é exclusivo para assinantes de um plano pago." };
    }
  }

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(file.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de download." };
  return { error: null, url: signed.signedUrl };
}
