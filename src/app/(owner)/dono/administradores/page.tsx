import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { AdminOwnerToggle } from "@/components/owner/admin-owner-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DonoAdministradoresPage() {
  const supabase = await createClient();
  const currentProfile = await getCurrentProfile();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_owner")
    .eq("role", "admin")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administradores</h1>
        <p className="text-muted-foreground">
          Quem tem acesso de proprietário pode gerenciar planos e promover outros administradores. Só
          existe um admin de conteúdo hoje — novos são criados diretamente no banco ou promovidos em
          Professores, no admin de conteúdo.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Proprietário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(admins ?? []).map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                <TableCell>
                  <AdminOwnerToggle
                    profileId={admin.id}
                    initialIsOwner={admin.is_owner}
                    disabled={admin.id === currentProfile?.id && admin.is_owner}
                  />
                </TableCell>
              </TableRow>
            ))}
            {(admins ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum administrador encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
