import { z } from "zod";

export const inclusionProfileSchema = z.enum(["TDAH", "TEA", "DI", "Dislexia", "TOD", "Baixa visão"]);

export const lessonPlanInputSchema = z.object({
  subjectId: z.uuid("Selecione a disciplina."),
  gradeId: z.uuid("Selecione a série."),
  theme: z.string().trim().min(3, "Informe o tema central.").max(180),
  durationMinutes: z.coerce.number().int().min(10).max(600),
  classCount: z.coerce.number().int().min(1).max(20),
  teacherObjectives: z.string().trim().max(1500).default(""),
  inclusionProfiles: z.array(inclusionProfileSchema).max(6).default([]),
  classContext: z.string().trim().max(1500).default(""),
  resources: z.string().trim().max(1000).default(""),
});

export type LessonPlanInput = z.infer<typeof lessonPlanInputSchema>;

export const lessonPlanOutputSchema = z.object({
  title: z.string().min(3).max(180),
  summary: z.string().min(10).max(1200),
  bnccCodes: z.array(z.string().max(20)).max(12),
  learningObjectives: z.array(z.string().min(3).max(500)).min(1).max(12),
  contents: z.array(z.string().min(2).max(500)).min(1).max(15),
  methodology: z.array(z.string().min(3).max(900)).min(1).max(15),
  resources: z.array(z.string().min(2).max(300)).min(1).max(15),
  schedule: z.array(z.object({
    phase: z.string().min(2).max(100),
    durationMinutes: z.number().int().min(1).max(600),
    actions: z.string().min(3).max(1200),
  })).min(1).max(20),
  assessment: z.array(z.object({
    criterion: z.string().min(2).max(300),
    evidence: z.string().min(2).max(500),
    instrument: z.string().min(2).max(300),
  })).min(1).max(12),
  adaptations: z.array(z.object({
    profile: z.string().min(2).max(80),
    strategies: z.array(z.string().min(2).max(500)).min(1).max(10),
  })).max(10),
  homework: z.string().max(1000),
  teacherNotes: z.array(z.string().min(2).max(500)).max(12),
});

export type LessonPlanOutput = z.infer<typeof lessonPlanOutputSchema>;

export const correctionInputSchema = z.object({
  correctionType: z.enum(["exercise", "essay"]),
  subjectId: z.uuid().optional().or(z.literal("")),
  gradeId: z.uuid().optional().or(z.literal("")),
  context: z.string().trim().max(1200).default(""),
  imageDataUrl: z.string().startsWith("data:image/").max(7_000_000),
});

export type CorrectionInput = z.infer<typeof correctionInputSchema>;

export const correctionOutputSchema = z.object({
  title: z.string().min(3).max(180),
  transcribedContent: z.string().min(1).max(12000),
  overallResult: z.string().min(3).max(1500),
  score: z.number().min(0).max(100).nullable(),
  maxScore: z.number().positive().max(100).nullable(),
  suggestedAnswer: z.string().max(5000),
  explanation: z.array(z.string().min(2).max(1000)).min(1).max(20),
  strengths: z.array(z.string().min(2).max(500)).max(12),
  improvements: z.array(z.string().min(2).max(500)).max(12),
  criteria: z.array(z.object({
    name: z.string().min(2).max(100),
    score: z.number().min(0).max(100).nullable(),
    maxScore: z.number().positive().max(100).nullable(),
    feedback: z.string().min(2).max(800),
  })).max(12),
  confidence: z.enum(["high", "medium", "low"]),
  needsTeacherReview: z.boolean(),
  reviewReason: z.string().max(800).nullable(),
});

export type CorrectionOutput = z.infer<typeof correctionOutputSchema>;
