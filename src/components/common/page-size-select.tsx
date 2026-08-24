"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/search-filter";

export function PageSizeSelect({
  pageSize,
  searchParams,
}: {
  pageSize: number;
  searchParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(
      Object.entries(searchParams).filter((entry): entry is [string, string] => entry[1] !== undefined),
    );
    params.delete("page");
    params.set("pageSize", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">Por página</span>
      <Select value={String(pageSize)} onValueChange={handleChange}>
        <SelectTrigger size="sm" className="w-[68px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
