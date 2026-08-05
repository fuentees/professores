"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { setTeacherStatus } from "@/actions/admin/teachers";

export function TeacherStatusToggle({
  profileId,
  status,
}: {
  profileId: string;
  status: "active" | "blocked" | "pending";
}) {
  async function handleToggle() {
    const next = status === "blocked" ? "active" : "blocked";
    const result = await setTeacherStatus(profileId, next);
    if (result.error) toast.error(result.error);
  }

  return (
    <button type="button" onClick={handleToggle}>
      <Badge variant={status === "blocked" ? "destructive" : "default"}>
        {status === "blocked" ? "Bloqueado" : status === "pending" ? "Pendente" : "Ativo"}
      </Badge>
    </button>
  );
}
