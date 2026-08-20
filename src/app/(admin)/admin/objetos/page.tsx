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
import { InteractiveTypeBadge } from "@/components/interactive/interactive-type-badge";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { PageHeader } from "@/components/common/page-header";

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
    .select("id, title, object_type, status, activity_type")
    .order("created_at", { ascending: false })
    .returns<{ id: string; title: string; object_type: string; status: string; activity_type: LearningActivityType | null }[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Objetos de aprendizagem"
        description="Jogos, simulações, quizzes, vídeos e links educacionais."
        action={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/objetos/novo">
                <Plus className="h-4 w-4" />
                Novo objeto
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
                <TableCell className="text-muted-foreground">
                  {obj.activity_type ? (
                    <InteractiveTypeBadge activityType={obj.activity_type} />
                  ) : (
                    obj.object_type
                  )}
                </TableCell>
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
