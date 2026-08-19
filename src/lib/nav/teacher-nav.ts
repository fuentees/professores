import {
  BookMarked,
  BookOpen,
  ClipboardCheck,
  Download,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  MessageSquare,
  SquareStack,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type TeacherNavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Navegação única do professor logado — usada tanto em /painel quanto nas
 * páginas "públicas" (materiais, cursos, objetos, bncc, fórum) quando
 * acessadas autenticado, pra não dar a sensação de dois sistemas
 * diferentes (mesmo shell/sidebar em todo lugar). Ver
 * src/app/(public)/layout.tsx e src/app/(teacher)/painel/layout.tsx.
 */
export const TEACHER_NAV_ITEMS: TeacherNavItem[] = [
  { href: "/painel", label: "Início", icon: Home },
  { href: "/materiais", label: "Materiais", icon: BookOpen },
  { href: "/objetos", label: "Recursos interativos", icon: LayoutGrid },
  { href: "/painel/banco-de-questoes", label: "Banco de questões", icon: SquareStack },
  { href: "/painel/gerador", label: "Criar avaliação", icon: ClipboardCheck },
  { href: "/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/bncc", label: "BNCC", icon: BookMarked },
  { href: "/painel/favoritos", label: "Favoritos", icon: Heart },
  { href: "/painel/downloads", label: "Downloads", icon: Download },
  { href: "/forum", label: "Comunidade", icon: MessageSquare },
];

export const TEACHER_NAV_BOTTOM_ITEMS: TeacherNavItem[] = [
  { href: "/painel/perfil", label: "Perfil", icon: User },
  { href: "/painel/assinatura", label: "Minha assinatura", icon: Wallet },
];
