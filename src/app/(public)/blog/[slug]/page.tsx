import { notFound } from "next/navigation";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, body, cover_url, author, published_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {post.cover_url ? (
          <Image src={post.cover_url} alt={post.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Newspaper className="h-10 w-10" />
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.author && (
          <p className="mt-2 text-sm text-muted-foreground">
            por {post.author}
            {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString("pt-BR")}`}
          </p>
        )}
      </div>

      {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}

      {post.body && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
      )}
    </div>
  );
}
