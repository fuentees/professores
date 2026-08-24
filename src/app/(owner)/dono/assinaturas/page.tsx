import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { PageSizeSelect } from "@/components/common/page-size-select";
import { TableSearchForm } from "@/components/common/table-search-form";
import { parsePage, parsePageSize, parseQuery, sanitizeIlikeTerm } from "@/lib/search-filter";
import type { SubscriptionStatus } from "@/types/supabase";

const BASE_PATH = "/dono/assinaturas";
const STATUS_VALUES: SubscriptionStatus[] = ["active", "expired", "canceled"];
const STATUS_LABELS: Record<SubscriptionStatus, string> = { active: "Ativa", expired: "Expirada", canceled: "Cancelada" };
const STATUS_VARIANTS: Record<SubscriptionStatus, "default" | "outline" | "secondary"> = {
  active: "default",
  expired: "outline",
  canceled: "secondary",
};

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (STATUS_VALUES as string[]).includes(value);
}

export default async function DonoAssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  const rawParams = await searchParams;
  const q = parseQuery(rawParams.q);
  const rawStatus = Array.isArray(rawParams.status) ? rawParams.status[0] : rawParams.status;
  const status = rawStatus && isSubscriptionStatus(rawStatus) ? rawStatus : undefined;
  const page = parsePage(rawParams.page);
  const pageSize = parsePageSize(rawParams.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  const term = sanitizeIlikeTerm(q);
  let teacherIds: string[] | null = null;
  if (term) {
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(500);
    teacherIds = (matchingProfiles ?? []).map((p) => p.id);
  }

  let subscriptionsQuery = supabase
    .from("subscriptions")
    .select(
      "id, status, starts_at, expires_at, payment_provider, profiles(full_name, email), plans(name, price, billing_period)",
      { count: "exact" },
    )
    .order("starts_at", { ascending: false })
    .range(from, to);

  if (status) subscriptionsQuery = subscriptionsQuery.eq("status", status);
  if (teacherIds) subscriptionsQuery = subscriptionsQuery.in("teacher_id", teacherIds.length > 0 ? teacherIds : [""]);

  const [{ data: subscriptions, count: totalCount }, { count: activeCount }, { count: expiredCount }, { count: canceledCount }] =
    await Promise.all([
      subscriptionsQuery,
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired"),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled"),
    ]);

  const allCount = (activeCount ?? 0) + (expiredCount ?? 0) + (canceledCount ?? 0);
  const statusCounts: Record<SubscriptionStatus, number> = {
    active: activeCount ?? 0,
    expired: expiredCount ?? 0,
    canceled: canceledCount ?? 0,
  };

  function statusHref(value: SubscriptionStatus | undefined) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q) params.set("q", q);
    if (pageSize !== 25) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  }

  const activeSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    status,
    pageSize: pageSize !== 25 ? String(pageSize) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Assinaturas" description="Histórico completo de assinaturas de todos os professores." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" aria-label="Filtrar assinaturas por status">
          <Button variant={!status ? "default" : "outline"} size="sm" nativeButton={false} render={<Link href={statusHref(undefined)}>Todas ({allCount})</Link>} />
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
        <PageSizeSelect pageSize={pageSize} searchParams={{ q: q || undefined, status }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TableSearchForm
          basePath={BASE_PATH}
          defaultValue={q}
          placeholder="Buscar por professor ou e-mail..."
          hiddenParams={{ status, pageSize: activeSearchParams.pageSize }}
        />
        {q && (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={statusHref(status)} />}>
            <X className="size-4" />
            Limpar busca
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
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
                    {q || status ? "Nenhuma assinatura encontrada para estes filtros." : "Nenhuma assinatura registrada ainda."}
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
                      <Badge variant={STATUS_VARIANTS[sub.status]}>{STATUS_LABELS[sub.status]}</Badge>
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

        <Pagination basePath={BASE_PATH} searchParams={activeSearchParams} page={page} pageSize={pageSize} total={totalCount ?? 0} />
      </div>
    </div>
  );
}
