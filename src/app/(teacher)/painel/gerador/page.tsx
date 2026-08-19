import Link from "next/link";
import { loadTaxonomyOptions } from "@/lib/taxonomy";
import { ExamGeneratorForm } from "@/components/painel/exam-generator-form";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function GeradorPage() {
  const [taxonomyOptions, profile] = await Promise.all([loadTaxonomyOptions(), getCurrentProfile()]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gerador de provas</h1>
          <p className="text-muted-foreground">
            Escolha série, disciplina e tema, configure a dificuldade e a quantidade de questões, e
            revise a prévia antes de salvar.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/painel/provas">Minhas provas</Link>}
        />
      </div>

      <ExamGeneratorForm taxonomyOptions={taxonomyOptions} defaultSchoolName={profile?.school_name ?? ""} />
    </div>
  );
}
