import Link from "next/link";
import { ShieldCheck, UserRoundPlus, Users, X } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { AdminRoleAction } from "@/components/owner/admin-role-action";
import { AdminOwnerToggle } from "@/components/owner/admin-owner-toggle";
import { CreateAdminAccountForm } from "@/components/owner/create-admin-account-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { PageSizeSelect } from "@/components/common/page-size-select";
import { TableSearchForm } from "@/components/common/table-search-form";
import { parsePage, parsePageSize, parseQuery, sanitizeIlikeTerm } from "@/lib/search-filter";

const BASE_PATH = "/dono/administradores";

export default async function DonoAdministradoresPage({
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
  const currentProfile = await getCurrentProfile();

  let teachersQuery = supabase
    .from("profiles")
    .select("id, full_name, email, status, created_at", { count: "exact" })
    .eq("role", "teacher")
    .order("created_at", { ascending: false })
    .range(from, to);

  const term = sanitizeIlikeTerm(q);
  if (term) {
    teachersQuery = teachersQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const [{ data: admins }, { count: teacherTotalCount }, { data: teachers, count: teachersFilteredCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, status, is_owner")
        .eq("role", "admin")
        .order("full_name"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
      teachersQuery,
    ]);

  const activeSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    pageSize: pageSize !== 25 ? String(pageSize) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administradores"
        description="Promova uma conta já cadastrada sem precisar acessar o banco de dados. Administradores cuidam do conteúdo; somente proprietários gerenciam o negócio e as permissões administrativas."
      />

      <Card>
        <CardHeader>
          <CardTitle>Criar administrador</CardTitle>
          <CardDescription>
            Crie uma conta já ativa, sem confirmação por e-mail. Marque &ldquo;proprietário&rdquo; se ela também deve gerenciar o negócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAdminAccountForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div><CardTitle>{admins?.length ?? 0}</CardTitle><CardDescription>Administradores</CardDescription></div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Users className="h-5 w-5 text-amber-600" />
            <div><CardTitle>{admins?.filter((admin) => admin.is_owner).length ?? 0}</CardTitle><CardDescription>Proprietários</CardDescription></div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <UserRoundPlus className="h-5 w-5 text-emerald-600" />
            <div><CardTitle>{teacherTotalCount ?? 0}</CardTitle><CardDescription>Contas disponíveis</CardDescription></div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe administrativa</CardTitle>
          <CardDescription>Defina proprietários ou devolva uma conta ao acesso de professor.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Conta</TableHead><TableHead>Status</TableHead><TableHead>Permissão</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {(admins ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum administrador cadastrado ainda.</TableCell></TableRow>
              )}
              {(admins ?? []).map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell><p className="font-medium">{admin.full_name || "Sem nome"}</p><p className="text-xs text-muted-foreground">{admin.email}</p></TableCell>
                  <TableCell><Badge variant={admin.status === "active" ? "default" : "destructive"}>{admin.status === "active" ? "Ativo" : "Bloqueado"}</Badge></TableCell>
                  <TableCell><AdminOwnerToggle profileId={admin.id} initialIsOwner={admin.is_owner} disabled={admin.id === currentProfile?.id && admin.is_owner} /></TableCell>
                  <TableCell className="text-right">
                    {admin.is_owner ? (
                      <span className="text-xs text-muted-foreground">Remova “Proprietário” para rebaixar</span>
                    ) : (
                      <AdminRoleAction profileId={admin.id} fullName={admin.full_name} action="demote" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Promover uma conta existente</CardTitle>
            <CardDescription>A pessoa precisa primeiro criar uma conta comum no portal. Depois, promova-a aqui.</CardDescription>
          </div>
          <PageSizeSelect pageSize={pageSize} searchParams={{ q: q || undefined }} />
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Conta</TableHead><TableHead>Situação atual</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {(teachers ?? []).map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell><p className="font-medium">{teacher.full_name || "Sem nome"}</p><p className="text-xs text-muted-foreground">{teacher.email}</p></TableCell>
                    <TableCell><Badge variant={teacher.status === "active" ? "secondary" : "outline"}>{teacher.status === "active" ? "Professor ativo" : teacher.status === "blocked" ? "Bloqueado — será reativado" : "Cadastro pendente"}</Badge></TableCell>
                    <TableCell className="text-right"><AdminRoleAction profileId={teacher.id} fullName={teacher.full_name} action="promote" /></TableCell>
                  </TableRow>
                ))}
                {(teachers ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      {q ? `Nenhuma conta encontrada para "${q}".` : "Nenhuma conta de professor disponível para promoção."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            basePath={BASE_PATH}
            searchParams={activeSearchParams}
            page={page}
            pageSize={pageSize}
            total={teachersFilteredCount ?? 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
