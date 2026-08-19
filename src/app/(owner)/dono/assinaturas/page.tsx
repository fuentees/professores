import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = { active: "Ativa", expired: "Expirada", canceled: "Cancelada" };
const STATUS_VARIANTS: Record<string, "default" | "outline" | "secondary"> = {
  active: "default",
  expired: "outline",
  canceled: "secondary",
};

export default async function DonoAssinaturasPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, starts_at, expires_at, payment_provider, profiles(full_name, email), plans(name, price, billing_period)")
    .order("starts_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <p className="text-muted-foreground">Histórico de assinaturas de todos os professores (últimas 200).</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Professor</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!subscriptions || subscriptions.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma assinatura registrada ainda.
                </TableCell>
              </TableRow>
            )}
            {subscriptions?.map((sub) => {
              const teacher = sub.profiles as unknown as { full_name: string; email: string } | null;
              const plan = sub.plans as unknown as { name: string } | null;
              return (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {teacher?.full_name || "—"}
                    <span className="block text-xs font-normal text-muted-foreground">{teacher?.email}</span>
                  </TableCell>
                  <TableCell>{plan?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[sub.status] ?? "outline"}>
                      {STATUS_LABELS[sub.status] ?? sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sub.starts_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR") : "Sem prazo"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
