import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  TipCountdown,
  WEEK_ONE_TIP_OFF_ISO,
  clockSampleSkewed,
  countdownParts,
  openingPhase,
  projectServerNow,
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

describe('TipCountdown server render', () => {
  it('renders the remaining time as of the server league check, with no hydration gap', () => {
    const html = renderToStaticMarkup(createElement(TipCountdown, { serverNowIso: '2026-10-19T12:00:00Z' }));
    expect(html).toContain('role="timer"');
    expect(html).toContain('Until the first Week 1 tip · Tue, Oct 20 · 3:00 PM ET');
    expect(html).toContain('>1<'); // 1 day
    expect(html).toContain('>07<'); // 7 hours
    expect(html).toContain('data-court-clock="countdown"');
  });

  it('renders the overlay variant with the league-scoring source distinction', () => {
    const html = renderToStaticMarkup(
      createElement(TipCountdown, { serverNowIso: '2026-10-19T12:00:00Z', variant: 'overlay' }),
    );
    expect(html).toContain('Week 1 tip-off');
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
