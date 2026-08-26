export function isRecentlyCreated(createdAt: string, days = 14): boolean {
  return Date.now() - new Date(createdAt).getTime() < days * 24 * 60 * 60 * 1000;
}

export function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
