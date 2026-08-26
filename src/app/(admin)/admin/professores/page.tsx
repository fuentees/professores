import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TeacherStatusToggle } from "@/components/admin/teacher-status-toggle";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { PageSizeSelect } from "@/components/common/page-size-select";
import { TableSearchForm } from "@/components/common/table-search-form";
import { parsePage, parsePageSize, parseQuery, sanitizeIlikeTerm } from "@/lib/search-filter";

const BASE_PATH = "/admin/professores";

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; pageSize?: string | string[] }>;
}) {
  const rawParams = await searchParams;
  const q = parseQuery(rawParams.q);
  const page = parsePage(rawParams.page);
  const pageSize = parsePageSize(rawParams.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let teachersQuery = supabase
    .from("profiles")
    .select("id, full_name, email, status, created_at", { count: "exact" })
    .eq("role", "teacher")
    .order("created_at", { ascending: false })
    .range(from, to);

  const term = sanitizeIlikeTerm(q);
  if (term) teachersQuery = teachersQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);

  const { data: teachers, count: totalCount } = await teachersQuery;

  const activeSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    pageSize: pageSize !== 25 ? String(pageSize) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professores"
        description="Gerencie o acesso dos professores cadastrados no portal."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TableSearchForm
            basePath={BASE_PATH}
            defaultValue={q}
            placeholder="Buscar por nome ou e-mail..."
            hiddenParams={{ pageSize: activeSearchParams.pageSize }}
          />
          {q && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={BASE_PATH} />}>
              <X className="size-4" />
              Limpar busca
            </Button>
          )}
        </div>
        <PageSizeSelect pageSize={pageSize} searchParams={{ q: q || undefined }} />
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!teachers || teachers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    {q ? `Nenhum professor encontrado para "${q}".` : "Nenhum professor cadastrado ainda."}
                  </TableCell>
                </TableRow>
              )}
              {teachers?.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(teacher.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <TeacherStatusToggle profileId={teacher.id} status={teacher.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/professores/${teacher.id}`}>Ver detalhes</Link>}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination basePath={BASE_PATH} searchParams={activeSearchParams} page={page} pageSize={pageSize} total={totalCount ?? 0} />
      </div>
    </div>
  );
}
