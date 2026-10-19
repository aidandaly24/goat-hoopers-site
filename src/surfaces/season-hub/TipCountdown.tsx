"use client";

import { useEffect, useState } from "react";
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

export type ClockSample = { monoMs: number; wallMs: number };

/**
 * Anchor a server time sample at hydration. The sample was stamped when
 * the server ran its league check (`checkedAt`); by the time the client
 * hydrates, that instant is already in the past. Anchoring the raw stamp
 * to hydration time would re-live the sample/response age on every load,
 * so the anchor advances by the sample's age — measured once, here, as
 * the gap between the client's wall clock at hydration and the stamp.
 * After this single correction the wall clock never sets the displayed
 * time again: advancement is monotonic-only and divergence-checked. A
 * wall clock behind the stamp never rewinds the anchor.
 */
export function anchorFromSample(serverMs: number, wallMs: number, monoMs: number): ClockAnchor {
  const ageMs = Number.isFinite(wallMs) ? Math.max(0, wallMs - serverMs) : 0;
  return { serverMs: serverMs + ageMs, monoMs };
}

/**
 * Whether a hidden interval's elapsed time can be trusted. While a tab is
 * hidden its timers stop, so no visible-sample pair spans the gap — but
 * the two clocks' totals across the gap are still evidence: when wall and
 * monotonic time advance together, the interval is an ordinary tab switch
 * however long it lasted. When they diverge — the device slept
 * (performance.now() stalls while wall time runs), the wall clock was
 * adjusted, either clock ran backwards — how much time actually passed
 * is unknowable from inside the page, and no projection from the anchor
 * may be presented as live.
 */
export function hiddenIntervalDiverged(hide: ClockSample, resume: ClockSample): boolean {
  const monoDelta = resume.monoMs - hide.monoMs;
  const wallDelta = resume.wallMs - hide.wallMs;
  return (
    ![hide.monoMs, hide.wallMs, resume.monoMs, resume.wallMs].every(Number.isFinite) ||
    monoDelta < 0 ||
    wallDelta < 0 ||
    Math.abs(wallDelta - monoDelta) > 2000
  );
}

/**
 * Reconcile the clock when the tab becomes visible again. A trusted
 * hidden interval reconciles with exactly one re-projection from the
 * untouched anchor, and the detector baseline restarts at the resume
 * sample so only consecutive *visible* samples are ever compared. A
 * diverged interval is NOT trusted: elapsed time across it is uncertain,
 * so no projection is offered as live (the caller falls back to the
 * unconfirmed static target) — resuming on the monotonic projection
 * alone after device sleep would keep counting down confidently stale.
 * Either way the projection itself reads the anchor and the monotonic
 * clock only; the wall clock never sets it.
 */
