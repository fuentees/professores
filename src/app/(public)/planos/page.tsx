import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

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

  // Assinatura é liberada manualmente pelo admin (sem checkout próprio) —
  // para quem já tem conta, "Criar conta" de novo é uma ação quebrada;
  // manda pra tela onde o professor vê o status real da própria assinatura.
  const ctaHref = profile ? "/painel/assinatura" : "/cadastro";
  const ctaLabel = profile ? "Ver minha assinatura" : "Criar conta";

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
                <Button nativeButton={false} render={<Link href={ctaHref}>{ctaLabel}</Link>} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
