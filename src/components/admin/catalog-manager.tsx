"use client";

import { useState } from "react";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CatalogRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  status: "active" | "inactive";
};

export type ActionResult = { error: string | null };

type CatalogManagerProps<TRow extends CatalogRow, TValues extends FieldValues> = {
  title: string;
  emptyLabel: string;
  rows: TRow[];
  schema: ZodType<TValues>;
  defaultValues: (row?: TRow) => TValues;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderExtraFields?: (form: UseFormReturn<any>) => React.ReactNode;
  extraColumns?: { header: string; render: (row: TRow) => React.ReactNode }[];
  onCreate: (values: TValues) => Promise<ActionResult>;
  onUpdate: (id: string, values: TValues) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onSetStatus: (id: string, status: "active" | "inactive") => Promise<ActionResult>;
};

export function CatalogManager<TRow extends CatalogRow, TValues extends FieldValues>({
  title,
  emptyLabel,
  rows,
  schema,
  defaultValues,
  renderExtraFields,
  extraColumns,
  onCreate,
  onUpdate,
  onDelete,
  onSetStatus,
}: CatalogManagerProps<TRow, TValues>) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TRow | null>(null);

  // TValues is generic here (bound only by FieldValues), so react-hook-form's
  // resolver/defaultValues inference can't line up structurally with it even
  // though every real schema passed in does conform. Cast at the boundary.
  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues() as never,
  }) as unknown as UseFormReturn<TValues>;

  function openCreate() {
    setEditing(null);
    form.reset(defaultValues());
    setOpen(true);
  }

  function openEdit(row: TRow) {
    setEditing(row);
    form.reset(defaultValues(row));
    setOpen(true);
  }

  async function onSubmit(values: TValues) {
    const result = editing ? await onUpdate(editing.id, values) : await onCreate(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Atualizado com sucesso." : "Criado com sucesso.");
    setOpen(false);
  }

  async function handleDelete(id: string) {
    const result = await onDelete(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Excluído com sucesso.");
  }

  async function handleToggleStatus(row: TRow) {
    const result = await onSetStatus(row.id, row.status === "active" ? "inactive" : "active");
    if (result.error) {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? `Editar ${title.toLowerCase()}` : `Novo em ${title.toLowerCase()}`}</DialogTitle>
            </DialogHeader>

            <form
              id="catalog-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register("name" as never)} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.name.message)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...form.register("description" as never)} />
              </div>

              {renderExtraFields?.(form)}

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="orderIndex">Ordem</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    {...form.register("orderIndex" as never, { valueAsNumber: true })}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status" as never) as unknown as string}
                    onValueChange={(value) =>
                      form.setValue("status" as never, (value ?? "active") as never)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>

            <DialogFooter>
              <Button type="submit" form="catalog-form" disabled={form.formState.isSubmitting}>
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
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              {extraColumns?.map((col) => <TableHead key={col.header}>{col.header}</TableHead>)}
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5 + (extraColumns?.length ?? 0)}
                  className="text-center text-sm text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                {extraColumns?.map((col) => <TableCell key={col.header}>{col.render(row)}</TableCell>)}
                <TableCell>{row.order_index}</TableCell>
                <TableCell>
                  <button type="button" onClick={() => handleToggleStatus(row)}>
                    <Badge variant={row.status === "active" ? "default" : "secondary"}>
                      {row.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir &ldquo;{row.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. Itens vinculados a este registro
                          impedirão a exclusão.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(row.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
