"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createBlogCategory, deleteBlogCategory } from "@/actions/admin/blog";

export function BlogCategoriesManager({ categories }: { categories: { id: string; name: string }[] }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    const result = await createBlogCategory({ name });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setName("");
  }

  async function handleDelete(id: string) {
    const result = await deleteBlogCategory(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Categorias</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" />
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
        )}
        {categories.map((category) => (
          <Badge key={category.id} variant="secondary" className="gap-1 py-1.5 pr-1">
            {category.name}
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              className="rounded-full hover:bg-muted-foreground/20"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
