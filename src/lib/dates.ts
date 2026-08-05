export function isRecentlyCreated(createdAt: string, days = 14): boolean {
  return Date.now() - new Date(createdAt).getTime() < days * 24 * 60 * 60 * 1000;
}
