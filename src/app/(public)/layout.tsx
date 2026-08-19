import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TEACHER_NAV_ITEMS, TEACHER_NAV_BOTTOM_ITEMS } from "@/lib/nav/teacher-nav";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * Estas rotas (materiais, cursos, objetos, bncc, fórum, home etc.) servem
 * dois públicos: visitante anônimo navegando o site comercial, e usuário já
 * logado (professor OU admin) navegando o mesmo conteúdo dentro do app. Pra
 * não dar a sensação de "dois sistemas" (header público vs. sidebar), o
 * shell é decidido aqui, uma vez: qualquer conta ativa logada vê o mesmo
 * DashboardShell/sidebar usado em /painel — só quem não tem conta continua
 * vendo o site comercial. Admin navegando aqui é "conferir como o professor
 * vê" — a área de gestão continua só em /admin (link no menu do usuário),
 * então não conflita com "admin separado".
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile && profile.status === "active" && (profile.role === "teacher" || profile.role === "admin")) {
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
