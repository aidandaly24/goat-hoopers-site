/**
 * espn-client.test.ts — the live-games poller (src/data/espn-client.ts, PR #63).
 *
 * Offline tests with fake fetch + fake clock covering the P2-1/P2-2 review
 * findings: bounded retry with backoff and visibility/online recovery, and
 * day-boundary expiry so an idle tab discovers the next slate.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createLiveGamesPoller,
  type LiveGamesPollerDeps,
} from "@/data/espn-client";
import type { LiveGame } from "@/domain/live-game";

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

function setup(
  fetchImpl: (signal: AbortSignal) => Promise<LiveGame[]>,
) {
  const updates: Array<LiveGame[] | null> = [];
  const visibleHandlers: Array<() => void> = [];
  const onlineHandlers: Array<() => void> = [];
  const deps: LiveGamesPollerDeps = {
    fetchGames: fetchImpl,
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
  return { poller, updates, visibleHandlers, onlineHandlers };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("retry on transient failure (P2-1)", () => {
  it("recovers after one rejected fetch without overlapping requests", async () => {
    vi.useFakeTimers();
    let calls = 0;
    let concurrent = 0;
    let maxConcurrent = 0;
    const { poller, updates } = setup(async () => {
      calls += 1;
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      try {
        await Promise.resolve();
        if (calls === 2) throw new Error("transient");
        return [liveGame];
      } finally {
        concurrent -= 1;
      }
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toEqual([[liveGame]]);

    await vi.advanceTimersByTimeAsync(60_000); // scheduled poll → rejects
    expect(calls).toBe(2);
    expect(updates).toEqual([[liveGame]]); // no update yet, retry scheduled

    await vi.advanceTimersByTimeAsync(30_000); // 30s retry → succeeds
    expect(calls).toBe(3);
    expect(updates).toEqual([[liveGame], [liveGame]]);
    expect(maxConcurrent).toBe(1);

    poller.stop();
  });

  it("backs off then parks silently, recovering on visibility", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { poller, updates, visibleHandlers } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      if (calls <= 3) throw new Error("down");
      return [liveGame];
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=0: fail → retry at t=30s
    await vi.advanceTimersByTimeAsync(30_000); // t=30s: fail → retry at t=90s
    await vi.advanceTimersByTimeAsync(60_000); // t=90s: fail → park
    expect(calls).toBe(3);
    expect(updates).toEqual([null]);

    // Parked: advancing time schedules nothing further.
    await vi.advanceTimersByTimeAsync(3_600_001);
    expect(calls).toBe(3);

    // Visibility wake-up after >1h since the last attempt recovers.
    visibleHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(4);
    expect(updates).toEqual([null, [liveGame]]);

    poller.stop();
  });

  it("does not wake on visibility when the last check was recent", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { poller, visibleHandlers } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      throw new Error("down");
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // t=0: fail
    await vi.advanceTimersByTimeAsync(90_000); // retries at t=30s, t=90s → park
    expect(calls).toBe(3);

    // 10 minutes after parking — within the 1h bound, no re-check.
    await vi.advanceTimersByTimeAsync(600_000);
    visibleHandlers[0]();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(3);

    poller.stop();
  });
});

describe("day-boundary expiry (P2-2)", () => {
  it("discovers the next day's slate after an empty night", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 0, 0)); // 11pm local
    let calls = 0;
    const { poller, updates } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      return calls === 1 ? [] : [liveGame];
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toEqual([[]]);

    // Idle: one wake-up at local midnight, 1h away.
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(calls).toBe(2);
    expect(updates).toEqual([[], [liveGame]]);

    poller.stop();
  });

  it("replaces stale finals with the next day's slate", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 23, 30, 0)); // 11:30pm local
    let calls = 0;
    const { poller, updates } = setup(async () => {
      calls += 1;
      await Promise.resolve();
      return calls === 1 ? [finalGame] : [liveGame];
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toEqual([[finalGame]]);

    // All-final slate: idle, wake at midnight (30m away).
    await vi.advanceTimersByTimeAsync(1_800_000);
    expect(calls).toBe(2);
    // Stale finals are replaced, not rotated indefinitely.
    expect(updates).toEqual([[finalGame], [liveGame]]);

    poller.stop();
  });
});
