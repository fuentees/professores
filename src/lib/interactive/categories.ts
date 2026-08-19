import {
  Brain,
  CheckCheck,
  FileQuestion,
  FlaskConical,
  Layers,
  ListOrdered,
  PenLine,
  Shuffle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { LearningActivityType } from "@/lib/validations/interactive-activity";

/**
 * Categorização visual/funcional dos recursos interativos. Deriva 100% do
 * `activity_type` já existente (learning_objects.activity_type) — nenhuma
 * coluna nova, nenhuma migration. Ver plano: professor precisa distinguir
 * "quiz" de "jogo" de "simulação" à primeira vista, mesmo quando a
 * implementação interna compartilha o mesmo player/tabela.
 */
export type InteractiveCategory = "quiz" | "game" | "simulation" | "flashcard" | "activity";

export const INTERACTIVE_CATEGORIES: InteractiveCategory[] = [
  "quiz",
  "game",
  "simulation",
  "flashcard",
  "activity",
];

export const ACTIVITY_TYPE_CATEGORY: Record<LearningActivityType, InteractiveCategory> = {
  quiz: "quiz",
  true_false: "quiz",
  matching: "game",
  memory: "game",
  ordering: "game",
  fill_blank: "activity",
  flashcards: "flashcard",
  simulation: "simulation",
};

/**
 * Classes Tailwind por categoria, sempre escritas por extenso (nunca
 * `bg-${x}-soft`) — o scanner do Tailwind só reconhece classes que
 * aparecem literalmente no código-fonte; strings montadas em runtime
 * ficam de fora do CSS gerado.
 */
export type CategoryClasses = {
  bg: string;
  bgSoft: string;
  text: string;
  border: string;
  ring: string;
  /** Chip ativo (fundo sólido) e inativo (contorno + hover) já compostos. */
  chipActive: string;
  chipInactive: string;
};

export const CATEGORY_CLASSES: Record<InteractiveCategory, CategoryClasses> = {
  quiz: {
    bg: "bg-primary",
    bgSoft: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
    ring: "ring-primary/30",
    chipActive: "border-transparent bg-primary text-primary-foreground",
    chipInactive: "border-primary/30 text-primary hover:bg-primary/10",
  },
  game: {
    bg: "bg-interactive",
    bgSoft: "bg-interactive-soft",
    text: "text-interactive",
    border: "border-interactive/30",
    ring: "ring-interactive/30",
    chipActive: "border-transparent bg-interactive text-white",
    chipInactive: "border-interactive/30 text-interactive hover:bg-interactive-soft",
  },
  simulation: {
    bg: "bg-simulation",
    bgSoft: "bg-simulation-soft",
    text: "text-simulation",
    border: "border-simulation/30",
    ring: "ring-simulation/30",
    chipActive: "border-transparent bg-simulation text-white",
    chipInactive: "border-simulation/30 text-simulation hover:bg-simulation-soft",
  },
  flashcard: {
    bg: "bg-flashcard",
    bgSoft: "bg-flashcard-soft",
    text: "text-flashcard",
    border: "border-flashcard/30",
    ring: "ring-flashcard/30",
    chipActive: "border-transparent bg-flashcard text-white",
    chipInactive: "border-flashcard/30 text-flashcard hover:bg-flashcard-soft",
  },
  activity: {
    bg: "bg-activity",
    bgSoft: "bg-activity-soft",
    text: "text-activity",
    border: "border-activity/30",
    ring: "ring-activity/30",
    chipActive: "border-transparent bg-activity text-white",
    chipInactive: "border-activity/30 text-activity hover:bg-activity-soft",
  },
};

export type CategoryMeta = {
  label: string;
  pluralLabel: string;
  description: string;
  icon: LucideIcon;
  classes: CategoryClasses;
  ctaLabel: string;
};

export const CATEGORY_META: Record<InteractiveCategory, CategoryMeta> = {
  quiz: {
    label: "Quiz",
    pluralLabel: "Quizzes",
    description: "Perguntas de múltipla escolha ou verdadeiro/falso com correção na hora.",
    icon: FileQuestion,
    classes: CATEGORY_CLASSES.quiz,
    ctaLabel: "Jogar agora",
  },
  game: {
    label: "Jogo",
    pluralLabel: "Jogos",
    description: "Associação, memória e ordenação — aprendizado em formato de jogo.",
    icon: Shuffle,
    classes: CATEGORY_CLASSES.game,
    ctaLabel: "Jogar agora",
  },
  simulation: {
    label: "Simulação",
    pluralLabel: "Simulações",
    description: "Ferramentas interativas para explorar um conceito manipulando variáveis.",
    icon: FlaskConical,
    classes: CATEGORY_CLASSES.simulation,
    ctaLabel: "Explorar",
  },
  flashcard: {
    label: "Flashcards",
    pluralLabel: "Flashcards",
    description: "Cartões de frente e verso para memorização e revisão rápida.",
    icon: Layers,
    classes: CATEGORY_CLASSES.flashcard,
    ctaLabel: "Estudar",
  },
  activity: {
    label: "Atividade interativa",
    pluralLabel: "Atividades interativas",
    description: "Exercícios como completar lacunas, feitos direto na tela.",
    icon: PenLine,
    classes: CATEGORY_CLASSES.activity,
    ctaLabel: "Iniciar atividade",
  },
};

export type ActivityTypeMeta = { label: string; icon: LucideIcon };

/** Ícone/rótulo do subtipo específico (mais granular que a categoria). */
export const ACTIVITY_TYPE_META: Record<LearningActivityType, ActivityTypeMeta> = {
  quiz: { label: "Quiz", icon: FileQuestion },
  true_false: { label: "Verdadeiro ou falso", icon: CheckCheck },
  matching: { label: "Associação", icon: Shuffle },
  memory: { label: "Jogo da memória", icon: Brain },
  fill_blank: { label: "Completar lacunas", icon: PenLine },
  ordering: { label: "Ordenação", icon: ListOrdered },
  flashcards: { label: "Flashcards", icon: Layers },
  simulation: { label: "Simulação", icon: Sparkles },
};

export function getCategory(activityType: LearningActivityType): InteractiveCategory {
  return ACTIVITY_TYPE_CATEGORY[activityType];
}

export function getCategoryMeta(activityType: LearningActivityType): CategoryMeta {
  return CATEGORY_META[getCategory(activityType)];
}
