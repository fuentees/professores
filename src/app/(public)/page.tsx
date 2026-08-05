import Link from "next/link";
import { BookOpen, GraduationCap, LibraryBig, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const NIVEIS = [
  "Educação Infantil",
  "1º ao 5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
  "Ensino Médio",
];

const DESTAQUES = [
  {
    icon: LibraryBig,
    title: "Biblioteca organizada",
    description:
      "Materiais filtrados por nível, série, disciplina, unidade, tema e subtema.",
  },
  {
    icon: BookOpen,
    title: "Alinhado à BNCC",
    description: "Conteúdos vinculados às habilidades da Base Nacional Comum Curricular.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso controlado",
    description: "Downloads protegidos por planos e liberação individual de acesso.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b bg-gradient-to-b from-muted/40 to-background px-4 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Biblioteca digital para professores
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Materiais pedagógicos organizados para cada aula.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Planos de aula, atividades, avaliações e cursos — filtrados por nível, série,
            disciplina e tema, prontos para usar em sala.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/materiais">Explorar materiais</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/planos">Conhecer os planos</Link>}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="mb-4 text-sm font-medium text-muted-foreground">Navegue por nível</p>
        <div className="flex flex-wrap gap-2">
          {NIVEIS.map((nivel) => (
            <span
              key={nivel}
              className="rounded-full border bg-background px-4 py-2 text-sm"
            >
              {nivel}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {DESTAQUES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border p-6">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
