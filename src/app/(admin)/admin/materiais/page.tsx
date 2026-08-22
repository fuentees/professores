import Link from "next/link";
import { FileUp, Plus } from "lucide-react";
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
import { ContentStatusSelect } from "@/components/admin/content-status-select";
import { DeleteContentButton } from "@/components/admin/delete-content-button";
import type { ContentStatus } from "@/types/supabase";
import { PageHeader } from "@/components/common/page-header";

type ContentListRow = {
  id: string;
  title: string;
  status: ContentStatus;
  is_featured: boolean;
  created_at: string;
  body: string | null;
  allow_download: boolean;
  content_content_types: { content_types: { name: string } | null }[];
  content_subjects: { subjects: { name: string } | null }[];
  content_files: { id: string }[];
};

export default async function MateriaisPage() {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from("contents")
    .select(
      "id, title, status, is_featured, created_at, body, allow_download, content_content_types(content_types(name)), content_subjects(subjects(name)), content_files(id)",
    )
    .order("created_at", { ascending: false })
    .returns<ContentListRow[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materiais"
        description="Crie, organize e publique materiais. Textos completos ganham Word e impressão automaticamente; anexos extras são opcionais."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/admin/questoes/importar">
                  <FileUp className="h-4 w-4" />
                  Importar questões Word
                </Link>
              }
            />
            <Button
              nativeButton={false}
              render={
                <Link href="/admin/materiais/novo">
                  <Plus className="h-4 w-4" />
                  Publicar material
                </Link>
              }
            />
          </div>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Finalidade</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Arquivos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!contents || contents.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Nenhum material cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {contents?.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium">{content.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {content.content_content_types.map((t) => t.content_types?.name).filter(Boolean).join(", ") ||
                    "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {content.content_subjects.map((s) => s.subjects?.name).filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  {content.content_files.length > 0 ? (
                    <Badge variant="outline">
                      {content.content_files.length} {content.content_files.length === 1 ? "arquivo" : "arquivos"}
                    </Badge>
                  ) : content.body && content.allow_download ? (
                    <Badge variant="secondary">Word automático</Badge>
                  ) : (
                    <Badge variant="secondary">Sem download</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ContentStatusSelect id={content.id} status={content.status as ContentStatus} />
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/materiais/${content.id}/editar`}>Editar</Link>}
                  />
                  <DeleteContentButton id={content.id} title={content.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
