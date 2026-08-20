import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps<"/cursos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) return {};
  return {
    title: course.title,
    description: course.description ?? undefined,
    openGraph: {
      title: course.title,
      description: course.description ?? undefined,
      images: course.cover_url ? [course.cover_url] : undefined,
    },
  };
}

type ModuleWithLessons = {
  id: string;
  title: string;
  order_index: number;
  course_lessons: { id: string; title: string; duration_minutes: number | null; status: string }[];
};

export default async function CourseDetailPage({
  params,
}: PageProps<"/cursos/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, cover_url, instructor, workload_hours, certificate_enabled")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, title, order_index, course_lessons(id, title, duration_minutes, status)")
    .eq("course_id", course.id)
    .order("order_index")
    .returns<ModuleWithLessons[]>();

  let completedLessonIds = new Set<string>();
  if (profile) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("teacher_id", profile.id)
      .not("completed_at", "is", null);
    completedLessonIds = new Set((progress ?? []).map((p) => p.lesson_id));
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {course.cover_url ? (
          <Image src={course.cover_url} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <GraduationCap className="h-10 w-10" />
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && <p className="mt-2 text-muted-foreground">{course.description}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {course.instructor && <Badge variant="outline">{course.instructor}</Badge>}
          {course.workload_hours && <Badge variant="outline">{course.workload_hours}h</Badge>}
          {course.certificate_enabled && <Badge variant="secondary">Com certificado</Badge>}
        </div>
      </div>

      <div className="space-y-6">
        {(modules ?? []).map((module) => (
          <div key={module.id} className="rounded-lg border">
            <div className="border-b bg-muted/30 px-4 py-3 font-semibold">{module.title}</div>
            <div className="divide-y">
              {module.course_lessons
                .filter((lesson) => lesson.status === "active")
                .map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/cursos/${slug}/aulas/${lesson.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      {completedLessonIds.has(lesson.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      {lesson.title}
                    </span>
                    {lesson.duration_minutes && (
                      <span className="text-muted-foreground">{lesson.duration_minutes} min</span>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
