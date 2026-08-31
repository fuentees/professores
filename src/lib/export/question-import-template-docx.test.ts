import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseQuestionDocx } from "@/lib/parsing/docx";
import { generateQuestionImportTemplate } from "./question-import-template-docx";

describe("modelo oficial de importação Word", () => {
  it("é lido pelo mesmo importador usado em produção", async () => {
    const bytes = await generateQuestionImportTemplate();
    if (process.env.WRITE_QUESTION_TEMPLATE_QA === "1") {
      const outputDir = path.resolve(process.cwd(), "tmp/question-template-qa");
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(path.join(outputDir, "modelo-oficial-importacao-questao.docx"), bytes);
    }
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const { draft } = await parseQuestionDocx(arrayBuffer);

    expect(draft.code.value).toBe("HIS4-1T-001");
    expect(draft.subjectName.value).toBe("História");
    expect(draft.gradeName.value).toBe("4º ano");
    expect(draft.bnccCodes).toContain("EF04HI01");
    expect(draft.bnccSkills[0]?.description).toContain("descrição completa");
    expect(draft.leadingText).toContain("enunciado completo");
    expect(draft.correctionProse).toContain("resposta esperada");
  });
});
