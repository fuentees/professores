import { z } from "zod";

const baseCatalogFields = {
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  description: z.string().trim().optional(),
  orderIndex: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
};

export const educationLevelSchema = z.object(baseCatalogFields);
export type EducationLevelInput = z.infer<typeof educationLevelSchema>;

export const gradeSchema = z.object({
  ...baseCatalogFields,
  educationLevelId: z.uuid("Selecione um nível de ensino."),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export const subjectSchema = z.object({
  ...baseCatalogFields,
  shortName: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use um código hexadecimal, ex: #2563eb.")
    .optional()
    .or(z.literal("")),
});
export type SubjectInput = z.infer<typeof subjectSchema>;

export const curriculumUnitSchema = z.object({
  ...baseCatalogFields,
  gradeId: z.uuid("Selecione uma série."),
  subjectId: z.uuid("Selecione uma disciplina."),
});
export type CurriculumUnitInput = z.infer<typeof curriculumUnitSchema>;

export const themeSchema = z.object({
  ...baseCatalogFields,
  curriculumUnitId: z.uuid("Selecione uma unidade."),
});
export type ThemeInput = z.infer<typeof themeSchema>;

export const subthemeSchema = z.object({
  ...baseCatalogFields,
  themeId: z.uuid("Selecione um tema."),
});
export type SubthemeInput = z.infer<typeof subthemeSchema>;

export const contentTypeSchema = z.object({
  ...baseCatalogFields,
  icon: z.string().trim().optional(),
});
export type ContentTypeInput = z.infer<typeof contentTypeSchema>;

export const gradeSubjectSchema = z.object({
  gradeId: z.uuid(),
  subjectId: z.uuid(),
});
export type GradeSubjectInput = z.infer<typeof gradeSubjectSchema>;
