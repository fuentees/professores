import { BrandBackdrop, BrandLogo } from "@/components/common/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30 px-4 py-12">
      <BrandBackdrop />
      <div className="relative w-full max-w-sm space-y-6">
        <BrandLogo className="justify-center" nameClassName="text-lg" />
        <div className="rounded-xl border bg-background/90 p-6 shadow-md backdrop-blur">{children}</div>
      </div>
    </div>
  );
}
