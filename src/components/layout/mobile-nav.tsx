"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isPublicNavHrefActive, PUBLIC_NAV_ITEMS } from "@/lib/nav/public-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const mobileLinkClassName =
    "block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg text-primary-foreground hover:bg-primary-foreground/12 lg:hidden"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader className="border-b">
          <SheetTitle>Menu principal</SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegação móvel" className="flex flex-col gap-3 overflow-y-auto px-4 pb-6">
          {PUBLIC_NAV_ITEMS.map((item) => {
            if (item.type === "link") {
              const active = isPublicNavHrefActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(mobileLinkClassName, active && "bg-primary/10 text-primary")}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.label} className="space-y-1">
                <p className="px-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                  {item.label}
                </p>
                {item.links.map((link) => {
                  const active = isPublicNavHrefActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        mobileLinkClassName,
                        "ml-2",
                        active && "bg-primary/10 text-primary",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
