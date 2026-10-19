import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TipCountdown, WEEK_ONE_TIP_OFF_ISO, countdownParts } from './TipCountdown';

describe('countdownParts', () => {
  it('splits remaining time into days, hours, minutes and seconds', () => {
    const target = Date.parse('2026-10-20T19:00:00.000Z');
    const now = target - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(countdownParts(target, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });
  it('reads as arrived at and after the target, and on invalid input', () => {
    const target = Date.parse(WEEK_ONE_TIP_OFF_ISO);
    expect(countdownParts(target, target)).toBeNull();
    expect(countdownParts(target, target + 1000)).toBeNull();
    expect(countdownParts(Number.NaN, target)).toBeNull();
  });
});

describe('TipCountdown server render', () => {
  it('renders the remaining time as of the server league check, with no hydration gap', () => {
    const html = renderToStaticMarkup(createElement(TipCountdown, { serverNowIso: '2026-10-19T12:00:00Z' }));
    expect(html).toContain('role="timer"');
    expect(html).toContain('Until the first Week 1 tip · Tue, Oct 20 · 3:00 PM ET');
    expect(html).toContain('>1<'); // 1 day
    expect(html).toContain('>07<'); // 7 hours
  });
  it('renders nothing once the tip has passed', () => {
    const html = renderToStaticMarkup(createElement(TipCountdown, { serverNowIso: '2026-10-21T12:00:00Z' }));
    expect(html).toBe('');
  });
});
