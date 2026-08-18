import Image from "next/image";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CourseCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  instructor: string | null;
  workload_hours: number | null;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
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
        <h2 className="line-clamp-2 font-semibold group-hover:underline">{course.title}</h2>
        {course.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
          {course.instructor && <Badge variant="outline">{course.instructor}</Badge>}
          {course.workload_hours && <Badge variant="outline">{course.workload_hours}h</Badge>}
        </div>
      </div>
    </Link>
  );
}
