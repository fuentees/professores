import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelSubscriptionRequestButton } from "@/components/subscriptions/cancel-subscription-request-button";

type SubscriptionRow = {
  status: string;
  starts_at: string;
  expires_at: string | null;
  plans: { name: string; description: string | null; features: string[] } | null;
};

type PendingRequestRow = {
  created_at: string;
  plans: { name: string; description: string | null } | null;
};

export default async function AssinaturaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar?redirect=/painel/assinatura");

  const supabase = await createClient();
  const [{ data: subscription }, { data: pendingRequest }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, starts_at, expires_at, plans(name, description, features)")
      .eq("teacher_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle()
      .returns<SubscriptionRow>(),
    supabase
      .from("subscription_requests")
      .select("created_at, plans(name, description)")
      .eq("teacher_id", profile.id)
      .eq("status", "pending")
      .maybeSingle()
      .returns<PendingRequestRow>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minha assinatura</h1>
        <p className="text-muted-foreground">Acompanhe seu plano de acesso ao portal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{subscription.plans?.name}</span>
                <Badge>Ativo</Badge>
              </div>
              {subscription.plans?.description && (
                <p className="text-sm text-muted-foreground">{subscription.plans.description}</p>
              )}
              {subscription.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Expira em {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </>
          ) : pendingRequest ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{pendingRequest.plans?.name}</span>
                <Badge variant="secondary">Em análise</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Sua solicitação foi recebida. Você verá o plano ativo aqui assim que a equipe concluir a liberação.
              </p>
              <CancelSubscriptionRequestButton />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você ainda não possui uma assinatura ativa. Conheça nossos planos.
              </p>
              <Button nativeButton={false} render={<Link href="/planos">Ver planos</Link>} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
