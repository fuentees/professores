import "server-only";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export class NotAdminError extends Error {
  constructor() {
    super("Ação restrita ao administrador do portal.");
    this.name = "NotAdminError";
  }
}

/**
 * Defense-in-depth check for admin Server Actions. RLS already blocks
 * non-admin writes at the database level; this just gives a clean error
 * message instead of a raw Postgres RLS failure.
 */
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new NotAdminError();
  }
  return profile;
}
