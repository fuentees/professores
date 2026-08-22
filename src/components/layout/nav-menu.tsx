"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isPublicNavHrefActive } from "@/lib/nav/public-nav";

export function NavMenu({
  label,
  links,
  pathname,
  active = false,
}: {
  label: string;
  links: { href: string; label: string }[];
  pathname: string;
  active?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-inherit outline-none transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground data-popup-open:bg-primary-foreground/15 data-popup-open:text-primary-foreground",
          active && "bg-primary-foreground/15 text-primary-foreground",
        )}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {links.map((link) => (
          <DropdownMenuLinkItem
            key={link.href}
            className={cn(
              "px-2.5 py-2",
              isPublicNavHrefActive(pathname, link.href) && "bg-accent text-accent-foreground",
            )}
            render={
              <Link
                href={link.href}
                aria-current={isPublicNavHrefActive(pathname, link.href) ? "page" : undefined}
              />
            }
          >
            {link.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
