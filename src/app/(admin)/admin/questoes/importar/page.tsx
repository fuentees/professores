import { QuestionImportUploader } from "@/components/admin/question-import-uploader";
import { PageHeader } from "@/components/common/page-header";
import Link from "next/link";
import { Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportarQuestoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar questões"
        description="Envie um ou vários arquivos .docx. A questão e suas habilidades BNCC são extraídas para revisão; habilidades novas entram no catálogo somente quando você aprova a importação."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<a href="/api/admin/modelo-questao-word"><Download className="size-4" />Baixar modelo Word</a>} />
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/questoes/importacoes"><History className="size-4" />Ver importações</Link>} />
          </div>
        }
      />

      <QuestionImportUploader />
    </div>
  );
}
