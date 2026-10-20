import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WEEK_ONE_TIP_OFF_ISO, openingPhase } from '@/domain/season-opening';
import {
  TipCountdown,
  anchorFromSample,
  clockSampleSkewed,
  countdownParts,
  formatTipCaption,
  freshestResponseEndMonoMs,
  hiddenIntervalDiverged,
  projectServerNow,
  resumeClock,
} from './TipCountdown';

const TARGET = Date.parse(WEEK_ONE_TIP_OFF_ISO);

describe('countdownParts', () => {
  it('splits remaining time into days, hours, minutes and seconds', () => {
    const now = TARGET - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(countdownParts(TARGET, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });
  it('reads as arrived at and after the target, and on invalid input', () => {
    expect(countdownParts(TARGET, TARGET)).toBeNull();
    expect(countdownParts(TARGET, TARGET + 1000)).toBeNull();
    expect(countdownParts(Number.NaN, TARGET)).toBeNull();
  });
});

describe('openingPhase', () => {
  it('counts down before the tip in any provider phase', () => {
    expect(openingPhase(TARGET - 1000, TARGET, 1)).toBe('before');
    expect(openingPhase(TARGET - 1000, TARGET, null)).toBe('before');
  });
  it('shows the started state through Week 1, then retires', () => {
    expect(openingPhase(TARGET + 1000, TARGET, 1)).toBe('started');
    expect(openingPhase(TARGET + 3 * 86_400_000, TARGET, 1)).toBe('started');
    expect(openingPhase(TARGET + 1000, TARGET, 2)).toBe('past');
    expect(openingPhase(TARGET + 1000, TARGET, null)).toBe('started');
    expect(openingPhase(TARGET + 8 * 86_400_000, TARGET, null)).toBe('past');
    expect(openingPhase(Number.NaN, TARGET, 1)).toBe('past');
  });
});

describe('trusted clock helpers', () => {
  it('projects server time from the monotonic anchor only', () => {
    const anchor = { serverMs: 1_000_000, monoMs: 5000 };
    expect(projectServerNow(anchor, 5000)).toBe(1_000_000);
    expect(projectServerNow(anchor, 7500)).toBe(1_002_500);
    expect(projectServerNow(anchor, 4000)).toBe(1_000_000);
  });
  it('flags suspension and wall/mono divergence as skew, never as time', () => {
    const a = { monoMs: 0, wallMs: 100_000 };
    expect(clockSampleSkewed(a, { monoMs: 1000, wallMs: 101_000 })).toBe(false);
    expect(clockSampleSkewed(a, { monoMs: 60_000, wallMs: 160_000 })).toBe(true); // suspended tick gap
    expect(clockSampleSkewed(a, { monoMs: 1000, wallMs: 130_000 })).toBe(true); // wall jumped
    expect(clockSampleSkewed(a, { monoMs: -1, wallMs: 101_000 })).toBe(true);
  });
});

describe('resume after a hidden interval', () => {
  it('reconciles with one re-projection from the untouched anchor — no skew, no reset', () => {
    // Anchor: one hour before the tip, monotonic clock at 5s.
    const anchor = { serverMs: TARGET - 3_600_000, monoMs: 5000 };
    // A visible tick 1s later is clean and projects from the anchor.
    const visible = { monoMs: 6000, wallMs: 200_000 };
    expect(clockSampleSkewed({ monoMs: anchor.monoMs, wallMs: 199_000 }, visible)).toBe(false);
    expect(projectServerNow(anchor, visible.monoMs)).toBe(TARGET - 3_599_000);
    // The tab hides for ten minutes: no samples are taken while hidden.
    // Feeding the pre-hidden baseline across that gap WOULD flag skew (the
    // old failure mode — a hidden tab read as suspension)...
    const afterHidden = { monoMs: visible.monoMs + 600_000, wallMs: visible.wallMs + 600_000 };
    expect(clockSampleSkewed(visible, afterHidden)).toBe(true);
    // ...so resume never feeds that pair to the visible-sample detector.
    // Wall and monotonic advanced together across the hidden interval, so
    // the resume is trusted: it re-projects once from the same anchor, the
    // displayed time advances by the full hidden interval in a single
    // step, and the anchor itself is unchanged.
    const { projectedMs, baseline, trusted } = resumeClock(anchor, visible, afterHidden);
    expect(trusted).toBe(true);
    expect(projectedMs).toBe(TARGET - 2_999_000);
    expect(anchor).toEqual({ serverMs: TARGET - 3_600_000, monoMs: 5000 });
    expect(countdownParts(TARGET, projectedMs)).toEqual({ days: 0, hours: 0, minutes: 49, seconds: 59 });
    // Ticking resumes cleanly from the resume baseline: the next visible
    // sample is not skewed, so there is no unconfirmed flash.
    const next = { monoMs: baseline.monoMs + 1000, wallMs: baseline.wallMs + 1000 };
    expect(clockSampleSkewed(baseline, next)).toBe(false);
  });

  it('a wall-clock jump during the hidden interval marks the resume untrusted — the projection never comes from the wall clock', () => {
    const anchor = { serverMs: TARGET - 3_600_000, monoMs: 5000 };
    const hide = { monoMs: 605_000, wallMs: 800_000 };
    const clean = resumeClock(anchor, hide, { monoMs: 665_000, wallMs: 860_000 });
    const wallJumped = resumeClock(anchor, hide, { monoMs: 665_000, wallMs: 860_000 + 600_000 });
    // The projection is identical either way (anchor + monotonic only)...
    expect(wallJumped.projectedMs).toBe(clean.projectedMs);
    // ...but a hidden interval whose wall and monotonic clocks disagree
    // cannot be trusted, so the display must not resume on it.
    expect(clean.trusted).toBe(true);
    expect(wallJumped.trusted).toBe(false);
  });

  it('a hidden interval that spans the tip reconciles straight to the started phase', () => {
    const anchor = { serverMs: TARGET - 60_000, monoMs: 0 };
    const { projectedMs, trusted } = resumeClock(anchor, { monoMs: 0, wallMs: 0 }, { monoMs: 120_000, wallMs: 120_000 });
    expect(trusted).toBe(true);
    expect(openingPhase(projectedMs, TARGET, 1)).toBe('started');
  });

  it('device sleep while hidden (wall +600s, monotonic +1s) is divergence, never a trusted resume', () => {
    // The dot's reproduction: the page hides, the device sleeps — wall
    // time advances 600 seconds while performance.now() advances ~1
    // second — then the tab resumes. The old resume re-projected from the
    // monotonic anchor alone and kept counting down confidently stale
    // (1d 03:30:00 → 1d 03:29:59 while ten real minutes had passed).
    const hide = { monoMs: 6000, wallMs: 200_000 };
    const slept = { monoMs: 7000, wallMs: 800_000 };
    expect(hiddenIntervalDiverged(hide, slept)).toBe(true);
    const anchor = { serverMs: TARGET - (86_400_000 + 3 * 3_600_000 + 1_800_000), monoMs: 5000 };
    const { trusted } = resumeClock(anchor, hide, slept);
    expect(trusted).toBe(false);
    // Ordinary tab switches still resume: both clocks advance together,
    // however long the tab was hidden.
    expect(hiddenIntervalDiverged(hide, { monoMs: 606_000, wallMs: 800_000 })).toBe(false);
    expect(hiddenIntervalDiverged(hide, { monoMs: 6500, wallMs: 200_500 })).toBe(false);
    // A monotonic clock running backwards across the interval is not
    // elapsed time either.
    expect(hiddenIntervalDiverged(hide, { monoMs: 5000, wallMs: 199_000 })).toBe(true);
  });
});

describe('sample age at hydration', () => {
  it('advances the anchor only by the trusted receipt lag, so an older checkedAt is not re-lived', () => {
    const serverMs = Date.parse('2026-10-19T12:00:00Z');
    // The response carrying the sample completed 250ms before hydration
    // on the browser's monotonic timing record: the sample is at least
    // that old, so the anchor starts 250ms ahead of the raw stamp — and
    // not one millisecond further.
    expect(anchorFromSample(serverMs, 4750, 5000)).toEqual({
      serverMs: serverMs + 250,
      monoMs: 5000,
    });
    // A response that completed exactly at hydration anchors at the stamp.
    expect(anchorFromSample(serverMs, 5000, 5000)).toEqual({ serverMs, monoMs: 5000 });
  });

  it('offers no anchor when the receipt lag cannot be established from trusted evidence', () => {
    const serverMs = Date.parse('2026-10-19T12:00:00Z');
    // No timing record at all.
    expect(anchorFromSample(serverMs, null, 5000)).toBeNull();
    // The freshest recorded completion is two minutes old: it cannot be
    // identified as the response that carried THIS sample (a stale entry
    // from an earlier document, e.g. after a soft navigation), so its lag
    // must not become elapsed server time — the display is unconfirmed.
    expect(anchorFromSample(serverMs, 5000, 5000 + 120_000)).toBeNull();
    // A receipt stamped after hydration is not evidence either.
    expect(anchorFromSample(serverMs, 6000, 5000)).toBeNull();
    expect(anchorFromSample(serverMs, Number.NaN, 5000)).toBeNull();
    expect(anchorFromSample(Number.NaN, 4750, 5000)).toBeNull();
  });

  it('reads the receipt from the freshest recorded response completion at or before hydration', () => {
    const entry = (responseEnd: number) => ({ responseEnd }) as unknown as PerformanceEntry;
    vi.stubGlobal('performance', {
      getEntriesByType: (type: string) =>
        type === 'navigation' ? [entry(1200)] : [entry(3400), entry(900), entry(0), entry(99_999)],
    });
    try {
      // The entry completing after "now" (99_999) and the never-completed
      // one (0) are ignored; the receipt is the freshest genuine
      // completion, 3400.
      expect(freshestResponseEndMonoMs(5000)).toBe(3400);
      // Nothing completed at or before an earlier hydration: no evidence.
      expect(freshestResponseEndMonoMs(500)).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('skewed client clock at hydration', () => {
  // The dot's reproduction: a fresh server check 30 seconds before the
  // accepted tip (2026-10-20T19:00:00Z) on a client whose wall clock is
  // two hours fast. The old anchor aged the sample by (client wall −
  // stamp), which IS the wall clock whenever it runs ahead, so after
  // mounting the court falsely showed "Week 1 is underway". The wall
  // clock is no longer an input to the anchor at all — hydration ages
  // the sample only by the monotonic receipt lag — so both skew
  // directions produce the identical, server-bound anchor.
  const serverMs = Date.parse('2026-10-20T18:59:30Z'); // 30s before the tip
  const receiptMonoMs = 10_000;
  const hydrationMonoMs = 10_250; // trusted receipt lag: 250ms

  it('a client clock two hours ahead never turns the fresh pre-tip sample into the started state', () => {
    const anchor = anchorFromSample(serverMs, receiptMonoMs, hydrationMonoMs);
    expect(anchor).toEqual({ serverMs: serverMs + 250, monoMs: hydrationMonoMs });
    const projected = projectServerNow(anchor!, hydrationMonoMs);
    expect(openingPhase(projected, TARGET, 1)).toBe('before');
    expect(countdownParts(TARGET, projected)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 29 });
    // The projection reaches the tip only after the remaining real time
    // has elapsed on the monotonic clock — a constant client offset is
    // not elapsed time and can never carry it across early.
    expect(openingPhase(projectServerNow(anchor!, hydrationMonoMs + 29_000), TARGET, 1)).toBe('before');
  });

  it('a client clock two hours behind yields the same anchor — the count is the server sample’s, not a skewed one', () => {
    // Identical monotonic evidence, identical anchor: the display counts
    // down the server sample's own remaining ~30 seconds rather than a
    // confidently wrong figure derived from the skewed wall clock.
    const anchor = anchorFromSample(serverMs, receiptMonoMs, hydrationMonoMs);
    expect(anchor).toEqual({ serverMs: serverMs + 250, monoMs: hydrationMonoMs });
    expect(countdownParts(TARGET, projectServerNow(anchor!, hydrationMonoMs))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 29,
    });
  });
});

describe('target captions', () => {
  it('formats the accepted October target as 3 PM EDT in America/New_York', () => {
    expect(formatTipCaption(TARGET)).toBe('Tue, Oct 20 · 3:00 PM EDT');
  });

  it('formats a December target as 2 PM EST — the caption follows targetIso, never a hardcoded October line', () => {
    expect(formatTipCaption(Date.parse('2026-12-01T19:00:00Z'))).toBe('Tue, Dec 1 · 2:00 PM EST');
  });

  it('renders the formatted caption in the live countdown', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { targetIso: '2026-12-01T19:00:00Z', serverNowIso: '2026-11-30T12:00:00Z' }),
    );
    expect(html).toContain('Tue, Dec 1 · 2:00 PM EST');
    expect(html).toContain('Sleeper confirms the Dec 1 date');
    expect(html).not.toContain('Oct 20');
  });

  it('renders the formatted caption in the started state', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { targetIso: '2026-12-01T19:00:00Z', serverNowIso: '2026-12-02T12:00:00Z', week: 1 }),
    );
    expect(html).toContain('First tip · Tue, Dec 1 · 2:00 PM EST');
    expect(html).not.toContain('Oct 20');
  });
});

