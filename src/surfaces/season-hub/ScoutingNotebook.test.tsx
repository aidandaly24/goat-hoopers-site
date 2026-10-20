import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { ScoutingNotebook } from './ScoutingNotebook';

function render(fixture: ReturnType<typeof personalizedFixture>, sources: ReturnType<typeof playerGuideFixture> | null = null) {
  const personal = buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, fixture.news, sources);
  if (personal.kind !== 'member' || !personal.summary) throw Error('Missing synthetic summary');
  return renderToStaticMarkup(createElement(ScoutingNotebook, { summary: personal.summary,
    faces: buildHomeFaces(fixture.home, fixture.market), pairTeamIds: ['1', '2'],
    edition: null, portraits: {}, directory: fixture.home.directory }));
}

describe('reason-labeled notebook rows', () => {
  it('uses several supplied value anchors when form is unavailable, with an explicit asset basis', () => {
    const html = render(personalizedFixture());
    for (const index of [0, 1, 2]) expect(html).toContain(`data-watch-player="1-player-${index}"`);
    expect(html.match(/Highest modeled value/g)).toHaveLength(4);
    expect(html).toContain('FAAB · current player quote');
    expect(html).toContain('asset price, not observed form');
    expect(html).not.toContain('FPPG (EMA)');
  });

  it('preserves distinct preseason price movers rather than labeling them current form', () => {
    const fixture = personalizedFixture();
    fixture.home.hub!.season.status = 'pre_season';
    fixture.market.stocks.filter(row => row.playerId.startsWith('1-')).forEach((row, index) => { row.changePct = index + 1; });
    const html = render(fixture);
    expect(html.match(/Rising modeled value/g)).toHaveLength(3);
    expect(html).toContain('previous price snapshot');
    expect(html).not.toContain('2026 observed form');
  });

  it('keeps observed sample sizes and supplied status without printing unknown defaults', () => {
    const html = render(personalizedFixture(), playerGuideFixture('1'));
    expect(html).toContain('2026 observed form');
    expect(html).toContain('30.0 FPPG (EMA) across 5 observed games');
    expect(html).toContain('Status: Questionable');
    expect(html).not.toContain('No injury designation in the supplied source');
    expect(html).not.toContain('Availability status unknown');
    expect(html.match(/data-watch-player="1-player-0"/g)).toHaveLength(1);
  });

  it('omits a notebook with no supported player entries', () => {
    const html = renderToStaticMarkup(createElement(ScoutingNotebook, {
      summary: null, faces: [], pairTeamIds: null, edition: null, portraits: {}, directory: [],
    }));
    expect(html).toBe('');
  });
});
