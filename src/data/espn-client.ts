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
import { isGameDay, type LiveGame } from "@/domain/live-game";
import { fetchLiveGames } from "./espn";

/** Poll cadence while games are live/upcoming (rule 14). */
const POLL_MS = 60_000;
/** First retry after a transient failure; second retry backs off to POLL_MS. */
const RETRY_1_MS = 30_000;
const MAX_RETRIES = 2;
/**
 * Idle wake-up bound: visibility/online events only trigger a re-check when
 * the last attempt is older than this, so tab switches can't start a
 * request storm.
 */
const IDLE_WAKEUP_MS = 3_600_000;

/** Injected dependencies — the poller never touches globals directly. */
export type LiveGamesPollerDeps = {
  fetchGames: (signal: AbortSignal) => Promise<LiveGame[]>;
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
 * - Transient failure: bounded retry (30s, then 60s backoff), then parks
 *   silently — online/visibility events recover it (P2-1).
 * - Idle slate (empty or all-final): no continuous polling. Wakes once at
 *   the next local midnight to discover the new day's slate, plus a
 *   bounded wake-up on visibility/online if the last check is >1h old
 *   (P2-2). Stale finals are replaced by the fresh check, never rotated
 *   indefinitely.
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
      void poll();
    }, ms);
  }

  async function poll() {
    if (stopped || inFlight) return;
    inFlight = true;
    clearTimer();
    aborter?.abort();
    aborter = new AbortController();
    lastAttempt = deps.now();
    try {
      const fresh = await deps.fetchGames(aborter.signal);
      if (stopped) return;
      retries = 0;
      onUpdate(fresh);
      if (isGameDay(fresh)) {
        schedule(POLL_MS);
      } else {
        // Idle: one bounded wake-up at the next day boundary.
        schedule(msUntilLocalMidnight(deps.now()));
      }
    } catch {
      if (stopped) return;
      retries += 1;
      if (retries === 1) {
        schedule(RETRY_1_MS);
      } else if (retries <= MAX_RETRIES) {
        schedule(POLL_MS);
      } else {
        // Park silently; visibility/online listeners recover (P2-1).
        onUpdate(null);
      }
    } finally {
      inFlight = false;
    }
  }

  function wake() {
    if (stopped || inFlight) return;
    if (deps.now() - lastAttempt > IDLE_WAKEUP_MS) {
      void poll();
    }
  }

  return {
    start() {
      unsubVisible = deps.onVisible(wake);
      unsubOnline = deps.onOnline(wake);
      void poll();
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
