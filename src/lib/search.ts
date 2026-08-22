const STOP_WORDS = new Set([
  "a",
  "as",
  "ano",
  "anos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "o",
  "os",
  "para",
  "por",
  "sobre",
  "serie",
  "série",
  "uma",
  "um",
]);

function comparable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/**
 * Transforma uma frase natural em poucos termos úteis. A busca deixa de
 * exigir que o conteúdo repita a frase inteira digitada pelo professor.
 */
export function getSearchTokens(value: string): string[] {
  const tokens = value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

  return [...new Set(tokens)].slice(0, 6);
}

export function matchesSearch(value: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = comparable(value);
  return tokens.some((token) => haystack.includes(comparable(token)));
}

/** Escapa os caracteres estruturais usados pelo `.or()` do PostgREST. */
export function toPostgrestSearchToken(value: string): string {
  return value.replace(/[%_\\,()."]/g, "").trim();
}
