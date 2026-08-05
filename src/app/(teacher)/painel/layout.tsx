import { redirect } from "next/navigation";
import {
  Bell,
  BookMarked,
  BookOpen,
  Download,
  FolderOpen,
  GraduationCap,
  Heart,
  History,
  Home,
  LayoutGrid,
  MessageSquare,
  User,
  Wallet,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/painel", label: "Início", icon: Home },
  { href: "/materiais", label: "Materiais", icon: BookOpen },
  { href: "/pastas", label: "Pastas", icon: FolderOpen },
  { href: "/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/objetos", label: "Objetos de aprendizagem", icon: LayoutGrid },
  { href: "/bncc", label: "BNCC", icon: BookMarked },
  { href: "/painel/favoritos", label: "Favoritos", icon: Heart },
  { href: "/painel/historico", label: "Histórico", icon: History },
  { href: "/painel/downloads", label: "Downloads", icon: Download },
  { href: "/forum", label: "Fórum", icon: MessageSquare },
  { href: "/painel/notificacoes", label: "Notificações", icon: Bell },
  { href: "/painel/assinatura", label: "Minha assinatura", icon: Wallet },
  { href: "/painel/perfil", label: "Perfil", icon: User },
];

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/painel");
  }

  if (profile.status === "blocked") {
    redirect("/?bloqueado=1");
  }

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} homeHref="/painel">
      {children}
    </DashboardShell>
  );
}
