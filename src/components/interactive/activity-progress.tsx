/** Barra de progresso simples usada por players com etapas (quiz, flashcards). */
export function ActivityProgress({
  current,
  total,
  barClassName,
}: {
  current: number;
  total: number;
  barClassName: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {current} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
