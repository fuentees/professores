/**
 * Guards against open-redirect via a user-controlled `redirect`/`next`
 * query param. `"//evil.com".startsWith("/")` is true in JS — browsers treat
 * a leading `//` as protocol-relative (same scheme, different host), so a
 * naive `startsWith("/")` check lets an attacker send a logged-in user to an
 * external site right after auth. Also rejects backslash variants, which
 * some browsers normalize to `//` as well.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  return true;
}
