import { Gamepad2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export function InteractiveEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <EmptyState
      icon={Gamepad2}
      title={hasFilters ? "Nenhum recurso encontrado com esses filtros" : "Nenhum recurso interativo publicado ainda"}
      description={hasFilters ? "Tente outra categoria, disciplina ou termo de busca." : undefined}
    />
  );
}
