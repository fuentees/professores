import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";

type FeaturedRow = {
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
};

export default async function PainelPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ count: favoritesCount }, { count: downloadsCount }, { data: featured }] = await Promise.all([
    profile
      ? supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("teacher_id", profile.id)
      : Promise.resolve({ count: 0 }),
    profile
      ? supabase
          .from("downloads")
          .select("*", { count: "exact", head: true })
          .eq("teacher_id", profile.id)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("contents")
      .select(
        `slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
        content_subjects(subjects(name)),
        content_grades(grades(name)),
        content_content_types(content_types(name))`,
      )
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<FeaturedRow[]>(),
  ]);

  const materials: MaterialCardData[] = (featured ?? []).map((c) => ({
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
        <h1 className="text-2xl font-semibold">Olá, {profile?.full_name || "professor(a)"}</h1>
        <p className="text-muted-foreground">
          Aqui você acompanha novidades, materiais recentes e seus favoritos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Materiais favoritados", value: favoritesCount ?? 0 },
          { label: "Cursos em andamento", value: 0 },
          { label: "Downloads recentes", value: downloadsCount ?? 0 },
          { label: "Notificações", value: 0 },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materiais em destaque</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum material em destaque no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {materials.map((material) => (
                <MaterialCard key={material.slug} material={material} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
