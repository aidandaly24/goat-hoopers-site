/**
 * espn-client.test.ts — the live-games poller (src/data/espn-client.ts, PR #63).
 *
 * Offline tests with fake fetch + fake clock covering the P2 review
 * findings: 60s request floor on every path (P2-3), failure recovery via
 * needsRecovery that survives the idle bound (P2-1), and provider-day
 * rollover via the ESPN slate date (P2-2).
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createLiveGamesPoller,
  type LiveGamesPollerDeps,
} from "@/data/espn-client";
import type { LiveGame, LiveSlate } from "@/domain/live-game";

const liveGame: LiveGame = {
  id: "401123456",
  awayAbbr: "BOS",
  awayName: "Boston Celtics",
  homeAbbr: "LAL",
  homeName: "Los Angeles Lakers",
  awayScore: 102,
  homeScore: 98,
  status: "in-progress",
  clock: "Q3 4:32",
};

const finalGame: LiveGame = { ...liveGame, status: "final", clock: "Final" };

function slate(games: LiveGame[], slateDate: string | null = "2026-10-08"): LiveSlate {
  return { games, slateDate };
}

function setup(
  fetchImpl: (signal: AbortSignal) => Promise<LiveSlate>,
) {
  const updates: Array<LiveGame[] | null> = [];
  const visibleHandlers: Array<() => void> = [];
  const onlineHandlers: Array<() => void> = [];
  /** Request start timestamps, for the 60s-floor assertions (P2-3). */
  const requestTimes: number[] = [];
  const deps: LiveGamesPollerDeps = {
    fetchGames: async (signal) => {
      requestTimes.push(Date.now());
      return fetchImpl(signal);
    },
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
    onVisible: (fn) => {
      visibleHandlers.push(fn);
      return () => {};
    },
    onOnline: (fn) => {
      onlineHandlers.push(fn);
      return () => {};
    },
  };
  const poller = createLiveGamesPoller(deps, (g) => updates.push(g));
  return { poller, updates, visibleHandlers, onlineHandlers, requestTimes };
}

/** Every consecutive request start must be ≥60s apart (P2-3, #56 AC3). */
function expectFloor(requestTimes: number[]) {
  for (let i = 1; i < requestTimes.length; i += 1) {
    expect(requestTimes[i] - requestTimes[i - 1]).toBeGreaterThanOrEqual(60_000);
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe("60s request floor on every path (P2-3)", () => {
  it("spaces retries at 60s and keeps request starts ≥60s apart through failure and recovery", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { poller, updates, onlineHandlers, requestTimes } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      if (calls <= 3) throw new Error("down");
      return slate([liveGame]);
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=0: fail → retry in 60s
    await vi.advanceTimersByTimeAsync(60_000); // t=60s: fail → retry in 60s
    await vi.advanceTimersByTimeAsync(60_000); // t=120s: fail → park
    expect(calls).toBe(3);
    expect(updates).toEqual([null]);

    // Online recovery 60s after parking: floor satisfied, recovers now.
    await vi.advanceTimersByTimeAsync(60_000); // t=180s
    onlineHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(4);
    expect(updates).toEqual([null, [liveGame]]);
    expectFloor(requestTimes);

    poller.stop();
  });

  it("defers a midnight wake-up inside the floor instead of firing early", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 59, 30)); // 11:59:30pm local
    let calls = 0;
    const { poller, requestTimes } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      return slate([], "2026-10-08");
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=23:59:30: idle → midnight in 30s
    expect(calls).toBe(1);

    await vi.advanceTimersByTimeAsync(30_000); // t=00:00:00: timer fires…
    // …but the 60s floor isn't satisfied, so the poll is deferred, not run.
    expect(calls).toBe(1);

    await vi.advanceTimersByTimeAsync(30_000); // t=00:00:30: floor satisfied
    expect(calls).toBe(2);
    expectFloor(requestTimes);

    poller.stop();
  });
});

