import {
  attrs,
  children,
  extractTableRows,
  extractText,
  findAttrDeep,
  findDescendantsByTag,
  tagName,
  type XmlNode,
} from "./ooxml";

export type RawParagraphNode = {
  kind: "paragraph";
  text: string;
  imageRelIds: string[];
  /** Estilo do parágrafo (`w:pStyle`), quando presente — usado pra detectar títulos. */
  styleId: string | null;
};

export type RawTableNode = {
  kind: "table";
  rows: string[][];
};

export type RawBodyNode = RawParagraphNode | RawTableNode;

function paragraphStyleId(p: XmlNode): string | null {
  for (const child of children(p)) {
    if (tagName(child) === "w:pPr") {
      for (const propChild of children(child)) {
        if (tagName(propChild) === "w:pStyle") {
          return attrs(propChild)["@_w:val"] ?? null;
        }
      }
    }
  }
  return null;
}

function imageRelIdsInParagraph(p: XmlNode): string[] {
  const drawings = findDescendantsByTag(p, "w:drawing");
  const ids: string[] = [];
  for (const drawing of drawings) {
    const relId = findAttrDeep(drawing, ":embed") ?? findAttrDeep(drawing, ":id");
    if (relId) ids.push(relId);
  }
  return ids;
}

function paragraphText(p: XmlNode): string {
  // Cada <w:t> é um run de texto; concatenar direto (sem espaço extra entre
  // runs) preserva a formatação lógica do parágrafo original. extractText()
  // desce recursivamente até o nó "#text" real — em modo preserveOrder, o
  // próprio nó <w:t> não tem "#text" diretamente, só o filho dele.
  const textRuns = findDescendantsByTag(p, "w:t");
  return textRuns.map((t) => extractText(t)).join("");
}

/** Percorre `w:body` e devolve uma lista plana e ordenada de parágrafos/tabelas. */
export function walkBody(body: XmlNode): RawBodyNode[] {
  const nodes: RawBodyNode[] = [];
  for (const child of children(body)) {
    const tag = tagName(child);
    if (tag === "w:tbl") {
      nodes.push({ kind: "table", rows: extractTableRows(child) });
    } else if (tag === "w:p") {
      nodes.push({
        kind: "paragraph",
        text: paragraphText(child).trim(),
        imageRelIds: imageRelIdsInParagraph(child),
        styleId: paragraphStyleId(child),
      });
    }
    // Outras tags de nível 1 (w:sectPr etc.) não carregam conteúdo pedagógico.
  }
  return nodes;
}
