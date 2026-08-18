import Image from "next/image";
import Link from "next/link";
import { Download, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type MaterialCardData = {
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  access_type: string;
  has_answer_key: boolean;
  isNew: boolean;
  subjectNames: string[];
  gradeNames: string[];
  typeNames: string[];
};

const ACCESS_LABELS: Record<string, string> = {
  public: "Público",
  free_signup: "Gratuito",
  teacher_only: "Professores",
  subscriber_only: "Assinantes",
};

export function MaterialCard({ material }: { material: MaterialCardData }) {
  return (
    <Link
      href={`/materiais/${material.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video bg-muted">
        {material.cover_url ? (
          <Image src={material.cover_url} alt={material.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {material.isNew && <Badge>Novo</Badge>}
          {material.has_answer_key && <Badge variant="secondary">Com gabarito</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {material.typeNames.slice(0, 2).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <h2 className="line-clamp-2 font-semibold group-hover:underline">{material.title}</h2>
        {material.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{material.short_description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-2 text-xs text-muted-foreground">
          {material.subjectNames.slice(0, 1).map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
          {material.gradeNames.slice(0, 1).map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
          <Badge variant="outline" className="ml-auto gap-1">
            <Download className="h-3 w-3" />
            {ACCESS_LABELS[material.access_type] ?? material.access_type}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
