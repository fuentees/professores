import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BILLING_LABELS: Record<string, string> = {
  free: "grátis",
  monthly: "/ mês",
  yearly: "/ ano",
};

export default async function PlanosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("order_index");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-14">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Planos</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha o plano que melhor atende às suas necessidades.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold">
                {plan.price > 0 ? `R$ ${plan.price.toFixed(2)}` : "Grátis"}
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
              <Button nativeButton={false} render={<Link href="/cadastro">Criar conta</Link>} />
            </CardContent>
          </Card>
        ))}

        {(!plans || plans.length === 0) && (
          <p className="col-span-full text-center text-muted-foreground">
            Nenhum plano cadastrado no momento.
          </p>
        )}
      </div>
    </div>
  );
}
