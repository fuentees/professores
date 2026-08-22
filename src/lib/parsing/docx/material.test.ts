import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMaterialDocx } from "./material";

function fixture(fileName: string): ArrayBuffer {
  const buffer = readFileSync(resolve(process.cwd(), "test", "fixtures", "docx", fileName));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

describe("parseMaterialDocx", () => {
  it("extrai texto, ano e BNCC de um Word real do acervo", async () => {
    const result = await parseMaterialDocx(fixture("geo4-001.docx"), "geo4-001.docx");

    expect(result.title.length).toBeGreaterThan(2);
    expect(result.body.length).toBeGreaterThan(200);
    expect(result.gradeNames).toContain("4º ano");
    expect(result.subjectNames).toContain("Geografia");
    expect(result.bnccCodes).toContain("EF04GE02");
    expect(result.hasAnswerKey).toBe(true);
  });
});
