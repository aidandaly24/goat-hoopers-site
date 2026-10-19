"use client";

import { useEffect, useState } from "react";
import { cs } from "./CourtsideStyles";

/**
 * First tip of the 2026–27 NBA regular season: Boston Celtics at Detroit
 * Pistons, Tuesday Oct 20, 2026, 19:00 UTC (3:00 PM ET) — the earliest game
 * on ESPN's scoreboard for 2026-10-20 (season type: regular season; no games
 * on Oct 19). Verified against the ESPN scoreboard API on 2026-10-19.
 * Sleeper's league season_start_date (2026-10-20) agrees on the date.
 */
export const WEEK_ONE_TIP_OFF_ISO = "2026-10-20T19:00:00.000Z";

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

/** Pure remaining-time split; negative or invalid input reads as arrived. */
export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) return null;
  const remaining = Math.floor((targetMs - nowMs) / 1000);
  if (remaining <= 0) return null;
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Live countdown to the Week 1 tip. The server renders the remaining time as
 * of the page's own league check (`serverNowIso`), so the first client render
 * matches the markup exactly; a one-second interval takes over from there.
 * Once the tip passes, the component renders nothing and the hero's live
 * matchup state takes over. Digits use tabular figures; the per-second tick
 * is a transform/opacity fade that prefers-reduced-motion disables (CSS).
 */
export function TipCountdown({
  targetIso = WEEK_ONE_TIP_OFF_ISO,
  serverNowIso,
}: {
  targetIso?: string;
  serverNowIso: string;
}) {
  const targetMs = Date.parse(targetIso);
  const [nowMs, setNowMs] = useState(() => Date.parse(serverNowIso));
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const parts = countdownParts(targetMs, nowMs);
  if (!parts) return null;
  const cells: { value: string; label: string }[] = [
    ...(parts.days > 0 ? [{ value: String(parts.days), label: "days" }] : []),
    { value: pad(parts.hours), label: "hrs" },
    { value: pad(parts.minutes), label: "min" },
    { value: pad(parts.seconds), label: "sec" },
  ];
  return (
    <div className={cs("countdown-wrap")}>
      <div className={cs("countdown")} role="timer" aria-label={`Opening tip in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`}>
        {cells.map((cell) => (
          <span className={cs("countdown-cell")} key={cell.label}>
            <span className={cs("countdown-value", "gh-num")} key={cell.value}>
              {cell.value}
            </span>
            <span className={cs("countdown-label")}>{cell.label}</span>
          </span>
        ))}
      </div>
      <p className={cs("countdown-caption")}>Until the first Week 1 tip · Tue, Oct 20 · 3:00 PM ET</p>
    </div>
  );
}
