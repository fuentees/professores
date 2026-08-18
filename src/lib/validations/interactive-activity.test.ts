import { describe, expect, it } from "vitest";
import { interactiveActivitySchema } from "./interactive-activity";

describe("interactiveActivitySchema", () => {
  it("aceita um quiz válido", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "quiz",
      config: {
        questions: [
          {
            id: "q1",
            prompt: "2 + 2?",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "4" },
            ],
            correctOptionId: "b",
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejeita quiz com menos de 2 alternativas", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "quiz",
      config: {
        questions: [
          { id: "q1", prompt: "2 + 2?", options: [{ id: "a", text: "4" }], correctOptionId: "a" },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quiz sem nenhuma pergunta", () => {
    const result = interactiveActivitySchema.safeParse({ activityType: "quiz", config: { questions: [] } });
    expect(result.success).toBe(false);
  });

  it("rejeita quando o shape do config não bate com o activityType (união discriminada)", () => {
    // config de true_false enviado com activityType "quiz"
    const result = interactiveActivitySchema.safeParse({
      activityType: "quiz",
      config: { statements: [{ id: "s1", statement: "Água ferve a 100°C.", isTrue: true }] },
    });
    expect(result.success).toBe(false);
  });

  it("aceita verdadeiro/falso válido", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "true_false",
      config: { statements: [{ id: "s1", statement: "O Sol é uma estrela.", isTrue: true }] },
    });
    expect(result.success).toBe(true);
  });

  it("rejeita associação com menos de 2 pares", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "matching",
      config: { pairs: [{ id: "p1", left: "Brasil", right: "Brasília" }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejeita completar lacunas sem o marcador ___ na frase", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "fill_blank",
      config: { sentences: [{ id: "s1", text: "O Brasil foi colonizado em 1500.", answer: "1500" }] },
    });
    expect(result.success).toBe(false);
  });

  it("aceita completar lacunas com o marcador ___", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "fill_blank",
      config: { sentences: [{ id: "s1", text: "O Brasil foi colonizado em ___.", answer: "1500" }] },
    });
    expect(result.success).toBe(true);
  });

  it("aceita uma simulação com simulationKey válido", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "simulation",
      config: { simulationKey: "fracoes" },
    });
    expect(result.success).toBe(true);
  });

  it("rejeita simulação com simulationKey desconhecido", () => {
    const result = interactiveActivitySchema.safeParse({
      activityType: "simulation",
      config: { simulationKey: "gravidade-quantica" },
    });
    expect(result.success).toBe(false);
  });

  it("rejeita um activityType que não existe", () => {
    const result = interactiveActivitySchema.safeParse({ activityType: "crossword", config: {} });
    expect(result.success).toBe(false);
  });
});
