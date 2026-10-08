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

/**
 * Live games for the ticker, polled from the browser.
 *
 * Returns null until the first fetch resolves, and permanently on
 * failure or off-days (the ticker then parks on News/Stocks). Polls
 * every 60s only while at least one game is in progress or scheduled
 * today — a slate of finals is displayed but not re-polled, and an
 * empty slate stops after the initial check.
 */
export function useLiveGames(): LiveGame[] | null {
  const [games, setGames] = useState<LiveGame[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function poll() {
      try {
        const fresh = await fetchLiveGames(controller.signal);
        if (cancelled) return;
        setGames(fresh);
        // Keep polling only while there's something to watch.
        if (isGameDay(fresh)) {
          timer = setTimeout(poll, POLL_MS);
        }
      } catch {
        // Scores unavailable: park silently. No retry storm — a reload
        // picks scores back up when ESPN is reachable again.
        if (!cancelled) setGames(null);
      }
    }

    poll();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return games;
}
