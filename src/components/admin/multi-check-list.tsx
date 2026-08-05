"use client";

import { Label } from "@/components/ui/label";

export type MultiCheckOption = { id: string; label: string };

export function MultiCheckList({
  label,
  options,
  selected,
  onChange,
  emptyLabel,
}: {
  label: string;
  options: MultiCheckOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyLabel: string;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="max-h-48 overflow-y-auto rounded-md border p-2">
        {options.length === 0 && (
          <p className="p-2 text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => toggle(option.id)}
              className="h-4 w-4"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
