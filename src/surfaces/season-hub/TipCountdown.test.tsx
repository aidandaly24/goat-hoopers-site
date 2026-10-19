import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  TipCountdown,
  WEEK_ONE_TIP_OFF_ISO,
  anchorFromSample,
  clockSampleSkewed,
  countdownParts,
  formatTipCaption,
  hiddenIntervalDiverged,
  openingPhase,
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
  it('advances the anchor by the age of the server sample, so an older checkedAt is not re-lived', () => {
    const serverMs = Date.parse('2026-10-19T12:00:00Z');
    // The league check was stamped 90 seconds before the client hydrated:
    // the anchor starts 90 seconds ahead of the raw sample, not at it.
    expect(anchorFromSample(serverMs, serverMs + 90_000, 5000)).toEqual({
      serverMs: serverMs + 90_000,
      monoMs: 5000,
    });
    // A fresh sample anchors at its own instant.
    expect(anchorFromSample(serverMs, serverMs, 5000)).toEqual({ serverMs, monoMs: 5000 });
    // A client wall clock behind the server sample never rewinds the anchor.
    expect(anchorFromSample(serverMs, serverMs - 30_000, 5000)).toEqual({ serverMs, monoMs: 5000 });
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
