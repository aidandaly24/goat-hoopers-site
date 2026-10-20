import { afterEach, expect, it, vi } from "vitest";
import { handleArcadeClockRequest } from "../arcade-clock";
import { createArcadeClockReader } from "../arcade-clock-client";
import { parseHeldOpeningClock } from "@/domain/arcade/held-opening-clock";
import { WEEK_ONE_RANKED_OPENING } from "@/domain/arcade/challenge-opening";

afterEach(() => vi.useRealTimers());
const request = () => new Request("https://goat.test/api/arcade/free-throw/clock");

it.each([-1, 0, 1, 86400000])("keeps the approved opening held at its boundary (%s ms)", async delta => {
  const asOfMs = WEEK_ONE_RANKED_OPENING.startsAtMs + delta;
  const response = handleArcadeClockRequest(request(), () => asOfMs);
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.json()).toEqual({ status: "ready", observation: { protocol: "held-opening-v1", phase: "held", asOfMs,
    opening: WEEK_ONE_RANKED_OPENING, period: null } });
  expect(new Intl.DateTimeFormat("en-US", { timeZone: WEEK_ONE_RANKED_OPENING.timeZone, hour: "numeric", minute: "2-digit", hour12: false }).format(WEEK_ONE_RANKED_OPENING.startsAtMs)).toBe("15:00");
});

it("samples the actual route with no auth/DB config, rejects query overrides, and withholds invalid time", async () => {
  vi.useFakeTimers(); vi.setSystemTime(WEEK_ONE_RANKED_OPENING.startsAtMs);
  const { GET } = await import("@/app/api/arcade/free-throw/clock/route");
  expect(await (await GET(request())).json()).toMatchObject({ observation: { asOfMs: WEEK_ONE_RANKED_OPENING.startsAtMs, phase: "held" } });
  for (const query of ["?active=1", "?startsAtMs=1", "?endsAtMs=2"]) expect(handleArcadeClockRequest(new Request(request().url + query)).status).toBe(400);
  expect(handleArcadeClockRequest(new Request(request().url, { method: "POST" })).status).toBe(405);
  for (const time of [NaN, Infinity, -1, 0.5]) expect(handleArcadeClockRequest(request(), () => time).status).toBe(503);
});

it("strictly decodes the held protocol, strips unexpected private fields, and rejects an active or invented schedule", async () => {
  const body = await handleArcadeClockRequest(request(), () => 1000).json(), observation = body.observation;
  for (const change of [{ phase: "active" }, { protocol: "other" }, { period: { endsAtMs: 123 } }, { asOfMs: undefined },
    { opening: { ...observation.opening, startsAtMs: observation.opening.startsAtMs + 1 } },
    { opening: { ...observation.opening, timeZone: "UTC" } }]) expect(parseHeldOpeningClock({ ...observation, ...change })).toBeNull();
  expect(parseHeldOpeningClock({ ...observation, userId: "private", shots: [1] })).toEqual(observation);
});

it("uses one no-store same-origin GET, propagates abort, and never retries or posts after failure", async () => {
  const signal = new AbortController().signal;
  const fetcher = vi.fn(async () => handleArcadeClockRequest(request(), () => 1000));
  const read = createArcadeClockReader(fetcher);
  expect(await read(signal)).toMatchObject({ ok: true, value: { phase: "held" } });
  expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/arcade/free-throw/clock", { method: "GET", credentials: "same-origin", cache: "no-store", signal });
  fetcher.mockRejectedValue(new Error("network"));
  expect(await read()).toEqual({ ok: false }); expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockResolvedValue(Response.json({ status: "ready", observation: { phase: "active" } }));
  expect(await read()).toEqual({ ok: false }); expect(fetcher).toHaveBeenCalledTimes(3);
});
