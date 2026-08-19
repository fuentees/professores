import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Home, Settings, ShieldCheck, Users, Wallet } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dono", label: "Visão geral", icon: Home },
  { href: "/dono/planos", label: "Planos", icon: CreditCard },
  { href: "/dono/assinaturas", label: "Assinaturas", icon: Wallet },
  { href: "/dono/administradores", label: "Administradores", icon: Users },
  { href: "/dono/configuracoes", label: "Configurações", icon: Settings },
];

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/dono");
  }

  if (profile.role !== "admin" || profile.status !== "active" || !profile.is_owner) {
    redirect(profile.role === "admin" ? "/admin" : "/");
  }

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} homeHref="/dono" variant="owner">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crown className="h-4 w-4" />
          Painel do proprietário — gestão de negócio
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ShieldCheck className="h-4 w-4" />
          Admin de conteúdo
        </Link>
      </div>
      {children}
    </DashboardShell>
  );
}
