import Image from "next/image";
import Link from "next/link";
import { Bookmark, Download, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subjectBadgeClassName } from "@/lib/subject-colors";

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
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8"
    >
      <div className="relative aspect-[16/7.5] overflow-hidden bg-muted">
        {material.cover_url ? (
          <Image src={material.cover_url} alt={material.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {material.isNew && <Badge>Novo</Badge>}
          {material.has_answer_key && <Badge variant="secondary">Com gabarito</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-primary">
          {material.typeNames.slice(0, 2).map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <h2 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug tracking-tight group-hover:text-primary">{material.title}</h2>
        {material.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{material.short_description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1 border-t pt-3 text-xs text-muted-foreground">
          {material.subjectNames.slice(0, 1).map((name) => (
            <Badge key={name} className={subjectBadgeClassName(name)}>
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
          <Bookmark className="ml-1 size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
