"use client";

import { useEffect, useState } from "react";
import { WEEK_ONE_TIP_OFF_ISO, openingPhase } from "@/domain/season-opening";
import { cs } from "./CourtsideStyles";

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
 * The longest receipt-to-hydration lag under which the freshest recorded
 * response completion can still be identified as belonging to the
 * response that carried this server sample. Beyond it the sample's age
 * cannot be established from trusted evidence (the record may be a stale
 * entry from an earlier document, e.g. after a soft navigation) and the
 * clock must show the unconfirmed static target instead of a live count.
 */
export const MAX_TRUSTED_RECEIPT_LAG_MS = 30_000;

/**
 * The freshest response completion the browser's own timing
 * infrastructure (Navigation + Resource Timing) recorded at or before
 * `nowMonoMs`, in performance.now() terms — or null when it recorded
 * none. These are monotonic timestamps captured by the browser around
 * the sample's receipt; the client wall clock is never consulted, so no
 * client clock offset can enter through here.
 */
export function freshestResponseEndMonoMs(nowMonoMs: number): number | null {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return null;
  let latest: number | null = null;
  try {
    for (const type of ["navigation", "resource"]) {
      for (const entry of performance.getEntriesByType(type)) {
        const end = (entry as PerformanceResourceTiming).responseEnd;
        if (Number.isFinite(end) && end > 0 && end <= nowMonoMs && (latest === null || end > latest)) {
          latest = end;
        }
      }
    }
  } catch {
    return null;
  }
  return latest;
}

/**
 * Anchor a server time sample at hydration, aging it ONLY by trusted
 * timing evidence. The sample was stamped when the server ran its league
 * check, during the very request whose response carried the sample to
 * this page — so its generation precedes that response's completion, and
 * by hydration the sample is at least (hydration − response completion)
 * old, measured entirely on the monotonic clock from the browser's own
 * timing records. Advancing the anchor by exactly that receipt lag can
 * lag the true server instant (by the sample's pre-receipt age: server
 * processing and transit) but can never pass it: no client clock offset,
 * however large, is converted into elapsed server time. The earlier
 * version of this function measured the age as (client wall clock −
 * sample stamp), which IS the wall clock whenever the client's clock
 * runs ahead — a client two hours fast turned a fresh check 30 seconds
 * before the tip into a false "Week 1 is underway" on mount.
 *
 * When the lag cannot be established — no timing record, or the
 * freshest recorded completion is older than
 * MAX_TRUSTED_RECEIPT_LAG_MS and so cannot be identified as the carrying
 * response — there is no anchor (null), and the caller renders the
 * unconfirmed static target rather than a live or started state.
 */
export function anchorFromSample(
  serverMs: number,
  receiptMonoMs: number | null,
  hydrationMonoMs: number,
): ClockAnchor | null {
  if (receiptMonoMs === null) return null;
  if (![serverMs, receiptMonoMs, hydrationMonoMs].every(Number.isFinite)) return null;
  const ageMs = hydrationMonoMs - receiptMonoMs;
  if (ageMs < 0 || ageMs > MAX_TRUSTED_RECEIPT_LAG_MS) return null;
  return { serverMs: serverMs + ageMs, monoMs: hydrationMonoMs };
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
 * anchored to the server's own league check (`serverNowIso`), advanced at
 * hydration only by the sample's receipt lag measured from the browser's
 * monotonic timing records (see anchorFromSample) and thereafter only by
 * the monotonic clock, so a skewed client clock cannot move it. When the
 * receipt lag cannot be established from that trusted evidence, elapsed
 * server time is unknowable and the display is the unconfirmed static
 * target from the start — never a live count, never a started state the
 * server sample itself did not reach. The
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
    // replace it. Its server instant is advanced only by the sample's
    // receipt lag — the monotonic gap between the freshest response
    // completion the browser recorded and hydration (see anchorFromSample)
    // — so an older league check is not re-lived from its stamp, and no
    // client wall-clock offset can become elapsed server time. When that
    // lag cannot be established, there is no anchor: fall back to the
    // unconfirmed static target instead of projecting a live count.
    const hydrationMonoMs = performance.now();
    const anchor = anchorFromSample(serverMs, freshestResponseEndMonoMs(hydrationMonoMs), hydrationMonoMs);
    if (!anchor) {
      setUncertain(true);
      return;
    }
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
