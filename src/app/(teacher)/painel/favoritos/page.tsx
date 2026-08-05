import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";

type FavoriteRow = {
  contents: {
    slug: string;
    title: string;
    short_description: string | null;
    cover_url: string | null;
    access_type: string;
    has_answer_key: boolean;
    created_at: string;
    content_subjects: { subjects: { name: string } | null }[];
    content_grades: { grades: { name: string } | null }[];
    content_content_types: { content_types: { name: string } | null }[];
  } | null;
};

export default async function FavoritosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/favoritos");

  const supabase = await createClient();
  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `contents (
        slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
        content_subjects(subjects(name)),
        content_grades(grades(name)),
        content_content_types(content_types(name))
      )`,
    )
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteRow[]>();

  const materials: MaterialCardData[] = (favorites ?? [])
    .map((f) => f.contents)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      short_description: c.short_description,
      cover_url: c.cover_url,
      access_type: c.access_type,
      has_answer_key: c.has_answer_key,
      isNew: isRecentlyCreated(c.created_at),
      subjectNames: c.content_subjects.map((s) => s.subjects?.name).filter((n): n is string => Boolean(n)),
      gradeNames: c.content_grades.map((g) => g.grades?.name).filter((n): n is string => Boolean(n)),
      typeNames: c.content_content_types
        .map((t) => t.content_types?.name)
        .filter((n): n is string => Boolean(n)),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-muted-foreground">Materiais que você marcou como favoritos.</p>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Você ainda não favoritou nenhum material.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.slug} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}
