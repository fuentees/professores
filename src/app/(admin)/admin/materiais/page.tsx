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
  content_content_types: { content_types: { name: string } | null }[];
  content_subjects: { subjects: { name: string } | null }[];
};

export default async function MateriaisPage() {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from("contents")
    .select(
      "id, title, status, is_featured, created_at, content_content_types(content_types(name)), content_subjects(subjects(name))",
    )
    .order("created_at", { ascending: false })
    .returns<ContentListRow[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materiais"
        description="Cadastre e publique atividades, avaliações, planos de aula e demais materiais."
        action={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/materiais/novo">
                <Plus className="h-4 w-4" />
                Novo material
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
              <TableHead>Disciplina</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!contents || contents.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
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
