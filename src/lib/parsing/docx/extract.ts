import type { RawBodyNode } from "./walk-body";
import type { ParsedDocumentBlock, ParsedQuestionDraft, ParsedWarning } from "./types";
import {
  cleanStrayPunctuation,
  extractBloomLevel,
  extractBnccCodes,
  extractByLabel,
  extractDifficulty,
  extractHeaderFields,
  splitKnowledgeObjects,
} from "./extract-fields";
import { collapseLeadingExactRepeat, extractItems, extractProseAnswers, extractRubricTable } from "./extract-items";

const TEXTO_BASE_HEADING = /^TEXTO\s+[IVX]+/i;
const QUESTAO_MARKER = /^Quest[ãa]o\b/i;
// "Questão 0Valor:Imagine que..." — nos documentos reais, o rótulo "Questão
// NN" + "Valor: X" às vezes é um parágrafo único com tabulações (não uma
// tabela de verdade), colado sem espaço ao texto do enunciado. Remove só
// esse prefixo de rótulo, nunca o conteúdo em si.
const QUESTION_PREFIX = /^Quest[ãa]o\s*\d*\s*(?:Valor\s*:\s*[\d,.]*\s*)?/i;
// Mesmo rótulo de QUESTION_PREFIX, mas sem exigir estar no início do texto —
// usado pra achar um rascunho duplicado colado no MEIO de um parágrafo (ver
// comentário onde é usado, em extractQuestionDraft). Exige "Valor:" presente
// (não opcional) pra não confundir com a palavra "questão" aparecendo
// naturalmente em prosa.
const MID_DRAFT_MARKER = /\s*Quest[ãa]o\s*\d+\s*Valor\s*:\s*[\d,.]*\s*/i;
const CORRECTION_MARKER =
  /Subs[íi]dio\s+para\s+a\s+Corre[çc][ãa]o|Gabarito\s+Oficial|Alinhamento\s+Pedag[óo]gico/i;
const BLOOM_ROW_MARKER = /Taxonomia\s+de\s+Bloom|situada\s+no\s+\d/i;

function isBlank(node: RawBodyNode): boolean {
  return node.kind === "paragraph" && !node.text && node.imageRelIds.length === 0;
}

