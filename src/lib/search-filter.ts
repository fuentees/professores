/**
 * Remove caracteres que quebrariam a sintaxe de filtro do PostgREST (`,` e
 * parênteses usados pelo `.or()`) ou que agiriam como curinga do ILIKE
 * (`%`, `_`), antes de interpolar um termo de busca digitado pelo usuário
 * numa query do Supabase.
 */
export function sanitizeIlikeTerm(input: string): string {
  return input.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function parsePageSize(value: string | string[] | undefined): number {
  const size = Number(Array.isArray(value) ? value[0] : value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
}

export function parseQuery(value: string | string[] | undefined): string {
  const q = Array.isArray(value) ? value[0] : value;
  return typeof q === "string" ? q.trim() : "";
}
