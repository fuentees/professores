import { redirect } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutGrid,
  ListTree,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  SquareStack,
  Tags,
  Ticket,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/admin", label: "Visão geral", icon: Home },
  { href: "/admin/materiais", label: "Materiais", icon: BookOpen },
  { href: "/admin/questoes", label: "Banco de questões", icon: SquareStack },
  { href: "/admin/disciplinas", label: "Disciplinas", icon: Tags },
  { href: "/admin/niveis-series", label: "Níveis e séries", icon: ListTree },
  { href: "/admin/unidades-temas", label: "Unidades e temas", icon: ListTree },
  { href: "/admin/tipos-materiais", label: "Tipos de material", icon: Ticket },
  { href: "/admin/pastas", label: "Pastas e coleções", icon: FolderOpen },
  { href: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/admin/objetos", label: "Objetos de aprendizagem", icon: LayoutGrid },
  { href: "/admin/bncc", label: "BNCC", icon: BookMarked },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/forum", label: "Fórum", icon: MessageSquare },
  { href: "/admin/professores", label: "Professores", icon: Users },
  { href: "/admin/planos", label: "Planos e assinaturas", icon: Wallet },
  { href: "/admin/questoes/importacoes", label: "Importações de questões", icon: Upload },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/admin");
  }

  if (profile.role !== "admin" || profile.status !== "active") {
    redirect("/");
  }

  return (
    <DashboardShell profile={profile} navItems={NAV_ITEMS} homeHref="/admin">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        Painel administrativo
      </div>
      {children}
    </DashboardShell>
  );
}
