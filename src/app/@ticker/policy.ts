/** Utility flows do not need league-market/news work or a live ticker. */
const UTILITY_ROOTS = new Set([
  "account",
  "admin",
  "login",
  "signup",
  "claim",
  "forgot-password",
  "reset-password",
]);

export function shouldRenderTicker(segments: readonly string[] = []): boolean {
  return !UTILITY_ROOTS.has(segments[0] ?? "");
}
