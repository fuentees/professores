/**
 * Escapes a value for use inside a PostgREST `.or()`/`.and()` filter string.
 * Without this, a comma or parenthesis typed by the user (e.g. searching
 * "Matemática, 6º ano") breaks PostgREST's condition-list parsing.
 * See: https://postgrest.org/en/stable/references/api/tables_views.html#operators
 */
export function escapeOrFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
