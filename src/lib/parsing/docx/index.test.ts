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
    expect(fullLevelRows.every((r) => typeof r.criteria === "string" && r.criteria.length > 0)).toBe(true);
  });

  it("sinaliza quando o documento tem mais de um enunciado candidato (HIS4-1T-002)", async () => {
    const { draft } = await parseQuestionDocx(loadFixture("his4-1t-002.docx"));

    expect(draft.statementCandidates.length).toBeGreaterThan(1);
    expect(draft.warnings.some((w) => w.field === "statement")).toBe(true);
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
