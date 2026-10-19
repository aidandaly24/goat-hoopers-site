import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StandingsTable } from './StandingsTable';
import { CourtsideHome } from './CourtsideHome';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import type { PersonalizedHomeData } from '@/domain/personalized-home';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';

const renderHome = (fixture: ReturnType<typeof personalizedFixture>, personal?: PersonalizedHomeData, viewerTeamId?: string) =>
  renderToStaticMarkup(createElement(CourtsideHome, {
    data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly,
    viewerTeamId, personal, faces: buildHomeFaces(fixture.home, fixture.market),
  }));
const member = (fixture: ReturnType<typeof personalizedFixture>, id = '1') =>
  buildPersonalizedHome({ kind: 'member', teamId: id }, fixture.home, fixture.weekly, fixture.market);

describe('integrated personalized edition', () => {
  it('leaves signed-out home intact: league desk, no notice, no personal marks', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-courtside-home');
    expect(html).toContain('data-league-desk');
    expect(html).not.toContain('data-team-desk');
    expect(html).not.toContain('data-home-notice');
    expect(html).not.toContain('data-roster-value');
    expect(html).not.toContain('Your team');
  });

  it('gives verified unclaimed accounts a slim claim notice, not a slab', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'unclaimed' });
    expect(html).toContain('data-home-notice="unclaimed"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('Claim my team');
    expect(html).not.toContain('data-team-desk');
  });

  it('keeps unavailable membership separate from missing public data', () => {
    const fixture = personalizedFixture();
    expect(renderHome(fixture, { kind: 'unavailable' })).toContain('Your team is temporarily unavailable');
    expect(renderHome(fixture, { kind: 'member', summary: null })).toContain('Check my team');
  });

  it('renders the member composition: team desk, one display-size value, honest recorded chart, notebook, down-page AI', () => {
    const fixture = personalizedFixture();
    const personal = buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, null, playerGuideFixture('1'), {
      '1-player-0': [{ date: '2026-11-05T12:00:00.000Z', price: 10, source: 'live' as const }],
      '1-player-1': [{ date: '2026-11-05T12:00:00.000Z', price: 30, source: 'live' as const },
        { date: '2026-11-09T12:00:00.000Z', price: 35, source: 'live' as const }],
    });
    const html = renderHome(fixture, personal, '1');
    expect(html).toContain('data-team-desk');
    expect(html).toContain('Your Week 3');
    expect(html).toContain('data-desk-ai');
    expect(html).toContain('Model choice: Fixture Club 2');
    // The team value is a display-size headline exactly once page-wide.
    expect(html.match(/data-team-value/g)).toHaveLength(1);
    expect(html).toContain('$110');
    // Recorded chart: genuine points only, truthfully labelled as a
    // repricing of today's roster — never as historical performance.
    expect(html).toContain('data-value-trend');
    expect(html).toContain('Current roster repriced from recorded player quotes');
    expect(html).toContain('Recorded Nov 5, 2026 – Nov 9, 2026');
    expect(html).toContain('+$5.00');
    expect(html).toContain('not the team’s historical value or performance');
    expect(html).toContain('Roster value');
    expect(html).toContain('No. 1 of 10');
    // The notebook features the guide's top watch with its observed basis.
    expect(html).toContain('data-scouting-notebook');
    expect(html).toContain('Synthetic 1 Player 1');
    expect(html).toContain('30.0 FPPG');
    expect(html).toContain('5 observed games');
    // The league-wide odds render once, down-page in the AI section.
    expect(html.match(/data-probability-for/g)).toHaveLength(10);
    expect(html.indexOf('data-team-desk')).toBeLessThan(html.indexOf('data-ai-decides'));
    expect(html.indexOf('data-roster-value')).toBeLessThan(html.indexOf('data-ai-decides'));
  });

  it('shows the honest unavailable state when no recorded history can support a chart', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-roster-value');
    expect(html).not.toContain('data-value-trend');
    expect(html).toContain('data-trend-unavailable');
    expect(html).toContain('Recorded team-value history unavailable');
  });

  it.each(['1', '4'])('weaves team %s into the edition: desk identity, one value headline, valued faces', id => {
    const fixture = personalizedFixture(), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const html = renderHome(fixture, member(fixture, id), id);
      expect(html).toContain('data-team-desk');
      expect(html).toContain('Your featured matchup');
      // The headline is the edition's own for every member.
      expect(html).toContain('Synthetic home anchor fixture');
      expect(html).toContain(`Fixture Club ${id}`);
      expect(html).toContain('href="/team"');
      expect(html).toContain(`href="/teams/${id}#team-roster"`);
      // Roster value is a display headline exactly once on the whole page.
      expect(html.match(/data-team-value/g)).toHaveLength(1);
      expect(html).toContain('$110');
      // The desk carries the member's own saved probability with provenance.
      expect(html).toContain('data-desk-ai');
      expect(html).toContain('not calibrated sports odds');
      expect(html).toContain(`Model choice: Fixture Club ${id === '1' ? '2' : '4'}`);
      expect(html).toContain('Saved Nov 10 · 7:00 AM');
      // Featured faces at editorial size with real modeled prices.
      expect(html).toContain('data-roster-value');
      expect(html).toContain('Built around your players.');
      expect(html).toContain(`Synthetic ${id} Player 2`);
      expect(html).toContain('$40.00');
      expect(html).not.toContain('Your Roster Value');
      // The full priced roster lives in the valuation disclosure only.
      expect(html.match(/data-hero-valuation/g)).toHaveLength(1);
      expect(html).toContain('All 4 roster players priced.');
      expect(html).not.toContain('Around Your Team');
      expect(html).not.toContain('NaN');
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it('marks exactly one own team in standings and the AI rows, never the previous viewer', () => {
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

  it('folds the viewer\u2019s moves into the league wire and their team wire, with no separate section', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-own-move="true"');
    expect(html).toContain('Fixture Club 1');
    expect(html).toContain('made a roster move');
    expect(html).toContain('data-form-wire');
    expect(html).not.toContain('Around Your Team');
  });

  it('labels stale saved AI in the desk and renders no probability when no pick joins', () => {
    const fixture = personalizedFixture(); fixture.weekly.status = 'stale';
    const stale = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market), '1');
    expect(stale).toContain('Stale · saved Week 3');
    fixture.weekly.matchups = [];
    const missing = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null), '1');
    expect(missing).toContain('data-team-desk');
    expect(missing).toContain('No saved AI result for your matchup yet');
    expect(missing).not.toContain('50%');
  });

  it('keeps the partial-coverage subtotal as one small line in the value section only', () => {
    const fixture = personalizedFixture();
    fixture.market.stocks = fixture.market.stocks.filter(quote => quote.playerId !== '1-player-3');
    const html = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market), '1');
    expect(html).toContain('Known-value subtotal · 3 of 4 priced');
    expect(html.match(/Known-value subtotal/g)).toHaveLength(1);
    expect(html).toContain('$100');
    expect(html).toContain('data-hero-valuation');
    expect(html).toContain('Unpriced');
    expect(html).toContain('unknown is never $0');
  });

  it('preserves a user-created team name verbatim in the desk', () => {
    const fixture = personalizedFixture(); fixture.teams[0].name = 'Fixture 🏀 Club ↗';
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('Fixture 🏀 Club ↗');
  });

  it('shows the countdown on the court in preseason — members get the same single overlay', () => {
    const fixture = personalizedFixture();
    fixture.home.hub!.season.status = 'pre_season';
    fixture.home.checkedAt = '2026-10-19T12:00:00Z';
    fixture.home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; });
    const html = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null), '1');
    // Member parity: the opening clock rides the court figure as the same
    // overlay anonymous visitors get — exactly one instance.
    expect(html.match(/data-court-clock="countdown"/g)).toHaveLength(1);
    expect(html).toContain('First NBA game · Tue, Oct 20 · 3:00 PM ET');
    expect(html).toContain('Sleeper confirms the Oct 20 date; its scoring-start time is unpublished');
    expect(html).toContain('role="timer"');
    expect(html).not.toContain('No. 1 of 10');
    expect(html).not.toContain('data-team-value');
  });

  it('shows the court opening clock to signed-out and unclaimed visitors before the tip', () => {
    for (const kind of ['signed_out', 'unclaimed'] as const) {
      const fixture = personalizedFixture();
      fixture.home.checkedAt = '2026-10-19T12:00:00Z';
      const html = renderHome(fixture, { kind });
      // The clock rides the court overlay for everyone — no desk required,
      // and the provider phase does not gate it.
      expect(html).toContain('data-court-clock="countdown"');
      expect(html).toContain('Week 1 tip-off');
      expect(html).toContain('Sleeper confirms the Oct 20 date; its scoring-start time is unpublished');
      expect(html).not.toContain('data-team-desk');
    }
  });

  it('retains team news and the verified best/rough recap for members', () => {
    const fixture = personalizedFixture();
    const personal = buildPersonalizedHome(
      { kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market,
      fixture.news, playerGuideFixture('1'),
    );
    const html = renderHome(fixture, personal, '1');
    expect(html).toContain('data-team-news');
    expect(html).toContain('News &amp; recent moves.');
    expect(html).toContain('Synthetic roster 1 player update');
    expect(html).toContain('Synthetic Wire');
    expect(html).toContain('data-guide-recap="true"');
    expect(html).toContain('Your best');
    expect(html).toContain('The rough week');
    expect(html).toContain('GP');
    expect(html).toContain('verified games');
    // The recap carries the guide's own period and recap message, not just
    // the coverage line.
    expect(html).toContain('2026 · Week 2 · 2026-11-02 to 2026-11-09 (end exclusive)');
    expect(html).toContain('Actual recorded fantasy points for current roster players with verified participation');
    // The notebook's featured watch carries the observed games its basis cites.
    expect(html).toContain('30.0 FPPG');
    expect(html).toContain('5 observed games');
    // Absence defaults from the guide never print as content.
    expect(html).not.toContain('No injury designation in the supplied source');
    expect(html).not.toContain('Availability status unknown');
  });

  it('discloses the guide recap status when no completed week is verified', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-form-wire');
    expect(html).not.toContain('data-guide-recap="true"');
    expect(html).toContain('data-guide-recap-status');
    expect(html).toContain('No best or rough-week ranking is inferred');
  });

  it('keeps the court clock and member modules when the edition is missing', () => {
    const fixture = personalizedFixture();
    fixture.home.edition = null;
    fixture.home.checkedAt = '2026-10-19T12:00:00Z';
    const personal = buildPersonalizedHome(
      { kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market,
      fixture.news, playerGuideFixture('1'),
    );
    const html = renderHome(fixture, personal, '1');
    expect(html).toContain('The next weekly story is on its way.');
    expect(html).toContain('data-court-clock="countdown"');
    expect(html).toContain('data-roster-value');
    expect(html.match(/data-team-value/g)).toHaveLength(1);
    expect(html).toContain('data-team-news');
    expect(html).toContain('data-faces-strip');
    expect(html).toContain('data-hero-valuation');
    expect(html).toContain('href="/team"');
    expect(html).toContain('href="/teams/1#team-roster"');
  });

  it('renders the faces strip with every team\u2019s top player by value', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-faces-strip');
    expect(html).toContain('Faces of the league');
    expect(html).toContain('Synthetic 7 Player 2');
    expect(html).toContain('href="/player/7-player-1"');
  });

  it('renders standings, leaders and moves as a visible league section — never inside a collapsed details', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-league-section');
    expect(html).toContain('Standings, leaders &amp; moves.');
    expect(html).not.toContain('id="your-standings"');
    expect(html).not.toContain('Live standings, stats & recent moves');
  });

  it('keeps the champion\u2019s crown badge and directory label, with NO homepage champion showcase section', () => {
    const fixture = personalizedFixture();
    fixture.home.directory[4].previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null };
    const html = renderHome(fixture, { kind: 'signed_out' });
    // Aidan's exclusion: the dedicated champion showcase block is not built.
    expect(html).not.toContain('data-champion-showcase');
    expect(html).not.toContain('Open the champions');
    // The avatar crown badge and the directory's champion label stay: the
    // bar-set record panel, one AI row, the faces strip, the directory row
    // and the standings row each carry the non-interactive badge.
    expect(html).toContain(' · 2025 champion');
    expect(html).toContain('The reigning champion');
    expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(5);
    expect(html).not.toContain('data-champion-crown="interactive"');
    expect(html).not.toContain('<button type="button" aria-label="Defending champion');
    const noChamp = renderHome(personalizedFixture(), { kind: 'signed_out' });
    expect(noChamp).not.toContain('data-champion-crown');
  });
});
