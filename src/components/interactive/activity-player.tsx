import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { QuizPlayer } from "./quiz-player";
import { TrueFalsePlayer } from "./true-false-player";
import { MatchingPlayer } from "./matching-player";
import { MemoryPlayer } from "./memory-player";
import { FillBlankPlayer } from "./fill-blank-player";
import { OrderingPlayer } from "./ordering-player";
import { FlashcardsPlayer } from "./flashcards-player";
import { SIMULATION_REGISTRY } from "./simulations/registry";

/** Config já deve ter passado por `interactiveActivitySchema.safeParse` antes de chegar aqui. */
export function ActivityPlayer({
  activityType,
  config,
}: {
  activityType: LearningActivityType;
  config: unknown;
}) {
  switch (activityType) {
    case "quiz":
      return <QuizPlayer config={config as Parameters<typeof QuizPlayer>[0]["config"]} />;
    case "true_false":
      return <TrueFalsePlayer config={config as Parameters<typeof TrueFalsePlayer>[0]["config"]} />;
    case "matching":
      return <MatchingPlayer config={config as Parameters<typeof MatchingPlayer>[0]["config"]} />;
    case "memory":
      return <MemoryPlayer config={config as Parameters<typeof MemoryPlayer>[0]["config"]} />;
    case "fill_blank":
      return <FillBlankPlayer config={config as Parameters<typeof FillBlankPlayer>[0]["config"]} />;
    case "ordering":
      return <OrderingPlayer config={config as Parameters<typeof OrderingPlayer>[0]["config"]} />;
    case "flashcards":
      return <FlashcardsPlayer config={config as Parameters<typeof FlashcardsPlayer>[0]["config"]} />;
    case "simulation": {
      const key = (config as { simulationKey?: keyof typeof SIMULATION_REGISTRY })?.simulationKey;
      const Simulation = key ? SIMULATION_REGISTRY[key] : null;
      if (!Simulation) return null;
      return <Simulation />;
    }
    default:
      return null;
  }
}
