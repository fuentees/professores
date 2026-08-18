"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSafeRedirectPath } from "@/lib/safe-redirect";

/**
 * Cliente (não server route) de propósito: o Supabase free tier usa o
 * template de e-mail padrão, que passa pela página de verificação
 * hospedada por eles e devolve a sessão como fragmento de URL
 * (#access_token=...&refresh_token=...) em vez de token_hash na query
 * string — e fragmento nunca chega ao servidor, então uma server route
 * não consegue ler isso. Por isso essa página trata os dois formatos:
 * token_hash na query (link customizado apontando direto pra cá) e
 * access_token/refresh_token no fragmento (fluxo padrão atual).
 */
export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<ConfirmingMessage />}>
      <AuthConfirmHandler />
    </Suspense>
  );
}

function ConfirmingMessage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Confirmando...</p>
    </div>
  );
}

function AuthConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      const supabase = createClient();
      const rawNext = searchParams.get("next");
      const next = isSafeRedirectPath(rawNext) ? rawNext : "/painel";

      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        router.replace(error ? "/entrar?erro=link_invalido" : next);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        router.replace(error ? "/entrar?erro=link_invalido" : next);
        return;
      }

      router.replace("/entrar?erro=link_invalido");
    }

    run();
  }, [router, searchParams]);

  return <ConfirmingMessage />;
}
