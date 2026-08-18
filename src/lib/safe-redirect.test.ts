import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "./safe-redirect";

describe("isSafeRedirectPath", () => {
  it("aceita caminhos internos simples", () => {
    expect(isSafeRedirectPath("/painel")).toBe(true);
    expect(isSafeRedirectPath("/materiais?nivel=abc")).toBe(true);
  });

  it("rejeita ausência de valor", () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath("")).toBe(false);
  });

  it("rejeita URLs absolutas para outro domínio", () => {
    expect(isSafeRedirectPath("https://evil.com")).toBe(false);
    expect(isSafeRedirectPath("evil.com")).toBe(false);
  });

  it("rejeita protocol-relative // (mesmo começando com barra)", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath("//evil.com/painel")).toBe(false);
  });

  it("rejeita a variante com barra invertida que alguns navegadores normalizam para //", () => {
    expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
  });
});
