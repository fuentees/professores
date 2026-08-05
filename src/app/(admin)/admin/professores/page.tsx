import Link from "next/link";
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

export default async function ProfessoresPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email, status, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Professores</h1>
        <p className="text-muted-foreground">
          Gerencie o acesso dos professores cadastrados no portal.
        </p>
      </div>

      <div className="rounded-lg border">
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
                  Nenhum professor cadastrado ainda.
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
    </div>
  );
}
