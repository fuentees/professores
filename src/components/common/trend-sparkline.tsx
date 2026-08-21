/**
 * Barras diárias simples (sem lib de gráfico — não vale a dependência pra
 * algo tão pequeno). Altura mínima de 8% em dias com 0 eventos: sem isso,
 * um trecho parado vira uma lacuna que parece bug de renderização, em vez
 * de comunicar "zero" de forma honesta (ver skill dataviz — sequential,
 * um hue só, sem decoração).
 */
export function TrendSparkline({
  data,
  label,
}: {
  data: { date: string; count: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div
      className="flex h-8 items-end gap-px"
      role="img"
      aria-label={`${label}: tendência dos últimos ${data.length} dias, total ${data.reduce((s, d) => s + d.count, 0)}`}
    >
      {data.map((d) => (
        <div
          key={d.date}
          className="min-w-0.5 flex-1 rounded-t-sm bg-primary/60"
          style={{ height: `${Math.max(8, (d.count / max) * 100)}%` }}
          title={`${new Date(d.date).toLocaleDateString("pt-BR")}: ${d.count}`}
        />
      ))}
    </div>
  );
}
