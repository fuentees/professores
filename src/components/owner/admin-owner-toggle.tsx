"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setOwnerFlag } from "@/actions/owner/admins";

export function AdminOwnerToggle({
  profileId,
  initialIsOwner,
  disabled,
}: {
  profileId: string;
  initialIsOwner: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(initialIsOwner);
  const [pending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    const previous = isOwner;
    setIsOwner(checked);
    startTransition(async () => {
      const result = await setOwnerFlag(profileId, checked);
      if (result.error) {
        setIsOwner(previous);
        toast.error(result.error);
        return;
      }
      toast.success(checked ? "Promovido a proprietário." : "Permissão de proprietário removida.");
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <Switch
        checked={isOwner}
        onCheckedChange={handleChange}
        disabled={disabled || pending}
        aria-label="Permissão de proprietário"
      />
      <span>{isOwner ? "Proprietário" : "Admin de conteúdo"}</span>
    </label>
  );
}
