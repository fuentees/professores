import type { ComponentType } from "react";
import type { SimulationKey } from "@/lib/validations/interactive-activity";
import { FractionSimulator } from "./fraction-simulator";
import { AreaSimulator } from "./area-simulator";
import { ProbabilitySimulator } from "./probability-simulator";

export const SIMULATION_REGISTRY: Record<SimulationKey, ComponentType> = {
  fracoes: FractionSimulator,
  area: AreaSimulator,
  probabilidade: ProbabilitySimulator,
};

export const SIMULATION_LABELS: Record<SimulationKey, string> = {
  fracoes: "Frações",
  area: "Área e perímetro",
  probabilidade: "Probabilidade (lançamento de dados)",
};
