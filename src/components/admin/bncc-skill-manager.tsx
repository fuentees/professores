"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { linkContentBnccSkill, unlinkContentBnccSkill } from "@/actions/admin/bncc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type LinkedBnccSkill = { linkId: string; skillId: string; code: string; description: string };
export type AvailableBnccSkill = { id: string; code: string; description: string };

export function BnccSkillManager({
  contentId,
  linkedSkills,
  availableSkills,
}: {
  contentId: string;
  linkedSkills: LinkedBnccSkill[];
  availableSkills: AvailableBnccSkill[];
}) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [linking, setLinking] = useState(false);

  const unlinkedSkills = availableSkills.filter(
    (skill) => !linkedSkills.some((l) => l.skillId === skill.id),
  );

  async function handleLink() {
    if (!selected) return;
    setLinking(true);
    const result = await linkContentBnccSkill(contentId, selected);
    setLinking(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSelected(undefined);
    toast.success("Habilidade vinculada.");
  }

  async function handleUnlink(linkId: string) {
    const result = await unlinkContentBnccSkill(linkId, contentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Habilidade desvinculada.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Habilidades da BNCC</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {linkedSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma habilidade vinculada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {linkedSkills.map((skill) => (
              <div key={skill.linkId} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {skill.code}
                  </Badge>
                  <span className="text-muted-foreground">{skill.description}</span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => handleUnlink(skill.linkId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={(v) => setSelected((v as string) ?? undefined)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={unlinkedSkills.length === 0 ? "Nenhuma habilidade disponível" : "Selecione uma habilidade"}>
                {(v: string) => {
                  const skill = unlinkedSkills.find((s) => s.id === v);
                  return skill ? `${skill.code} — ${skill.description}` : "Selecione uma habilidade";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {unlinkedSkills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id}>
                  {skill.code} — {skill.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" disabled={!selected || linking} onClick={handleLink}>
            Vincular
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
