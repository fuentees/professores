import "server-only";

import { createHash } from "node:crypto";
import type { z } from "zod";

export const DEFAULT_AI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

export class AiConfigurationError extends Error {}
export class AiProviderError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

type JsonSchema = Record<string, unknown>;
type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" };

type ResponsePayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

function stableSafetyIdentifier(profileId: string) {
  return createHash("sha256").update(profileId).digest("hex").slice(0, 32);
}

function extractOutputText(payload: ResponsePayload): string {
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal") throw new AiProviderError(content.refusal || "A solicitação foi recusada.", 422);
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new AiProviderError("A IA não devolveu um resultado utilizável.", 502);
}

export async function createStructuredResponse<T>({
  profileId,
  instructions,
  content,
  schemaName,
  jsonSchema,
  validator,
  maxOutputTokens = 5000,
}: {
  profileId: string;
  instructions: string;
  content: InputContent[];
  schemaName: string;
  jsonSchema: JsonSchema;
  validator: z.ZodType<T>;
  maxOutputTokens?: number;
}): Promise<{ data: T; model: string; inputTokens: number | null; outputTokens: number | null }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiConfigurationError("A IA ainda não foi configurada. Adicione OPENAI_API_KEY nas variáveis do projeto.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_AI_MODEL,
      store: false,
      safety_identifier: stableSafetyIdentifier(profileId),
      instructions,
      input: [{ role: "user", content }],
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const payload = (await response.json().catch(() => ({}))) as ResponsePayload;
  if (!response.ok) {
    const providerMessage = payload.error?.message;
    const friendly = response.status === 429
      ? "A IA está ocupada no momento. Aguarde um pouco e tente novamente."
      : response.status === 401
        ? "A chave da IA não é válida. Revise a configuração do projeto."
        : providerMessage || "Não foi possível falar com a IA agora.";
    throw new AiProviderError(friendly, response.status);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractOutputText(payload));
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw new AiProviderError("A IA devolveu um resultado incompleto. Tente novamente.", 502);
  }

  const validated = validator.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiProviderError("A IA devolveu um formato inesperado. Tente novamente.", 502);
  }

  return {
    data: validated.data,
    model: DEFAULT_AI_MODEL,
    inputTokens: payload.usage?.input_tokens ?? null,
    outputTokens: payload.usage?.output_tokens ?? null,
  };
}
