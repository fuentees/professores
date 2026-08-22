import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandAccentBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-brand-accent
      className={cn("h-1 w-full shrink-0 bg-primary print:hidden", className)}
    />
  );
}

export function BrandLogo({
  href = "/",
  subtitle,
  hideNameOnMobile = false,
  className,
  nameClassName,
}: {
  href?: string;
  subtitle?: string;
  hideNameOnMobile?: boolean;
  className?: string;
  nameClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Portal do Professor"
      className={cn("flex items-center gap-2.5 font-semibold", className)}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-interactive text-primary-foreground shadow-sm">
        <GraduationCap className="h-4.5 w-4.5" strokeWidth={2} />
      </span>
      <span className={cn("min-w-0 flex-col", hideNameOnMobile ? "hidden sm:flex" : "flex")}>
        <span className={cn("truncate tracking-tight", nameClassName)}>Portal do Professor</span>
        {subtitle && (
          <span className="truncate text-[10px] leading-tight font-medium tracking-wide text-muted-foreground uppercase">
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}

export function BrandBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -top-10 right-0 h-72 w-72 rounded-full bg-interactive/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-bncc/15 blur-3xl" />
    </div>
  );
}
