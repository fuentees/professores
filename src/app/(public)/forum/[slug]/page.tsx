import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pin, MessageCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { NewTopicForm } from "@/components/forum/new-topic-form";

type TopicRow = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles: { full_name: string } | null;
  forum_replies: { count: number }[];
};

export default async function ForumCategoryPage({
  params,
}: PageProps<"/forum/[slug]">) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/entrar?redirect=/forum/${slug}`);

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("forum_categories")
    .select("id, name, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, title, is_pinned, is_locked, created_at, profiles(full_name), forum_replies(count)")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<TopicRow[]>();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <Link href="/forum" className="text-sm text-muted-foreground hover:underline">
          ← Categorias
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{category.name}</h1>
        {category.description && <p className="text-muted-foreground">{category.description}</p>}
      </div>

      <NewTopicForm categorySlug={slug} />

      <div className="divide-y rounded-lg border">
        {(!topics || topics.length === 0) && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum tópico ainda. Seja o primeiro!</p>
        )}
        {topics?.map((topic) => (
          <Link
            key={topic.id}
            href={`/forum/topico/${topic.id}`}
            className="flex items-center justify-between gap-3 p-4 hover:bg-accent"
          >
            <div>
              <p className="flex items-center gap-2 font-medium">
                {topic.is_pinned && <Pin className="h-3.5 w-3.5" />}
                {topic.is_locked && <Lock className="h-3.5 w-3.5" />}
                {topic.title}
              </p>
              <p className="text-sm text-muted-foreground">
                por {topic.profiles?.full_name} · {new Date(topic.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {topic.forum_replies[0]?.count ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
