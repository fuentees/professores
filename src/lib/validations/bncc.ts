import { z } from "zod";

export const bnccStageSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  orderIndex: z.coerce.number().int(),
});
export type BnccStageInput = z.infer<typeof bnccStageSchema>;

export const bnccKnowledgeAreaSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  orderIndex: z.coerce.number().int(),
  stageId: z.uuid("Selecione uma etapa."),
});
export type BnccKnowledgeAreaInput = z.infer<typeof bnccKnowledgeAreaSchema>;

export const bnccComponentSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  orderIndex: z.coerce.number().int(),
  knowledgeAreaId: z.uuid("Selecione uma área do conhecimento."),
});
export type BnccComponentInput = z.infer<typeof bnccComponentSchema>;

export const bnccSkillSchema = z.object({
  code: z.string().trim().min(3, "Informe o código da habilidade."),
  description: z.string().trim().min(5, "Informe a descrição da habilidade."),
  thematicUnit: z.string().trim().optional(),
  knowledgeObject: z.string().trim().optional(),
  componentId: z.uuid("Selecione um componente curricular."),
  gradeId: z.uuid().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});
export type BnccSkillInput = z.infer<typeof bnccSkillSchema>;
