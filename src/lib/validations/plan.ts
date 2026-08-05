import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  billingPeriod: z.enum(["free", "monthly", "yearly"]),
  downloadLimit: z.coerce.number().int().optional(),
  features: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
  orderIndex: z.coerce.number().int(),
});

export type PlanInput = z.infer<typeof planSchema>;
