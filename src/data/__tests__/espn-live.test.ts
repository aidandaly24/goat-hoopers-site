/**
 * espn-live.test.ts — the live scoreboard mapper (src/data/espn.ts, PR #63).
 *
 * Covers the P2-3/P2-4 review findings with offline fixtures:
 * - Status classification: only positively-identified pre/in/post states
 *   authorize polling; unknown, canceled, or postponed statuses are dropped,
 *   never defaulted to "scheduled".
 * - Defensive parsing: object abbreviations, null events/competitors, and
 *   malformed scores can't reach React or crash the mapper; valid siblings
 *   survive mixed payloads.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toStatus, toLiveGame, fetchLiveGames } from "@/data/espn";

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "401123456",
    competitions: [
      {
        competitors: [
          {
            homeAway: "away",
            score: "102",
            team: { abbreviation: "BOS", displayName: "Boston Celtics" },
          },
          {
            homeAway: "home",
            score: "98",
            team: { abbreviation: "LAL", displayName: "Los Angeles Lakers" },
          },
        ],
      },
    ],
    status: {
      type: { id: "2", state: "in", completed: false, shortDetail: "Q3 4:32" },
    },
    ...overrides,
  };
}

describe("toStatus", () => {
  it("classifies the documented lifecycle states", () => {
    expect(toStatus({ state: "pre" })).toBe("scheduled");
    expect(toStatus({ state: "in" })).toBe("in-progress");
    expect(toStatus({ state: "post" })).toBe("final");
  });

  it("falls back to the legacy numeric id when state is absent", () => {
    expect(toStatus({ id: "1" })).toBe("scheduled");
    expect(toStatus({ id: "2" })).toBe("in-progress");
    expect(toStatus({ id: "3" })).toBe("final");
  });

  it("prefers state over id when both are present", () => {
    expect(toStatus({ id: "1", state: "in" })).toBe("in-progress");
  });

  it("drops missing, unknown, canceled, and postponed statuses", () => {
    expect(toStatus(undefined)).toBeNull();
    expect(toStatus(null)).toBeNull();
    expect(toStatus({})).toBeNull();
    expect(toStatus({ id: "9" })).toBeNull();
    expect(toStatus({ state: "canceled" })).toBeNull();
    expect(toStatus({ state: "postponed" })).toBeNull();
    // shortDetail "TBD" with no id/state must not become "scheduled"
    expect(toStatus({ shortDetail: "TBD" })).toBeNull();
  });
});

describe("toLiveGame", () => {
  it("maps a valid in-progress event", () => {
    const g = toLiveGame(validEvent());
    expect(g).toMatchObject({
      id: "401123456",
      awayAbbr: "BOS",
      awayName: "Boston Celtics",
      homeAbbr: "LAL",
      awayScore: 102,
      homeScore: 98,
      status: "in-progress",
      clock: "Q3 4:32",
    });
  });

  it("rejects an object abbreviation instead of passing it to React (P2-4)", () => {
    const evil = validEvent();
    (
      evil.competitions as Array<{
        competitors: Array<{ team: { abbreviation: unknown } }>;
      }>
    )[0].competitors[0].team.abbreviation = { value: "BOS" };
    expect(toLiveGame(evil)).toBeNull();
  });

  it("handles null events and competitors without throwing", () => {
    expect(toLiveGame(null)).toBeNull();
    expect(toLiveGame(undefined)).toBeNull();
    expect(toLiveGame("nope")).toBeNull();
    expect(toLiveGame({ ...validEvent(), competitions: null })).toBeNull();
    expect(
      toLiveGame({ ...validEvent(), competitions: [{ competitors: null }] }),
    ).toBeNull();
    expect(
      toLiveGame({ ...validEvent(), competitions: [{ competitors: "x" }] }),
    ).toBeNull();
  });

  it("drops events with unrecognized statuses instead of defaulting", () => {
    expect(
      toLiveGame(
        validEvent({ status: { type: { shortDetail: "TBD" } } }),
      ),
    ).toBeNull();
    expect(
      toLiveGame(
        validEvent({ status: { type: { state: "postponed" } } }),
      ),
    ).toBeNull();
  });

  it("sanitizes malformed scores to 0, never NaN", () => {
    const g = toLiveGame(
      validEvent({
        competitions: [
          {
            competitors: [
              {
                homeAway: "away",
                score: "abc",
                team: { abbreviation: "BOS" },
              },
              {
                homeAway: "home",
                score: { value: 98 },
                team: { abbreviation: "LAL" },
              },
            ],
          },
        ],
      }),
    );
    expect(g?.awayScore).toBe(0);
    expect(g?.homeScore).toBe(0);
  });

  it("requires a display clock", () => {
    expect(
      toLiveGame(validEvent({ status: { type: { id: "2", state: "in" } } })),
    ).toBeNull();
  });
});

describe("fetchLiveGames", () => {
  const fakeFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    fakeFetch.mockReset();
    vi.stubGlobal("fetch", fakeFetch);
  });

  function okResponse(body: unknown) {
    return {
      ok: true,
      json: async () => body,
    } as Response;
  }

  it("maps mixed valid and malformed events, keeping valid siblings", async () => {
    fakeFetch.mockResolvedValue(
      okResponse({
        day: { date: "2026-10-08" },
        events: [
          validEvent(),
          null,
          { id: "bad-no-competitors" },
          validEvent({
            id: "401123457",
            status: {
              type: { id: "3", state: "post", shortDetail: "Final" },
            },
          }),
        ],
      }),
    );
    const slate = await fetchLiveGames();
    expect(slate.games.map((g) => g.id)).toEqual(["401123456", "401123457"]);
    expect(slate.games[1].status).toBe("final");
    expect(slate.slateDate).toBe("2026-10-08");
  });

  it("returns a null slateDate when the provider omits day.date", async () => {
    fakeFetch.mockResolvedValue(okResponse({ events: [validEvent()] }));
    const slate = await fetchLiveGames();
    expect(slate.games.map((g) => g.id)).toEqual(["401123456"]);
    expect(slate.slateDate).toBeNull();
  });

  it("throws on HTTP errors", async () => {
    fakeFetch.mockResolvedValue({ ok: false, status: 403 } as Response);
    await expect(fetchLiveGames()).rejects.toThrow("HTTP 403");
  });

  it("throws when the shape is wrong", async () => {
    fakeFetch.mockResolvedValue(okResponse({ events: "nope" }));
    await expect(fetchLiveGames()).rejects.toThrow("shape changed");
    fakeFetch.mockResolvedValue(okResponse(null));
    await expect(fetchLiveGames()).rejects.toThrow("shape changed");
  });
});
