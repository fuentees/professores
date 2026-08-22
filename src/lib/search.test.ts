import { describe, expect, it } from "vitest";
import { getSearchTokens, matchesSearch, toPostgrestSearchToken } from "@/lib/search";

describe("busca em linguagem natural", () => {
  it("remove palavras de ligação e preserva os termos importantes", () => {
    expect(getSearchTokens("atividade sobre frações para o 6º ano")).toEqual([
      "atividade",
      "frações",
      "6º",
    ]);
  });

  it("encontra palavras mesmo sem acentos", () => {
    expect(matchesSearch("Simulador de Frações", ["fracoes"])).toBe(true);
  });

  it("remove caracteres que alterariam a expressão do PostgREST", () => {
    expect(toPostgrestSearchToken('frações,(%)')).toBe("frações");
  });
});
