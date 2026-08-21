import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavMenu } from "@/components/layout/nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="sticky top-0 z-40 border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(180,55,30,0.12)]">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav links={MOBILE_NAV_LINKS} />
          <Link href="/" className="flex items-center gap-2.5 font-semibold leading-none">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 shadow-sm">
              <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <span className="hidden text-[15px] tracking-tight sm:block">
              Portal do<br /><span className="text-lg">Professor</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-medium text-primary-foreground/85 lg:flex">
          <Link href="/" className="transition-colors hover:text-primary-foreground">
            Início
          </Link>
          <NavMenu label="Explorar" links={EXPLORAR_LINKS} />
          <Link href="/objetos" className="transition-colors hover:text-primary-foreground">
            Recursos interativos
          </Link>
          <Link href="/cursos" className="transition-colors hover:text-primary-foreground">
            Cursos
          </Link>
          <Link href="/bncc" className="transition-colors hover:text-primary-foreground">
            BNCC
          </Link>
          <NavMenu label="Comunidade" links={COMUNIDADE_LINKS} />
          <Link href="/planos" className="transition-colors hover:text-primary-foreground">
            Planos
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 [&_button]:text-primary-foreground [&_button:hover]:bg-primary-foreground/12">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
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
