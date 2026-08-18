import { z } from "zod";

export const LEARNING_ACTIVITY_TYPES = [
  "quiz",
  "true_false",
  "matching",
  "memory",
  "fill_blank",
  "ordering",
  "flashcards",
  "simulation",
] as const;

export type LearningActivityType = (typeof LEARNING_ACTIVITY_TYPES)[number];

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Informe o texto da alternativa."),
});

const quizConfigSchema = z.object({
  activityType: z.literal("quiz"),
  config: z.object({
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          prompt: z.string().trim().min(1, "Informe o enunciado da pergunta."),
          options: z.array(optionSchema).min(2, "Cada pergunta precisa de ao menos 2 alternativas."),
          correctOptionId: z.string().min(1, "Selecione a alternativa correta."),
        }),
      )
      .min(1, "Adicione ao menos uma pergunta."),
  }),
});

const trueFalseConfigSchema = z.object({
  activityType: z.literal("true_false"),
  config: z.object({
    statements: z
      .array(
        z.object({
          id: z.string().min(1),
          statement: z.string().trim().min(1, "Informe a afirmação."),
          isTrue: z.boolean(),
        }),
      )
      .min(1, "Adicione ao menos uma afirmação."),
  }),
});

const matchingConfigSchema = z.object({
  activityType: z.literal("matching"),
  config: z.object({
    pairs: z
      .array(
        z.object({
          id: z.string().min(1),
          left: z.string().trim().min(1, "Informe o item da esquerda."),
          right: z.string().trim().min(1, "Informe o item correspondente."),
        }),
      )
      .min(2, "Adicione ao menos 2 pares."),
  }),
});

const memoryConfigSchema = z.object({
  activityType: z.literal("memory"),
  config: z.object({
    pairs: z
      .array(
        z.object({
          id: z.string().min(1),
          a: z.string().trim().min(1, "Informe o conteúdo da primeira carta."),
          b: z.string().trim().min(1, "Informe o conteúdo da carta correspondente."),
        }),
      )
      .min(2, "Adicione ao menos 2 pares de cartas."),
  }),
});

const fillBlankConfigSchema = z.object({
  activityType: z.literal("fill_blank"),
  config: z.object({
    sentences: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z
            .string()
            .trim()
            .min(1, "Informe a frase.")
            .refine((v) => v.includes("___"), "Use ___ para marcar a lacuna."),
          answer: z.string().trim().min(1, "Informe a resposta correta."),
        }),
      )
      .min(1, "Adicione ao menos uma frase."),
  }),
});

const orderingConfigSchema = z.object({
  activityType: z.literal("ordering"),
  config: z.object({
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().trim().min(1, "Informe o item."),
        }),
      )
      .min(2, "Adicione ao menos 2 itens (na ordem correta)."),
  }),
});

const flashcardsConfigSchema = z.object({
  activityType: z.literal("flashcards"),
  config: z.object({
    cards: z
      .array(
        z.object({
          id: z.string().min(1),
          front: z.string().trim().min(1, "Informe a frente do cartão."),
          back: z.string().trim().min(1, "Informe o verso do cartão."),
        }),
      )
      .min(1, "Adicione ao menos um cartão."),
  }),
});

export const SIMULATION_KEYS = ["fracoes", "area", "probabilidade"] as const;
export type SimulationKey = (typeof SIMULATION_KEYS)[number];

const simulationConfigSchema = z.object({
  activityType: z.literal("simulation"),
  config: z.object({
    simulationKey: z.enum(SIMULATION_KEYS),
  }),
});

export const interactiveActivitySchema = z.discriminatedUnion("activityType", [
  quizConfigSchema,
  trueFalseConfigSchema,
  matchingConfigSchema,
  memoryConfigSchema,
  fillBlankConfigSchema,
  orderingConfigSchema,
  flashcardsConfigSchema,
  simulationConfigSchema,
]);

export type InteractiveActivityInput = z.infer<typeof interactiveActivitySchema>;
export type QuizConfig = z.infer<typeof quizConfigSchema>["config"];
export type TrueFalseConfig = z.infer<typeof trueFalseConfigSchema>["config"];
export type MatchingConfig = z.infer<typeof matchingConfigSchema>["config"];
export type MemoryConfig = z.infer<typeof memoryConfigSchema>["config"];
export type FillBlankConfig = z.infer<typeof fillBlankConfigSchema>["config"];
export type OrderingConfig = z.infer<typeof orderingConfigSchema>["config"];
export type FlashcardsConfig = z.infer<typeof flashcardsConfigSchema>["config"];
export type SimulationConfig = z.infer<typeof simulationConfigSchema>["config"];
