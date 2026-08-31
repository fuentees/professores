import { describe, expect, it } from "vitest";
import { extractBnccSkills } from "./extract-fields";

describe("extractBnccSkills", () => {
  it("preserva código e descrição do Word", () => {
    expect(extractBnccSkills("(EF04GE01) - Selecionar elementos da cultura local.")).toEqual([
      { code: "EF04GE01", description: "Selecionar elementos da cultura local." },
    ]);
  });

  it("separa várias habilidades e normaliza códigos minúsculos", () => {
    expect(extractBnccSkills("ef04hi01 — Reconhecer mudanças; (EF04HI03): Identificar transformações.")).toEqual([
      { code: "EF04HI01", description: "Reconhecer mudanças" },
      { code: "EF04HI03", description: "Identificar transformações." },
    ]);
  });
});
