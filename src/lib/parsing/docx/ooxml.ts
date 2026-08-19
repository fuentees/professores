import { XMLParser } from "fast-xml-parser";

/**
 * `preserveOrder: true` keeps sibling order across different tag names
 * (ex.: um `<w:p>` entre dois `<w:tbl>`), essencial porque a ordem do
 * documento é pedagogicamente significativa (TEXTO I / imagem / pergunta A).
 * Sem essa opção, o fast-xml-parser agrupa filhos do mesmo nome num array e
 * perde o entrelaçamento entre tags diferentes.
 */
const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  // O Word quebra uma frase em vários <w:r> por mudança de formatação, e o
  // espaço entre duas palavras às vezes vira um run só com um espaço (ou um
  // espaço no início/fim de um run), marcado com xml:space="preserve". O
  // fast-xml-parser, por padrão, dá trim em todo texto — isso apaga
  // exatamente esses espaços "soltos" e cola as palavras (ex.: "que" +
  // "tipo" vira "quetipo"). trimValues: false preserva o texto como está no
  // XML; como o document.xml do Word nunca é pretty-printed (sem quebras de
  // linha/indentação entre tags), não há espaço espúrio de formatação do
  // XML em si pra se preocupar.
  trimValues: false,
});

export type XmlNode = Record<string, unknown>;

export function parseXml(xml: string): XmlNode[] {
  return parser.parse(xml) as XmlNode[];
}

export function tagName(node: XmlNode): string | null {
  const key = Object.keys(node).find((k) => k !== ":@");
  return key ?? null;
}

export function children(node: XmlNode): XmlNode[] {
  const tag = tagName(node);
  if (!tag) return [];
  const value = node[tag];
  return Array.isArray(value) ? (value as XmlNode[]) : [];
}

export function attrs(node: XmlNode): Record<string, string> {
  return (node[":@"] as Record<string, string>) ?? {};
}

/** Concatena todo texto (`#text`) dentro de um nó, recursivamente. */
export function extractText(node: XmlNode): string {
  const tag = tagName(node);
  if (tag === "#text") return String(node["#text"] ?? "");
  return children(node)
    .map(extractText)
    .join("");
}

/** Procura recursivamente o primeiro atributo cuja chave termine com `suffix`. */
export function findAttrDeep(node: XmlNode, suffix: string): string | null {
  const nodeAttrs = attrs(node);
  for (const [key, value] of Object.entries(nodeAttrs)) {
    if (key.endsWith(suffix)) return value;
  }
  for (const child of children(node)) {
    const found = findAttrDeep(child, suffix);
    if (found) return found;
  }
  return null;
}

/** Verdadeiro se o nó (ou algum descendente) contém um `<w:drawing>`. */
export function hasDrawing(node: XmlNode): boolean {
  if (tagName(node) === "w:drawing") return true;
  return children(node).some(hasDrawing);
}

export function findDescendantsByTag(node: XmlNode, tag: string): XmlNode[] {
  const found: XmlNode[] = [];
  if (tagName(node) === tag) found.push(node);
  for (const child of children(node)) found.push(...findDescendantsByTag(child, tag));
  return found;
}

/**
 * Texto de uma célula de tabela (`w:tc`), incluindo tabelas aninhadas
 * achatadas. Junta parágrafos-filho com espaço — sem isso, duas linhas como
 * "CÓDIGO DA QUESTÃO: " e "HIS4-1T-005" (dois `<w:p>` na mesma célula) podem
 * colar sem separador nenhum quando nenhum dos dois termina com espaço.
 */
export function cellText(tc: XmlNode): string {
  const parts = children(tc).map((child) => extractText(child));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export type TableGrid = string[][];

/** Extrai uma tabela `w:tbl` como matriz de texto por célula. */
export function extractTableRows(tbl: XmlNode): TableGrid {
  const rows: TableGrid = [];
  for (const row of children(tbl)) {
    if (tagName(row) !== "w:tr") continue;
    const cells: string[] = [];
    for (const cell of children(row)) {
      if (tagName(cell) !== "w:tc") continue;
      cells.push(cellText(cell));
    }
    rows.push(cells);
  }
  return rows;
}

/** Encontra a raiz `w:body` dentro da árvore parseada de `word/document.xml`. */
export function findBody(root: XmlNode[]): XmlNode | null {
  for (const node of root) {
    const tag = tagName(node);
    if (tag === "w:document") {
      for (const child of children(node)) {
        if (tagName(child) === "w:body") return child;
      }
    }
  }
  return null;
}
