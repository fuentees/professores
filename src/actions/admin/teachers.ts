"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";

export type ActionResult = { error: string | null };

const TEACHERS_PATH = "/admin/professores";

const PASSWORD_LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const PASSWORD_DIGITS = "23456789";

function randomFrom(alphabet: string): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

/** Senha temporária legível (sem 0/O/1/l/I), sempre com letra e número — mesma regra de senha usada ao criar administradores. */
function generateTemporaryPassword(): string {
  const alphabet = PASSWORD_LETTERS + PASSWORD_DIGITS;
  let password = randomFrom(PASSWORD_LETTERS) + randomFrom(PASSWORD_DIGITS);
  for (let i = 0; i < 8; i++) password += randomFrom(alphabet);
  return password;
}

export async function addTeacherNote(teacherId: string, body: string): Promise<ActionResult> {
  let author;
  try {
    author = await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const trimmed = body.trim();
  if (trimmed.length < 2) return { error: "Escreva uma anotação antes de salvar." };
  if (trimmed.length > 2000) return { error: "Anotação muito longa (máximo 2000 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_notes").insert({
    teacher_id: teacherId,
    author_id: author.id,
    body: trimmed,
  });

  if (error) return { error: "Não foi possível salvar a anotação." };
  revalidatePath(`/admin/professores/${teacherId}`);
  return { error: null };
}

export type ResetPasswordResult = { error: string | null; password?: string };

export async function resetTeacherPassword(profileId: string): Promise<ResetPasswordResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const admin = createAdminClient();
  const { data: teacher } = await admin
    .from("profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .eq("role", "teacher")
    .maybeSingle();
  if (!teacher) return { error: "Professor não encontrado." };

  const password = generateTemporaryPassword();
  const { error } = await admin.auth.admin.updateUserById(teacher.auth_user_id, { password });
  if (error) return { error: "Não foi possível redefinir a senha." };

  return { error: null, password };
}

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

  // Só pode haver uma assinatura "active" por professor (índice único
  // parcial em subscriptions) — supersede a anterior antes de criar a
  // nova, em vez de deixar duas vivas ou estourar a constraint.
  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("teacher_id", teacherId)
    .eq("status", "active");

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
