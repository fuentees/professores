import JSZip from "jszip";
import { findBody, parseXml } from "./ooxml";
import { walkBody } from "./walk-body";
import { extractQuestionDraft } from "./extract";

export type MaterialPurposeSuggestion = "activity" | "assessment" | "planning" | "support";

export type ParsedMaterialDocx = {
  title: string;
  shortDescription: string;
  body: string;
  bnccCodes: string[];
  gradeNames: string[];
  subjectNames: string[];
  difficulty: "easy" | "medium" | "hard" | null;
  purpose: MaterialPurposeSuggestion;
  hasAnswerKey: boolean;
  looksLikeQuestionDocument: boolean;
};

const METADATA_LINE = /^(c[oó]digo|disciplina|componente|ano escolar|s[eé]rie|unidade|bimestre|trimestre|bncc|habilidade|dificuldade)\b/i;
const GENERIC_HEADING = /^(texto|quest[aã]o|atividade|gabarito)(\s+[ivx\d]+)?$/i;

function filenameTitle(fileName: string): string {
  return fileName
    .replace(/\.docx$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHeadingStyle(styleId: string | null): boolean {
  return Boolean(styleId && /^(title|titulo|t[ií]tulo|heading\s?1|cabecalho\s?1)/i.test(styleId));
}

function chooseTitle(
  paragraphs: Array<{ text: string; styleId: string | null }>,
  fileName: string,
): { title: string; paragraphIndex: number } {
  const styledIndex = paragraphs.findIndex(
    (paragraph) => isHeadingStyle(paragraph.styleId) && paragraph.text.length >= 3 && paragraph.text.length <= 180,
  );
  if (styledIndex >= 0) return { title: paragraphs[styledIndex].text, paragraphIndex: styledIndex };

  const naturalIndex = paragraphs.findIndex((paragraph) => {
    const text = paragraph.text.trim();
    return text.length >= 8 && text.length <= 180 && !METADATA_LINE.test(text) && !GENERIC_HEADING.test(text);
  });
  if (naturalIndex >= 0) return { title: paragraphs[naturalIndex].text, paragraphIndex: naturalIndex };

  return { title: filenameTitle(fileName) || "Material importado", paragraphIndex: -1 };
}

function inferPurpose(text: string): MaterialPurposeSuggestion {
  if (/\b(plano de aula|planejamento|sequ[eê]ncia did[aá]tica|roteiro de aula)\b/i.test(text)) return "planning";
  if (/\b(avalia[cç][aã]o|prova|simulado|gabarito)\b/i.test(text)) return "assessment";
  if (/\b(atividade|exerc[ií]cio|lista de exerc[ií]cios|tarefa)\b/i.test(text)) return "activity";
  return "support";
}

/** Extrai conteúdo editorial de um Word sem gravar nada no banco. */
export async function parseMaterialDocx(buffer: ArrayBuffer, fileName: string): Promise<ParsedMaterialDocx> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) throw new Error("O arquivo não parece ser um Word .docx válido.");

  const root = parseXml(await documentXmlFile.async("string"));
  const documentBody = findBody(root);
  if (!documentBody) throw new Error("Não foi possível localizar o texto dentro do Word.");

  const nodes = walkBody(documentBody);
  const structuredDraft = extractQuestionDraft(nodes);
  const paragraphs = nodes.flatMap((node) =>
    node.kind === "paragraph" && node.text.trim()
      ? [{ text: node.text.trim(), styleId: node.styleId }]
      : [],
  );
  const selectedTitle = chooseTitle(paragraphs, fileName);

  let paragraphCursor = 0;
  const lines = nodes.flatMap((node) => {
    if (node.kind === "table") {
      return node.rows
        .map((row) => row.filter(Boolean).join(" — ").trim())
        .filter(Boolean);
    }

    const currentIndex = node.text.trim() ? paragraphCursor++ : -1;
    if (!node.text.trim() || currentIndex === selectedTitle.paragraphIndex) return [];
    const text = node.text.trim();
    return isHeadingStyle(node.styleId) ? [text.toLocaleUpperCase("pt-BR")] : [text];
  });

  const body = lines.join("\n\n").trim();
  const descriptionCandidate = lines.find(
    (line) => line.length >= 35 && line.length <= 280 && !METADATA_LINE.test(line) && !GENERIC_HEADING.test(line),
  );
  const shortDescription = (descriptionCandidate ?? body.slice(0, 240)).replace(/\s+/g, " ").slice(0, 280).trim();
  const searchable = `${fileName}\n${selectedTitle.title}\n${body}`;
  const bnccCodes = Array.from(new Set([
    ...structuredDraft.bnccCodes,
    ...(searchable.toLocaleUpperCase("pt-BR").match(/\b(?:EI\d{2}[A-Z]{2}\d{2}|EF\d{2}[A-Z]{2}\d{2}|EM\d{2}[A-Z]{3}\d{3})\b/g) ?? []),
  ]));
  const gradeNames = Array.from(
    new Set([
      ...(structuredDraft.gradeName.value ? [structuredDraft.gradeName.value] : []),
      ...(searchable.match(/\b([1-9])\s*[º°o]\s*ano\b/gi) ?? []).map((grade) =>
        grade.replace(/\b([1-9])\s*[º°o]\s*ano\b/i, "$1º ano").replace(/\s+/g, " "),
      ),
    ]),
  );

  return {
    title: selectedTitle.title,
    shortDescription,
    body,
    bnccCodes,
    gradeNames,
    subjectNames: structuredDraft.subjectName.value ? [structuredDraft.subjectName.value] : [],
    difficulty: structuredDraft.difficultyRaw.value,
    purpose: inferPurpose(searchable),
    hasAnswerKey: /\b(gabarito|respostas? esperadas?|orienta[cç][aã]o para corre[cç][aã]o|subs[ií]dio para a corre[cç][aã]o)\b/i.test(searchable),
    looksLikeQuestionDocument:
      /\b(c[oó]digo da quest[aã]o|quest[aã]o\s*\d+|alternativa correta|resposta esperada)\b/i.test(searchable),
  };
}