export function resumeClock(
  anchor: ClockAnchor,
  hide: ClockSample,
  resume: ClockSample,
): { projectedMs: number; baseline: ClockSample; trusted: boolean } {
  return {
    projectedMs: projectServerNow(anchor, resume.monoMs),
    baseline: resume,
    trusted: !hiddenIntervalDiverged(hide, resume),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

const tipFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

function tipParts(targetMs: number): Record<string, string> {
  return Object.fromEntries(tipFormat.formatToParts(new Date(targetMs)).map((part) => [part.type, part.value]));
}

/** The target's caption in Eastern time with the zone named as it stands
 * on that date — "Tue, Oct 20 · 3:00 PM EDT", "Tue, Dec 1 · 2:00 PM EST".
 * Formatted from targetIso, never hardcoded: a later target must not wear
 * the opener's caption. */
export function formatTipCaption(targetMs: number): string {
  const p = tipParts(targetMs);
  return `${p.weekday}, ${p.month} ${p.day} · ${p.hour}:${p.minute} ${p.dayPeriod} ${p.timeZoneName}`;
}

/** The target's month/day in Eastern time, e.g. "Oct 20" — for copy that
 * names the date Sleeper confirms. */
export function formatTipDate(targetMs: number): string {
  const p = tipParts(targetMs);
  return `${p.month} ${p.day}`;
}

/**
 * The Week 1 opening clock, shown on the court for every visitor. Time is
 * anchored to the server's own league check (`serverNowIso`), advanced by
 * the sample's age at hydration (see anchorFromSample) and thereafter only
 * by the monotonic clock, so a skewed client clock cannot move it. The
 * interval stops at the tip (terminal started state) and while the tab is
 * hidden. On return, the hidden interval must reconcile — wall and
 * monotonic clocks advancing together — or elapsed time is uncertain and
 * the display falls back to the unconfirmed static target; device sleep
 * while hidden is exactly that case, and no confidently stale count is
 * ever shown. A sample taken while visible that shows suspension or skew
 * takes the same fallback. SSR renders from the same server instant, so
 * the first client render matches the markup.
 */
export function TipCountdown({
  targetIso = WEEK_ONE_TIP_OFF_ISO,
  serverNowIso,
  week = null,
}: {
  targetIso?: string;
  serverNowIso: string;
  week?: number | null;
}) {
  const targetMs = Date.parse(targetIso);
  const serverMs = Date.parse(serverNowIso);
  const [nowMs, setNowMs] = useState(serverMs);
  const [uncertain, setUncertain] = useState(false);

  useEffect(() => {
    // Only the countdown ticks; the started state is terminal and the past
    // state renders nothing — neither starts an interval.
    if (openingPhase(serverMs, targetMs, week) !== "before") return;
    // The anchor is created once per server sample and never reset: hidden
    // intervals, resumes and detector baselines all work around it, never
    // replace it. Its server instant is advanced by the sample's age at
    // hydration, so an older league check is not re-lived from its stamp.
    const anchor: ClockAnchor = anchorFromSample(serverMs, Date.now(), performance.now());
    // Detector baseline: only consecutive samples taken while the tab is
    // visible are ever compared. Nothing sampled across a hidden interval
    // reaches clockSampleSkewed.
    let baseline: ClockSample = { monoMs: anchor.monoMs, wallMs: Date.now() };
    // The last sample before the tab hid (the anchor sample until the
    // first hide): the resume path compares the hidden interval's two
    // clock totals against it.
    let hiddenAt: ClockSample = baseline;
    let id: number | undefined;
    let dead = false;
    const stop = () => {
      if (id !== undefined) window.clearInterval(id);
      id = undefined;
    };
    const sample = () => {
      const next: ClockSample = { monoMs: performance.now(), wallMs: Date.now() };
      if (clockSampleSkewed(baseline, next)) {
        dead = true;
        stop();
        setUncertain(true);
        return;
      }
      baseline = next;
      const projected = projectServerNow(anchor, next.monoMs);
      setNowMs(projected);
      if (projected >= targetMs) stop();
    };
    const tick = () => {
      if (id === undefined && !document.hidden) id = window.setInterval(sample, 1000);
    };
    // Show the age-corrected projection immediately, not one tick late:
    // the SSR value is the raw sample instant.
    setNowMs(projectServerNow(anchor, performance.now()));
    const resume = () => {
      if (dead) return;
      const reconciled = resumeClock(anchor, hiddenAt, { monoMs: performance.now(), wallMs: Date.now() });
      if (!reconciled.trusted) {
        // Elapsed time across the hidden interval is uncertain (device
        // sleep, clock adjustment): never resume a confidently stale
        // count — fall back to the unconfirmed static target.
        dead = true;
        stop();
        setUncertain(true);
        return;
      }
      baseline = reconciled.baseline;
      setNowMs(reconciled.projectedMs);
      if (reconciled.projectedMs < targetMs) tick();
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = { monoMs: performance.now(), wallMs: Date.now() };
        stop();
      } else resume();
    };
    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [serverMs, targetMs, week]);

  const phase = openingPhase(nowMs, targetMs, week);
  if (phase === "past") return null;
  const caption = formatTipCaption(targetMs);
  if (phase === "started") {
    return (
      <div className={cs("countdown-wrap")} data-court-clock="started">
        <p className={cs("countdown-started")}>Week 1 is underway</p>
        <p className={cs("countdown-caption")}>First tip · {caption}</p>
      </div>
    );
  }
  if (uncertain) {
    return (
      <div className={cs("countdown-wrap")} data-court-clock="uncertain">
        <p className={cs("countdown-started")}>Tip time unconfirmed</p>
        <p className={cs("countdown-caption")}>Week 1 tip-off · {caption} · reload for a fresh league check</p>
      </div>
    );
  }
  const parts = countdownParts(targetMs, nowMs);
  if (!parts) return null;
  // One presentation only: the court overlay. There is no inline hero
  // variant — members and anonymous visitors get the identical treatment,
  // exactly once per page.
  return (
    <div className={cs("countdown-wrap")} data-court-clock="countdown">
      <p className={cs("court-clock-line")}>
        <span className={cs("court-clock-label")}>Week 1 tip-off</span>
        <strong className={cs("court-clock-value", "gh-num")} role="timer" aria-label={`Opening tip in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`}>
          {parts.days > 0 ? `${parts.days}d ` : ""}{pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
        </strong>
      </p>
      <p className={cs("countdown-caption")}>
        First NBA game · {caption} · Sleeper confirms the {formatTipDate(targetMs)} date; its scoring-start time is unpublished
      </p>
    </div>
  );
}
