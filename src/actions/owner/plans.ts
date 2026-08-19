"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner, NotOwnerError } from "@/lib/auth/require-owner";
import { slugify, ensureUniqueSlug } from "@/lib/slug";
import { planSchema } from "@/lib/validations/plan";

export type ActionResult = { error: string | null };

const PLANS_PATH = "/dono/planos";

export async function createPlan(input: unknown): Promise<ActionResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;
  const slug = await ensureUniqueSlug(supabase, "plans", slugify(data.name));

  const { error } = await supabase.from("plans").insert({
    name: data.name,
    slug,
    description: data.description || null,
    price: data.price,
    billing_period: data.billingPeriod,
    download_limit: data.downloadLimit ?? null,
    features: data.features,
    status: data.status,
    order_index: data.orderIndex,
  });

  if (error) return { error: error.message };
  revalidatePath(PLANS_PATH);
  return { error: null };
}

export async function updatePlan(id: string, input: unknown): Promise<ActionResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { error } = await supabase
    .from("plans")
    .update({
      name: data.name,
      slug: slugify(data.name),
      description: data.description || null,
      price: data.price,
      billing_period: data.billingPeriod,
      download_limit: data.downloadLimit ?? null,
      features: data.features,
      status: data.status,
      order_index: data.orderIndex,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PLANS_PATH);
  return { error: null };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", id);

  if (count && count > 0) {
    return { error: "Este plano possui assinaturas vinculadas e não pode ser excluído." };
  }

  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PLANS_PATH);
  return { error: null };
}

export async function setPlanStatus(id: string, status: "active" | "inactive"): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PLANS_PATH);
  return { error: null };
}
