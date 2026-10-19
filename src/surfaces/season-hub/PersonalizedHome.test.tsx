import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PersonalizedHome } from './PersonalizedHome';
import { StandingsTable } from './StandingsTable';
import { CourtsideHome } from './CourtsideHome';
import { buildPersonalizedHome } from '@/data/personalized-home';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
const markup = (data: Parameters<typeof PersonalizedHome>[0]['data']) => renderToStaticMarkup(createElement(PersonalizedHome, { data }));

describe('personal clubhouse presentation', () => {
  it('uses the approved portrait map in both valued-player and guide rows without requiring an ESPN ID', () => {
    const fixture = personalizedFixture();
    const data = buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, fixture.news, playerGuideFixture('1'));
    const html = renderToStaticMarkup(createElement(PersonalizedHome, { data, portraits: {
      '1-player-1': '/courtside/portraits/player-1362.png',
      // This lower-value player is absent from the top three but present in the guide.
      '1-player-3': '/courtside/portraits/player-2455.png',
    } }));
    expect(html).toContain('src="/courtside/portraits/player-1362.png"');
    expect(html).toContain('src="/courtside/portraits/player-2455.png"');
    expect(html).not.toContain('a.espncdn.com');
  });
  it('leaves signed-out home intact and gives verified unclaimed accounts a team-claim path', () => {
    expect(markup({ kind: 'signed_out' })).toBe('');
    const html = markup({ kind: 'unclaimed' });
    expect(html).toContain('href="/account"'); expect(html).toContain('Claim my team');
    expect(html).not.toContain('Fixture Club');
  });
  it.each(['1', '4'])('renders team %s with profile/roster links, truthfully labeled values, scores and actual model choice', id => {
    const fixture = personalizedFixture(), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const html = markup(buildPersonalizedHome({ kind: 'member', teamId: id }, fixture.home, fixture.weekly, fixture.market));
      expect(html).toContain(`data-team-id="${id}"`); expect(html).toContain('href="/team"');
      expect(html).toContain(`href="/teams/${id}#team-roster"`); expect(html).toContain('Highest modeled FAAB value');
      expect(html).toContain('not a current-performance ranking'); expect(html).toContain('not calibrated sports odds');
      expect(html).toContain('API confidence 20.0% is a separate signal'); expect(html).toContain('fixture-model');
      expect(html).not.toContain('NaN'); expect(fetch).not.toHaveBeenCalled();
      if (id === '1') { expect(html).toContain('>0.0</dd>'); expect(html).toContain('>Pending</dd>'); expect(html).toContain('Model choice: <strong>Fixture Club 2</strong>'); expect(html).toContain('65.0%'); expect(html).toContain('35.0%'); }
    } finally { fetch.mockRestore(); }
  });
  it('marks exactly one own team in standings and current matchup rows, never the previous viewer', () => {
    const fixture = personalizedFixture();
    for (const viewerTeamId of ['1', '4']) {
      const standings = renderToStaticMarkup(createElement(StandingsTable, { standings: fixture.home.hub!.standings, viewerTeamId }));
      expect(standings.match(/data-own-team="true"/g)).toHaveLength(1);
      expect(standings).toContain(`aria-label="View Fixture Club ${viewerTeamId}, your team"`);
      const html = renderToStaticMarkup(createElement(CourtsideHome, { data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly, viewerTeamId }));
      expect(html.match(/data-own-team="true"/g)).toHaveLength(2);
      const signedOut = renderToStaticMarkup(createElement(CourtsideHome, { data: fixture.home, archive: [], portraits: {}, aiWeekly: fixture.weekly }));
      expect(signedOut).not.toContain('Your team'); expect(signedOut).not.toContain('data-own-team');
    }
  });
  it('keeps unavailable membership separate from missing public data', () => {
    expect(markup({ kind: 'unavailable' })).toContain('Your team is temporarily unavailable');
    expect(markup({ kind: 'member', summary: null })).toContain('Check my team');
  });
  it('identifies stale saved AI and keeps missing AI honest', () => {
    const fixture = personalizedFixture(); fixture.weekly.status = 'stale';
    expect(markup(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market))).toContain('Out-of-date saved result');
    fixture.weekly.matchups = [];
    const html = markup(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null));
    expect(html).toContain('A matching saved pick is unavailable'); expect(html).not.toContain('50%'); expect(html).not.toContain('>0.0%</strong>');
  });
  it('avoids an unavailable standings anchor without an edition and preserves a user-created team name verbatim', () => {
    const fixture = personalizedFixture(); fixture.home.edition = null; fixture.teams[0].name = 'Fixture 🏀 Club ↗';
    const html = markup(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market));
    expect(html).not.toContain('href="#your-standings"'); expect(html).toContain('href="/teams"'); expect(html).toContain('Fixture 🏀 Club ↗');
  });
  it('does not promote preseason league order to a competitive rank or display non-started scores', () => {
    const fixture = personalizedFixture(); fixture.home.hub!.season.status = 'pre_season'; fixture.home.hub!.standings[0].wins = 0; fixture.home.hub!.standings[0].losses = 0;
    const html = markup(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market));
    expect(html).toContain('Standings begin when scoring starts'); expect(html).toContain('scoring has not started'); expect(html).not.toContain('Your score');
  });
});
