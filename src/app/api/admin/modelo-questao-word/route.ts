import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { generateQuestionImportTemplate } from "@/lib/export/question-import-template-docx";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotAdminError) return new Response("Acesso restrito.", { status: 403 });
    throw error;
  }

  const bytes = await generateQuestionImportTemplate();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="modelo-oficial-importacao-questao.docx"',
      "Cache-Control": "private, no-store",
    },
  });
}
