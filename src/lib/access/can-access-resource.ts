import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";
import { hasSubscriberAccess } from "@/lib/access/subscriber-access";

export type ResourceAccessType = "public" | "free_signup" | "teacher_only" | "subscriber_only";
type GrantTarget = Parameters<typeof hasSubscriberAccess>[2];

/**
 * Regra central de acesso a um recurso (material, objeto de aprendizagem,
 * aula de curso): "public" é visível sem conta; "free_signup" e
 * "teacher_only" exigem apenas um perfil ativo logado; "subscriber_only"
 * exige assinatura ativa ou um grant específico para o recurso.
 */
export async function canAccessResource(
  supabase: SupabaseClient<Database>,
  profile: CurrentProfile | null,
  resource: { accessType: ResourceAccessType },
  grantTarget?: GrantTarget,
): Promise<boolean> {
  if (resource.accessType === "public") return true;
  if (!profile) return false;
  if (profile.status !== "active") return false;
  if (resource.accessType === "subscriber_only") {
    return hasSubscriberAccess(supabase, profile.id, grantTarget);
  }
  return true;
}
