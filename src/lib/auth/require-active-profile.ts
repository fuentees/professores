import "server-only";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * Same as getCurrentProfile, but also rejects blocked accounts. Blocked
 * users were previously only stopped by the /painel layout redirect —
 * calling a mutating Server Action directly (favoritar, baixar, postar no
 * fórum, gerar prova...) bypassed the block entirely, since RLS on those
 * tables only checks ownership, never `profiles.status`. Drop-in
 * replacement: callers keep the same `if (!profile) return {error: ...}`
 * shape they already use with getCurrentProfile.
 */
export async function requireActiveProfile(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") return null;
  return profile;
}
