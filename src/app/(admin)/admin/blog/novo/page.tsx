import { createClient } from "@/lib/supabase/server";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import type { BlogPostInput } from "@/lib/validations/blog";

const DEFAULT_VALUES: BlogPostInput = {
  title: "",
  excerpt: "",
  body: "",
  author: "",
  categoryId: "",
  status: "draft",
  allowComments: false,
};

export default async function NovoArtigoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("blog_categories").select("id, name").order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo artigo</h1>
        <p className="text-muted-foreground">
          Depois de criar, você poderá enviar a imagem de capa.
        </p>
      </div>

      <BlogPostForm defaultValues={DEFAULT_VALUES} categories={categories ?? []} />
    </div>
  );
}
