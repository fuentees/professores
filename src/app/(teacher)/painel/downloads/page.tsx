import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type DownloadRow = {
  id: string;
  downloaded_at: string;
  resource_type: "material" | "question" | "exam" | "lesson";
  resource_title: string;
  resource_href: string;
  file_name: string | null;
};

const RESOURCE_LABELS: Record<DownloadRow["resource_type"], string> = {
  material: "Material",
  question: "Questão",
  exam: "Avaliação",
  lesson: "Curso",
};

export default async function DownloadsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/downloads");

  const supabase = await createClient();
  const { data: downloads } = await supabase
    .from("download_events")
    .select("id, downloaded_at, resource_type, resource_title, resource_href, file_name")
    .eq("teacher_id", profile.id)
    .order("downloaded_at", { ascending: false })
    .limit(50)
    .returns<DownloadRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Downloads</h1>
        <p className="text-muted-foreground">Arquivos que você já baixou.</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conteúdo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Baixado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!downloads || downloads.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Nenhum download ainda.
                </TableCell>
              </TableRow>
            )}
            {downloads?.map((download) => (
              <TableRow key={download.id}>
                <TableCell>
                  <Link href={download.resource_href} className="font-medium hover:underline">
                    {download.resource_title}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{RESOURCE_LABELS[download.resource_type]}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  {download.file_name ?? "Arquivo"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(download.downloaded_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
