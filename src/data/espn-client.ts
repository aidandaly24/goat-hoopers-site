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
 * An idle slate that is not today's needs bounded discovery even on the
 * first response, because the provider may roll its day after midnight.
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

function localSlateDate(nowMs: number): string {
  const date = new Date(nowMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
 *   the next local midnight for today's slate. A previous/unknown day
 *   re-checks within 2h from its first response (P2-2). Previous-day
 *   finals expire immediately; overnight live games keep polling.
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
   * Compare with the local day, rather than requiring a prior idle
   * response. Midnight remains an earlier discovery opportunity.
   */
  function scheduleIdle(slateDate: string | null) {
    const now = deps.now();
    const untilMidnight = msUntilLocalMidnight(now);
    schedule(slateDate === localSlateDate(now)
      ? untilMidnight
      : Math.min(untilMidnight, IDLE_RECHECK_MS));
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
      if (isGameDay(games)) {
        onUpdate(games);
        schedule(POLL_MS);
      } else {
        // Only a valid past calendar day can expire idle scores. Missing
        // or malformed dates still get bounded discovery, without guessing.
        const date = new Date(`${slate.slateDate}T00:00:00`);
        const expired = localSlateDate(date.getTime()) === slate.slateDate
          && slate.slateDate < localSlateDate(deps.now());
        onUpdate(expired ? [] : games);
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
