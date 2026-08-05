import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_url, author, published_at")
    .order("published_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-muted-foreground">Práticas pedagógicas, BNCC, avaliação e formação docente.</p>
      </div>

      {(!posts || posts.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum artigo publicado ainda.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {posts?.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video bg-muted">
              {post.cover_url ? (
                <Image src={post.cover_url} alt={post.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Newspaper className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="font-semibold group-hover:underline">{post.title}</h2>
              {post.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
              {post.author && <p className="mt-auto text-xs text-muted-foreground">por {post.author}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
