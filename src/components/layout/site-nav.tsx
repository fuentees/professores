"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavMenu } from "@/components/layout/nav-menu";
import { cn } from "@/lib/utils";
import { isPublicNavItemActive, PUBLIC_NAV_ITEMS } from "@/lib/nav/public-nav";

const linkClassName =
  "rounded-lg px-2.5 py-2 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden items-center gap-1 text-sm font-medium text-primary-foreground/85 lg:flex"
    >
      {PUBLIC_NAV_ITEMS.map((item) => {
        const active = isPublicNavItemActive(pathname, item);

        if (item.type === "link") {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                linkClassName,
                active && "bg-primary-foreground/15 text-primary-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <NavMenu
            key={item.label}
            label={item.label}
            links={item.links}
            pathname={pathname}
            active={active}
          />
        );
      })}
    </nav>
  );
}
