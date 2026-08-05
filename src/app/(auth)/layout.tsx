import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center text-lg font-semibold">
          Portal do Professor
        </Link>
        <div className="rounded-lg border bg-background p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
