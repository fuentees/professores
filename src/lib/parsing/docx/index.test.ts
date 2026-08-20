import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseQuestionDocx } from "./index";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../test/fixtures/docx");

function loadFixture(fileName: string): ArrayBuffer {
  const buf = readFileSync(path.join(FIXTURES_DIR, fileName));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe("parseQuestionDocx — documentos reais do acervo", () => {
  it("extrai código, disciplina, série e BNCC de uma questão discursiva simples (HIS4-1T-005)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-005.docx"));

    expect(draft.code.value).toBe("HIS4-1T-005");
    expect(draft.subjectName.value).toBe("História");
    expect(draft.gradeName.value).toBe("4º Ano");
    expect(draft.bnccCodes).toContain("EF04HI03");
    expect(draft.difficultyRaw.value).toBe("hard");
    expect(draft.bloomPrimaryRaw.value).toBe("avaliar");
    expect(draft.statementCandidates).toHaveLength(1);
    expect(draft.statementCandidates[0]).toContain("prefeitura");
    // Este documento não tem tabela de rubrica, só prosa de correção.
    expect(draft.rubrics).toHaveLength(0);
    expect(draft.correctionProse).not.toBeNull();
  });

  it("remove rascunho duplicado colado no meio do mesmo parágrafo (HIS4-1T-005)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-005.docx"));

    // O candidato bruto (statementCandidates) preserva a duplicação real do
    // documento — é leadingText (o que efetivamente vai pra questions.
    // statement) que precisa estar limpo. "casarão" só aparece uma vez por
    // cópia do enunciado, então serve pra detectar duplicação (diferente de
    // "prefeitura", que já aparece 2x dentro de uma única cópia legítima).
    expect(draft.leadingText).not.toMatch(/Quest[ãa]o\s*\d+\s*Valor/i);
    expect(draft.leadingText.match(/casar[ãa]o/gi)).toHaveLength(1);
    expect(draft.leadingText.length).toBeLessThan(draft.statementCandidates[0].length);
  });

  it("preserva espaços entre palavras que o Word divide em runs diferentes (HIS4-1T-004)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-004.docx"));

    // O fast-xml-parser corta espaço em branco de cada nó de texto por
    // padrão (trimValues) — isso apagava exatamente os espaços "soltos"
    // entre runs do Word (ex.: "recordações em"+" "+"família" virava
    // "recordações emfamília"). Ver ooxml.ts (trimValues: false) e
    // walk-body.ts (junção com heurística de fronteira de frase).
    expect(draft.leadingText).toContain("recordações em família");
    expect(draft.leadingText).not.toContain("emfamília");
    expect(draft.leadingText).toContain("QUADRO 1: A avó");
    expect(draft.leadingText).not.toContain("QUADRO 1:A avó");
  });

  it("extrai itens A/B/C embutidos no texto corrido (HIS4-1T-001_A)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-001-a.docx"));

    expect(draft.code.value).toBe("HIS4-1T-001");
    expect(draft.items.length).toBeGreaterThanOrEqual(3);
    expect(draft.items.map((i) => i.label)).toEqual(expect.arrayContaining(["A", "B", "C"]));
    expect(draft.answers.length).toBeGreaterThan(0);
  });

  it("extrai a tabela de rubrica com critérios de pontuação por item (HIS4-1T-001_B)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-001-b.docx"));

    expect(draft.rubrics.length).toBeGreaterThan(0);
    const fullLevelRows = draft.rubrics.filter((r) => r.level === "full");
    expect(fullLevelRows.length).toBeGreaterThan(0);
    // Este documento também repete o bloco "Fonte Material Escrita..." (~700
    // caracteres) duas vezes seguidas sem nenhum rótulo entre as cópias —
    // ver collapseLeadingExactRepeat. leadingText precisa ter só uma cópia.
    expect(draft.leadingText.match(/Fonte Material Escrita/g)).toHaveLength(1);
    expect(fullLevelRows.every((r) => typeof r.criteria === "string" && r.criteria.length > 0)).toBe(true);
  });

  it("sinaliza quando o documento tem mais de um enunciado candidato (HIS4-1T-002)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-002.docx"));

    expect(draft.statementCandidates.length).toBeGreaterThan(1);
    expect(draft.warnings.some((w) => w.field === "statement")).toBe(true);
  });

  it("remove a linha em branco (___) do fim do enunciado quando não há itens (HIS4-1T-002)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-002.docx"));

    // Sem isso, a prova impressa mostrava a linha crua do Word *e* as linhas
    // pontilhadas que o sistema já desenha — duas respostas em branco.
    expect(draft.leadingText).not.toMatch(/_{3,}/);
    expect(draft.leadingText.endsWith('diferentes?"')).toBe(true);
  });

  it("separa opções de associação coladas (HIS4-1T-004)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-004.docx"));

    // "...reunida.(   ) Fonte Material (Objeto)(   ) Fonte Oral..." — cada
    // "(   )" é uma opção pro aluno marcar; sem espaço nenhum entre elas
    // ficava ilegível na impressão.
    expect(draft.leadingText).not.toContain("Objeto)(");
  });

  it("extrai imagens e sinaliza .emf como não suportado para preview (HIS4-1T-005)", async () => {
    const { draft, media } = await parseQuestionDocx(loadFixture("his4-1t-005.docx"));

    expect(media.length).toBeGreaterThan(0);
    expect(media.some((m) => !m.supported)).toBe(true);
    expect(draft.warnings.some((w) => w.field === "assets")).toBe(true);
  });

  it("extrai imagens de conteúdo reais (HIS4-1T-004)", async () => {
    const { media } = await parseQuestionDocx(loadFixture("his4-1t-004.docx"));

    expect(media.length).toBeGreaterThan(0);
    expect(media.every((m) => m.buffer.length > 0)).toBe(true);
  });

  it("detecta divergência entre o código do conteúdo e o nome do arquivo (GEO 4-001)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("geo4-001.docx"));

    expect(draft.code.value).not.toBeNull();
    // O nome do arquivo é "GEO 4-001" — o código real do conteúdo é bem
    // diferente (com espaços/segmentos extras), confirmando a divergência
    // real encontrada neste documento. A comparação com o nome do arquivo
    // em si é feita na Server Action de importação, não no parser puro.
    expect(draft.code.value).not.toBe("GEO 4-001");
    expect(draft.subjectName.value).toBe("Geografia");
    expect(draft.bnccCodes).toContain("EF04GE01");
  });

  it("nunca lança para nenhum dos documentos reais do acervo (robustez)", async () => {
    const files = [
      "his4-1t-001-a.docx",
      "his4-1t-001-b.docx",
      "his4-1t-002.docx",
      "his4-1t-003.docx",
      "his4-1t-004.docx",
      "his4-1t-005.docx",
      "geo4-001.docx",
    ];

    for (const file of files) {
      const { draft } = await parseQuestionDocx(loadFixture(file));
      expect(draft.code.value, `${file} deveria ter um código extraído`).not.toBeNull();
      expect(draft.blocks.length, `${file} deveria ter blocos de conteúdo`).toBeGreaterThan(0);
    }
  });
});
