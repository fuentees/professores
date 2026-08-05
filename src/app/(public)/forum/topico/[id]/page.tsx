import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock, Pin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ReplyForm } from "@/components/forum/reply-form";
import { ReplyItem } from "@/components/forum/reply-item";

type ReplyRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { full_name: string } | null;
};

type TopicRow = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  category_id: string;
  profiles: { full_name: string } | null;
  forum_categories: { slug: string; name: string } | null;
};

export default async function TopicPage({
  params,
}: PageProps<"/forum/topico/[id]">) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/entrar?redirect=/forum/topico/${id}`);

  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, title, body, is_pinned, is_locked, created_at, category_id, profiles(full_name), forum_categories(slug, name)")
    .eq("id", id)
    .maybeSingle()
    .returns<TopicRow>();

  if (!topic) notFound();

  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, created_at, author_id, profiles(full_name)")
    .eq("topic_id", id)
    .eq("status", "active")
    .order("created_at")
    .returns<ReplyRow[]>();

  const categorySlug = topic.forum_categories?.slug ?? "";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/forum/${categorySlug}`} className="text-sm text-muted-foreground hover:underline">
        ← {topic.forum_categories?.name}
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          {topic.is_pinned && <Pin className="h-4 w-4" />}
          {topic.is_locked && <Lock className="h-4 w-4" />}
          {topic.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          por {topic.profiles?.full_name} ·{" "}
          {new Date(topic.created_at).toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="whitespace-pre-wrap text-sm">{topic.body}</p>
      </div>

      <div className="space-y-3">
        {(replies ?? []).map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={{
              id: reply.id,
              body: reply.body,
              created_at: reply.created_at,
              authorName: reply.profiles?.full_name ?? "Professor(a)",
            }}
            isOwn={reply.author_id === profile.id}
          />
        ))}
      </div>

      {topic.is_locked ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Este tópico está fechado para novas respostas.
        </p>
      ) : (
        <ReplyForm topicId={id} />
      )}
    </div>
  );
}
