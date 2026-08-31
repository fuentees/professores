import { describe, expect, it } from "vitest";
import { getBnccTaxonomyTarget } from "./code";

describe("getBnccTaxonomyTarget", () => {
  it("identifica componentes do Ensino Fundamental", () => {
    expect(getBnccTaxonomyTarget("EF04HI03")).toEqual({
      stageName: "Ensino Fundamental",
      areaName: "Ciências Humanas",
      componentName: "História",
    });
    expect(getBnccTaxonomyTarget("EF15LP01")?.componentName).toBe("Língua Portuguesa");
  });

  it("aceita códigos válidos da Educação Infantil e do Ensino Médio", () => {
    expect(getBnccTaxonomyTarget("EI03EO01")?.stageName).toBe("Educação Infantil");
    expect(getBnccTaxonomyTarget("EM13MAT101")?.componentName).toBe("Matemática");
  });

  it("não tenta adivinhar códigos desconhecidos", () => {
    expect(getBnccTaxonomyTarget("EF04XX01")).toBeNull();
    expect(getBnccTaxonomyTarget("QUALQUER01")).toBeNull();
  });
});
