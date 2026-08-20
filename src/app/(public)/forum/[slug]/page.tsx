import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pin, MessageCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { NewTopicForm } from "@/components/forum/new-topic-form";
import { EmptyState } from "@/components/common/empty-state";

export async function generateMetadata({ params }: PageProps<"/forum/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("forum_categories").select("name, description").eq("slug", slug).maybeSingle();

  if (!category) return {};
  return { title: category.name, description: category.description ?? undefined };
}

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
      <div className="space-y-1.5">
        <Link href="/forum" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-interactive hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Categorias
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{category.name}</h1>
        {category.description && <p className="text-muted-foreground">{category.description}</p>}
      </div>

      <NewTopicForm categorySlug={slug} />

      {(!topics || topics.length === 0) ? (
        <EmptyState icon={MessageCircle} title="Nenhum tópico ainda" description="Seja o primeiro a começar uma discussão." />
      ) : (
        <div className="flex flex-col gap-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/forum/topico/${topic.id}`}
              className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold tracking-tight group-hover:underline">
                  {topic.is_pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-interactive" />}
                  {topic.is_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <span className="truncate">{topic.title}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  por {topic.profiles?.full_name || "Professor(a)"} · {new Date(topic.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-interactive-soft px-2.5 py-1 text-sm font-medium text-interactive">
                <MessageCircle className="h-3.5 w-3.5" />
                {topic.forum_replies[0]?.count ?? 0}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
