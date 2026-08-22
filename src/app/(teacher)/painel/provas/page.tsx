import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { DeleteExamButton } from "@/components/painel/delete-exam-button";

type ExamRow = {
  id: string;
  title: string;
  created_at: string;
  themes: { name: string } | null;
  grades: { name: string } | null;
  subjects: { name: string } | null;
  generated_exam_questions: { id: string }[];
};

export default async function ProvasPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/provas");

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("generated_exams")
    .select("id, title, created_at, themes(name), grades(name), subjects(name), generated_exam_questions(id)")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<ExamRow[]>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Avaliações salvas</h1>
          <p className="text-muted-foreground">Avaliações que você criou para aplicar às suas turmas.</p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/painel/gerador">
              <Plus className="h-4 w-4" />
              Criar nova avaliação
            </Link>
          }
        />
      </div>

      {!exams || exams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Você ainda não criou nenhuma avaliação.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {exams.map((exam) => (
            <div key={exam.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{exam.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[exam.subjects?.name, exam.grades?.name, exam.themes?.name].filter(Boolean).join(" · ") || "Sem classificação"} ·{" "}
                  {exam.generated_exam_questions.length} questões ·{" "}
                  {new Date(exam.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/painel/provas/${exam.id}`}>Ver</Link>}
                />
                <DeleteExamButton id={exam.id} title={exam.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
