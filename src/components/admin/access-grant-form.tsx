"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grantContentAccess } from "@/actions/admin/teachers";

export function AccessGrantForm({
  teacherId,
  contents,
}: {
  teacherId: string;
  contents: { id: string; title: string }[];
}) {
  const [contentId, setContentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contentId) return;

    setPending(true);
    const result = await grantContentAccess(teacherId, contentId, expiresAt || null);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Acesso liberado.");
    setContentId("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label>Material</Label>
        <Select value={contentId} onValueChange={(value) => setContentId(value ?? "")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione o material">
              {(value: string) => contents.find((c) => c.id === value)?.title ?? "Selecione o material"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {contents.map((content) => (
              <SelectItem key={content.id} value={content.id}>
                {content.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grantExpiresAt">Expira em (opcional)</Label>
        <Input
          id="grantExpiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || !contentId}>
        {pending ? "Liberando..." : "Liberar acesso"}
      </Button>
    </form>
  );
}
