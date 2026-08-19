import { z } from "zod";

/**
 * URL externa opcional restrita a http(s) — sem isto, um `javascript:` ou
 * `data:` salvo aqui seria aberto depois via `window.open`/`iframe src` sem
 * nenhum outro filtro (open-object-button.tsx, aulas de curso).
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: "Informe uma URL http:// ou https:// válida." },
  );
