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
  NotebookTabs,
  Search,
  SquareStack,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type TeacherNavItem = { href: string; label: string; icon: LucideIcon; section?: string };

/**
 * Navegação única do professor logado — usada tanto em /painel quanto nas
 * páginas "públicas" (materiais, cursos, objetos, bncc, fórum) quando
 * acessadas autenticado, pra não dar a sensação de dois sistemas
 * diferentes (mesmo shell/sidebar em todo lugar). Ver
 * src/app/(public)/layout.tsx e src/app/(teacher)/painel/layout.tsx.
 */
export const TEACHER_NAV_ITEMS: TeacherNavItem[] = [
  { href: "/painel", label: "Início", icon: Home, section: "Visão geral" },
  { href: "/buscar", label: "Buscar no portal", icon: Search, section: "Encontrar" },
  { href: "/materiais", label: "Materiais", icon: BookOpen, section: "Encontrar" },
  { href: "/objetos", label: "Recursos interativos", icon: LayoutGrid, section: "Encontrar" },
  { href: "/painel/banco-de-questoes", label: "Banco de questões", icon: SquareStack, section: "Encontrar" },
  { href: "/painel/cadernos", label: "Cadernos de questões", icon: NotebookTabs, section: "Criar" },
  { href: "/painel/gerador", label: "Criar avaliação", icon: ClipboardCheck, section: "Criar" },
  { href: "/cursos", label: "Cursos", icon: GraduationCap, section: "Aprender" },
  { href: "/bncc", label: "BNCC", icon: BookMarked, section: "Aprender" },
  { href: "/forum", label: "Comunidade", icon: MessageSquare, section: "Trocar experiências" },
];

export const TEACHER_NAV_BOTTOM_ITEMS: TeacherNavItem[] = [
  { href: "/painel/favoritos", label: "Itens salvos", icon: Heart, section: "Minha área" },
  { href: "/painel/downloads", label: "Downloads", icon: Download, section: "Minha área" },
  { href: "/painel/perfil", label: "Perfil", icon: User, section: "Minha área" },
  { href: "/painel/assinatura", label: "Minha assinatura", icon: Wallet, section: "Minha área" },
];
