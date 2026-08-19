import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

const ADMIN_PREFIX = "/admin";
const OWNER_PREFIX = "/dono";
const TEACHER_PREFIX = "/painel";
// /redefinir-senha fica de fora: o link de recuperação de senha autentica o
// usuário (sessão de recovery) antes de trazê-lo para essa página, então não
// podemos redirecioná-lo para /painel só por já estar "logado".
const AUTH_PREFIXES = ["/entrar", "/cadastro", "/recuperar-senha"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: avoid writing logic between createServerClient and getUser().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (
    !user &&
    (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(OWNER_PREFIX) || pathname.startsWith(TEACHER_PREFIX))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith(ADMIN_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Painel do proprietário: além de admin, exige a flag is_owner — mais
  // restrito que o admin de conteúdo comum.
  if (user && pathname.startsWith(OWNER_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status, is_owner")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.role !== "admin" || !profile.is_owner) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === "admin" ? "/admin" : "/";
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith(TEACHER_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.status === "blocked") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("bloqueado", "1");
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
