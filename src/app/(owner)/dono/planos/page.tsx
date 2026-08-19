import { createClient } from "@/lib/supabase/server";
import { PlansManager, type PlanRow } from "@/components/owner/plans-manager";

export default async function DonoPlanosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("*").order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-muted-foreground">
          Cadastre os planos de acesso. No MVP, a liberação de assinaturas é manual (feita em
          Professores, no admin de conteúdo).
        </p>
      </div>

      <PlansManager rows={(plans ?? []) as PlanRow[]} />
    </div>
  );
}
