"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, NotOwnerError } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null };

const ADMINS_PATH = "/dono/administradores";

/**
 * Alterna a flag is_owner de outro admin. Bloqueia dois casos perigosos:
 * o próprio proprietário se auto-rebaixando (perderia acesso ao painel na
 * hora), e remover o último proprietário restante (ninguém mais poderia
 * promover um substituto).
 */
export async function setOwnerFlag(profileId: string, isOwner: boolean): Promise<ActionResult> {
  let currentOwner;
  try {
    currentOwner = await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { error: e.message };
    throw e;
  }

  if (profileId === currentOwner.id && !isOwner) {
    return { error: "Você não pode remover sua própria permissão de proprietário." };
  }

  const supabase = await createClient();

  if (!isOwner) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_owner", true);
    if ((count ?? 0) <= 1) {
      return { error: "Precisa haver pelo menos um proprietário — promova outro admin antes de remover este." };
    }
  }

  const { error } = await supabase.from("profiles").update({ is_owner: isOwner }).eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath(ADMINS_PATH);
  return { error: null };
}
