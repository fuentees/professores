"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export type ActionResult = { error: string | null; url?: string };

export async function markLessonComplete(lessonId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
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
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Faça login para baixar este arquivo." };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("lesson_files")
    .select("storage_path")
    .eq("id", lessonFileId)
    .single();

  if (!file) return { error: "Arquivo não encontrado." };

  const { data: signed, error } = await admin.storage
    .from("private")
    .createSignedUrl(file.storage_path, 60);

  if (error || !signed) return { error: "Não foi possível gerar o link de download." };
  return { error: null, url: signed.signedUrl };
}
