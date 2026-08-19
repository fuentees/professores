export type EducationLevelOrder = { id: string; orderIndex: number };

/**
 * Ordena séries agrupadas por nível de ensino (Educação Infantil → Fund. I →
 * Fund. II → Médio), preservando a ordem cronológica dentro de cada nível.
 * Sem isso, séries de níveis diferentes ficam intercaladas — cada nível
 * reinicia seu order_index em 0, então ordenar só por order_index produz
 * "6º ano, 1ª série, Bebês, 1º ano..." em vez da ordem certa. Depende de
 * `grades` já vir ordenado por order_index da própria query (sort
 * estável preserva essa sub-ordem dentro de cada nível).
 */
export function sortGradesByLevel<T extends { educationLevelId: string }>(
  grades: T[],
  educationLevels: EducationLevelOrder[],
): T[] {
  const levelOrder = new Map(educationLevels.map((l) => [l.id, l.orderIndex]));
  return [...grades].sort(
    (a, b) => (levelOrder.get(a.educationLevelId) ?? 99) - (levelOrder.get(b.educationLevelId) ?? 99),
  );
}
