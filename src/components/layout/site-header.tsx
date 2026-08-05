import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

const NAV_LINKS = [
  { href: "/materiais", label: "Materiais" },
  { href: "/cursos", label: "Cursos" },
  { href: "/pastas", label: "Pastas" },
  { href: "/objetos", label: "Objetos de aprendizagem" },
  { href: "/blog", label: "Blog" },
  { href: "/forum", label: "Fórum" },
  { href: "/bncc", label: "BNCC" },
  { href: "/planos", label: "Planos" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-5 w-5" />
          <span>Portal do Professor</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
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
