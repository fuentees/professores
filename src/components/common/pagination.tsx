import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function hrefForPage(basePath: string, params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Paginação server-rendered (sem JS): "Anterior"/"Próxima" são links reais
 * que preservam os demais filtros ativos na URL. Some sozinha quando cabe
 * tudo numa página só.
 */
export function Pagination({
  basePath,
  searchParams,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const params = new URLSearchParams(
    Object.entries(searchParams).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  params.delete("page");

  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(total, currentPage * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-1 pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "Nenhum resultado" : `Mostrando ${from}–${to} de ${total}`}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={hrefForPage(basePath, params, currentPage - 1)} />}>
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
          )}
          <span className="px-1 text-sm whitespace-nowrap text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={hrefForPage(basePath, params, currentPage + 1)} />}>
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
