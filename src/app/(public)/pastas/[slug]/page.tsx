import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MaterialCard, type MaterialCardData } from "@/components/materials/material-card";
import { isRecentlyCreated } from "@/lib/dates";
import { folderCover } from "@/lib/content-cover";

type FolderContentRow = {
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

export async function generateMetadata({ params }: PageProps<"/pastas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: folder } = await supabase
    .from("folders")
    .select("title, description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!folder) return {};
  return {
    title: folder.title,
    description: folder.description ?? undefined,
    openGraph: {
      title: folder.title,
      description: folder.description ?? undefined,
      images: [folder.cover_url ?? folderCover(slug)],
    },
  };
}

export default async function FolderDetailPage({
  params,
}: PageProps<"/pastas/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: folder } = await supabase
    .from("folders")
    .select("id, title, description, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!folder) notFound();

  const coverUrl = folder.cover_url ?? folderCover(slug);

  const { data: items } = await supabase
    .from("folder_contents")
    .select(
      `contents (
        slug, title, short_description, cover_url, access_type, has_answer_key, created_at,
        content_subjects(subjects(name)),
        content_grades(grades(name)),
        content_content_types(content_types(name))
      )`,
    )
    .eq("folder_id", folder.id)
    .order("order_index")
    .returns<FolderContentRow[]>();

  const materials: MaterialCardData[] = (items ?? [])
    .map((i) => i.contents)
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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div className="relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted">
        <Image src={coverUrl} alt={folder.title} fill className="object-cover" priority />
      </div>

      <div>
        <h1 className="text-3xl font-bold">{folder.title}</h1>
        {folder.description && <p className="mt-2 text-muted-foreground">{folder.description}</p>}
      </div>

      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum material nesta pasta ainda.
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
