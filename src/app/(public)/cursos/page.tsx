import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { CourseCard } from "@/components/courses/course-card";
import { GraduationCap } from "lucide-react";

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, title, description, cover_url, instructor, workload_hours")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <PageHeader title="Cursos" description="Formação continuada para professores." />

      {!courses || courses.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Nenhum curso publicado ainda" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
