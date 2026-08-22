import Image from "next/image";
import Link from "next/link";
import { Clock, GraduationCap, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { courseCover } from "@/lib/content-cover";

export type CourseCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  instructor: string | null;
  workload_hours: number | null;
};

// Card de "produto" — deliberadamente mais elevado que MaterialCard
// (shadow-sm já em repouso, radius maior, capa com overlay) pra parecer um
// curso completo, não um arquivo pra baixar.
export function CourseCard({ course, eager = false }: { course: CourseCardData; eager?: boolean }) {
  const coverUrl = course.cover_url ?? courseCover(course.slug);

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8"
    >
      <div className="relative aspect-video bg-gradient-to-br from-primary/15 to-primary/5">
        {coverUrl ? (
          <Image src={coverUrl} alt={course.title} fill loading={eager ? "eager" : "lazy"} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/60">
            <GraduationCap className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
        <Badge className="absolute left-3 top-3 gap-1 bg-primary text-primary-foreground hover:bg-primary">
          <GraduationCap className="h-3 w-3" />
          Curso
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="line-clamp-2 text-lg font-semibold tracking-tight group-hover:text-primary">
          {course.title}
        </h2>
        {course.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
          {course.instructor && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {course.instructor}
            </span>
          )}
          {course.workload_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.workload_hours}h
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
