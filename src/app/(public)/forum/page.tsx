import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function ForumPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/forum");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("forum_categories")
    .select("slug, name, description")
    .order("order_index");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Fórum</h1>
        <p className="text-muted-foreground">Tire dúvidas e troque experiências com outros professores.</p>
      </div>

      <div className="divide-y rounded-lg border">
        {(!categories || categories.length === 0) && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada ainda.
          </p>
        )}
        {categories?.map((category) => (
          <Link
            key={category.slug}
            href={`/forum/${category.slug}`}
            className="flex items-center gap-3 p-4 hover:bg-accent"
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{category.name}</p>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
