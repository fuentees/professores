import { ShieldCheck, UserRoundPlus, Users } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { AdminRoleAction } from "@/components/owner/admin-role-action";
import { AdminOwnerToggle } from "@/components/owner/admin-owner-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DonoAdministradoresPage() {
  const supabase = await createClient();
  const currentProfile = await getCurrentProfile();
  const [{ data: admins }, { data: teachers }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, status, is_owner")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, status, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administradores</h1>
        <p className="text-muted-foreground">
          Promova uma conta já cadastrada sem precisar acessar o banco de dados. Administradores cuidam
          do conteúdo; somente proprietários gerenciam o negócio e as permissões administrativas.
        </p>
      </div>

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
            <div><CardTitle>{teachers?.length ?? 0}</CardTitle><CardDescription>Contas disponíveis</CardDescription></div>
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
        <CardHeader>
          <CardTitle>Promover uma conta existente</CardTitle>
          <CardDescription>A pessoa precisa primeiro criar uma conta comum no portal. Depois, promova-a aqui.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
                <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Nenhuma conta de professor disponível para promoção.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
