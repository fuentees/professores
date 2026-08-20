import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/materiais",
  "/pastas",
  "/objetos",
  "/cursos",
  "/bncc",
  "/blog",
  "/forum",
  "/planos",
  "/termos",
  "/privacidade",
];

/**
 * Usa o client público (createClient, respeitando RLS) — as tabelas de
 * conteúdo já restringem leitura anônima a linhas publicadas via policy,
 * então não precisa (e não deve) usar o admin client aqui: evita vazar
 * slug de rascunho não publicado no sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const supabase = await createClient();

  const [{ data: contents }, { data: courses }, { data: folders }, { data: objects }, { data: posts }] =
    await Promise.all([
      supabase.from("contents").select("slug, created_at"),
      supabase.from("courses").select("slug, created_at"),
      supabase.from("folders").select("slug, created_at"),
      supabase.from("learning_objects").select("slug, created_at"),
      supabase.from("blog_posts").select("slug, published_at"),
    ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...(contents ?? []).map((c) => ({ url: `${base}/materiais/${c.slug}`, lastModified: new Date(c.created_at) })),
    ...(courses ?? []).map((c) => ({ url: `${base}/cursos/${c.slug}`, lastModified: new Date(c.created_at) })),
    ...(folders ?? []).map((f) => ({ url: `${base}/pastas/${f.slug}`, lastModified: new Date(f.created_at) })),
    ...(objects ?? []).map((o) => ({ url: `${base}/objetos/${o.slug}`, lastModified: new Date(o.created_at) })),
    ...(posts ?? []).map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
    })),
  ];

  return [...staticEntries, ...dynamicEntries];
}
