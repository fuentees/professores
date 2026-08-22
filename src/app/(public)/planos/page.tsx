import Link from "next/link";
import type { Metadata } from "next";
import { Check, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SubscriptionRequestButton } from "@/components/subscriptions/subscription-request-button";

export const metadata: Metadata = {
  title: "Planos",
  description: "Escolha o plano que melhor atende às suas necessidades.",
};

const BILLING_LABELS: Record<string, string> = {
  free: "grátis",
  monthly: "/ mês",
  yearly: "/ ano",
};

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PlanosPage() {
  const supabase = await createClient();
  const [{ data: plans }, profile] = await Promise.all([
    supabase.from("plans").select("*").order("order_index"),
    getCurrentProfile(),
  ]);

  const [{ data: activeSubscription }, { data: pendingRequest }] = profile
    ? await Promise.all([
        supabase.from("subscriptions").select("plan_id").eq("teacher_id", profile.id).eq("status", "active").maybeSingle(),
        supabase.from("subscription_requests").select("plan_id").eq("teacher_id", profile.id).eq("status", "pending").maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-14">
      <PageHeader title="Planos" description="Escolha o plano que melhor atende às suas necessidades." />

      {!plans || plans.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum plano disponível no momento"
          description="Volte em breve — estamos preparando nossos planos de assinatura."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-3xl font-bold">
                  {plan.price > 0 ? `R$ ${formatPrice(plan.price)}` : "Grátis"}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    {BILLING_LABELS[plan.billing_period]}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!profile ? (
                  <Button nativeButton={false} render={<Link href="/cadastro">Criar conta</Link>} />
                ) : activeSubscription?.plan_id === plan.id ? (
                  <Button disabled>Plano atual</Button>
                ) : plan.billing_period === "free" ? (
                  <Button nativeButton={false} variant="outline" render={<Link href="/painel/assinatura">Ver minha assinatura</Link>} />
                ) : pendingRequest?.plan_id === plan.id ? (
                  <Button disabled>Solicitação enviada</Button>
                ) : (
                  <SubscriptionRequestButton planId={plan.id} planName={plan.name} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
