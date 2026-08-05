import { LearningObjectForm } from "@/components/admin/learning-object-form";
import type { LearningObjectInput } from "@/lib/validations/learning-object";

const DEFAULT_VALUES: LearningObjectInput = {
  title: "",
  description: "",
  objectType: "",
  externalUrl: "",
  accessType: "teacher_only",
  status: "draft",
};

export default function NovoObjetoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo objeto de aprendizagem</h1>
        <p className="text-muted-foreground">
          Depois de criar, você poderá enviar a capa e, se necessário, um arquivo.
        </p>
      </div>

      <LearningObjectForm defaultValues={DEFAULT_VALUES} />
    </div>
  );
}