describe('TipCountdown server render', () => {
  it('renders the remaining time as of the server league check, with no hydration gap', () => {
    const html = renderToStaticMarkup(createElement(TipCountdown, { serverNowIso: '2026-10-19T12:00:00Z' }));
    expect(html).toContain('role="timer"');
    expect(html).toContain('data-court-clock="countdown"');
    // The single (court overlay) presentation: 1 day, 7 hours to the tip.
    expect(html).toContain('Week 1 tip-off');
    expect(html).toContain('1d 07:00:00');
  });

  it('keeps the league-scoring source distinction in the caption', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { serverNowIso: '2026-10-19T12:00:00Z' }),
    );
    expect(html).toContain('First NBA game · Tue, Oct 20 · 3:00 PM EDT');
    expect(html).toContain('Sleeper confirms the Oct 20 date; its scoring-start time is unpublished');
  });

  it('renders a terminal started state once the tip passes during Week 1', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { serverNowIso: '2026-10-21T12:00:00Z', week: 1 }),
    );
    expect(html).toContain('Week 1 is underway');
    expect(html).toContain('data-court-clock="started"');
    expect(html).not.toContain('role="timer"');
  });

  it('renders nothing once the season has moved past the opening window', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { serverNowIso: '2026-10-28T12:00:00Z', week: 3 }),
    );
    expect(html).toBe('');
  });
});
