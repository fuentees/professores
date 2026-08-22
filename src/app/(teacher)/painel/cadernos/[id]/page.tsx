import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getQuestionCollectionDetail } from "@/actions/question-collections";
import { QuestionCollectionEditor } from "@/components/questions/question-collection-editor";

export default async function QuestionCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getQuestionCollectionDetail(id);
  if (result.error || !result.collection) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/painel/cadernos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Todos os cadernos</Link>
        <h1 className="text-2xl font-semibold">Editar caderno</h1>
        <p className="text-muted-foreground">Organize as questões na ordem em que deseja trabalhar.</p>
      </div>
      <QuestionCollectionEditor collection={result.collection} />
    </div>
  );
}
