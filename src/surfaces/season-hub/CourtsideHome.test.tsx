import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StandingsTable } from './StandingsTable';
import { CourtsideHome } from './CourtsideHome';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import type { PersonalizedHomeData } from '@/domain/personalized-home';
import { personalizedFixture } from '@/test/personalized-home-fixture';

const renderHome = (fixture: ReturnType<typeof personalizedFixture>, personal?: PersonalizedHomeData, viewerTeamId?: string) =>
  renderToStaticMarkup(createElement(CourtsideHome, {
    data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly,
    viewerTeamId, personal, faces: buildHomeFaces(fixture.home, fixture.market),
  }));
const member = (fixture: ReturnType<typeof personalizedFixture>, id = '1') =>
  buildPersonalizedHome({ kind: 'member', teamId: id }, fixture.home, fixture.weekly, fixture.market);

describe('integrated personalized edition', () => {
  it('leaves signed-out home intact: no hero, no notice, no personal marks', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-courtside-home');
    expect(html).not.toContain('data-hero');
    expect(html).not.toContain('data-home-notice');
    expect(html).not.toContain('data-your-lead');
    expect(html).not.toContain('Your team');
  });

  it('gives verified unclaimed accounts a slim claim notice, not a slab', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'unclaimed' });
    expect(html).toContain('data-home-notice="unclaimed"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('Claim my team');
    expect(html).not.toContain('data-hero');
  });

  it('keeps unavailable membership separate from missing public data', () => {
    const fixture = personalizedFixture();
    expect(renderHome(fixture, { kind: 'unavailable' })).toContain('Your team is temporarily unavailable');
    expect(renderHome(fixture, { kind: 'member', summary: null })).toContain('Check my team');
  });

  it.each(['1', '4'])('weaves team %s into the edition: hero matchup, one roster-value headline, valued lead', id => {
    const fixture = personalizedFixture(), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const html = renderHome(fixture, member(fixture, id), id);
      const title = id === '1' ? 'Fixture Club 1 vs Fixture Club 2' : 'Fixture Club 3 vs Fixture Club 4';
      expect(html).toContain('data-hero');
      expect(html).toContain('Your featured matchup');
      expect(html).toContain(title);
      expect(html).toContain('href="/team"');
      expect(html).toContain(`href="/teams/${id}#team-roster"`);
      // Roster value is a headline exactly once on the whole page.
      expect(html.match(/\$110\.00 FAAB/g)).toHaveLength(1);
      // The saved pick renders in the hero with its label, never a fabricated split.
      expect(html).toContain('data-hero-ai');
      expect(html).toContain('not calibrated sports odds');
      expect(html).toContain(`Model choice: Fixture Club ${id === '1' ? '2' : '4'}`);
      expect(html).toContain('Saved Nov 10 · 7:00 AM');
      // Top-three lead with real modeled prices; no full-roster price list.
      expect(html).toContain('data-your-lead');
      expect(html).toContain('Your top three');
      expect(html).toContain(`Synthetic ${id} Player 2`);
      expect(html).toContain('$40.0');
      expect(html).not.toContain('Your Roster Value');
      // The full priced roster lives in the hero's valuation disclosure only.
      expect(html).toContain('data-hero-valuation');
      expect(html).toContain('Full roster valuation');
      expect(html).toContain('$40.00');
      expect(html).toContain('All 4 roster players priced.');
      expect(html).not.toContain('Around Your Team');
      expect(html).not.toContain('NaN');
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it('marks exactly one own team in standings and the week rail, never the previous viewer', () => {
    const fixture = personalizedFixture();
    for (const viewerTeamId of ['1', '4']) {
      const standings = renderToStaticMarkup(createElement(StandingsTable, { standings: fixture.home.hub!.standings, viewerTeamId }));
      expect(standings.match(/data-own-team="true"/g)).toHaveLength(1);
      expect(standings).toContain(`aria-label="View Fixture Club ${viewerTeamId}, your team"`);
      const html = renderToStaticMarkup(createElement(CourtsideHome, { data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly, viewerTeamId }));
      expect(html.match(/data-own-team="true"/g)).toHaveLength(2);
      const signedOut = renderToStaticMarkup(createElement(CourtsideHome, { data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly }));
      expect(signedOut).not.toContain('Your team');
      expect(signedOut).not.toContain('data-own-team');
    }
  });

  it('folds the viewer\u2019s moves into the league wire, marked, with no separate section', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-own-move="true"');
    expect(html).toContain('Fixture Club 1');
    expect(html).toContain('made a roster move');
    expect(html).not.toContain('Around Your Team');
  });

  it('labels stale saved AI as a chip and renders no AI element when no pick joins', () => {
    const fixture = personalizedFixture(); fixture.weekly.status = 'stale';
    const stale = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market), '1');
    expect(stale).toContain('Stale · saved Week 3');
    fixture.weekly.matchups = [];
    const missing = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null), '1');
    expect(missing).toContain('data-hero');
    expect(missing).not.toContain('data-hero-ai');
    expect(missing).not.toContain('50%');
  });

  it('keeps the partial-coverage subtotal as one small line under the hero value only', () => {
    const fixture = personalizedFixture();
    fixture.market.stocks = fixture.market.stocks.filter(quote => quote.playerId !== '1-player-3');
    const html = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market), '1');
    expect(html).toContain('Known-value subtotal · 3 of 4 priced');
    expect(html.match(/Known-value subtotal/g)).toHaveLength(1);
    expect(html).toContain('$100.00 FAAB');
    expect(html).toContain('data-hero-valuation');
    expect(html).toContain('Unpriced');
    expect(html).toContain('unknown is never $0');
  });

  it('preserves a user-created team name verbatim in the hero title', () => {
    const fixture = personalizedFixture(); fixture.teams[0].name = 'Fixture 🏀 Club ↗';
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('Fixture 🏀 Club ↗');
  });

  it('shows the countdown in the preseason hero and never promotes a scoreless standing', () => {
    const fixture = personalizedFixture();
    fixture.home.hub!.season.status = 'pre_season';
    fixture.home.checkedAt = '2026-10-19T12:00:00Z';
    fixture.home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; });
    const html = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null), '1');
    expect(html).toContain('Until the first Week 1 tip');
    expect(html).toContain('role="timer"');
    expect(html).not.toContain('No. 1 of 10');
    expect(html).not.toContain('hero-score');
  });

  it('renders the faces strip with every team\u2019s top player by value', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-faces-strip');
    expect(html).toContain('Faces of the league');
    expect(html).toContain('Synthetic 7 Player 2');
    expect(html).toContain('href="/player/7-player-1"');
  });

  it('crowns the previous-season champion from directory data, nowhere else', () => {
    const fixture = personalizedFixture();
    fixture.home.directory[4].previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null };
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-champion-showcase');
    expect(html).toContain('Reigning champion · 2025');
    expect(html).toContain(' · 2025 champion');
    expect(html.match(/Defending champion/g)).toHaveLength(5); // week rail, faces strip, showcase, directory row, standings row
    const noChamp = renderHome(personalizedFixture(), { kind: 'signed_out' });
    expect(noChamp).not.toContain('data-champion-showcase');
    expect(noChamp).not.toContain('Defending champion');
  });
});
