import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForumCategoriesManager } from "@/components/admin/forum-categories-manager";
import { TopicModerationActions } from "@/components/admin/topic-moderation-actions";
import { PageHeader } from "@/components/common/page-header";

type TopicRow = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles: { full_name: string } | null;
  forum_categories: { name: string } | null;
};

export default async function ForumAdminPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: topics }] = await Promise.all([
    supabase.from("forum_categories").select("*").order("order_index"),
    supabase
      .from("forum_topics")
      .select("id, title, is_pinned, is_locked, created_at, profiles(full_name), forum_categories(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .returns<TopicRow[]>(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Fórum" description="Modere tópicos e gerencie categorias." />

      <ForumCategoriesManager rows={categories ?? []} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tópicos recentes</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="text-right">Moderação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!topics || topics.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhum tópico criado ainda.
                  </TableCell>
                </TableRow>
              )}
              {topics?.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">
                    {topic.title}
                    {topic.is_pinned && <Badge className="ml-2">Fixado</Badge>}
                    {topic.is_locked && <Badge variant="secondary" className="ml-2">Fechado</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{topic.forum_categories?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{topic.profiles?.full_name}</TableCell>
                  <TableCell className="text-right">
                    <TopicModerationActions
                      id={topic.id}
                      isPinned={topic.is_pinned}
                      isLocked={topic.is_locked}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
