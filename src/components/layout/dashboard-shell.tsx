import { type LucideIcon } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/common/brand";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: string;
};

export function DashboardShell({
  profile,
  navItems,
  bottomNavItems = [],
  homeHref,
  mainClassName = "p-6",
  variant,
  children,
}: {
  profile: CurrentProfile;
  navItems: DashboardNavItem[];
  bottomNavItems?: DashboardNavItem[];
  homeHref: string;
  /** Páginas públicas (materiais, home...) já têm seu próprio padding/
   * max-width (às vezes seções full-bleed, ex. hero da home) — passar ""
   * pra não somar padding duplicado. Páginas de /painel não se auto-
   * espaçam, por isso o padrão continua "p-6". */
  mainClassName?: string;
  /** Por padrão deriva do role (admin x professor). O painel do proprietário
   * é uma terceira área visualmente distinta — passa "owner" explicitamente
   * pra não ser confundido com o admin de conteúdo. */
  variant?: "teacher" | "admin" | "owner";
  children: React.ReactNode;
}) {
  // Renderiza os ícones aqui (server component) e passa elementos já
  // prontos pros componentes client (DashboardNav/DashboardMobileNav) —
  // passar o componente do ícone em si (função) como prop cruzando a
  // fronteira server/client quebra a serialização RSC ("Only plain
  // objects can be passed...").
  const items = navItems.map(({ href, label, icon: Icon, section }) => ({
    href,
    label,
    section,
    icon: <Icon className="h-4 w-4" />,
  }));
  const bottomItems = bottomNavItems.map(({ href, label, icon: Icon, section }) => ({
    href,
    label,
    section,
    icon: <Icon className="h-4 w-4" />,
  }));

  // A marca principal permanece igual em todas as áreas. Admin e owner se
  // diferenciam apenas pelo subtítulo e pelo destaque dos itens ativos, sem
  // perder o reconhecimento visual do Portal do Professor.
  const resolvedVariant = variant ?? (profile.role === "admin" ? "admin" : "teacher");
  const isAdmin = resolvedVariant === "admin";
  const isOwner = resolvedVariant === "owner";
  const activeClassName = isOwner
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : isAdmin
      ? "bg-accent text-foreground"
      : "bg-primary/10 text-primary";

  const logo = (
    <BrandLogo
      href={homeHref}
      subtitle={isOwner ? "Proprietário" : isAdmin ? "Administração" : undefined}
      hideNameOnMobile
      nameClassName="text-sm"
    />
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden shrink-0 flex-col border-r bg-sidebar print:hidden lg:flex lg:w-64">
        <div className="flex h-16 items-center gap-2 border-b px-4">{logo}</div>
        <DashboardNav items={items} bottomItems={bottomItems} activeClassName={activeClassName} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra mobile: hambúrguer (abre sheet com a navegação) + logo */}
        <header className="flex h-16 items-center gap-2 border-b bg-card px-4 print:hidden lg:hidden">
          <DashboardMobileNav items={items} bottomItems={bottomItems} activeClassName={activeClassName} />
          {logo}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu profile={profile} />
          </div>
        </header>

        {/* Barra desktop */}
        <header className="hidden h-16 items-center justify-end gap-2 border-b bg-card px-4 print:hidden lg:flex">
          <ThemeToggle />
          <UserMenu profile={profile} />
        </header>

        <main className={`flex-1 bg-background ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
}
