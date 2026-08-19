import { Sparkles } from "lucide-react";

/** Topo da página /objetos — título, explicação curta do módulo. A busca
 * fica no InteractiveFilters logo abaixo (não duplicada aqui). */
export function InteractiveHero({ total }: { total: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-interactive/10 via-primary/5 to-simulation/10 px-6 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-interactive/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-interactive backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Recursos interativos
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Jogos, quizzes e simulações</h1>
        <p className="max-w-xl text-muted-foreground">
          Recursos que os alunos usam direto no navegador — sem instalar nada. Organize por categoria,
          disciplina e série, e leve pra sala de aula ou passe de tarefa.
        </p>
        <p className="text-sm text-muted-foreground">
          {total} recurso{total === 1 ? "" : "s"} disponíve{total === 1 ? "l" : "is"}
        </p>
      </div>
    </div>
  );
}
