"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createBnccSkill,
  deleteBnccSkill,
  updateBnccSkill,
} from "@/actions/admin/bncc";
import { bnccSkillSchema, type BnccSkillInput } from "@/lib/validations/bncc";

export type BnccSkillRow = {
  id: string;
  code: string;
  description: string;
  thematic_unit: string | null;
  knowledge_object: string | null;
  component_id: string;
  grade_id: string | null;
  status: "active" | "inactive";
};

export function BnccSkillsManager({
  rows,
  components,
  grades,
}: {
  rows: BnccSkillRow[];
  components: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BnccSkillRow | null>(null);

  const form = useForm({
    resolver: zodResolver(bnccSkillSchema),
    defaultValues: {
      code: "",
      description: "",
      thematicUnit: "",
      knowledgeObject: "",
      componentId: components[0]?.id ?? "",
      gradeId: "",
      status: "active" as const,
    },
  });

  const componentName = (id: string) => components.find((c) => c.id === id)?.name ?? "—";
  const gradeName = (id: string | null) => grades.find((g) => g.id === id)?.name ?? "—";

  function openCreate() {
    setEditing(null);
    form.reset({
      code: "",
      description: "",
      thematicUnit: "",
      knowledgeObject: "",
      componentId: components[0]?.id ?? "",
      gradeId: "",
      status: "active",
    });
    setOpen(true);
  }

  function openEdit(row: BnccSkillRow) {
    setEditing(row);
    form.reset({
      code: row.code,
      description: row.description,
      thematicUnit: row.thematic_unit ?? "",
      knowledgeObject: row.knowledge_object ?? "",
      componentId: row.component_id,
      gradeId: row.grade_id ?? "",
      status: row.status,
    });
    setOpen(true);
  }

  async function onSubmit(values: BnccSkillInput) {
    const result = editing ? await updateBnccSkill(editing.id, values) : await createBnccSkill(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Habilidade atualizada." : "Habilidade criada.");
    setOpen(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteBnccSkill(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Habilidades</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nova habilidade
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar habilidade" : "Nova habilidade"}</DialogTitle>
            </DialogHeader>

            <form id="bncc-skill-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" placeholder="EF06MA01" {...form.register("code")} />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descrição da habilidade</Label>
                <Textarea id="description" rows={3} {...form.register("description")} />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="thematicUnit">Unidade temática</Label>
                  <Input id="thematicUnit" {...form.register("thematicUnit")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="knowledgeObject">Objeto de conhecimento</Label>
                  <Input id="knowledgeObject" {...form.register("knowledgeObject")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Componente curricular</Label>
                  <Select
                    value={form.watch("componentId")}
                    onValueChange={(value) => form.setValue("componentId", value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione">
                        {(value: string) => (value ? componentName(value) : "Selecione")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {components.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Série/ano</Label>
                  <Select
                    value={form.watch("gradeId")}
                    onValueChange={(value) => form.setValue("gradeId", value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione">
                        {(value: string) => (value ? gradeName(value) : "Selecione")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>

            <DialogFooter>
              <Button type="submit" form="bncc-skill-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Componente</TableHead>
              <TableHead>Série</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhuma habilidade cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm font-medium">
                  <Badge variant="outline">{row.code}</Badge>
                </TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{row.description}</TableCell>
                <TableCell className="text-muted-foreground">{componentName(row.component_id)}</TableCell>
                <TableCell className="text-muted-foreground">{gradeName(row.grade_id)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
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
