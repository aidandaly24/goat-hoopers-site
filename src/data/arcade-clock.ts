import "server-only";
import { WEEK_ONE_RANKED_OPENING } from "@/domain/arcade/challenge-opening";
import { parseHeldOpeningClock } from "@/domain/arcade/held-opening-clock";

const response = (body: unknown, status: number) => Response.json(body, { status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });

/** Public clock only: no account, environment, database, admission or score access. */
export function handleArcadeClockRequest(request: Request, now: () => number = Date.now): Response {
  if (request.method !== "GET") return response({ status: "method_not_allowed" }, 405);
  if (request.url.length > 2048 || [...new URL(request.url).searchParams].length) return response({ status: "invalid_query" }, 400);
  try {
    const observation = parseHeldOpeningClock({ protocol: "held-opening-v1", phase: "held", asOfMs: now(), opening: WEEK_ONE_RANKED_OPENING, period: null });
    return observation ? response({ status: "ready", observation }, 200) : response({ status: "unavailable" }, 503);
  } catch { return response({ status: "unavailable" }, 503); }
}
