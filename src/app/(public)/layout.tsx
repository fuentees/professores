import { Wrench } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TEACHER_NAV_ITEMS, TEACHER_NAV_BOTTOM_ITEMS } from "@/lib/nav/teacher-nav";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSiteSettings } from "@/actions/owner/settings";

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

  // Modo de manutenção só afeta visitante anônimo (sem conta ativa) — quem
  // já está logado (professor/admin) segue direto pelo branch acima e nunca
  // passa por aqui, então continua acessando /painel e /admin normalmente.
  const settings = await getSiteSettings();
  if (settings?.maintenance_mode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Wrench className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Em manutenção</h1>
        <p className="max-w-md text-muted-foreground">
          {settings.maintenance_message || "Estamos fazendo uma manutenção rápida. Voltamos em breve."}
        </p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter supportEmail={settings?.support_email} />
    </>
  );
}
