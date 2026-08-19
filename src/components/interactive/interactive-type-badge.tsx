import type { LearningActivityType } from "@/lib/validations/interactive-activity";
import { ACTIVITY_TYPE_META, getCategoryMeta } from "@/lib/interactive/categories";

/** Selo colorido por categoria com o ícone/rótulo do subtipo específico. */
export function InteractiveTypeBadge({
  activityType,
  className = "",
}: {
  activityType: LearningActivityType;
  className?: string;
}) {
  const category = getCategoryMeta(activityType);
  const type = ACTIVITY_TYPE_META[activityType];
  const Icon = type.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${category.classes.bgSoft} px-2.5 py-1 text-xs font-medium ${category.classes.text} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {type.label}
    </span>
  );
}
