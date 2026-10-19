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

  it('renders the personal panel: display-size value, recorded trend, rank, own pairing, top mover', () => {
    const fixture = personalizedFixture();
    const personal = buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, null, playerGuideFixture('1'), {
      '1-player-0': [{ date: '2026-11-05T12:00:00.000Z', price: 10, source: 'live' as const }],
      '1-player-1': [{ date: '2026-11-05T12:00:00.000Z', price: 30, source: 'live' as const },
        { date: '2026-11-09T12:00:00.000Z', price: 35, source: 'live' as const }],
    });
    const html = renderHome(fixture, personal, '1');
    expect(html).toContain('data-personal-panel');
    expect(html).toContain('Your roster value');
    // The value headline still appears exactly once page-wide.
    expect(html.match(/\$110\.00 FAAB/g)).toHaveLength(1);
    // Recorded trend: real points only, honest range label and delta.
    expect(html).toContain('data-value-trend');
    expect(html).toContain('+$70.00');
    expect(html).toContain('since Nov 5');
    expect(html).toContain('Value rank');
    expect(html).toContain('No. 1 of 10');
    expect(html).toContain('Next matchup · Week 3');
    // The member's own pairing's model bar lives in the panel.
    expect(html).toContain('data-hero-ai');
    // Top mover from the same guide evidence as the players lead.
    expect(html).toContain('data-panel-mover');
    expect(html).toContain('Top mover · your roster');
    expect(html).toContain('Synthetic 1 Player 1');
    expect(html).toContain('30.0 FPPG · 5 GP');
    // The league-wide odds render once, in the week desk below the layout.
    expect(html).toContain('week-desk-row');
    expect(html.match(/data-probability-for/g)).toHaveLength(10);
    expect(html.indexOf('data-personal-panel')).toBeLessThan(html.indexOf('week-desk-row'));
  });

  it('shows the panel without a trend line when no recorded history exists', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-personal-panel');
    expect(html).not.toContain('data-value-trend');
  });

  it.each(['1', '4'])('weaves team %s into the edition: hero matchup, one roster-value headline, valued lead', id => {
    const fixture = personalizedFixture(), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const html = renderHome(fixture, member(fixture, id), id);
      const title = id === '1' ? 'Fixture Club 1 vs Fixture Club 2' : 'Fixture Club 3 vs Fixture Club 4';
      expect(html).toContain('data-hero');
      expect(html).toContain('Your featured matchup');
      expect(html).toContain(title);
      // Both face-off sides carry their layout classes (the away side's
      // modifier must resolve through cs() as its own class, not a space).
      expect(html).toContain('hero-side-away');
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

  it('shows the countdown on the court in preseason — members get the same single overlay', () => {
    const fixture = personalizedFixture();
    fixture.home.hub!.season.status = 'pre_season';
    fixture.home.checkedAt = '2026-10-19T12:00:00Z';
    fixture.home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; });
    const html = renderHome(fixture, buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null), '1');
    // Member parity: the opening clock rides the court figure as the same
    // overlay anonymous visitors get — exactly one instance, no lesser
    // inline hero variant for members.
    expect(html.match(/data-court-clock="countdown"/g)).toHaveLength(1);
    expect(html).toContain('First NBA game · Tue, Oct 20 · 3:00 PM ET');
    expect(html).toContain('Sleeper confirms the Oct 20 date; its scoring-start time is unpublished');
    expect(html).toContain('role="timer"');
    expect(html).not.toContain('No. 1 of 10');
    expect(html).not.toContain('hero-score');
  });

  it('shows the court opening clock to signed-out and unclaimed visitors before the tip', () => {
    for (const kind of ['signed_out', 'unclaimed'] as const) {
      const fixture = personalizedFixture();
      fixture.home.checkedAt = '2026-10-19T12:00:00Z';
      const html = renderHome(fixture, { kind });
      // The clock rides the court overlay for everyone — no hero required,
      // and the provider phase does not gate it.
      expect(html).toContain('data-court-clock="countdown"');
      expect(html).toContain('Week 1 tip-off');
      expect(html).toContain('Sleeper confirms the Oct 20 date; its scoring-start time is unpublished');
      expect(html).not.toContain('data-hero');
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
    expect(html).toContain('Your team in the news');
    expect(html).toContain('Synthetic roster 1 player update');
    expect(html).toContain('Synthetic Wire');
    expect(html).toContain('data-guide-recap');
    expect(html).toContain('Your best');
    expect(html).toContain('The rough week');
    expect(html).toContain('GP');
    expect(html).toContain('verified games');
    // The recap carries the guide's own period and recap message, not just
    // the coverage line.
    expect(html).toContain('2026 · Week 2 · 2026-11-02 to 2026-11-09 (end exclusive)');
    expect(html).toContain('Actual recorded fantasy points for current roster players with verified participation');
    // Watch rows carry the observed games their basis cites ("EMA across
    // the shown number of games")...
    expect(html).toContain('30.0 FPPG · 5 GP');
    expect(html).toContain('24.0 FPPG · 7 GP');
    // ...and a note prints only for an actual injury designation: the
    // no-designation and unknown defaults never render as content.
    expect(html).toContain('Status: Questionable');
    expect(html).not.toContain('No injury designation in the supplied source');
    expect(html).not.toContain('Availability status unknown');
  });

  it('discloses the guide recap status when no completed week is verified', () => {
    const fixture = personalizedFixture();
    const html = renderHome(fixture, member(fixture, '1'), '1');
    expect(html).toContain('data-your-lead');
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
    expect(html).toContain('data-your-lead');
    expect(html).toContain('data-team-news');
    expect(html).toContain('data-faces-strip');
    // The member's team context survives without the edition too: the full
    // roster valuation disclosure and the team actions the hero carries.
    expect(html).toContain('data-member-team');
    expect(html).toContain('data-hero-valuation');
    expect(html).toContain('Full roster valuation');
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

  it('crowns the previous-season champion from directory data, nowhere else', () => {
    const fixture = personalizedFixture();
    fixture.home.directory[4].previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null };
    const html = renderHome(fixture, { kind: 'signed_out' });
    expect(html).toContain('data-champion-showcase');
    expect(html).toContain('Reigning champion · 2025');
    expect(html).toContain(' · 2025 champion');
    // Five avatar crowns (week rail, faces strip, showcase, directory row,
    // standings row) — all non-interactive badges: avatars sit inside
    // matchup buttons and links, where a crown button would be invalid
    // nested interactive content. The spinnable variant never renders here.
    expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(5);
    expect(html).not.toContain('data-champion-crown="interactive"');
    expect(html).not.toContain('<button type="button" aria-label="Defending champion');
    const noChamp = renderHome(personalizedFixture(), { kind: 'signed_out' });
    expect(noChamp).not.toContain('data-champion-showcase');
    expect(noChamp).not.toContain('data-champion-crown');
  });
});
