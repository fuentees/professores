import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function recordQuestionImportEvent(
  admin: AdminClient,
  input: {
    importId: string | null;
    actorId: string | null;
    action: string;
    details?: Record<string, unknown>;
  },
) {
  // Auditoria não deve derrubar a operação principal por uma indisponibilidade
  // temporária; a chamada continua aguardada para evitar eventos perdidos no
  // caminho feliz.
  await admin.from("question_import_events").insert({
    import_id: input.importId,
    actor_id: input.actorId,
    action: input.action,
    details: input.details ?? {},
  });
}
