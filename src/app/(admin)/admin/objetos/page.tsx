import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

export default async function ObjetosPage() {
  const supabase = await createClient();
  const { data: objects } = await supabase
    .from("learning_objects")
    .select("id, title, object_type, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Objetos de aprendizagem</h1>
          <p className="text-muted-foreground">Jogos, simulações, quizzes, vídeos e links educacionais.</p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/objetos/novo">
              <Plus className="h-4 w-4" />
              Novo objeto
            </Link>
          }
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!objects || objects.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Nenhum objeto cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {objects?.map((obj) => (
              <TableRow key={obj.id}>
                <TableCell className="font-medium">{obj.title}</TableCell>
                <TableCell className="text-muted-foreground">{obj.object_type}</TableCell>
                <TableCell>
                  <Badge variant={obj.status === "published" ? "default" : "secondary"}>
                    {STATUS_LABELS[obj.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/objetos/${obj.id}/editar`}>Editar</Link>}
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
