import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { CoverManager } from "@/components/admin/cover-manager";
import { uploadBlogPostCover } from "@/actions/admin/blog";
import type { BlogPostInput } from "@/lib/validations/blog";

export default async function EditarArtigoPage({
  params,
}: PageProps<"/admin/blog/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("id, name").order("name"),
  ]);

  if (!post) notFound();

  const defaultValues: BlogPostInput = {
    title: post.title,
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    author: post.author ?? "",
    categoryId: post.category_id ?? "",
    status: post.status,
    allowComments: post.allow_comments,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Editar artigo</h1>
        <p className="text-muted-foreground">{post.title}</p>
      </div>

      <CoverManager
        entityId={id}
        coverUrl={post.cover_url}
        altLabel="Capa do artigo"
        onUpload={uploadBlogPostCover}
      />

      <BlogPostForm postId={id} defaultValues={defaultValues} categories={categories ?? []} />
    </div>
  );
}
