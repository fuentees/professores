import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { folderCover } from "@/lib/content-cover";

export const metadata: Metadata = {
  title: "Pastas e coleções",
  description: "Materiais agrupados por tema, prontos pra usar em conjunto.",
};

export default async function PastasPage() {
  const supabase = await createClient();
  const { data: folders } = await supabase
    .from("folders")
    .select("slug, title, description, cover_url")
    .order("order_index");

  return (
    <div className="editorial-surface mx-auto w-full max-w-7xl space-y-6 overflow-hidden px-4 py-10 sm:px-6">
      <PageHeader title="Pastas e coleções" description="Materiais agrupados por tema, prontos para usar em conjunto." />

      {(!folders || folders.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma pasta publicada ainda.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {folders?.map((folder) => (
          <Link
            key={folder.slug}
            href={`/pastas/${folder.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8"
          >
            <div className="relative aspect-video bg-muted">
              {folder.cover_url || folderCover(folder.slug) ? (
                <Image src={folder.cover_url ?? folderCover(folder.slug)} alt={folder.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <FolderOpen className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="font-semibold group-hover:text-primary">{folder.title}</h2>
              {folder.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{folder.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
