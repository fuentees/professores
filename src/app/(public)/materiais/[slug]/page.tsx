import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { recordView } from "@/actions/content-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/materials/download-button";
import { FavoriteButton } from "@/components/materials/favorite-button";
import { MaterialCard } from "@/components/materials/material-card";
import { SectionHeader } from "@/components/common/section-header";
import { fetchRelatedContentCards } from "@/lib/queries/content-cards";
import { canAccessResource, type ResourceAccessType } from "@/lib/access/can-access-resource";

type ContentDetail = {
  id: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  body: string | null;
  cover_url: string | null;
  author: string | null;
  access_type: string;
  allow_download: boolean;
  has_answer_key: boolean;
  published_at: string | null;
  content_subjects: { subjects: { id: string; name: string } | null }[];
  content_grades: { grades: { id: string; name: string } | null }[];
  content_themes: { themes: { name: string } | null }[];
  content_content_types: { content_types: { name: string } | null }[];
  content_files: { id: string; name: string; allow_download: boolean }[];
  content_bncc_skills: { bncc_skills: { id: string; code: string; description: string } | null }[];
};

const ACCESS_LABELS: Record<string, string> = {
  public: "Público",
  free_signup: "Gratuito com cadastro",
  teacher_only: "Exclusivo para professores",
  subscriber_only: "Exclusivo para assinantes",
};

export default async function MaterialDetailPage({
  params,
}: PageProps<"/materiais/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: content } = await supabase
    .from("contents")
    .select(
      `id, title, subtitle, short_description, body, cover_url, author, access_type,
      allow_download, has_answer_key, published_at,
      content_subjects(subjects(id, name)),
      content_grades(grades(id, name)),
      content_themes(themes(name)),
      content_content_types(content_types(name)),
      content_files(id, name, allow_download),
      content_bncc_skills(bncc_skills(id, code, description))`,
    )
    .eq("slug", slug)
    .maybeSingle()
    .returns<ContentDetail>();

  if (!content) notFound();

  await recordView(content.id);

  let initialFavorited = false;
  if (profile) {
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("teacher_id", profile.id)
      .eq("content_id", content.id)
      .maybeSingle();
    initialFavorited = Boolean(favorite);
  }

  const canSeeFiles = await canAccessResource(
    supabase,
    profile,
    { accessType: content.access_type as ResourceAccessType },
    { contentId: content.id },
  );

  const relatedMaterials = await fetchRelatedContentCards(supabase, {
    excludeContentId: content.id,
    subjectIds: content.content_subjects.map((s) => s.subjects?.id).filter((id): id is string => Boolean(id)),
    gradeIds: content.content_grades.map((g) => g.grades?.id).filter((id): id is string => Boolean(id)),
    limit: 4,
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {content.cover_url ? (
          <Image src={content.cover_url} alt={content.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {content.content_content_types.map(
          (t) => t.content_types && <Badge key={t.content_types.name}>{t.content_types.name}</Badge>,
        )}
        {content.has_answer_key && <Badge variant="secondary">Com gabarito</Badge>}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{content.title}</h1>
        {content.subtitle && <p className="mt-1 text-lg text-muted-foreground">{content.subtitle}</p>}
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        {content.content_subjects.map((s) => s.subjects && <Badge key={s.subjects.name} variant="outline">{s.subjects.name}</Badge>)}
        {content.content_grades.map((g) => g.grades && <Badge key={g.grades.name} variant="outline">{g.grades.name}</Badge>)}
        {content.content_themes.map((t) => t.themes && <Badge key={t.themes.name} variant="outline">{t.themes.name}</Badge>)}
      </div>

      {content.short_description && <p className="text-muted-foreground">{content.short_description}</p>}

      {content.body && canSeeFiles && (
        <div className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed">
          {content.body}
        </div>
      )}

      {content.content_bncc_skills.length > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium">Habilidades da BNCC</p>
          <div className="flex flex-col gap-2">
            {content.content_bncc_skills.map(
              (s) =>
                s.bncc_skills && (
                  <div key={s.bncc_skills.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0 font-mono">
                      {s.bncc_skills.code}
                    </Badge>
                    <span className="text-muted-foreground">{s.bncc_skills.description}</span>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        {profile && <FavoriteButton contentId={content.id} initialFavorited={initialFavorited} />}

        {!canSeeFiles && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {profile
                ? `Este material é ${ACCESS_LABELS[content.access_type]?.toLowerCase()}.`
                : "Entre com sua conta de professor para baixar este material."}
            </p>
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link href={profile ? "/planos" : "/entrar"}>
                  {profile ? "Conhecer planos" : "Entrar"}
                </Link>
              }
            />
          </div>
        )}

        {canSeeFiles &&
          content.allow_download &&
          content.content_files
            .filter((f) => f.allow_download)
            .map((file) => <DownloadButton key={file.id} fileId={file.id} fileName={file.name} />)}
      </div>

      <p className="text-xs text-muted-foreground">
        Este material é disponibilizado para uso pedagógico. A reprodução para fins comerciais não é
        permitida.
      </p>

      {relatedMaterials.length > 0 && (
        <div className="space-y-4 pt-4">
          <SectionHeader title="Materiais relacionados" />
          <div className="grid gap-6 sm:grid-cols-2">
            {relatedMaterials.map((material) => (
              <MaterialCard key={material.slug} material={material} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
