import Link from "next/link";
import Image from "next/image";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function PastasPage() {
  const supabase = await createClient();
  const { data: folders } = await supabase
    .from("folders")
    .select("slug, title, description, cover_url")
    .order("order_index");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Pastas e coleções</h1>
        <p className="text-muted-foreground">Materiais agrupados por tema.</p>
      </div>

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
            className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video bg-muted">
              {folder.cover_url ? (
                <Image src={folder.cover_url} alt={folder.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <FolderOpen className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="font-semibold group-hover:underline">{folder.title}</h2>
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
