import Link from "next/link";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, title, description, cover_url, instructor, workload_hours")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Cursos</h1>
        <p className="text-muted-foreground">Formação continuada para professores.</p>
      </div>

      {(!courses || courses.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum curso publicado ainda.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => (
          <Link
            key={course.slug}
            href={`/cursos/${course.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video bg-muted">
              {course.cover_url ? (
                <Image src={course.cover_url} alt={course.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <GraduationCap className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="font-semibold group-hover:underline">{course.title}</h2>
              {course.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
                {course.instructor && <Badge variant="outline">{course.instructor}</Badge>}
                {course.workload_hours && <Badge variant="outline">{course.workload_hours}h</Badge>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
