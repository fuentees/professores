import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { QuestionDocumentBlockData } from "@/lib/queries/question-document-blocks";

/**
 * Reconstrói visualmente a estrutura do documento original importado
 * (texto-base, imagens, tabelas, itens) na ordem em que apareciam no
 * .docx — até agora question_document_blocks/question_assets eram
 * extraídos e guardados, mas nunca exibidos em lugar nenhum.
 */
export function QuestionDocumentRenderer({ blocks }: { blocks: QuestionDocumentBlockData[] }) {
  if (blocks.length === 0) return null;

  const groups: (QuestionDocumentBlockData | QuestionDocumentBlockData[])[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.blockType === "list_item" && Array.isArray(last) && last[0]?.blockType === "list_item") {
      last.push(block);
    } else if (block.blockType === "list_item") {
      groups.push([block]);
    } else {
      groups.push(block);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => {
        if (Array.isArray(group)) {
          return (
            <ul key={i} className="list-inside list-disc text-sm text-muted-foreground">
              {group.map((item, j) => (
                <li key={j}>{item.blockType === "list_item" ? item.text : null}</li>
              ))}
            </ul>
          );
        }

        switch (group.blockType) {
          case "heading":
            return (
              <p key={i} className="text-sm font-semibold tracking-tight">
                {group.text}
              </p>
            );
          case "paragraph":
            return (
              <p key={i} className="whitespace-pre-wrap text-justify text-sm leading-relaxed">
                {group.text}
              </p>
            );
          case "image":
            return (
              <div key={i} className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border bg-muted">
                {group.url ? (
                  <Image src={group.url} alt={group.altText ?? "Imagem da questão"} fill className="object-contain" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                    <ImageOff className="h-8 w-8" />
                    <span className="text-xs">{group.altText ?? "Sem preview disponível"}</span>
                  </div>
                )}
              </div>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <tbody>
                    {group.rows.map((row, r) => (
                      <tr key={r} className="border-b last:border-0">
                        {row.map((cell, c) => (
                          <td key={c} className="border-r p-2 align-top last:border-0">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
