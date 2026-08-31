import { describe, expect, it } from "vitest";
import { correctionInputSchema, lessonPlanInputSchema, lessonPlanOutputSchema } from "@/lib/ai/schemas";

describe("AI teacher tools schemas", () => {
  it("rejects lesson plans without a valid grade and subject", () => {
    const result = lessonPlanInputSchema.safeParse({ subjectId: "x", gradeId: "y", theme: "Frações", durationMinutes: 50, classCount: 1 });
    expect(result.success).toBe(false);
  });

  it("accepts a complete structured lesson plan", () => {
    const result = lessonPlanOutputSchema.safeParse({
      title: "Frações no cotidiano",
      summary: "A turma investiga frações em situações próximas da realidade.",
      bnccCodes: [],
      learningObjectives: ["Representar frações."],
      contents: ["Frações"],
      methodology: ["Levantamento de conhecimentos prévios."],
      resources: ["Cartolina"],
      schedule: [{ phase: "Abertura", durationMinutes: 10, actions: "Conversa inicial." }],
      assessment: [{ criterion: "Representação", evidence: "Registro do aluno", instrument: "Observação" }],
      adaptations: [],
      homework: "",
      teacherNotes: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects oversized image payloads before calling the provider", () => {
    const result = correctionInputSchema.safeParse({ correctionType: "exercise", imageDataUrl: `data:image/jpeg;base64,${"a".repeat(7_000_001)}` });
    expect(result.success).toBe(false);
  });
});
