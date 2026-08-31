import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { lessonPlanOutputSchema } from "@/lib/ai/schemas";
import { LessonPlanEditor } from "@/components/painel/lesson-plan-editor";

export default async function PlanejamentoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: plan } = profile ? await supabase
    .from("lesson_plans")
    .select("id, subject_id, grade_id, theme, duration_minutes, class_count, output")
    .eq("id", id)
    .eq("teacher_id", profile.id)
    .maybeSingle() : { data: null };
  if (!plan) notFound();

  const [{ data: subject }, { data: grade }] = await Promise.all([
    plan.subject_id ? supabase.from("subjects").select("name").eq("id", plan.subject_id).maybeSingle() : { data: null },
    plan.grade_id ? supabase.from("grades").select("name").eq("id", plan.grade_id).maybeSingle() : { data: null },
  ]);
  const output = lessonPlanOutputSchema.safeParse(plan.output);
  if (!output.success) notFound();

  return <LessonPlanEditor meta={{ id: plan.id, subjectName: subject?.name ?? "Não informada", gradeName: grade?.name ?? "Não informada", theme: plan.theme, durationMinutes: plan.duration_minutes, classCount: plan.class_count }} initialOutput={output.data} />;
}
