"use client";

import { useEffect, useRef, useState } from "react";
import { cs } from "./CourtsideStyles";

/**
 * First tip of the 2026–27 NBA regular season: Boston Celtics at Detroit
 * Pistons, Tuesday Oct 20, 2026, 19:00 UTC (3:00 PM ET) — the earliest game
 * on ESPN's scoreboard for 2026-10-20 (season type: regular season; no games
 * on Oct 19). Verified against the ESPN scoreboard API on 2026-10-19.
 * This is the first NBA tip, NOT Sleeper's scoring-start instant: Sleeper
 * publishes season_start_date (2026-10-20) — a date, no time — and the UI
 * copy keeps that distinction.
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

export type OpeningPhase = "before" | "started" | "past";

/**
 * The court's opening state at a given instant: countdown before the first
 * tip; the started state through the rest of Week 1; nothing once the season
 * has moved on. `week` is the current displayed week — null when no pairing
 * establishes it, in which case the started state lasts seven days past the
 * tip. The provider's phase flag never gates this: the clock does.
 */
export function openingPhase(nowMs: number, targetMs: number, week: number | null): OpeningPhase {
  if (!Number.isFinite(nowMs) || !Number.isFinite(targetMs)) return "past";
  if (nowMs < targetMs) return "before";
  if (week === 1) return "started";
  if (week === null && nowMs < targetMs + 7 * 86_400_000) return "started";
  return "past";
}

export type ClockAnchor = { serverMs: number; monoMs: number };

/** Project the current server instant from the anchor and the monotonic
 * clock. Elapsed time never comes from the wall clock. */
export function projectServerNow(anchor: ClockAnchor, monoMs: number): number {
  return anchor.serverMs + Math.max(0, monoMs - anchor.monoMs);
}

/** Wall/mono divergence detects suspension or clock skew between samples;
 * the wall clock never sets the displayed time. */
export function clockSampleSkewed(
  previous: { monoMs: number; wallMs: number },
  next: { monoMs: number; wallMs: number },
): boolean {
  const monoDelta = next.monoMs - previous.monoMs;
  const wallDelta = next.wallMs - previous.wallMs;
  return (
    ![previous.monoMs, previous.wallMs, next.monoMs, next.wallMs].every(Number.isFinite) ||
    monoDelta < 0 ||
    monoDelta > 5000 ||
    Math.abs(wallDelta - monoDelta) > 2000
  );
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The Week 1 opening clock, shown on the court for every visitor. Time is
 * anchored to the server's own league check (`serverNowIso`) and advanced
 * only by the monotonic clock, so a skewed client clock cannot move it.
 * The interval stops at the tip (terminal started state) and while the tab
 * is hidden; if a sample shows suspension/skew, ticking stops and the
 * display falls back to an unconfirmed static date. SSR renders from the
 * same server instant, so the first client render matches the markup.
 */
export function TipCountdown({
  targetIso = WEEK_ONE_TIP_OFF_ISO,
  serverNowIso,
  week = null,
  variant = "hero",
}: {
  targetIso?: string;
  serverNowIso: string;
  week?: number | null;
  variant?: "hero" | "overlay";
}) {
  const targetMs = Date.parse(targetIso);
  const serverMs = Date.parse(serverNowIso);
  const [nowMs, setNowMs] = useState(serverMs);
  const [uncertain, setUncertain] = useState(false);
  const lastSample = useRef<{ monoMs: number; wallMs: number } | null>(null);

  useEffect(() => {
    // Only the countdown ticks; the started state is terminal and the past
    // state renders nothing — neither starts an interval.
    if (openingPhase(serverMs, targetMs, week) !== "before") return;
    const anchor: ClockAnchor = { serverMs, monoMs: performance.now() };
    lastSample.current = { monoMs: anchor.monoMs, wallMs: Date.now() };
    let id: number | undefined;
    const stop = () => {
      if (id !== undefined) window.clearInterval(id);
      id = undefined;
    };
    const sample = () => {
      const next = { monoMs: performance.now(), wallMs: Date.now() };
      if (lastSample.current && clockSampleSkewed(lastSample.current, next)) {
        stop();
        setUncertain(true);
        return;
      }
      lastSample.current = next;
      const projected = projectServerNow(anchor, next.monoMs);
      setNowMs(projected);
      if (projected >= targetMs) stop();
    };
    const start = () => {
      if (id !== undefined || document.hidden) return;
      // Resuming re-bases the skew sample so a clean hidden interval (where
      // monotonic and wall time advance together) is not read as skew.
      lastSample.current = { monoMs: performance.now(), wallMs: Date.now() };
      id = window.setInterval(sample, 1000);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [serverMs, targetMs, week]);

  const phase = openingPhase(nowMs, targetMs, week);
  if (phase === "past") return null;
  if (phase === "started") {
    return (
      <div className={cs("countdown-wrap")} data-court-clock="started">
        <p className={cs("countdown-started")}>Week 1 is underway</p>
        <p className={cs("countdown-caption")}>First tip · Tue, Oct 20 · 3:00 PM ET</p>
      </div>
    );
  }
  if (uncertain) {
    return (
      <div className={cs("countdown-wrap")} data-court-clock="uncertain">
        <p className={cs("countdown-started")}>Tip time unconfirmed</p>
        <p className={cs("countdown-caption")}>Week 1 tip-off · Tue, Oct 20 · 3:00 PM ET · reload for a fresh league check</p>
      </div>
    );
  }
  const parts = countdownParts(targetMs, nowMs);
  if (!parts) return null;
  if (variant === "overlay") {
    return (
      <div className={cs("countdown-wrap")} data-court-clock="countdown">
        <p className={cs("court-clock-line")}>
          <span className={cs("court-clock-label")}>Week 1 tip-off</span>
          <strong className={cs("court-clock-value", "gh-num")} role="timer" aria-label={`Opening tip in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`}>
            {parts.days > 0 ? `${parts.days}d ` : ""}{pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
          </strong>
        </p>
        <p className={cs("countdown-caption")}>
          First NBA game · Tue, Oct 20 · 3:00 PM ET · Sleeper confirms the Oct 20 date; its scoring-start time is unpublished
        </p>
      </div>
    );
  }
  const cells: { value: string; label: string }[] = [
    ...(parts.days > 0 ? [{ value: String(parts.days), label: "days" }] : []),
    { value: pad(parts.hours), label: "hrs" },
    { value: pad(parts.minutes), label: "min" },
    { value: pad(parts.seconds), label: "sec" },
  ];
  return (
    <div className={cs("countdown-wrap")} data-court-clock="countdown">
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
