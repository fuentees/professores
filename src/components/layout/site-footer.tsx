import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter({ supportEmail }: { supportEmail?: string | null }) {
  return (
    <footer className="border-t border-primary-foreground/10 bg-[color-mix(in_oklch,var(--foreground),#18213a_75%)] text-primary-foreground print:hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary"><GraduationCap className="size-5" /></span>
            <p className="text-base font-semibold leading-tight">Portal do<br />Professor</p>
          </div>
          <p className="mt-4 max-w-sm text-primary-foreground/60">
            Biblioteca digital de materiais pedagógicos para professores de todas as
            disciplinas e etapas.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="mb-1 font-semibold">Explorar</p>
          <Link href="/materiais" className="text-primary-foreground/60 hover:text-primary-foreground">
            Materiais
          </Link>
          <Link href="/buscar" className="text-primary-foreground/60 hover:text-primary-foreground">
            Buscar no portal
          </Link>
          <Link href="/objetos" className="text-primary-foreground/60 hover:text-primary-foreground">
            Recursos interativos
          </Link>
          <Link href="/cursos" className="text-primary-foreground/60 hover:text-primary-foreground">
            Cursos
          </Link>
          <Link href="/bncc" className="text-primary-foreground/60 hover:text-primary-foreground">
            BNCC
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <p className="mb-1 font-semibold">Comunidade</p>
          <Link href="/forum" className="text-primary-foreground/60 hover:text-primary-foreground">
            Fórum
          </Link>
          <Link href="/blog" className="text-primary-foreground/60 hover:text-primary-foreground">
            Blog
          </Link>
          <Link href="/planos" className="text-primary-foreground/60 hover:text-primary-foreground">
            Planos
          </Link>
        </div>

        {supportEmail && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Contato</p>
            <a href={`mailto:${supportEmail}`} className="text-primary-foreground/60 hover:text-primary-foreground">
              {supportEmail}
            </a>
          </div>
        )}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-primary-foreground/10 px-4 py-5 text-center text-xs text-primary-foreground/50 sm:flex-row sm:px-6 sm:text-left">
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
