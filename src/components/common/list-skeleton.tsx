/**
 * Esqueleto genérico pra loading.tsx de páginas de listagem (grid de cards
 * ou tabela) — evita tela em branco em conexão lenta enquanto os dados
 * carregam. `rows` controla quantos placeholders desenhar.
 */
export function ListSkeleton({ rows = 6, variant = "grid" }: { rows?: number; variant?: "grid" | "rows" }) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2 border-b pb-6">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>

      {variant === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 overflow-hidden rounded-xl border">
              <div className="aspect-video bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded-md bg-muted" />
                <div className="h-3 w-full rounded-md bg-muted" />
                <div className="h-3 w-2/3 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-16 rounded-xl border bg-muted/40" />
          ))}
        </div>
      )}
    </div>
  );
}
