import "server-only";
import { timingSafeEqual } from "node:crypto";
import { parseReconcileAuthorizationWindow, reconcileAuthorizedAt, type ReconcileAuthorizationWindow } from "@/domain/arcade/reconcile-window";

export type ReconcileAccess = { status: "allowed"; window: ReconcileAuthorizationWindow } | { status: "disabled" | "held" | "unauthorized" };
/** Only this endpoint's dedicated setting is read. No legacy key fallback and
 * no credential is retained in the returned/public authorization result. */
export function authorizeReconcile(headers: Headers, env: Readonly<Record<string, string | undefined>>, nowMs: number): ReconcileAccess {
  if (env.GOAT_ARCADE_RECONCILE_ENABLED !== "1") return { status: "disabled" };
  const window = parseReconcileAuthorizationWindow(env.GOAT_ARCADE_RECONCILE_NOT_BEFORE, env.GOAT_ARCADE_RECONCILE_EXPIRES_AT);
  const token = env.GOAT_ARCADE_RECONCILE_TOKEN;
  if (!window || typeof token !== "string" || token.length !== 64 || !/^[a-f0-9]{64}$/.test(token)) return { status: "held" };
  const actual = headers.get("authorization");
  if (!actual || actual.length !== 71 || !/^Bearer [a-f0-9]{64}$/.test(actual) || !timingSafeEqual(Buffer.from(actual), Buffer.from(`Bearer ${token}`)) ||
    !reconcileAuthorizedAt(window, nowMs)) return { status: "unauthorized" };
  return { status: "allowed", window };
}

/** No JSON parsing: reject any bytes, excessive empty chunks, read errors or a
 * stream that does not finish within one second. Cancellation is never awaited. */
export async function emptyReconcileBody(request: Request): Promise<boolean> {
  if (!request.body) return true;
  if (request.bodyUsed || request.body.locked) return false;
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("empty_body_timeout")), 1000); });
  try {
    for (let n = 0; n < 8; n++) {
      const part = await Promise.race([reader.read(), timeout]);
      if (part.done) return true;
      if (!(part.value instanceof Uint8Array) || part.value.byteLength) return false;
    }
    return false;
  } catch { return false; }
  finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
}
