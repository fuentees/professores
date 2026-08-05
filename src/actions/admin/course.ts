"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import { coverStoragePath, contentFileStoragePath } from "@/lib/storage/paths";
import { courseSchema, lessonDetailSchema } from "@/lib/validations/course";

export type ActionResult = { error: string | null; id?: string };

const COURSES_PATH = "/admin/cursos";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

// ---------- Curso ----------

export async function createCourse(input: unknown): Promise<ActionResult> {
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title: data.title,
      slug: slugify(data.title),
      description: data.description || null,
      instructor: data.instructor || null,
      workload_hours: data.workloadHours ?? null,
      access_type: data.accessType,
      certificate_enabled: data.certificateEnabled,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !course) return { error: error?.message ?? "Não foi possível criar o curso." };
  revalidatePath(COURSES_PATH);
  return { error: null, id: course.id };
}

export async function updateCourse(id: string, input: unknown): Promise<ActionResult> {
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;

  const { data: current } = await supabase.from("courses").select("status").eq("id", id).single();
  const becamePublished = data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("courses")
    .update({
      title: data.title,
      description: data.description || null,
      instructor: data.instructor || null,
      workload_hours: data.workloadHours ?? null,
      access_type: data.accessType,
      certificate_enabled: data.certificateEnabled,
      status: data.status,
      ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  revalidatePath(`/admin/cursos/${id}/editar`);
  return { error: null, id };
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

export async function uploadCourseCover(courseId: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const path = coverStoragePath(courseId, file.name);

  const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("courses").update({ cover_url: publicUrl }).eq("id", courseId);
  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

// ---------- Módulos ----------

export async function createModule(values: {
  name: string;
  orderIndex: number;
  parentId?: string;
}): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  if (!values.parentId) return { error: "Curso inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("course_modules").insert({
    course_id: values.parentId,
    title: values.name,
    order_index: values.orderIndex,
  });
  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

export async function deleteModule(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("course_modules").delete().eq("id", id);
  if (error) return { error: "Não é possível excluir: existem aulas vinculadas a este módulo." };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

// ---------- Aulas ----------

export async function createLesson(values: {
  name: string;
  orderIndex: number;
  parentId?: string;
}): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  if (!values.parentId) return { error: "Módulo inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").insert({
    module_id: values.parentId,
    title: values.name,
    order_index: values.orderIndex,
  });
  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

export async function deleteLesson(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(COURSES_PATH);
  return { error: null };
}

export async function updateLessonDetail(id: string, input: unknown): Promise<ActionResult> {
  const parsed = lessonDetailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;
  const { error } = await supabase
    .from("course_lessons")
    .update({
      title: data.title,
      description: data.description || null,
      body: data.body || null,
      video_url: data.videoUrl || null,
      duration_minutes: data.durationMinutes ?? null,
      status: data.status,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/cursos/aulas/${id}`);
  return { error: null };
}

export async function addLessonFile(lessonId: string, file: File): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const path = contentFileStoragePath(lessonId, file.name);

  const { error: uploadError } = await supabase.storage.from("private").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const { error } = await supabase.from("lesson_files").insert({
    lesson_id: lessonId,
    name: file.name,
    storage_path: path,
    file_type: extension,
    file_size: file.size,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/cursos/aulas/${lessonId}`);
  return { error: null };
}

export async function removeLessonFile(fileId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("lesson_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (file) await supabase.storage.from("private").remove([file.storage_path]);

  const { error } = await supabase.from("lesson_files").delete().eq("id", fileId);
  if (error) return { error: error.message };
  return { error: null };
}
