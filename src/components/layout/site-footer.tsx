import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-semibold">Portal do Professor</p>
          <p className="mt-2 text-muted-foreground">
            Biblioteca digital de materiais pedagógicos para professores de todas as
            disciplinas e etapas.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">Navegação</p>
          <Link href="/materiais" className="text-muted-foreground hover:text-foreground">
            Materiais
          </Link>
          <Link href="/cursos" className="text-muted-foreground hover:text-foreground">
            Cursos
          </Link>
          <Link href="/bncc" className="text-muted-foreground hover:text-foreground">
            BNCC
          </Link>
          <Link href="/planos" className="text-muted-foreground hover:text-foreground">
            Planos
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">Institucional</p>
          <Link href="/termos" className="text-muted-foreground hover:text-foreground">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground">
            Política de privacidade
          </Link>
        </div>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Portal do Professor. Todos os direitos reservados.
      </div>
    </footer>
  );
}
