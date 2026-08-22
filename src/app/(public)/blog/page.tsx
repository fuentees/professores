import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { blogCover } from "@/lib/content-cover";

export const metadata: Metadata = {
  title: "Blog",
  description: "Práticas pedagógicas, BNCC, avaliação e formação docente.",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_url, author, published_at")
    .order("published_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <PageHeader title="Blog" description="Práticas pedagógicas, BNCC, avaliação e formação docente." />

      {(!posts || posts.length === 0) ? (
        <EmptyState icon={Newspaper} title="Nenhum artigo publicado ainda" description="Volte em breve pra conferir novos conteúdos." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-video bg-gradient-to-br from-highlight-soft to-muted">
                {post.cover_url || blogCover(post.slug) ? (
                  <Image src={post.cover_url ?? blogCover(post.slug)} alt={post.title} fill loading={index < 4 ? "eager" : "lazy"} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-highlight">
                    <Newspaper className="h-9 w-9" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="line-clamp-2 font-semibold tracking-tight group-hover:underline">{post.title}</h2>
                {post.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  {post.author && <span>por {post.author}</span>}
                  {post.published_at && (
                    <span>{new Date(post.published_at).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
