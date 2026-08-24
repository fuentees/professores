import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlansManager, type PlanRow } from "@/components/owner/plans-manager";
import { SubscriptionRequestActions } from "@/components/owner/subscription-request-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { PageSizeSelect } from "@/components/common/page-size-select";
import { parsePage, parsePageSize } from "@/lib/search-filter";

const BASE_PATH = "/dono/planos";
type RequestStatus = "pending" | "approved" | "rejected" | "canceled";
const STATUS_VALUES: RequestStatus[] = ["pending", "approved", "rejected", "canceled"];
const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Recusada",
  canceled: "Cancelada",
};
const STATUS_VARIANTS: Record<RequestStatus, "default" | "outline" | "secondary" | "destructive"> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
  canceled: "outline",
};

function isRequestStatus(value: string): value is RequestStatus {
  return (STATUS_VALUES as string[]).includes(value);
}

type RequestRow = {
  id: string;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
  teacher: { full_name: string; email: string } | null;
  plans: { name: string } | null;
};

export default async function DonoPlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[]; pageSize?: string | string[] }>;
}) {
  const rawParams = await searchParams;
  const rawStatus = Array.isArray(rawParams.status) ? rawParams.status[0] : rawParams.status;
  const status: RequestStatus = rawStatus && isRequestStatus(rawStatus) ? rawStatus : "pending";
  const page = parsePage(rawParams.page);
  const pageSize = parsePageSize(rawParams.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const [
    { data: plans },
    { data: requests, count: totalCount },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: canceledCount },
  ] = await Promise.all([
    supabase.from("plans").select("*").order("order_index"),
    supabase
      .from("subscription_requests")
      .select("id, status, created_at, reviewed_at, teacher:profiles!subscription_requests_teacher_id_fkey(full_name, email), plans(name)", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: status === "pending" })
      .range(from, to)
      .returns<RequestRow[]>(),
    supabase.from("subscription_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("subscription_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("subscription_requests").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("subscription_requests").select("id", { count: "exact", head: true }).eq("status", "canceled"),
  ]);

  const statusCounts: Record<RequestStatus, number> = {
    pending: pendingCount ?? 0,
    approved: approvedCount ?? 0,
    rejected: rejectedCount ?? 0,
    canceled: canceledCount ?? 0,
  };

  function statusHref(value: RequestStatus) {
    const params = new URLSearchParams();
    if (value !== "pending") params.set("status", value);
    if (pageSize !== 25) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  }

  const activeSearchParams: Record<string, string | undefined> = {
    status: status !== "pending" ? status : undefined,
    pageSize: pageSize !== 25 ? String(pageSize) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description="Cadastre os planos de acesso e analise as solicitações enviadas pelos professores."
      />

      <PlansManager rows={(plans ?? []) as PlanRow[]} />

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle>Solicitações de assinatura</CardTitle>
          <PageSizeSelect pageSize={pageSize} searchParams={{ status: activeSearchParams.status }} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar solicitações por status">
            {STATUS_VALUES.map((value) => (
              <Button
                key={value}
                variant={status === value ? "default" : "outline"}
                size="sm"
                nativeButton={false}
                render={<Link href={statusHref(value)}>{STATUS_LABELS[value]} ({statusCounts[value]})</Link>}
              />
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{status === "pending" ? "Ações" : "Analisada em"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!requests || requests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma solicitação {STATUS_LABELS[status].toLowerCase()} encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {requests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell><p className="font-medium">{request.teacher?.full_name ?? "Professor"}</p><p className="text-xs text-muted-foreground">{request.teacher?.email}</p></TableCell>
                    <TableCell>{request.plans?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(request.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANTS[request.status]}>{STATUS_LABELS[request.status]}</Badge></TableCell>
                    <TableCell>
                      {request.status === "pending" ? (
                        <SubscriptionRequestActions requestId={request.id} />
                      ) : (
                        <span className="text-muted-foreground">
                          {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString("pt-BR") : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination basePath={BASE_PATH} searchParams={activeSearchParams} page={page} pageSize={pageSize} total={totalCount ?? 0} />
        </CardContent>
      </Card>
    </div>
  );
}
