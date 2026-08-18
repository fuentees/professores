import { QuestionImportUploader } from "@/components/admin/question-import-uploader";

export default function ImportarQuestoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar questões</h1>
        <p className="text-muted-foreground">
          Envie um ou vários arquivos .docx do acervo. Cada arquivo é analisado, o original é
          preservado e uma questão em rascunho é criada para revisão — nada é publicado
          automaticamente.
        </p>
      </div>

      <QuestionImportUploader />
    </div>
  );
}
