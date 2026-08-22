import { createClient } from "@/lib/supabase/server";
import { PlansManager, type PlanRow } from "@/components/owner/plans-manager";
import { SubscriptionRequestActions } from "@/components/owner/subscription-request-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RequestRow = {
  id: string;
  created_at: string;
  teacher: { full_name: string; email: string } | null;
  plans: { name: string } | null;
};

export default async function DonoPlanosPage() {
  const supabase = await createClient();
  const [{ data: plans }, { data: requests }] = await Promise.all([
    supabase.from("plans").select("*").order("order_index"),
    supabase
      .from("subscription_requests")
      .select("id, created_at, teacher:profiles!subscription_requests_teacher_id_fkey(full_name, email), plans(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .returns<RequestRow[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-muted-foreground">
          Cadastre os planos de acesso e analise as solicitações enviadas pelos professores.
        </p>
      </div>

      <PlansManager rows={(plans ?? []) as PlanRow[]} />

      <Card>
        <CardHeader><CardTitle>Solicitações de assinatura</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Professor</TableHead><TableHead>Plano</TableHead><TableHead>Solicitado em</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {(!requests || requests.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma solicitação pendente.</TableCell></TableRow>}
              {requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell><p className="font-medium">{request.teacher?.full_name ?? "Professor"}</p><p className="text-xs text-muted-foreground">{request.teacher?.email}</p></TableCell>
                  <TableCell>{request.plans?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><SubscriptionRequestActions requestId={request.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
