import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteFolderButton } from "@/components/admin/delete-folder-button";
import { PageHeader } from "@/components/common/page-header";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

type FolderListRow = {
  id: string;
  title: string;
  status: string;
  folder_contents: { count: number }[];
};

export default async function PastasPage() {
  const supabase = await createClient();
  const { data: folders } = await supabase
    .from("folders")
    .select("id, title, status, folder_contents(count)")
    .order("created_at", { ascending: false })
    .returns<FolderListRow[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pastas e coleções"
        description="Agrupe materiais por tema, ex: “Volta às aulas”, “Revisão para o SAEB”."
        action={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/pastas/novo">
                <Plus className="h-4 w-4" />
                Nova pasta
              </Link>
            }
          />
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Materiais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!folders || folders.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Nenhuma pasta cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
            {folders?.map((folder) => (
              <TableRow key={folder.id}>
                <TableCell className="font-medium">{folder.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {folder.folder_contents[0]?.count ?? 0}
                </TableCell>
                <TableCell>
                  <Badge variant={folder.status === "published" ? "default" : "secondary"}>
                    {STATUS_LABELS[folder.status]}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/pastas/${folder.id}/editar`}>Editar</Link>}
                  />
                  <DeleteFolderButton id={folder.id} title={folder.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
