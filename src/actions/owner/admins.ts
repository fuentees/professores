"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner, NotOwnerError } from "@/lib/auth/require-owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null };

const ADMINS_PATH = "/dono/administradores";
const profileIdSchema = z.string().uuid("Conta inválida.");
const createAdminAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe o nome completo."),
    email: z.email("Informe um e-mail válido."),
    temporaryPassword: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.temporaryPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type CreateAdminAccountState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

async function getOwnerOrError() {
  try {
    return { owner: await requireOwner(), error: null };
  } catch (error) {
    if (error instanceof NotOwnerError) return { owner: null, error: error.message };
    throw error;
  }
}

function revalidateAdminPages() {
  revalidatePath(ADMINS_PATH);
  revalidatePath("/admin/professores");
}

export async function createAdminAccount(
  _state: CreateAdminAccountState,
  formData: FormData,
): Promise<CreateAdminAccountState> {
  const parsed = createAdminAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    temporaryPassword: formData.get("temporaryPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const authorization = await getOwnerOrError();
  if (!authorization.owner) return { message: authorization.error };

  const admin = createAdminClient();
  const { data, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (createError || !data.user) {
    const alreadyExists = createError?.message.toLowerCase().includes("already") ?? false;
    return {
      message: alreadyExists
        ? "Já existe uma conta com este e-mail. Localize-a abaixo e use “Promover a admin”."
        : "Não foi possível criar a conta administradora.",
    };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      role: "admin",
      status: "active",
      is_owner: false,
    })
    .eq("auth_user_id", data.user.id)
    .select("id")
    .maybeSingle();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { message: "A conta não pôde receber a permissão administrativa e foi cancelada." };
  }

  revalidateAdminPages();
  return {
    success: true,
    message: "Administrador criado. A conta já pode entrar sem confirmar o e-mail.",
  };
}

export async function promoteToAdmin(profileId: string): Promise<ActionResult> {
  const parsedId = profileIdSchema.safeParse(profileId);
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? "Conta inválida." };

  const authorization = await getOwnerOrError();
  if (!authorization.owner) return { error: authorization.error };

  const supabase = await createClient();
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (targetError) return { error: "Não foi possível verificar esta conta." };
  if (!target) return { error: "Conta não encontrada." };
  if (target.role === "admin") return { error: "Esta conta já é administradora." };

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", status: "active", is_owner: false })
    .eq("id", target.id)
    .eq("role", "teacher");

  if (error) return { error: error.message };
  revalidateAdminPages();
  return { error: null };
}

export async function demoteToTeacher(profileId: string): Promise<ActionResult> {
  const parsedId = profileIdSchema.safeParse(profileId);
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? "Conta inválida." };

  const authorization = await getOwnerOrError();
  if (!authorization.owner) return { error: authorization.error };
  if (authorization.owner.id === parsedId.data) {
    return { error: "Você não pode rebaixar sua própria conta." };
  }

  const supabase = await createClient();
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, is_owner")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (targetError) return { error: "Não foi possível verificar esta conta." };
  if (!target) return { error: "Conta não encontrada." };
  if (target.role !== "admin") return { error: "Esta conta não é administradora." };
  if (target.is_owner) {
    return { error: "Remova primeiro a permissão de proprietário desta conta." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "teacher", is_owner: false })
    .eq("id", target.id)
    .eq("role", "admin")
    .eq("is_owner", false);

  if (error) return { error: error.message };
  revalidateAdminPages();
  return { error: null };
}

/**
 * Alterna a flag is_owner de outro admin. Bloqueia dois casos perigosos:
 * o próprio proprietário se auto-rebaixando (perderia acesso ao painel na
 * hora), e remover o último proprietário restante (ninguém mais poderia
 * promover um substituto).
 */
export async function setOwnerFlag(profileId: string, isOwner: boolean): Promise<ActionResult> {
  const parsedId = profileIdSchema.safeParse(profileId);
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? "Conta inválida." };

  const authorization = await getOwnerOrError();
  if (!authorization.owner) return { error: authorization.error };
  const currentOwner = authorization.owner;

  if (parsedId.data === currentOwner.id && !isOwner) {
    return { error: "Você não pode remover sua própria permissão de proprietário." };
  }

  const supabase = await createClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, status, is_owner")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (targetError) return { error: "Não foi possível verificar esta conta." };
  if (!target) return { error: "Conta não encontrada." };
  if (target.role !== "admin") {
    return { error: "Somente uma conta administradora pode se tornar proprietária." };
  }
  if (isOwner && target.status !== "active") {
    return { error: "Ative esta conta antes de torná-la proprietária." };
  }
  if (target.is_owner === isOwner) return { error: null };

  if (!isOwner) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "active")
      .eq("is_owner", true);
    if ((count ?? 0) <= 1) {
      return { error: "Precisa haver pelo menos um proprietário — promova outro admin antes de remover este." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_owner: isOwner })
    .eq("id", target.id)
    .eq("role", "admin");
  if (error) return { error: error.message };

  revalidateAdminPages();
  return { error: null };
}
