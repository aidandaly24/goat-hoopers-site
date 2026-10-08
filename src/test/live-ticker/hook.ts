import { useEffect, useState } from "react";
import { createLiveGamesPoller } from "../../data/espn-client";
import type { LiveGame, LiveSlate } from "@/domain/live-game";

const game: LiveGame = {
  id: "synthetic-game", awayAbbr: "BOS", awayName: "Synthetic Boston",
  homeAbbr: "LAL", homeName: "Synthetic Los Angeles",
  awayScore: 102, homeScore: 98, status: "final", clock: "Final",
};
type ResponseKind = "final" | "in-progress" | "scheduled" | "empty" | "failure";
let now = new Date(2026, 9, 9, 3).getTime();
let response: ResponseKind = "final";
let slateDate = "2026-10-08";
let nextId = 0;
const timers = new Map<number, { at: number; fn: () => void }>();
const requests: number[] = [];
const subscribers = new Set<() => void>();
function notify() { subscribers.forEach((fn) => fn()); }

export const fixtureClock = {
  snapshot: () => ({
    now: new Date(now).toLocaleString(), response, slateDate,
    requests: requests.length,
    spacing: requests.slice(1).map((time, index) => time - requests[index]),
    next: timers.size ? Math.min(...Array.from(timers.values(), (timer) => timer.at)) - now : null,
  }),
  subscribe(fn: () => void) { subscribers.add(fn); return () => { subscribers.delete(fn); }; },
  reset(overnight: boolean) {
    now = overnight ? new Date(2026, 9, 8, 23, 59, 30).getTime() : new Date(2026, 9, 9, 3).getTime();
    response = overnight ? "in-progress" : "final";
    slateDate = "2026-10-08";
    timers.clear(); requests.length = 0; notify();
  },
  respond(kind: ResponseKind, date = slateDate) { response = kind; slateDate = date; notify(); },
  async advance(ms: number) {
    const target = now + ms;
    for (;;) {
      const next = Array.from(timers).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > target) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn();
      await Promise.resolve(); await Promise.resolve();
    }
    now = target; notify();
  },
};

/** Test-only React binding to the production poller through its injected seam. */
export function useLiveGames(): LiveGame[] | null {
  const [games, setGames] = useState<LiveGame[] | null>(null);
  useEffect(() => {
    const poller = createLiveGamesPoller({
      now: () => now,
      fetchGames: async (signal): Promise<LiveSlate> => {
        requests.push(now); notify();
        if (signal.aborted || response === "failure") throw new Error("Synthetic failure");
        const games = response === "empty" ? [] : [{
          ...game, status: response,
          clock: response === "scheduled" ? "8:00 PM" : response === "in-progress" ? "Q3 4:32" : "Final",
        }];
        return { games, slateDate };
      },
      setTimeout(fn, ms) { const id = ++nextId; timers.set(id, { at: now + ms, fn }); notify(); return id; },
      clearTimeout(id) { timers.delete(id as number); notify(); },
      onVisible(fn) {
        const handler = () => { if (document.visibilityState === "visible") fn(); };
        document.addEventListener("visibilitychange", handler);
        return () => document.removeEventListener("visibilitychange", handler);
      },
      onOnline(fn) { window.addEventListener("online", fn); return () => window.removeEventListener("online", fn); },
    }, setGames);
    poller.start();
    return () => poller.stop();
  }, []);
  return games;
}
