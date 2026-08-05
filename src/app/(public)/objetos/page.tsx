import Link from "next/link";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function ObjetosPage() {
  const supabase = await createClient();
  const { data: objects } = await supabase
    .from("learning_objects")
    .select("slug, title, description, cover_url, object_type")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Objetos de aprendizagem</h1>
        <p className="text-muted-foreground">
          Jogos, simulações, quizzes e outros recursos interativos.
        </p>
      </div>

      {(!objects || objects.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum objeto publicado ainda.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {objects?.map((obj) => (
          <Link
            key={obj.slug}
            href={`/objetos/${obj.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-video bg-muted">
              {obj.cover_url ? (
                <Image src={obj.cover_url} alt={obj.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <LayoutGrid className="h-8 w-8" />
                </div>
              )}
              <Badge className="absolute left-2 top-2">{obj.object_type}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="font-semibold group-hover:underline">{obj.title}</h2>
              {obj.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{obj.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
