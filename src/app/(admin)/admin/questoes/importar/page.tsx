import { QuestionImportUploader } from "@/components/admin/question-import-uploader";
import { PageHeader } from "@/components/common/page-header";

export default function ImportarQuestoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar questões"
        description="Envie um ou vários arquivos .docx do acervo. Cada arquivo é analisado, o original é preservado e uma questão em rascunho é criada para revisão — nada é publicado automaticamente."
      />

      <QuestionImportUploader />
    </div>
  );
}
