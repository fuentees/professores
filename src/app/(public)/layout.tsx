import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TEACHER_NAV_ITEMS, TEACHER_NAV_BOTTOM_ITEMS } from "@/lib/nav/teacher-nav";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * Estas rotas (materiais, cursos, objetos, bncc, fórum, home etc.) servem
 * dois públicos: visitante anônimo navegando o site comercial, e professor
 * já logado navegando o mesmo conteúdo dentro do app. Pra não dar a
 * sensação de "dois sistemas" (header público vs. sidebar do painel), o
 * shell é decidido aqui, uma vez: professor ativo logado sempre vê o mesmo
 * DashboardShell/sidebar usado em /painel — o conteúdo de cada página
 * (page.tsx) não muda nada, só o que envolve ele.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile && profile.role === "teacher" && profile.status === "active") {
    return (
      <DashboardShell
        profile={profile}
        navItems={TEACHER_NAV_ITEMS}
        bottomNavItems={TEACHER_NAV_BOTTOM_ITEMS}
        homeHref="/painel"
        mainClassName=""
      >
        {children}
      </DashboardShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
