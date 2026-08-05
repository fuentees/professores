import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/admin/course-form";
import { CoverManager } from "@/components/admin/cover-manager";
import { SimpleEntityManager } from "@/components/admin/simple-entity-manager";
import { uploadCourseCover, createModule, deleteModule, createLesson, deleteLesson } from "@/actions/admin/course";
import { Button } from "@/components/ui/button";
import type { CourseInput } from "@/lib/validations/course";
import type { Database } from "@/types/supabase";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

export default async function EditarCursoPage({
  params,
}: PageProps<"/admin/cursos/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: course }, { data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle().returns<CourseRow>(),
    supabase.from("course_modules").select("*").eq("course_id", id).order("order_index"),
    supabase
      .from("course_lessons")
      .select("id, module_id, title, order_index, course_modules!inner(course_id)")
      .eq("course_modules.course_id", id)
      .order("order_index")
      .returns<{ id: string; module_id: string; title: string; order_index: number }[]>(),
  ]);

  if (!course) notFound();

  const moduleRows = (modules ?? []).map((m) => ({ id: m.id, name: m.title, order_index: m.order_index }));
  const lessonRows = (lessons ?? []).map((l) => ({
    id: l.id,
    name: l.title,
    order_index: l.order_index,
    module_id: l.module_id,
  }));

  const defaultValues: CourseInput = {
    title: course.title,
    description: course.description ?? "",
    instructor: course.instructor ?? "",
    workloadHours: course.workload_hours ?? undefined,
    accessType: course.access_type,
    certificateEnabled: course.certificate_enabled,
    status: course.status,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar curso</h1>
        <p className="text-muted-foreground">{course.title}</p>
      </div>

      <CoverManager
        entityId={id}
        coverUrl={course.cover_url}
        altLabel="Capa do curso"
        onUpload={uploadCourseCover}
      />

      <CourseForm courseId={id} defaultValues={defaultValues} />

      <SimpleEntityManager
        title="Módulos"
        emptyLabel="Nenhum módulo cadastrado ainda."
        rows={moduleRows}
        onCreate={(values) => createModule({ ...values, parentId: id })}
        onDelete={deleteModule}
      />

      <div className="space-y-4">
        <SimpleEntityManager
          title="Aulas"
          emptyLabel="Nenhuma aula cadastrada ainda. Crie um módulo primeiro."
          rows={lessonRows}
          parentLabel="Módulo"
          parentOptions={moduleRows}
          parentColumnValue={(row) => row.module_id}
          onCreate={createLesson}
          onDelete={deleteLesson}
        />
        {lessons && lessons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/admin/cursos/aulas/${lesson.id}`}>Editar conteúdo: {lesson.title}</Link>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
