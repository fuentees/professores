import type { ParsedAnswer, ParsedItem, ParsedRubricRow } from "./types";

const ITEM_MARKER = /(?:^|\s)([a-eA-E])\)\s*/g;
/** Sequência de "_" (linha em branco pro aluno responder à mão). */
const BLANK_LINE = /_{3,}/g;
/**
 * Mesma linha em branco, mas só quando está no FINAL do texto (com espaço
 * opcional antes/depois, podendo repetir) — usada pra limpar o enunciado
 * quando a questão não tem itens A/B/C. Sem isso, uma questão discursiva de
 * bloco único ("explique... _______________") mostrava a linha do Word
 * *e* as linhas pontilhadas que o sistema já desenha por baixo — duas
 * respostas em branco, uma feia (texto corrido) e uma bonita, empilhadas.
 * Só remove do FIM (não do meio) pra não arriscar apagar um "____" usado de
 * propósito como lacuna no meio de uma frase.
 */
const TRAILING_BLANK_LINES = /(?:\s*_{3,}\s*)+$/;

/**
 * Divide o texto corrido do enunciado em itens A/B/C quando existirem
 * marcadores desse tipo embutidos no texto (não em células de tabela
 * separadas — confirmado nos documentos reais). Se não houver nenhum
 * marcador, devolve lista vazia (a questão é tratada como um bloco único).
 */
export function extractItems(statementText: string): { items: ParsedItem[]; leadingText: string } {
  const matches = [...statementText.matchAll(ITEM_MARKER)];
  if (matches.length === 0) {
    return { items: [], leadingText: statementText.replace(TRAILING_BLANK_LINES, "").trim() };
  }

  const leadingText = statementText.slice(0, matches[0].index).trim();
  const items: ParsedItem[] = [];

  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toUpperCase();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : statementText.length;
    const prompt = statementText
      .slice(start, end)
      .replace(BLANK_LINE, "")
      .trim();
    if (prompt) items.push({ label, prompt });
  }

  return { items, leadingText };
}

/**
 * Alguns documentos colam um bloco de texto duplicado *exatamente*, sem
 * nenhum rótulo entre as cópias (diferente do padrão "Questão N Valor:" já
 * tratado em MID_DRAFT_MARKER) — confirmado em HIS4-1T-001-B, onde o mesmo
 * parágrafo de ~700 caracteres aparece duas vezes seguidas antes do texto
 * base real. Detecta o maior bloco a partir do início que se repete
 * imediatamente (text[0:k] === text[k:2k]) e remove a segunda cópia. Só
 * considera blocos >= 60 caracteres pra nunca confundir com repetições
 * curtas legítimas de prosa.
 */
export function collapseLeadingExactRepeat(text: string): string {
  const n = text.length;
  for (let k = Math.floor(n / 2); k >= 60; k--) {
    if (text.slice(0, k) === text.slice(k, 2 * k)) {
      return (text.slice(0, k) + text.slice(2 * k)).trim();
    }
  }
  return text;
}

// [\s\S] no lugar de "." com flag /s (dotAll) — o target TS do projeto é
// ES2017, que não suporta a flag /s em regex literais.
const COMANDO_PATTERN = /Comando\s+([A-Ea-e])\s*[-:]\s*([\s\S]+?)(?=Comando\s+[A-Ea-e]\s*[-:]|$)/gi;
const RESPOSTA_ESPERADA_PATTERN = /Resposta\s+esperada\s*:\s*([\s\S]+)/i;
const ITEM_GABARITO_PATTERN = /Item\s+([A-Ea-e])\s*:\s*([\s\S]+?)(?=Item\s+[A-Ea-e]\s*:|$)/gi;

/**
 * Dois formatos observados nos documentos reais: "Comando A - ... Resposta
 * esperada: ..." e "Item A: ...". Ambos em prosa, não em tabela.
 */
export function extractProseAnswers(correctionText: string): ParsedAnswer[] {
  const answers: ParsedAnswer[] = [];

  for (const match of correctionText.matchAll(COMANDO_PATTERN)) {
    const [, label, body] = match;
    const respostaMatch = body.match(RESPOSTA_ESPERADA_PATTERN);
    answers.push({
      itemLabel: label.toUpperCase(),
      expectedAnswer: (respostaMatch ? respostaMatch[1] : body).trim(),
      correctionGuidance: respostaMatch ? body.slice(0, respostaMatch.index).trim() || null : null,
    });
  }

  if (answers.length === 0) {
    for (const match of correctionText.matchAll(ITEM_GABARITO_PATTERN)) {
      const [, label, body] = match;
      answers.push({ itemLabel: label.toUpperCase(), expectedAnswer: body.trim(), correctionGuidance: null });
    }
  }

  return answers;
}

const RUBRIC_HEADER_PATTERN = /Crit[ée]rio\s+de\s+Distribui[çc][ãa]o\s+de\s+Pontos/i;
const RUBRIC_LEVEL_PATTERNS: { pattern: RegExp; level: "full" | "partial" | "none" }[] = [
  { pattern: /Pontua[çc][ãa]o\s+Total|Pleno\s+Dom[íi]nio/i, level: "full" },
  { pattern: /Pontua[çc][ãa]o\s+Parcial|Dom[íi]nio\s+Parcial/i, level: "partial" },
  { pattern: /Pontua[çc][ãa]o\s+Nula|Incorret[ao]/i, level: "none" },
];
const ITEM_COLUMN_PATTERN = /Item\s+([A-Ea-e])\s*\(([\d,.]+)\)/i;
const LEADING_POINTS_PATTERN = /^([\d,.]+)\s*ponto[s]?\s*:?\s*/i;

/**
 * Tabela "Critério de Distribuição de Pontos": cabeçalho com uma coluna por
 * item ("Item A (0,30)"), linhas "Pontuação Total/Parcial/Nula" com
 * pontuação + critério na mesma célula.
 */
export function extractRubricTable(rows: string[][]): ParsedRubricRow[] {
  if (rows.length === 0 || !RUBRIC_HEADER_PATTERN.test(rows[0][0] ?? "")) return [];

  const itemLabels: (string | null)[] = rows[0].slice(1).map((cell) => {
    const match = cell.match(ITEM_COLUMN_PATTERN);
    return match ? match[1].toUpperCase() : null;
  });

  const result: ParsedRubricRow[] = [];
  for (const row of rows.slice(1)) {
    const levelMatch = RUBRIC_LEVEL_PATTERNS.find((l) => l.pattern.test(row[0] ?? ""));
    if (!levelMatch) continue;

    row.slice(1).forEach((cell, index) => {
      const trimmed = cell.trim();
      if (!trimmed) return;
      const pointsMatch = trimmed.match(LEADING_POINTS_PATTERN);
      const points = pointsMatch ? Number(pointsMatch[1].replace(",", ".")) : null;
      const criteria = pointsMatch ? trimmed.slice(pointsMatch[0].length).trim() : trimmed;
      result.push({
        itemLabel: itemLabels[index] ?? null,
        level: levelMatch.level,
        points: Number.isFinite(points) ? points : null,
        criteria: criteria || trimmed,
      });
    });
  }

  return result;
}
