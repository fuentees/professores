"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardNavLinkData = { href: string; label: string; icon: React.ReactNode };

// Item de "raiz" de uma área (ex: /admin, /dono, /painel — só um segmento de
// path) só fica ativo em match exato; senão qualquer sub-rota (/admin/
// materiais, /dono/planos...) o mantém marcado como ativo *junto* com o item
// mais específico correspondente, já que toda sub-rota começa com o mesmo
// prefixo.
function isActive(pathname: string, href: string): boolean {
  const isSectionRoot = /^\/[^/]+$/.test(href);
  if (isSectionRoot) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon,
  active,
  activeClassName,
}: DashboardNavLinkData & { active: boolean; activeClassName: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? activeClassName : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {/* Ícone já vem renderizado do server component (DashboardShell) —
          passar o componente do ícone em si (função) como prop pra um
          Client Component quebra a serialização RSC. O elemento
          renderizado usa stroke="currentColor" por padrão, então herda a
          cor do texto (ativo/inativo) normalmente. */}
      {icon}
      {label}
    </Link>
  );
}

export function DashboardNav({
  items,
  bottomItems,
  activeClassName = "bg-primary/10 text-primary",
}: {
  items: DashboardNavLinkData[];
  bottomItems: DashboardNavLinkData[];
  /** Admin usa um destaque neutro (não coral) pra reforçar que é uma área
   * separada do app do professor — ver DashboardShell. */
  activeClassName?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <div className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} activeClassName={activeClassName} />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-1 border-t pt-3">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} activeClassName={activeClassName} />
        ))}
      </div>
    </nav>
  );
}
