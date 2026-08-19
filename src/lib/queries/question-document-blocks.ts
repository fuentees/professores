import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type QuestionDocumentBlockData =
  | { blockType: "heading" | "paragraph" | "list_item"; section: string; orderIndex: number; text: string }
  | { blockType: "image"; section: string; orderIndex: number; url: string | null; altText: string | null }
  | { blockType: "table"; section: string; orderIndex: number; rows: string[][] };

const SECTION_ORDER: Record<string, number> = { base_text: 0, statement: 1, correction: 2, other: 3 };

/**
 * Reconstrói a estrutura ordenada do documento original (texto-base /
 * imagem / pergunta A / pergunta B...) a partir de question_document_blocks
 * + question_assets — extraídos pelo importador de .docx desde a sessão
 * anterior, mas nunca renderizados em lugar nenhum até agora. Resolve URLs
 * assinadas aqui (bucket "private", admin-only) pra devolver algo pronto
 * pra exibir tanto na revisão do admin quanto no detalhe do professor.
 */
export async function fetchQuestionDocumentBlocks(
  supabase: SupabaseClient<Database>,
  questionId: string,
): Promise<QuestionDocumentBlockData[]> {
  const [{ data: blocks }, { data: assets }] = await Promise.all([
    supabase
      .from("question_document_blocks")
      .select("section, block_type, content, order_index")
      .eq("question_id", questionId),
    supabase.from("question_assets").select("id, storage_path, alt_text").eq("question_id", questionId),
  ]);

  const assetById = new Map((assets ?? []).map((a) => [a.id, a]));
  const signedUrlById = new Map<string, string>();
  await Promise.all(
    (assets ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage.from("private").createSignedUrl(a.storage_path, 300);
      if (signed) signedUrlById.set(a.id, signed.signedUrl);
    }),
  );

  const result: QuestionDocumentBlockData[] = (blocks ?? []).map((b) => {
    const content = (b.content ?? {}) as Record<string, unknown>;

    if (b.block_type === "image") {
      const assetId = typeof content.assetId === "string" ? content.assetId : null;
      const asset = assetId ? assetById.get(assetId) : undefined;
      return {
        blockType: "image",
        section: b.section,
        orderIndex: b.order_index,
        url: assetId ? (signedUrlById.get(assetId) ?? null) : null,
        altText: asset?.alt_text ?? null,
      };
    }

    if (b.block_type === "table") {
      return {
        blockType: "table",
        section: b.section,
        orderIndex: b.order_index,
        rows: Array.isArray(content.rows) ? (content.rows as string[][]) : [],
      };
    }

    return {
      blockType: b.block_type as "heading" | "paragraph" | "list_item",
      section: b.section,
      orderIndex: b.order_index,
      text: typeof content.text === "string" ? content.text : "",
    };
  });

  return result.sort((a, b) => {
    const sectionDiff = (SECTION_ORDER[a.section] ?? 99) - (SECTION_ORDER[b.section] ?? 99);
    return sectionDiff !== 0 ? sectionDiff : a.orderIndex - b.orderIndex;
  });
}
