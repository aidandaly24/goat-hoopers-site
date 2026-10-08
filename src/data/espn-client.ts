/**
 * Browser-side live-scores hook for the ticker (issue #56).
 *
 * Split from ./espn.ts because that module is also imported by the server
 * data layer (league.ts); React hooks can't live in a server-imported
 * module. The polling loop lives here in the data client — components
 * stay presentational (rule 6).
 */
"use client";

import { useEffect, useState } from "react";
import { isGameDay, type LiveGame, type LiveSlate } from "@/domain/live-game";
import { fetchLiveGames } from "./espn";

/** Poll cadence while games are live/upcoming (rule 14). */
const POLL_MS = 60_000;
/**
 * Minimum spacing between request starts, applied to every path —
 * bootstrap, retry, timer, visibility, online (P2-3; #56 AC3: at most one
 * request per 60s per client).
 */
const MIN_SPACING_MS = 60_000;
const MAX_RETRIES = 2;
/**
 * Idle wake-up bound: visibility/online events only trigger a re-check of
 * an idle slate when the last attempt is older than this, so tab switches
 * can't start a request storm. Does not apply to failure recovery (P2-1).
 */
const IDLE_WAKEUP_MS = 3_600_000;
/**
 * When an idle wake-up fires but the provider's slate date hasn't rolled
 * (P2-2), re-check on this shorter cadence instead of waiting another day.
 */
const IDLE_RECHECK_MS = 2 * 3_600_000;

/** Injected dependencies — the poller never touches globals directly. */
export type LiveGamesPollerDeps = {
  fetchGames: (signal: AbortSignal) => Promise<LiveSlate>;
  now: () => number;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
  /** Subscribe to tab-visible events; returns an unsubscribe function. */
  onVisible: (fn: () => void) => () => void;
  /** Subscribe to network-online events; returns an unsubscribe function. */
  onOnline: (fn: () => void) => () => void;
};

function msUntilLocalMidnight(nowMs: number): number {
  const midnight = new Date(nowMs);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - nowMs);
}

/**
 * The polling state machine, extracted for testability (rule 11).
 *
 * Behavior:
 * - Polls every 60s while a game is live or scheduled today.
 * - One 60s floor gates every request start — bootstrap, retry, timer,
 *   visibility, online (P2-3; #56 AC3). A wake-up inside the floor queues
 *   a single deferred attempt instead of firing early or being dropped.
 * - Transient failure: bounded retries at the 60s floor, then parks
 *   silently with a needsRecovery flag — the next online/visibility event
 *   always recovers it (P2-1), regardless of the 1h idle bound.
 * - Idle slate (empty or all-final): no continuous polling. Wakes once at
 *   the next local midnight to discover the new day's slate; if the
 *   provider's slate date hasn't rolled, re-checks every 2h instead of
 *   waiting 24h (P2-2). Stale finals are replaced by the fresh check,
 *   never rotated indefinitely.
 * - Never overlaps requests: an in-flight guard drops re-entrant polls.
 */
