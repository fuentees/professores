"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPlan, deletePlan, setPlanStatus, updatePlan } from "@/actions/owner/plans";
import { planSchema, type PlanInput } from "@/lib/validations/plan";
import { CatalogManager, type CatalogRow } from "@/components/admin/catalog-manager";
import { TagInput } from "@/components/admin/tag-input";

export type PlanRow = CatalogRow & {
  price: number;
  billing_period: "free" | "monthly" | "yearly";
  download_limit: number | null;
  features: string[];
};

const BILLING_LABELS: Record<string, string> = {
  free: "Gratuito",
  monthly: "Mensal",
  yearly: "Anual",
};

export function PlansManager({ rows }: { rows: PlanRow[] }) {
  return (
    <CatalogManager<PlanRow, PlanInput>
      title="Planos"
      emptyLabel="Nenhum plano cadastrado ainda."
      rows={rows}
      schema={planSchema}
      defaultValues={(row) => ({
        name: row?.name ?? "",
        description: row?.description ?? "",
        price: row?.price ?? 0,
        billingPeriod: row?.billing_period ?? "free",
        downloadLimit: row?.download_limit ?? undefined,
        features: row?.features ?? [],
        status: row?.status ?? "active",
        orderIndex: row?.order_index ?? 0,
      })}
      extraColumns={[
        {
          header: "Preço",
          render: (row) =>
            row.price > 0
              ? `R$ ${row.price.toFixed(2)} / ${BILLING_LABELS[row.billing_period]}`
              : "Gratuito",
        },
      ]}
      renderExtraFields={(form) => (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" type="number" step="0.01" {...form.register("price")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Periodicidade</Label>
              <Select
                value={form.watch("billingPeriod")}
                onValueChange={(value) => form.setValue("billingPeriod", value ?? "free")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => BILLING_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="downloadLimit">Limite de downloads</Label>
              <Input id="downloadLimit" type="number" {...form.register("downloadLimit")} />
            </div>
          </div>
          <TagInput
            label="Benefícios"
            value={form.watch("features")}
            onChange={(features) => form.setValue("features", features)}
          />
        </>
      )}
      onCreate={createPlan}
      onUpdate={updatePlan}
      onDelete={deletePlan}
      onSetStatus={setPlanStatus}
    />
  );
}
