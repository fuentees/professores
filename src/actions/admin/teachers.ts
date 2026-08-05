"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";

export type ActionResult = { error: string | null };

const TEACHERS_PATH = "/admin/professores";

export async function setTeacherStatus(
  profileId: string,
  status: "active" | "blocked",
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", profileId)
    .eq("role", "teacher");

  if (error) return { error: error.message };
  revalidatePath(TEACHERS_PATH);
  return { error: null };
}

export async function createManualSubscription(
  teacherId: string,
  planId: string,
  expiresAt: string | null,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").insert({
    teacher_id: teacherId,
    plan_id: planId,
    status: "active",
    expires_at: expiresAt,
    payment_provider: "manual",
  });

  if (error) return { error: error.message };
  revalidatePath(TEACHERS_PATH);
  revalidatePath(`/admin/professores/${teacherId}`);
  return { error: null };
}

export async function cancelSubscription(subscriptionId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("id", subscriptionId);

  if (error) return { error: error.message };
  revalidatePath(TEACHERS_PATH);
  return { error: null };
}

export async function grantContentAccess(
  teacherId: string,
  contentId: string,
  expiresAt: string | null,
): Promise<ActionResult> {
  const admin = await (async () => {
    try {
      return await requireAdmin();
    } catch (e) {
      if (e instanceof NotAdminError) return null;
      throw e;
    }
  })();
  if (!admin) return { error: "Ação restrita ao administrador do portal." };

  const supabase = await createClient();
  const { error } = await supabase.from("access_grants").insert({
    teacher_id: teacherId,
    content_id: contentId,
    expires_at: expiresAt,
    granted_by: admin.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/professores/${teacherId}`);
  return { error: null };
}

export async function revokeContentAccess(grantId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("access_grants").delete().eq("id", grantId);
  if (error) return { error: error.message };
  revalidatePath(TEACHERS_PATH);
  return { error: null };
}