export function createLiveGamesPoller(
  deps: LiveGamesPollerDeps,
  onUpdate: (games: LiveGame[] | null) => void,
): { start: () => void; stop: () => void } {
  let stopped = false;
  let inFlight = false;
  let timer: unknown;
  let aborter: AbortController | null = null;
  let retries = 0;
  let lastAttempt = 0;
  /** P2-1: parked after exhausting retries — wake events must recover. */
  let needsRecovery = false;
  /** P2-2: ESPN's day.date from the last idle response. */
  let lastSlateDate: string | null = null;
  let unsubVisible: (() => void) | null = null;
  let unsubOnline: (() => void) | null = null;

  function clearTimer() {
    if (timer !== undefined) {
      deps.clearTimeout(timer);
      timer = undefined;
    }
  }

  function schedule(ms: number) {
    clearTimer();
    timer = deps.setTimeout(() => {
      timer = undefined;
      requestPoll();
    }, ms);
  }

  /** P2-3: ms until a new request may start under the 60s floor. */
  function floorDelayMs(): number {
    if (lastAttempt === 0) return 0;
    return Math.max(0, lastAttempt + MIN_SPACING_MS - deps.now());
  }

  /**
   * The single 60s-floor gate for every poll path (P2-3). When inside the
   * floor, queues one deferred attempt instead of firing early — and
   * instead of dropping a recovery wake-up (P2-1).
   */
  function requestPoll() {
    if (stopped || inFlight) return;
    const wait = floorDelayMs();
    if (wait > 0) {
      schedule(wait);
      return;
    }
    void poll();
  }

  /**
   * Idle-slate scheduling (P2-2): track the provider's slate date across
   * wake-ups. A fresh or rolled slate waits for the next local midnight;
   * an unrolled slate re-checks in 2h so a visible tab discovers the new
   * day without waiting 24h.
   */
  function scheduleIdle(slateDate: string | null) {
    if (
      slateDate !== null &&
      lastSlateDate !== null &&
      slateDate === lastSlateDate
    ) {
      schedule(IDLE_RECHECK_MS);
    } else {
      lastSlateDate = slateDate;
      schedule(msUntilLocalMidnight(deps.now()));
    }
  }

  async function poll() {
    if (stopped || inFlight) return;
    inFlight = true;
    clearTimer();
    aborter?.abort();
    aborter = new AbortController();
    lastAttempt = deps.now();
    try {
      const slate = await deps.fetchGames(aborter.signal);
      if (stopped) return;
      retries = 0;
      needsRecovery = false;
      const games = slate.games;
      onUpdate(games);
      if (isGameDay(games)) {
        lastSlateDate = null;
        schedule(POLL_MS);
      } else {
        scheduleIdle(slate.slateDate);
      }
    } catch {
      if (stopped) return;
      retries += 1;
      if (retries <= MAX_RETRIES) {
        schedule(POLL_MS);
      } else {
        // Park silently; needsRecovery makes the next visibility/online
        // event recover instead of being dropped by the idle bound (P2-1).
        needsRecovery = true;
        onUpdate(null);
      }
    } finally {
      inFlight = false;
    }
  }

  function wake() {
    if (stopped || inFlight) return;
    if (needsRecovery) {
      // P2-1: parked after failures — always honor, via the 60s floor.
      requestPoll();
      return;
    }
    if (deps.now() - lastAttempt > IDLE_WAKEUP_MS) {
      requestPoll();
    }
  }

  return {
    start() {
      unsubVisible = deps.onVisible(wake);
      unsubOnline = deps.onOnline(wake);
      requestPoll();
    },
    stop() {
      stopped = true;
      clearTimer();
      aborter?.abort();
      unsubVisible?.();
      unsubOnline?.();
    },
  };
}

/**
 * Live games for the ticker, polled from the browser.
 *
 * Returns null until the first fetch resolves, and on parked failure or
 * off-days (the ticker then parks on News/Stocks). The poller handles
 * retry, day-boundary expiry, and visibility/online recovery; this hook
 * is just the React binding.
 */
export function useLiveGames(): LiveGame[] | null {
  const [games, setGames] = useState<LiveGame[] | null>(null);

  useEffect(() => {
    const poller = createLiveGamesPoller(
      {
        fetchGames: (signal) => fetchLiveGames(signal),
        now: () => Date.now(),
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (id) =>
          clearTimeout(id as ReturnType<typeof setTimeout>),
        onVisible: (fn) => {
          const handler = () => {
            if (document.visibilityState === "visible") fn();
          };
          document.addEventListener("visibilitychange", handler);
          return () => document.removeEventListener("visibilitychange", handler);
        },
        onOnline: (fn) => {
          window.addEventListener("online", fn);
          return () => window.removeEventListener("online", fn);
        },
      },
      setGames,
    );
    poller.start();
    return () => poller.stop();
  }, []);

  return games;
}
