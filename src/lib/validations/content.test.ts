import { describe, expect, it } from "vitest";
import { contentSchema } from "./content";

const VALID_CONTENT = {
  title: "Atividade sobre frações",
  subtitle: "",
  shortDescription: "",
  body: "",
  author: "",
  difficulty: "" as const,
  gradeIds: [],
  subjectIds: [],
  curriculumUnitIds: [],
  themeIds: [],
  subthemeIds: [],
  contentTypeIds: ["00000000-0000-4000-8000-000000000001"],
  tagNames: [],
  accessType: "teacher_only" as const,
  allowView: true,
  allowDownload: true,
  allowPrint: true,
  allowComments: false,
  hasAnswerKey: false,
  isFeatured: false,
  status: "draft" as const,
  publishAt: "",
};

describe("contentSchema", () => {
  it("aceita exatamente uma finalidade principal", () => {
    expect(contentSchema.safeParse(VALID_CONTENT).success).toBe(true);
  });

  it("rejeita material sem finalidade principal", () => {
    const result = contentSchema.safeParse({ ...VALID_CONTENT, contentTypeIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejeita várias finalidades principais", () => {
    const result = contentSchema.safeParse({
      ...VALID_CONTENT,
      contentTypeIds: [
        "00000000-0000-4000-8000-000000000001",
        "00000000-0000-4000-8000-000000000002",
      ],
    });
    expect(result.success).toBe(false);
  });
});