export function extractQuestionDraft(bodyNodes: RawBodyNode[]): ParsedQuestionDraft {
  const warnings: ParsedWarning[] = [];
  const nodes = bodyNodes.filter((n) => !isBlank(n));

  const headerTable = nodes.find((n) => n.kind === "table");
  const headerRows = headerTable?.kind === "table" ? headerTable.rows : [];
  const headerCells = headerRows.flat().filter(Boolean);
  const fields = extractHeaderFields(headerRows);

  const bloomRowText = headerCells.find((c) => BLOOM_ROW_MARKER.test(c) && !/Habilidade\s+BNCC/i.test(c));
  const bloomPrimaryRaw = extractBloomLevel(bloomRowText ?? null);

  const bnccCodes = extractBnccCodes(fields.bnccRaw.value);
  if (fields.bnccRaw.value && bnccCodes.length === 0) {
    warnings.push({
      severity: "warning",
      field: "bncc",
      message: "Campo de habilidade BNCC preenchido, mas nenhum código no formato EFxxXXxx foi encontrado.",
    });
  }

  const knowledgeObjects = splitKnowledgeObjects(fields.knowledgeObjectRaw.value);
  const difficultyRaw = extractDifficulty(fields.complexityRaw.value);
  if (fields.complexityRaw.value && !difficultyRaw.value) {
    warnings.push({
      severity: "warning",
      field: "difficulty",
      message: "Não foi possível identificar com clareza qual complexidade está marcada.",
    });
  }

  // ---- Corpo da questão: tudo depois da tabela de cabeçalho -------------
  const headerIndex = headerTable ? nodes.indexOf(headerTable) : -1;
  const bodyOnly = nodes.slice(headerIndex + 1);

  type Section = "base_text" | "statement" | "correction" | "other";
  let currentSection: Section = "other";
  let statementGroup = -1;
  const sectioned: { node: RawBodyNode; section: Section; statementGroup: number; strippedText?: string }[] = [];

  for (const node of bodyOnly) {
    let triggeredStatement = false;
    if (node.kind === "paragraph" && TEXTO_BASE_HEADING.test(node.text)) {
      currentSection = "base_text";
    } else if (
      (node.kind === "table" && QUESTAO_MARKER.test(node.rows[0]?.[0] ?? "")) ||
      (node.kind === "paragraph" && QUESTAO_MARKER.test(node.text))
    ) {
      currentSection = "statement";
      statementGroup++;
      triggeredStatement = true;
    } else if (node.kind === "paragraph" && CORRECTION_MARKER.test(node.text)) {
      currentSection = "correction";
    } else if (node.kind === "table" && /Crit[ée]rio\s+de\s+Distribui[çc][ãa]o/i.test(node.rows[0]?.[0] ?? "")) {
      currentSection = "correction";
    }

    const strippedText =
      triggeredStatement && node.kind === "paragraph" ? node.text.replace(QUESTION_PREFIX, "").trim() : undefined;

    sectioned.push({
      node,
      section: currentSection,
      statementGroup: currentSection === "statement" ? statementGroup : -1,
      strippedText,
    });
  }

  // ---- Enunciado: agrupa parágrafos pelo "Questão NN" que os iniciou, pra
  // não tratar um enunciado quebrado em vários parágrafos como se fossem
  // candidatos diferentes — só documentos com mais de um marcador "Questão"
  // realmente têm mais de um candidato (rascunho duplicado/variações).
  const statementGroups = new Map<number, string[]>();
  for (const entry of sectioned) {
    if (entry.section !== "statement" || entry.node.kind !== "paragraph") continue;
    const text = entry.strippedText ?? entry.node.text;
    if (!text) continue;
    const parts = statementGroups.get(entry.statementGroup) ?? [];
    parts.push(text);
    statementGroups.set(entry.statementGroup, parts);
  }
  const groupedStatements = [...statementGroups.values()].map((parts) => parts.join(" ").trim()).filter(Boolean);
  // De-duplica candidatos idênticos (rascunho colado 2x) mas preserva
  // variações reais (fraseados diferentes) como candidatos separados.
  const statementCandidates = [...new Set(groupedStatements)];
  if (statementCandidates.length > 1) {
    warnings.push({
      severity: "warning",
      field: "statement",
      message: `Encontrados ${statementCandidates.length} enunciados diferentes no documento — o primeiro foi usado, revise se é o correto.`,
    });
  }

  const primaryStatement = statementCandidates[0] ?? "";
  // Em alguns documentos, um segundo rascunho ("Questão N Valor: ...") vem
  // colado no MEIO do mesmo parágrafo/célula — sem quebra de nó, então o
  // agrupamento acima (que só olha o início de cada nó via QUESTAO_MARKER)
  // não separa em candidatos diferentes. Corta ali: esse marcador só existe
  // como rótulo de abertura de rascunho, nunca como conteúdo real de
  // enunciado, então tudo depois dele é sempre repetição.
  const midDraftMatch = primaryStatement.match(MID_DRAFT_MARKER);
  const cleanedStatement =
    midDraftMatch && midDraftMatch.index! > 0 ? primaryStatement.slice(0, midDraftMatch.index).trim() : primaryStatement;
  // Segundo padrão de duplicação (sem rótulo, bloco colado 2x exatamente) —
  // ver comentário em collapseLeadingExactRepeat.
  const dedupedStatement = collapseLeadingExactRepeat(cleanedStatement);
  const { items, leadingText } = extractItems(dedupedStatement);

  // ---- Correção: prosa + tabela de rubrica -------------------------------
  const correctionParagraphs = sectioned
    .filter((s) => s.section === "correction" && s.node.kind === "paragraph" && s.node.text)
    .map((s) => (s.node as { text: string }).text);
  const correctionProse = correctionParagraphs.length > 0 ? correctionParagraphs.join("\n\n") : null;

  const rubricTable = sectioned.find(
    (s) => s.section === "correction" && s.node.kind === "table" && /Crit[ée]rio\s+de\s+Distribui[çc][ãa]o/i.test(
      (s.node as { rows: string[][] }).rows[0]?.[0] ?? "",
    ),
  );
  const rubrics =
    rubricTable && rubricTable.node.kind === "table" ? extractRubricTable(rubricTable.node.rows) : [];

  const answers = correctionProse ? extractProseAnswers(correctionProse) : [];
  if (rubrics.length === 0 && answers.length === 0 && !correctionProse) {
    warnings.push({
      severity: "warning",
      field: "correction",
      message: "Nenhuma seção de correção/gabarito foi identificada no documento.",
    });
  }

  // ---- Blocos ordenados (preserva estrutura pedagógica) ------------------
  const blocks: ParsedDocumentBlock[] = [];
  const sectionCounters: Record<Section, number> = { base_text: 0, statement: 0, correction: 0, other: 0 };
  const images: { relId: string }[] = [];

  for (const { node, section } of sectioned) {
    if (node.kind === "table") {
      blocks.push({
        section,
        blockType: "table",
        content: { rows: node.rows },
        orderIndex: sectionCounters[section]++,
      });
      continue;
    }
    if (node.imageRelIds.length > 0) {
      for (const relId of node.imageRelIds) {
        images.push({ relId });
        blocks.push({ section, blockType: "image", content: { relId }, orderIndex: sectionCounters[section]++ });
      }
    }
    if (node.text) {
      const blockType = node.styleId?.toLowerCase().includes("heading") ? "heading" : "paragraph";
      blocks.push({ section, blockType, content: { text: node.text }, orderIndex: sectionCounters[section]++ });
    }
  }

  const code = { ...fields.code, value: fields.code.value?.trim() ?? null };

  return {
    code,
    subjectName: fields.subjectName,
    gradeName: { ...fields.gradeName, value: cleanStrayPunctuation(fields.gradeName.value) },
    curriculumUnitName: fields.curriculumUnitName,
    academicPeriodRaw: fields.academicPeriodRaw,
    bookName: extractByLabel(
      headerCells.map((c) => [c]),
      /Livro\s*/i,
    ),
    bookUnit: extractByLabel(
      headerCells.map((c) => [c]),
      /Unidade\s*:\s*/i,
    ),
    knowledgeObjects,
    bnccCodes,
    difficultyRaw,
    pedagogicalNote: fields.pedagogicalNote,
    bloomPrimaryRaw,
    bloomJustification: bloomRowText ? { value: bloomRowText, confidence: "medium" } : { value: null, confidence: "low" },
    statementCandidates: statementCandidates.length > 0 ? statementCandidates : leadingText ? [leadingText] : [],
    leadingText,
    items,
    answers,
    rubrics,
    correctionProse,
    blocks,
    images,
    warnings,
  };
}
