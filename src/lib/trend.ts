/**
 * Agrupa uma lista de timestamps ISO em baldes diários dos últimos `days`
 * dias (incluindo hoje), preenchendo dias sem nenhum evento com 0 — sem
 * isso, um trecho sem atividade simplesmente não apareceria no gráfico em
 * vez de aparecer como zero de verdade.
 */
export function bucketByDay(timestamps: string[], days: number): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}
