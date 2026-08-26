import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getExamGenerationQuota } from "@/lib/access/exam-quota";
import { startOfCurrentMonthIso } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeacherStatusToggle } from "@/components/admin/teacher-status-toggle";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import { ManualSubscriptionForm } from "@/components/admin/manual-subscription-form";
import { AccessGrantForm } from "@/components/admin/access-grant-form";
import { CancelSubscriptionButton, RevokeAccessButton } from "@/components/admin/cancel-subscription-button";
import { TeacherNotes, type TeacherNoteRow } from "@/components/admin/teacher-notes";

const RESOURCE_LABELS: Record<string, string> = {
  material: "Material",
  question: "Questão",
  exam: "Avaliação",
  lesson: "Curso",
};

type SubscriptionRow = {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  plans: { name: string; download_limit: number | null } | null;
};

type DownloadRow = {
  id: string;
  resource_type: string;
  resource_title: string;
  file_name: string | null;
  downloaded_at: string;
};

export default async function ProfessorDetailPage({
  params,
}: PageProps<"/admin/professores/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const monthStart = startOfCurrentMonthIso();

  const [
    { data: teacher },
    { data: plans },
    { data: subscriptions },
    { data: grants },
    { data: contents },
    { count: downloadsTotal },
    { count: downloadsThisMonth },
    { data: recentDownloads },
    { data: notes },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "teacher").maybeSingle(),
    supabase.from("plans").select("id, name").eq("status", "active").order("order_index"),
    supabase
      .from("subscriptions")
      .select("id, status, starts_at, expires_at, plans(name, download_limit)")
      .eq("teacher_id", id)
      .order("created_at", { ascending: false })
      .returns<SubscriptionRow[]>(),
    supabase
      .from("access_grants")
      .select("id, expires_at, contents(title)")
      .eq("teacher_id", id)
      .order("created_at", { ascending: false })
      .returns<{ id: string; expires_at: string | null; contents: { title: string } | null }[]>(),
    supabase.from("contents").select("id, title").order("title"),
    supabase.from("download_events").select("id", { count: "exact", head: true }).eq("teacher_id", id),
    supabase
      .from("download_events")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id)
      .gte("downloaded_at", monthStart),
    supabase
      .from("download_events")
      .select("id, resource_type, resource_title, file_name, downloaded_at")
      .eq("teacher_id", id)
      .order("downloaded_at", { ascending: false })
      .limit(15)
      .returns<DownloadRow[]>(),
    supabase
      .from("teacher_notes")
      .select("id, body, created_at, author:profiles!teacher_notes_author_id_fkey(full_name, email)")
      .eq("teacher_id", id)
      .order("created_at", { ascending: false })
      .returns<TeacherNoteRow[]>(),
  ]);

  if (!teacher) notFound();

  const examQuota = await getExamGenerationQuota(supabase, id, "teacher");
  const activeSubscription = subscriptions?.find((sub) => sub.status === "active");
  const downloadLimit = activeSubscription?.plans?.download_limit ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{teacher.full_name || teacher.email}</h1>
          <p className="text-muted-foreground">{teacher.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ResetPasswordButton profileId={teacher.id} fullName={teacher.full_name} />
          <TeacherStatusToggle profileId={teacher.id} status={teacher.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso do plano</CardTitle>
          <CardDescription>
            Consumo real deste professor — útil pra responder reclamações sobre limite atingido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Downloads este mês</p>
              <p className="text-2xl font-semibold">
                {downloadsThisMonth ?? 0}
                {downloadLimit !== null && (
                  <span className="text-base font-normal text-muted-foreground"> / {downloadLimit}</span>
                )}
              </p>
              {downloadLimit === null && activeSubscription && (
                <p className="text-xs text-muted-foreground">Plano {activeSubscription.plans?.name} sem limite.</p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Downloads no total</p>
              <p className="text-2xl font-semibold">{downloadsTotal ?? 0}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Avaliações geradas este mês</p>
              <p className="text-2xl font-semibold">
                {examQuota.used}
                {examQuota.limit !== null && (
                  <span className="text-base font-normal text-muted-foreground"> / {examQuota.limit}</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anotações internas</CardTitle>
          <CardDescription>
            Contexto de atendimento (reclamações, combinados, exceções) visível pra qualquer admin — não pro professor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherNotes teacherId={teacher.id} notes={notes ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ManualSubscriptionForm teacherId={teacher.id} plans={plans ?? []} />
          <div className="flex flex-col gap-2">
            {(subscriptions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura.</p>
            )}
            {subscriptions?.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {sub.plans?.name} ·{" "}
                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                  {sub.expires_at && (
                    <span className="ml-2 text-muted-foreground">
                      expira em {new Date(sub.expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </span>
                {sub.status === "active" && <CancelSubscriptionButton id={sub.id} />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liberação individual de materiais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AccessGrantForm teacherId={teacher.id} contents={contents ?? []} />
          <div className="flex flex-col gap-2">
            {(grants ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma liberação individual.</p>
            )}
            {grants?.map((grant) => (
              <div key={grant.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {grant.contents?.title}
                  {grant.expires_at && (
                    <span className="ml-2 text-muted-foreground">
                      expira em {new Date(grant.expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </span>
                <RevokeAccessButton id={grant.id} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downloads recentes</CardTitle>
          <CardDescription>Últimos 15 arquivos baixados por este professor.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {(!recentDownloads || recentDownloads.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    <Download className="mx-auto mb-1.5 size-4 text-muted-foreground" />
                    Nenhum download registrado ainda.
                  </TableCell>
                </TableRow>
              )}
              {recentDownloads?.map((download) => (
                <TableRow key={download.id}>
                  <TableCell className="font-medium">{download.resource_title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <FileText className="size-3" />
                      {RESOURCE_LABELS[download.resource_type] ?? download.resource_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{download.file_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(download.downloaded_at).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
