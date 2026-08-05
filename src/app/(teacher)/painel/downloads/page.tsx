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

type DownloadRow = {
  id: string;
  downloaded_at: string;
  contents: { slug: string; title: string } | null;
  content_files: { name: string } | null;
};

export default async function DownloadsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/downloads");

  const supabase = await createClient();
  const { data: downloads } = await supabase
    .from("downloads")
    .select("id, downloaded_at, contents(slug, title), content_files(name)")
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
              <TableHead>Material</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Baixado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!downloads || downloads.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Nenhum download ainda.
                </TableCell>
              </TableRow>
            )}
            {downloads?.map((download) => (
              <TableRow key={download.id}>
                <TableCell>
                  {download.contents ? (
                    <Link
                      href={`/materiais/${download.contents.slug}`}
                      className="font-medium hover:underline"
                    >
                      {download.contents.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {download.content_files?.name ?? "—"}
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
