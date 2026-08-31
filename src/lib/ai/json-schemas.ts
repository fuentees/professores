export const lessonPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    bnccCodes: { type: "array", items: { type: "string" } },
    learningObjectives: { type: "array", items: { type: "string" } },
    contents: { type: "array", items: { type: "string" } },
    methodology: { type: "array", items: { type: "string" } },
    resources: { type: "array", items: { type: "string" } },
    schedule: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          phase: { type: "string" },
          durationMinutes: { type: "integer" },
          actions: { type: "string" },
        },
        required: ["phase", "durationMinutes", "actions"],
      },
    },
    assessment: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterion: { type: "string" },
          evidence: { type: "string" },
          instrument: { type: "string" },
        },
        required: ["criterion", "evidence", "instrument"],
      },
    },
    adaptations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          profile: { type: "string" },
          strategies: { type: "array", items: { type: "string" } },
        },
        required: ["profile", "strategies"],
      },
    },
    homework: { type: "string" },
    teacherNotes: { type: "array", items: { type: "string" } },
  },
  required: [
    "title", "summary", "bnccCodes", "learningObjectives", "contents", "methodology",
    "resources", "schedule", "assessment", "adaptations", "homework", "teacherNotes",
  ],
} as const;

export const correctionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    transcribedContent: { type: "string" },
    overallResult: { type: "string" },
    score: { type: ["number", "null"] },
    maxScore: { type: ["number", "null"] },
    suggestedAnswer: { type: "string" },
    explanation: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          score: { type: ["number", "null"] },
          maxScore: { type: ["number", "null"] },
          feedback: { type: "string" },
        },
        required: ["name", "score", "maxScore", "feedback"],
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    needsTeacherReview: { type: "boolean" },
    reviewReason: { type: ["string", "null"] },
  },
  required: [
    "title", "transcribedContent", "overallResult", "score", "maxScore", "suggestedAnswer",
    "explanation", "strengths", "improvements", "criteria", "confidence", "needsTeacherReview", "reviewReason",
  ],
} as const;
