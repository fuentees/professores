import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = {
  title: "Fórum",
  description: "Tire dúvidas e troque experiências com outros professores.",
};

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
      <PageHeader title="Fórum" description="Tire dúvidas e troque experiências com outros professores." />

      {(!categories || categories.length === 0) ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma categoria cadastrada ainda"
          description="Volte em breve — novas categorias de discussão aparecem aqui."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/forum/${category.slug}`}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-interactive-soft text-interactive">
                <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-tight group-hover:underline">{category.name}</p>
                {category.description && (
                  <p className="line-clamp-1 text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-interactive" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
