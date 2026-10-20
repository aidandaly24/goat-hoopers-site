/** Point-in-time authorization window; not a COMMIT or response deadline. */
export type ReconcileAuthorizationWindow = { notBeforeMs: number; expiresAtMs: number };
export const MAX_RECONCILE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const integer = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
function instant(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return integer(ms) && new Date(ms).toISOString() === value.replace("Z", ".000Z") ? ms : null;
}
export function parseReconcileAuthorizationWindow(notBefore: unknown, expiresAt: unknown): ReconcileAuthorizationWindow | null {
  const start = instant(notBefore), end = instant(expiresAt);
  return start !== null && end !== null && end > start && end - start <= MAX_RECONCILE_WINDOW_MS
    ? { notBeforeMs: start, expiresAtMs: end } : null;
}
/** Start inclusive, expiry exclusive. Invalid clocks/windows deny authorization. */
export function reconcileAuthorizedAt(window: ReconcileAuthorizationWindow, nowMs: number): boolean {
  return integer(nowMs) && integer(window.notBeforeMs) && integer(window.expiresAtMs) &&
    window.expiresAtMs > window.notBeforeMs && window.expiresAtMs - window.notBeforeMs <= MAX_RECONCILE_WINDOW_MS &&
    nowMs >= window.notBeforeMs && nowMs < window.expiresAtMs;
}
