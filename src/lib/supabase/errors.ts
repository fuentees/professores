type PostgrestLikeError = { message: string; code?: string };

/**
 * Turns a delete failure into a friendly message only when it's actually a
 * foreign-key violation (23503); any other error (permissions, network,
 * etc.) is surfaced as-is instead of being mislabeled as "linked records".
 */
export function friendlyDeleteError(error: PostgrestLikeError, linkedMessage: string): string {
  if (error.code === "23503") return linkedMessage;
  return error.message;
}
