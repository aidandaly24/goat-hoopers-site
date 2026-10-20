import { parseHeldOpeningClock, type HeldOpeningClock } from "@/domain/arcade/held-opening-clock";

export type ArcadeClockReply = { ok: true; value: HeldOpeningClock } | { ok: false };
export type ArcadeClockReader = (signal?: AbortSignal) => Promise<ArcadeClockReply>;

/** One same-origin GET per request; no polling, automatic retry or state-changing transport. */
export function createArcadeClockReader(fetcher: (input: string, init?: RequestInit) => Promise<Response> = fetch): ArcadeClockReader {
  return async signal => {
    try {
      const response = await fetcher("/api/arcade/free-throw/clock", { method: "GET", credentials: "same-origin", cache: "no-store", signal });
      if (!response.ok) return { ok: false };
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("status" in body) || body.status !== "ready" || !("observation" in body)) return { ok: false };
      const observation = parseHeldOpeningClock(body.observation);
      return observation ? { ok: true, value: observation } : { ok: false };
    } catch { return { ok: false }; }
  };
}
