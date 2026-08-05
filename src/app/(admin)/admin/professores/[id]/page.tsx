import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherStatusToggle } from "@/components/admin/teacher-status-toggle";
import { ManualSubscriptionForm } from "@/components/admin/manual-subscription-form";
import { AccessGrantForm } from "@/components/admin/access-grant-form";
import { CancelSubscriptionButton, RevokeAccessButton } from "@/components/admin/cancel-subscription-button";

export default async function ProfessorDetailPage({
  params,
}: PageProps<"/admin/professores/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: teacher }, { data: plans }, { data: subscriptions }, { data: grants }, { data: contents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).eq("role", "teacher").maybeSingle(),
      supabase.from("plans").select("id, name").eq("status", "active").order("order_index"),
      supabase
        .from("subscriptions")
        .select("id, status, starts_at, expires_at, plans(name)")
        .eq("teacher_id", id)
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            status: string;
            starts_at: string;
            expires_at: string | null;
            plans: { name: string } | null;
          }[]
        >(),
      supabase
        .from("access_grants")
        .select("id, expires_at, contents(title)")
        .eq("teacher_id", id)
        .order("created_at", { ascending: false })
        .returns<{ id: string; expires_at: string | null; contents: { title: string } | null }[]>(),
      supabase.from("contents").select("id, title").order("title"),
    ]);

  if (!teacher) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{teacher.full_name || teacher.email}</h1>
          <p className="text-muted-foreground">{teacher.email}</p>
        </div>
        <TeacherStatusToggle profileId={teacher.id} status={teacher.status} />
      </div>

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
    </div>
  );
}
