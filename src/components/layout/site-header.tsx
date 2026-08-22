import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-primary-foreground/15 bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(180,55,30,0.12)] print:hidden">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/" className="flex items-center gap-2.5 font-semibold leading-none">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 shadow-sm">
              <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <span className="hidden text-[15px] tracking-tight sm:block">
              Portal do<br /><span className="text-lg">Professor</span>
            </span>
          </Link>
        </div>

        <SiteNav />

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
                className="text-primary-foreground hover:bg-primary-foreground/12 hover:text-primary-foreground"
                nativeButton={false}
                render={<Link href="/entrar">Entrar</Link>}
              />
              <Button
                className="border-primary-foreground/20 bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90"
                nativeButton={false}
                render={<Link href="/cadastro">Cadastre-se</Link>}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
