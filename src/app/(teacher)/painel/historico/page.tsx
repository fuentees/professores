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

type ViewRow = {
  id: string;
  viewed_at: string;
  contents: { slug: string; title: string } | null;
};

export default async function HistoricoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/historico");

  const supabase = await createClient();
  const { data: views } = await supabase
    .from("content_views")
    .select("id, viewed_at, contents(slug, title)")
    .eq("teacher_id", profile.id)
    .order("viewed_at", { ascending: false })
    .limit(50)
    .returns<ViewRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-muted-foreground">Últimos materiais que você visualizou.</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Visualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!views || views.length === 0) && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                  Nenhum material visualizado ainda.
                </TableCell>
              </TableRow>
            )}
            {views?.map((view) => (
              <TableRow key={view.id}>
                <TableCell>
                  {view.contents ? (
                    <Link href={`/materiais/${view.contents.slug}`} className="font-medium hover:underline">
                      {view.contents.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(view.viewed_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
