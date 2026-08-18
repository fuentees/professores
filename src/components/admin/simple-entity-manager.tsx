"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SimpleEntityRow = { id: string; name: string; order_index: number };
export type SimpleParentOption = { id: string; name: string };

export function SimpleEntityManager<TRow extends SimpleEntityRow>({
  title,
  emptyLabel,
  rows,
  parentLabel,
  parentOptions,
  parentColumnValue,
  onCreate,
  onDelete,
}: {
  title: string;
  emptyLabel: string;
  rows: TRow[];
  parentLabel?: string;
  parentOptions?: SimpleParentOption[];
  parentColumnValue?: (row: TRow) => string;
  onCreate: (values: { name: string; orderIndex: number; parentId?: string }) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(parentOptions?.[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  const parentName = (id: string) => parentOptions?.find((p) => p.id === id)?.name ?? "—";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    if (parentOptions && !parentId) return;

    setPending(true);
    const result = await onCreate({ name, orderIndex: rows.length, parentId: parentId || undefined });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Criado com sucesso.");
    setName("");
  }

  async function handleDelete(id: string) {
    const result = await onDelete(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${title}-name`}>Nome</Label>
          <Input id={`${title}-name`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {parentOptions && (
          <div className="flex flex-col gap-2">
            <Label>{parentLabel}</Label>
            <Select value={parentId} onValueChange={(value) => setParentId(value ?? "")}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione">
                  {(value: string) => (value ? parentName(value) : "Selecione")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {parentOptions && <TableHead>{parentLabel}</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={parentOptions ? 3 : 2} className="text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                {parentOptions && parentColumnValue && (
                  <TableCell className="text-muted-foreground">{parentName(parentColumnValue(row))}</TableCell>
                )}
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
