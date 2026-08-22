import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { getQuestionCollections } from "@/actions/question-collections";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { DeleteQuestionCollectionButton } from "@/components/questions/delete-question-collection-button";

export default async function QuestionCollectionsPage() {
  const collections = await getQuestionCollections();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cadernos de questões</h1>
          <p className="text-muted-foreground">Seleções salvas para continuar depois, baixar ou transformar em avaliação.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/painel/banco-de-questoes"><Plus />Selecionar questões</Link>} />
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum caderno salvo"
          description="No banco de questões, selecione o que deseja e clique em “Salvar caderno”."
        />
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {collections.map((collection) => (
            <div key={collection.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <Link href={`/painel/cadernos/${collection.id}`} className="font-medium hover:underline">{collection.name}</Link>
                <p className="text-sm text-muted-foreground">
                  {collection.questionCount} {collection.questionCount === 1 ? "questão" : "questões"} · atualizado em {new Date(collection.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button nativeButton={false} size="sm" variant="outline" render={<Link href={`/painel/cadernos/${collection.id}`}>Abrir</Link>} />
                <DeleteQuestionCollectionButton id={collection.id} name={collection.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
