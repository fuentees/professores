import Link from "next/link";
import { GraduationCap, type LucideIcon } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function DashboardShell({
  profile,
  navItems,
  homeHref,
  children,
}: {
  profile: CurrentProfile;
  navItems: DashboardNavItem[];
  homeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="shrink-0 border-b bg-muted/20 print:hidden lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-2 border-b px-4 font-semibold">
          <Link href={homeHref} className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <span>Portal do Professor</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b px-4 print:hidden">
          <UserMenu profile={profile} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
