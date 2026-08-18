import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavMenu } from "@/components/layout/nav-menu";

// Nav flat pra mobile (sheet) — todos os destinos, sem agrupamento (lista
// simples já é o padrão certo em mobile).
const MOBILE_NAV_LINKS = [
  { href: "/materiais", label: "Materiais" },
  { href: "/pastas", label: "Pastas" },
  { href: "/objetos", label: "Recursos interativos" },
  { href: "/cursos", label: "Cursos" },
  { href: "/bncc", label: "BNCC" },
  { href: "/forum", label: "Fórum" },
  { href: "/blog", label: "Blog" },
  { href: "/planos", label: "Planos" },
];

const EXPLORAR_LINKS = [
  { href: "/materiais", label: "Materiais" },
  { href: "/pastas", label: "Pastas" },
];

const COMUNIDADE_LINKS = [
  { href: "/forum", label: "Fórum" },
  { href: "/blog", label: "Blog" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <MobileNav links={MOBILE_NAV_LINKS} />
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5" />
            <span>Portal do Professor</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          <Link href="/" className="hover:text-foreground">
            Início
          </Link>
          <NavMenu label="Explorar" links={EXPLORAR_LINKS} />
          <Link href="/objetos" className="hover:text-foreground">
            Recursos interativos
          </Link>
          <Link href="/cursos" className="hover:text-foreground">
            Cursos
          </Link>
          <Link href="/bncc" className="hover:text-foreground">
            BNCC
          </Link>
          <NavMenu label="Comunidade" links={COMUNIDADE_LINKS} />
          <Link href="/planos" className="hover:text-foreground">
            Planos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/entrar">Entrar</Link>}
              />
              <Button nativeButton={false} render={<Link href="/cadastro">Cadastre-se</Link>} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
