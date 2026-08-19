import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";
import { canAccessResource } from "./can-access-resource";

function makeProfile(overrides: Partial<CurrentProfile> = {}): CurrentProfile {
  return {
    id: "profile-1",
    auth_user_id: "auth-1",
    full_name: "Professora Teste",
    email: "teste@example.com",
    phone: null,
    avatar_url: null,
    role: "teacher",
    status: "active",
    is_owner: false,
    school_name: null,
    school_phone: null,
    school_logo_url: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Mock mínimo do query builder do Supabase: qualquer encadeamento de
 * select/eq/or/limit resolve para o `row` configurado por tabela. */
function makeSupabaseMock(rows: Record<string, unknown>): SupabaseClient<Database> {
  const chain = (table: string) => ({
    select: () => chain(table),
    eq: () => chain(table),
    or: () => chain(table),
    limit: () => chain(table),
    maybeSingle: async () => ({ data: rows[table] ?? null }),
  });
  return { from: (table: string) => chain(table) } as unknown as SupabaseClient<Database>;
}

describe("canAccessResource", () => {
  it("permite acesso público mesmo sem perfil (visitante anônimo)", async () => {
    const supabase = makeSupabaseMock({});
    const result = await canAccessResource(supabase, null, { accessType: "public" });
    expect(result).toBe(true);
  });

  it("permite acesso público mesmo com perfil logado", async () => {
    const supabase = makeSupabaseMock({});
    const result = await canAccessResource(supabase, makeProfile(), { accessType: "public" });
    expect(result).toBe(true);
  });

  it.each(["free_signup", "teacher_only"] as const)(
    "nega %s sem perfil e permite com perfil logado",
    async (accessType) => {
      const supabase = makeSupabaseMock({});
      expect(await canAccessResource(supabase, null, { accessType })).toBe(false);
      expect(await canAccessResource(supabase, makeProfile(), { accessType })).toBe(true);
    },
  );

  it("nega subscriber_only sem perfil, mesmo sem checar assinatura", async () => {
    const supabase = makeSupabaseMock({ subscriptions: { id: "sub-1" } });
    const result = await canAccessResource(supabase, null, { accessType: "subscriber_only" });
    expect(result).toBe(false);
  });

  it("permite subscriber_only com perfil e assinatura ativa", async () => {
    const supabase = makeSupabaseMock({ subscriptions: { id: "sub-1" } });
    const result = await canAccessResource(supabase, makeProfile(), { accessType: "subscriber_only" });
    expect(result).toBe(true);
  });

  it("nega subscriber_only com perfil mas sem assinatura nem grant", async () => {
    const supabase = makeSupabaseMock({});
    const result = await canAccessResource(supabase, makeProfile(), { accessType: "subscriber_only" });
    expect(result).toBe(false);
  });

  it("permite subscriber_only com perfil e grant específico de conteúdo", async () => {
    const supabase = makeSupabaseMock({ access_grants: { id: "grant-1" } });
    const result = await canAccessResource(supabase, makeProfile(), { accessType: "subscriber_only" }, {
      contentId: "content-1",
    });
    expect(result).toBe(true);
  });
});
