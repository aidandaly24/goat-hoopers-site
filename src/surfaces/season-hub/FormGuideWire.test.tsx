import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildPersonalizedHome } from '@/data/personalized-home';
import type { HomeTeamSummary } from '@/domain/personalized-home';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { FormGuideWire } from './FormGuideWire';

function setup() {
  const fixture = personalizedFixture(), sources = playerGuideFixture('1');
  const summary = () => {
    const result = buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, fixture.news, sources);
    if (result.kind !== 'member' || !result.summary) throw Error('Missing synthetic summary');
    return result.summary;
  };
  return { fixture, sources, summary };
}
const render = (summary: HomeTeamSummary) =>
  renderToStaticMarkup(createElement(FormGuideWire, { summary, portraits: {} }));

describe('verified weekly player context', () => {
  it('shows a small cohort once, retaining GP and a legitimate played zero', () => {
    const { sources, summary } = setup();
    sources.completedWeek!.players[0].gamesPlayed = 2;
    const html = render(summary());
    expect(html).toContain('data-guide-cohort="true"');
    expect(html.match(/data-recap-player=/g)).toHaveLength(4);
    for (let index = 0; index < 4; index++) expect(html.match(new RegExp(`data-recap-player="1-player-${index}"`, 'g'))).toHaveLength(1);
    expect(html).toContain('0.0 pts · 2 GP');
    expect(html).toContain('12.0 pts · 1 GP');
    expect(html).toContain('Synthetic injury-shortened week');
    expect(html).toContain('2026-11-02 to 2026-11-09 (end exclusive)');
    expect(html).not.toContain('may overlap');
    expect(html).not.toContain('Lowest totals');
  });

  it('does not add DNP or unknown participation to the displayed cohort', () => {
    const { sources, summary } = setup();
    sources.completedWeek!.players[2].gamesPlayed = null;
    const html = render(summary());
    expect(html.match(/data-recap-player=/g)).toHaveLength(2);
    expect(html).not.toContain('data-recap-player="1-player-0"');
    expect(html).not.toContain('data-recap-player="1-player-2"');
    expect(html).toContain('2 current roster players have verified games; each appears once');
    expect(html).toContain('Synthetic roster 1 player update');
    expect(html).toContain('Full transaction wire');
  });

  it('shows distinct highest and lowest totals for six supported participants', () => {
    const { fixture, sources, summary } = setup();
    sources.completedWeek!.players[0].gamesPlayed = 2;
    for (const index of [4, 5]) {
      const id = `1-player-${index}`;
      fixture.home.directory[0].players.push({ id, fullName: `Synthetic added player ${index}`, position: 'C', nbaTeam: 'SYN', espnId: null });
      sources.completedWeek!.players.push({ playerId: id, fantasyPoints: index * 12, gamesPlayed: 2, injuryNote: null });
    }
    const html = render(summary());
    expect(html).toContain('Highest totals · Week 2');
    expect(html).toContain('Lowest totals · Week 2');
    expect(html).not.toContain('data-guide-cohort');
    expect(html.match(/data-recap-player=/g)).toHaveLength(6);
    expect(html).toContain('Compare totals alongside games played');
    expect(html).not.toContain('underperform');
  });

  it('keeps preseason status compact without inventing results or an empty wire', () => {
    const { fixture, sources, summary } = setup();
    fixture.home.hub!.season.status = 'pre_season';
    sources.formSeason = null; sources.completedWeek = null;
    const data = summary(); data.news = []; data.moves = []; data.newsAvailable = true;
    const html = render(data);
    expect(html).toContain('data-guide-recap-status="true"');
    expect(html).toContain('No completed previous fantasy week');
    expect(html).not.toContain('<h2');
    expect(html).not.toContain('data-guide-recap="true"');
    expect(html).not.toContain('data-team-news');
  });

  it('shows shared high/low selections once and discloses ties in a larger cohort', () => {
    const { fixture, sources, summary } = setup();
    sources.completedWeek!.players[0].gamesPlayed = 2;
    for (const index of [4, 5]) {
      const id = `1-player-${index}`;
      fixture.home.directory[0].players.push({ id, fullName: `Synthetic tied player ${index}`, position: 'C', nbaTeam: 'SYN', espnId: null });
      sources.completedWeek!.players.push({ playerId: id, fantasyPoints: 0, gamesPlayed: 1, injuryNote: null });
    }
    sources.completedWeek!.players.forEach(player => { player.fantasyPoints = 0; });
    const html = render(summary());
    const shown = [...html.matchAll(/data-recap-player="([^"]+)"/g)].map(match => match[1]);
    expect(shown).toHaveLength(3);
    expect(new Set(shown).size).toBe(shown.length);
    expect(html).toContain('3 distinct players shown from 6 with verified games');
    expect(html).toContain('Highest / lowest totals · ties');
  });
  it('discloses incomplete tied selections in a small cohort', () => {
    const { sources, summary } = setup();
    sources.completedWeek!.players.forEach(player => { player.fantasyPoints = 0; player.gamesPlayed = 1; });
    const html = render(summary());
    expect(html.match(/data-recap-player=/g)).toHaveLength(3);
    expect(html).toContain('3 distinct players shown from 4 with verified games');
    expect(html).not.toContain('4 current roster players have verified games; each appears once');
  });
});
