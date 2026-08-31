import type { ExtractedField, ParsedBnccSkill } from "./types";

/**
 * Busca um rótulo nas células de uma tabela (linha por linha). Dois layouts
 * observados nos documentos reais: rótulo e valor na MESMA célula
 * ("Componente Curricular: História"), ou rótulo sozinho numa célula com o
 * valor na célula seguinte da mesma linha (a linha do código costuma vir
 * assim: célula 1 = "CÓDIGO DA QUESTÃO:", célula 2 = "HIS4-1T-005").
 */
export function extractByLabel(rows: string[][], labelPattern: RegExp): ExtractedField<string> {
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      const match = cell.match(labelPattern);
      if (!match) continue;

      const trailing = cell.slice((match.index ?? 0) + match[0].length).trim();
      if (trailing) return { value: trailing, confidence: "high", raw: cell };

      const nextCell = row[i + 1]?.trim();
      if (nextCell) return { value: nextCell, confidence: "high", raw: `${cell} | ${nextCell}` };
    }
  }
  return { value: null, confidence: "low" };
}

const LABEL_PATTERNS = {
  code: /C[ÓO]DIGO\s+DA\s+QUEST[ÃA]O\s*:\s*/i,
  subject: /Componente\s+Curricular\s*:\s*/i,
  grade: /Ano\/S[ée]rie\s*:\s*/i,
  curriculumUnit: /Unidade\s+Tem[áa]tica\s*:\s*/i,
  academicPeriod: /Trimestre\/Bimestre\s*:\s*/i,
  knowledgeObject: /Objeto\s+de\s+Conhecimento\s*\(Conte[úu]do\)\s*:\s*/i,
  bncc: /Habilidade\s+BNCC\s*:\s*/i,
  complexity: /N[íi]vel\s+de\s+Complexidade\s*:\s*/i,
  pedagogicalNote: /Nota\s+pedag[óo]gica\s+de\s+articula[çc][ãa]o\s*:\s*/i,
};

export function extractHeaderFields(rows: string[][]) {
  return {
    code: extractByLabel(rows, LABEL_PATTERNS.code),
    subjectName: extractByLabel(rows, LABEL_PATTERNS.subject),
    gradeName: extractByLabel(rows, LABEL_PATTERNS.grade),
    curriculumUnitName: extractByLabel(rows, LABEL_PATTERNS.curriculumUnit),
    academicPeriodRaw: extractByLabel(rows, LABEL_PATTERNS.academicPeriod),
    knowledgeObjectRaw: extractByLabel(rows, LABEL_PATTERNS.knowledgeObject),
    bnccRaw: extractByLabel(rows, LABEL_PATTERNS.bncc),
    complexityRaw: extractByLabel(rows, LABEL_PATTERNS.complexity),
    pedagogicalNote: extractByLabel(rows, LABEL_PATTERNS.pedagogicalNote),
  };
}

/** Divide a lista "* item1.* item2." em itens individuais, preservando o texto verbatim. */
export function splitKnowledgeObjects(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("*")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "Ano/Série: 4º Ano]" — limpa colchetes/pontuação solta comuns nos documentos reais, sem alterar o conteúdo. */
export function cleanStrayPunctuation(value: string | null): string | null {
  if (!value) return value;
  return value.replace(/[\]\[]+$/g, "").trim() || null;
}

// Educação Infantil, Ensino Fundamental e Ensino Médio. Mantemos o padrão
// estrito para não transformar números ou siglas soltas do documento em uma
// habilidade curricular inexistente.
const BNCC_CODE_PATTERN = /\(?\b((?:EI\d{2}[A-Z]{2}\d{2})|(?:EF\d{2}[A-Z]{2}\d{2})|(?:EM\d{2}(?:[A-Z]{2}\d{2}|[A-Z]{3}\d{3})))\b\)?/gi;

export function extractBnccSkills(raw: string | null): ParsedBnccSkill[] {
  if (!raw) return [];

  const matches = [...raw.toUpperCase().matchAll(BNCC_CODE_PATTERN)];
  const originalMatches = [...raw.matchAll(BNCC_CODE_PATTERN)];
  const skills = new Map<string, ParsedBnccSkill>();

  for (let index = 0; index < matches.length; index++) {
    const code = matches[index][1];
    const originalMatch = originalMatches[index];
    const start = (originalMatch.index ?? 0) + originalMatch[0].length;
    const end = originalMatches[index + 1]?.index ?? raw.length;
    const description = raw
      .slice(start, end)
      .replace(/^[\s)\]};:,.\-–—]+/, "")
      .replace(/[\s;|]+$/, "")
      .trim();

    if (!skills.has(code)) {
      skills.set(code, { code, description: description.length >= 5 ? description : null });
    }
  }

  return [...skills.values()];
}

export function extractBnccCodes(raw: string | null): string[] {
  return extractBnccSkills(raw).map((skill) => skill.code);
}

/** "[ ] Fácil      [X] Médio      [ ] Difícil" → identifica qual opção tem a marca. */
export function extractDifficulty(raw: string | null): ExtractedField<"easy" | "medium" | "hard"> {
  if (!raw) return { value: null, confidence: "low" };

  const options: { pattern: RegExp; value: "easy" | "medium" | "hard" }[] = [
    { pattern: /\[\s*[xX]\s*\]\s*F[áa]cil/, value: "easy" },
    { pattern: /\[\s*[xX]\s*\]\s*M[ée]dio/, value: "medium" },
    { pattern: /\[\s*[xX]\s*\]\s*Dif[íi]cil/, value: "hard" },
  ];

  const matched = options.filter((o) => o.pattern.test(raw));
  if (matched.length === 1) {
    return { value: matched[0].value, confidence: "high", raw };
  }
  // Nenhuma marcação encontrada, ou mais de uma (documento inconsistente) —
  // não adivinha, deixa pra revisão humana.
  return { value: null, confidence: "low", raw };
}

const BLOOM_LEVEL_NAMES = ["lembrar", "entender", "aplicar", "analisar", "avaliar", "criar"];

/** "...situada no 5º nível da Taxonomia de Bloom: Avaliar (Julgamento/Crítica)..." */
export function extractBloomLevel(raw: string | null): ExtractedField<string> {
  if (!raw) return { value: null, confidence: "low" };
  const lower = raw.toLowerCase();
  const found = BLOOM_LEVEL_NAMES.find((level) => {
    const pattern = new RegExp(`taxonomia\\s+de\\s+bloom\\s*:?\\s*${level}|:\\s*${level}\\b`, "i");
    return pattern.test(lower);
  });
  if (found) return { value: found, confidence: "medium", raw };
  return { value: null, confidence: "low", raw };
}
