import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type LearningObjectCardData = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  object_type: string;
};

export function LearningObjectCard({ object }: { object: LearningObjectCardData }) {
  return (
    <Link
      href={`/objetos/${object.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video bg-muted">
        {object.cover_url ? (
          <Image src={object.cover_url} alt={object.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <LayoutGrid className="h-8 w-8" />
          </div>
        )}
        <Badge className="absolute left-2 top-2">{object.object_type}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-semibold group-hover:underline">{object.title}</h2>
        {object.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{object.description}</p>
        )}
      </div>
    </Link>
  );
}
