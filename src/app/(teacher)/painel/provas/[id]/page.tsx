import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getGeneratedExamDetail } from "@/actions/exam-generator";
import { ExamPrintView } from "@/components/painel/exam-print-view";

export default async function ProvaDetalhePage({
  params,
}: PageProps<"/painel/provas/[id]">) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/entrar?redirect=/painel/provas/${id}`);

  const result = await getGeneratedExamDetail(id);
  if (result.error || !result.exam) notFound();

  return (
    <ExamPrintView
      exam={result.exam}
      questions={result.questions ?? []}
      printSettings={{ schoolLogoUrl: profile.school_logo_url, schoolPhone: profile.school_phone }}
    />
  );
}
