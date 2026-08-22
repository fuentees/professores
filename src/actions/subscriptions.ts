"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile } from "@/lib/auth/require-active-profile";
import { NotOwnerError, requireOwner } from "@/lib/auth/require-owner";

type Result = { error: string | null };

export async function requestSubscription(planId: string): Promise<Result> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login para solicitar este plano." };

  const admin = createAdminClient();
  const { data: plan } = await admin
    .from("plans")
    .select("id, price, status")
    .eq("id", planId)
    .eq("status", "active")
    .maybeSingle();
  if (!plan || Number(plan.price) <= 0) return { error: "Selecione um plano Premium válido." };

  const { data: active } = await admin
    .from("subscriptions")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("status", "active")
    .maybeSingle();
  if (active) return { error: "Você já possui uma assinatura ativa." };

  const { data: pending } = await admin
    .from("subscription_requests")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("status", "pending")
    .maybeSingle();

  const operation = pending
    ? admin.from("subscription_requests").update({ plan_id: plan.id }).eq("id", pending.id)
    : admin.from("subscription_requests").insert({ teacher_id: profile.id, plan_id: plan.id });
  const { error } = await operation;
  if (error) return { error: "Não foi possível enviar sua solicitação." };

  revalidatePath("/planos");
  revalidatePath("/painel/assinatura");
  revalidatePath("/dono/planos");
  return { error: null };
}

export async function cancelSubscriptionRequest(): Promise<Result> {
  const profile = await requireActiveProfile();
  if (!profile) return { error: "Faça login." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscription_requests")
    .update({ status: "canceled" })
    .eq("teacher_id", profile.id)
    .eq("status", "pending");
  if (error) return { error: "Não foi possível cancelar a solicitação." };
  revalidatePath("/planos");
  revalidatePath("/painel/assinatura");
  revalidatePath("/dono/planos");
  return { error: null };
}

export async function reviewSubscriptionRequest(
  requestId: string,
  decision: "approved" | "rejected",
): Promise<Result> {
  let owner;
  try {
    owner = await requireOwner();
  } catch (error) {
    if (error instanceof NotOwnerError) return { error: error.message };
    throw error;
  }

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("subscription_requests")
    .select("id, teacher_id, plan_id, status")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();
  if (!request) return { error: "Solicitação não encontrada ou já analisada." };

  if (decision === "approved") {
    const { data: plan } = await admin.from("plans").select("billing_period").eq("id", request.plan_id).maybeSingle();
    if (!plan) return { error: "Plano não encontrado." };
    await admin.from("subscriptions").update({ status: "canceled" }).eq("teacher_id", request.teacher_id).eq("status", "active");
    const expiresAt = new Date();
    if (plan.billing_period === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await admin.from("subscriptions").insert({
      teacher_id: request.teacher_id,
      plan_id: request.plan_id,
      status: "active",
      expires_at: expiresAt.toISOString(),
      payment_provider: "manual_request",
      external_reference: request.id,
    });
    if (error) return { error: "Não foi possível ativar a assinatura." };
  }

  const { error } = await admin
    .from("subscription_requests")
    .update({ status: decision, reviewed_by: owner.id, reviewed_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error) return { error: "A assinatura foi alterada, mas a solicitação não pôde ser finalizada." };

  revalidatePath("/dono/planos");
  revalidatePath("/painel/assinatura");
  return { error: null };
}
