import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATERIAL_TYPE_DEFINITIONS } from "@/lib/material-taxonomy";

export type ContentTypeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
};

export function ContentTypesManager({ rows }: { rows: ContentTypeRow[] }) {
  const rowBySlug = new Map(rows.map((row) => [row.slug, row]));
  const inactiveCount = rows.filter((row) => row.status === "inactive").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {MATERIAL_TYPE_DEFINITIONS.map((definition) => {
          const row = rowBySlug.get(definition.slug);
          return (
            <Card key={definition.slug}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{definition.name}</CardTitle>
                <Badge variant={row?.status === "active" ? "default" : "outline"}>
                  {row?.status === "active" ? "Ativo" : "Pendente"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{definition.description}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Exemplos:</span>{" "}
                  {definition.examples}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Como classificar</p>
        <p className="mt-1">
          Cada material recebe uma única finalidade principal. Termos como “Simulado”,
          “Lista de exercícios”, “BNCC” e “Recuperação” ficam nos marcadores; Word, PDF,
          vídeo e outros formatos vêm dos arquivos; gabarito é indicado separadamente.
        </p>
        {inactiveCount > 0 && (
          <p className="mt-2">
            {inactiveCount} classificações antigas foram preservadas como inativas para manter o histórico.
          </p>
        )}
      </div>
    </div>
  );
}
