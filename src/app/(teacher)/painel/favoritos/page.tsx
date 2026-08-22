import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { InteractiveCard } from "@/components/interactive/interactive-card";
import { LearningObjectCard } from "@/components/learning-objects/learning-object-card";
import { learningObjectCover } from "@/lib/content-cover";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";

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

type ObjectFavoriteRow = {
  learning_objects: {
    slug: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    object_type: string;
    activity_type: LearningActivityType | null;
    subjects: { name: string } | null;
    grades: { name: string } | null;
  } | null;
};

export default async function FavoritosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/favoritos");

  const supabase = await createClient();
  const [{ data: favorites }, { data: objectFavorites }] = await Promise.all([
    supabase
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
      .returns<FavoriteRow[]>(),
    supabase
      .from("learning_object_favorites")
      .select("learning_objects(slug, title, description, cover_url, object_type, activity_type, subjects(name), grades(name))")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<ObjectFavoriteRow[]>(),
  ]);

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
  const savedObjects = (objectFavorites ?? [])
    .map((favorite) => favorite.learning_objects)
    .filter((object): object is NonNullable<typeof object> => Boolean(object));

  return (
    <div className="space-y-6">
      <PageHeader title="Itens salvos" description="Materiais e recursos interativos que você deseja encontrar novamente." />

      {materials.length === 0 && savedObjects.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum item salvo ainda"
          description="Salve materiais e recursos interativos que você deseja usar depois."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" nativeButton={false} render={<Link href="/materiais">Explorar materiais</Link>} />
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/objetos">Explorar recursos</Link>} />
            </div>
          }
        />
      ) : (
        <div className="space-y-10">
          {savedObjects.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Recursos interativos</h2>
                <p className="text-sm text-muted-foreground">Jogos, quizzes, simulações e atividades salvas.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {savedObjects.map((object) =>
                  object.activity_type ? (
                    <InteractiveCard
                      key={object.slug}
                      object={{
                        slug: object.slug,
                        title: object.title,
                        description: object.description,
                        coverUrl: object.cover_url ?? learningObjectCover(object.slug),
                        activityType: object.activity_type,
                        subjectName: object.subjects?.name,
                        gradeName: object.grades?.name,
                      }}
                    />
                  ) : (
                    <LearningObjectCard
                      key={object.slug}
                      object={{
                        slug: object.slug,
                        title: object.title,
                        description: object.description,
                        cover_url: object.cover_url,
                        object_type: object.object_type,
                      }}
                    />
                  ),
                )}
              </div>
            </section>
          )}

          {materials.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Materiais</h2>
                <p className="text-sm text-muted-foreground">Conteúdos pedagógicos marcados como favoritos.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((material) => <MaterialCard key={material.slug} material={material} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
