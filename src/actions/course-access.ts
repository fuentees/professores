"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { hasSubscriberAccess } from "@/lib/access/subscriber-access";
import { getDownloadQuota, downloadQuotaExceeded, DOWNLOAD_QUOTA_MESSAGE } from "@/lib/access/download-quota";

export type ActionResult = { error: string | null; url?: string };

type LessonFileWithCourse = {
  name: string;
  storage_path: string;
  lesson: {
    id: string;
    title: string;
    status: string;
    module: {
      course: { id: string; slug: string; title: string; status: string; access_type: string } | null;
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
      "name, storage_path, lesson:course_lessons(id, title, status, module:course_modules(course:courses(id, slug, title, status, access_type)))",
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

  const quota = await getDownloadQuota(admin, profile.id, profile.role);
  if (downloadQuotaExceeded(quota)) return { error: DOWNLOAD_QUOTA_MESSAGE(quota.limit!) };

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(file.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de download." };

  await admin.from("download_events").insert({
    teacher_id: profile.id,
    resource_type: "lesson",
    resource_id: file.lesson!.id,
    resource_title: `${course.title} — ${file.lesson!.title}`,
    resource_href: `/cursos/${course.slug}/aulas/${file.lesson!.id}`,
    file_name: file.name,
  });
  revalidatePath("/painel");
  revalidatePath("/painel/downloads");
  return { error: null, url: signed.signedUrl };
}
