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
import { BlogCategoriesManager } from "@/components/admin/blog-categories-manager";
import { DeleteBlogPostButton } from "@/components/admin/delete-blog-post-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

export default async function BlogAdminPage() {
  const supabase = await createClient();
  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select("id, title, status, created_at").order("created_at", { ascending: false }),
    supabase.from("blog_categories").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-muted-foreground">Artigos para professores.</p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/blog/novo">
              <Plus className="h-4 w-4" />
              Novo artigo
            </Link>
          }
        />
      </div>

      <BlogCategoriesManager categories={categories ?? []} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!posts || posts.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Nenhum artigo cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {posts?.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {STATUS_LABELS[post.status]}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/admin/blog/${post.id}/editar`}>Editar</Link>}
                  />
                  <DeleteBlogPostButton id={post.id} title={post.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
