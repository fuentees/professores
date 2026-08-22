export type PublicNavLink = {
  href: string;
  label: string;
};

export type PublicNavItem =
  | (PublicNavLink & { type: "link" })
  | { type: "group"; label: string; links: PublicNavLink[] };

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { type: "link", href: "/", label: "Início" },
  { type: "link", href: "/buscar", label: "Buscar" },
  {
    type: "group",
    label: "Biblioteca",
    links: [
      { href: "/materiais", label: "Materiais" },
      { href: "/bncc", label: "BNCC" },
    ],
  },
  { type: "link", href: "/objetos", label: "Recursos interativos" },
  { type: "link", href: "/cursos", label: "Cursos" },
  {
    type: "group",
    label: "Comunidade",
    links: [
      { href: "/forum", label: "Fórum" },
      { href: "/blog", label: "Blog" },
    ],
  },
  { type: "link", href: "/planos", label: "Planos" },
];

export function isPublicNavHrefActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPublicNavItemActive(pathname: string, item: PublicNavItem): boolean {
  if (item.type === "link") return isPublicNavHrefActive(pathname, item.href);
  return item.links.some((link) => isPublicNavHrefActive(pathname, link.href));
}
