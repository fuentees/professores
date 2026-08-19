import "server-only";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export class NotOwnerError extends Error {
  constructor() {
    super("Ação restrita ao proprietário do portal.");
    this.name = "NotOwnerError";
  }
}

/**
 * Defense-in-depth check for owner-only Server Actions (planos, gestão de
 * outros admins). Mais restrito que requireAdmin: exige role admin ativo
 * E a flag is_owner — um admin de conteúdo comum não passa aqui.
 */
export async function requireOwner() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active" || !profile.is_owner) {
    throw new NotOwnerError();
  }
  return profile;
}
