import { CourseForm } from "@/components/admin/course-form";
import type { CourseInput } from "@/lib/validations/course";

const DEFAULT_VALUES: CourseInput = {
  title: "",
  description: "",
  instructor: "",
  workloadHours: undefined,
  accessType: "teacher_only",
  certificateEnabled: false,
  status: "draft",
};

export default function NovoCursoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo curso</h1>
        <p className="text-muted-foreground">
          Depois de criar, você poderá enviar a capa e cadastrar módulos e aulas.
        </p>
      </div>

      <CourseForm defaultValues={DEFAULT_VALUES} />
    </div>
  );
}