describe("failure recovery via needsRecovery (P2-1)", () => {
  it("recovers on online before the 1h idle bound, without another event", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { poller, updates, onlineHandlers, visibleHandlers } = setup(
      async () => {
        calls += 1;
        await Promise.resolve();
        if (calls <= 3) throw new Error("down");
        return slate([liveGame]);
      },
    );

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=0: fail
    await vi.advanceTimersByTimeAsync(60_000); // t=60s: fail
    await vi.advanceTimersByTimeAsync(60_000); // t=120s: fail → park
    expect(calls).toBe(3);
    expect(updates).toEqual([null]);

    // Parked: advancing time schedules nothing further.
    await vi.advanceTimersByTimeAsync(600_000); // t=712s
    expect(calls).toBe(3);

    // Online at t=712s — only 10min after parking, inside the 1h idle
    // bound — but needsRecovery always honors the wake-up.
    onlineHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(4);
    expect(updates).toEqual([null, [liveGame]]);
    // No visibility event was needed.
    expect(visibleHandlers.length).toBe(1);

    poller.stop();
  });

  it("defers an online wake-up inside the 60s floor instead of dropping it", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { poller, onlineHandlers, requestTimes } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      if (calls <= 3) throw new Error("down");
      return slate([liveGame]);
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=0: fail
    await vi.advanceTimersByTimeAsync(60_000); // t=60s: fail
    await vi.advanceTimersByTimeAsync(60_000); // t=120s: fail → park
    expect(calls).toBe(3);

    // Online 30s after parking — inside the 60s floor. The wake-up is
    // deferred to the floor expiry, not dropped.
    await vi.advanceTimersByTimeAsync(30_000); // t=150s
    onlineHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(3); // not yet — deferred

    await vi.advanceTimersByTimeAsync(30_000); // t=180s: floor satisfied
    expect(calls).toBe(4);
    expectFloor(requestTimes);

    poller.stop();
  });

  it("does not wake an idle slate on visibility when the last check was recent", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 0, 0)); // 11pm local
    let calls = 0;
    const { poller, visibleHandlers } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      return slate([], "2026-10-08");
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=23:00: idle → midnight timer
    expect(calls).toBe(1);

    // 30 minutes later — within the 1h idle bound, and not a failure
    // recovery — so visibility does not re-check (storm protection).
    await vi.advanceTimersByTimeAsync(1_800_000);
    visibleHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);

    poller.stop();
  });
});

describe("provider-day rollover (P2-2)", () => {
  it("re-checks in 2h when the midnight slate hasn't rolled, then finds the new day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 0, 0)); // 11pm local, Oct 8
    let calls = 0;
    const { poller, updates } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      if (calls <= 2) {
        // Midnight comes but ESPN still serves yesterday's finals.
        return slate([finalGame], "2026-10-08");
      }
      // Provider rolls later that morning.
      return slate([liveGame], "2026-10-09");
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=23:00: idle finals
    expect(updates).toEqual([[finalGame]]);

    // Idle: wake at local midnight, 1h away.
    await vi.advanceTimersByTimeAsync(3_600_000); // t=00:00 Oct 9
    expect(calls).toBe(2);
    // Same slate date → not 24h, re-check in 2h.
    await vi.advanceTimersByTimeAsync(2 * 3_600_000); // t=02:00
    expect(calls).toBe(3);
    expect(updates).toEqual([[finalGame], [finalGame], [liveGame]]);

    // New slate is a game day: back to 60s polling.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toBe(4);

    poller.stop();
  });

  it("waits for the next midnight when the provider slate has rolled", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 0, 0)); // 11pm local, Oct 8
    let calls = 0;
    const { poller, updates } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      return calls === 1
        ? slate([], "2026-10-08")
        : slate([liveGame], "2026-10-09");
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toEqual([[]]);

    // Midnight wake-up finds the rolled slate: game day, no 2h detour.
    await vi.advanceTimersByTimeAsync(3_600_000); // t=00:00 Oct 9
    expect(calls).toBe(2);
    expect(updates).toEqual([[], [liveGame]]);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toBe(3);

    poller.stop();
  });
});
