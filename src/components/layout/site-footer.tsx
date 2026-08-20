import Link from "next/link";

export function SiteFooter({ supportEmail }: { supportEmail?: string | null }) {
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
          <p className="font-medium">Explorar</p>
          <Link href="/materiais" className="text-muted-foreground hover:text-foreground">
            Materiais
          </Link>
          <Link href="/pastas" className="text-muted-foreground hover:text-foreground">
            Pastas
          </Link>
          <Link href="/objetos" className="text-muted-foreground hover:text-foreground">
            Recursos interativos
          </Link>
          <Link href="/cursos" className="text-muted-foreground hover:text-foreground">
            Cursos
          </Link>
          <Link href="/bncc" className="text-muted-foreground hover:text-foreground">
            BNCC
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium">Comunidade</p>
          <Link href="/forum" className="text-muted-foreground hover:text-foreground">
            Fórum
          </Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            Blog
          </Link>
          <Link href="/planos" className="text-muted-foreground hover:text-foreground">
            Planos
          </Link>
        </div>

        {supportEmail && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Contato</p>
            <a href={`mailto:${supportEmail}`} className="text-muted-foreground hover:text-foreground">
              {supportEmail}
            </a>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-between gap-2 border-t px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <span>© {new Date().getFullYear()} Portal do Professor. Todos os direitos reservados.</span>
        <div className="flex items-center gap-4">
          <Link href="/termos" className="hover:text-foreground hover:underline">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:text-foreground hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
