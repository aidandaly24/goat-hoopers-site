import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { playerContextFixture } from './fixture';

globalThis.fetch = async () => { throw Error('Offline component verification forbids network requests'); };
const render = (state: string, teamId = '1') => {
  const { home, weekly, viewer, personal, portraits, faces } = playerContextFixture(state, teamId);
  return renderToStaticMarkup(createElement(CourtsideHome, { data: home, archive: [], portraits,
    aiWeekly: weekly, personal, faces, viewerTeamId: viewer.kind === 'member' ? viewer.teamId : undefined }));
};
let cases = 0;
for (let team = 1; team <= 10; team++) {
  const html = render('small-cohort', String(team));
  assert.equal((html.match(/data-recap-player=/g) ?? []).length, 4);
  for (let player = 0; player < 4; player++) assert.equal((html.match(new RegExp(`data-recap-player="${team}-player-${player}"`, 'g')) ?? []).length, 1);
  assert.match(html, /0\.0 pts · 2 GP/);
  assert.match(html, /data-guide-cohort="true"/);
  assert.doesNotMatch(html, /may overlap|The rough week/);
  cases++;
}
const dnp = render('member');
assert.equal((dnp.match(/data-recap-player=/g) ?? []).length, 3);
assert.doesNotMatch(dnp, /data-recap-player="1-player-0"/);
const six = render('six-participants');
assert.equal((six.match(/data-recap-player=/g) ?? []).length, 6);
assert.match(six, /Highest totals · Week 2/); assert.match(six, /Lowest totals · Week 2/);
assert.doesNotMatch(six, /data-guide-cohort|underperform/);
const value = render('value-only');
const tied = render('tied-participants');
assert.equal((tied.match(/data-recap-player=/g) ?? []).length, 3);
assert.equal(new Set([...tied.matchAll(/data-recap-player="([^"]+)"/g)].map(match => match[1])).size, 3);
assert.match(tied, /3 distinct players shown from 6 with verified games/);
assert.match(tied, /Highest \/ lowest totals · ties/);
assert.match(render('small-tie'), /3 distinct players shown from 4 with verified games/);
for (const index of [0, 1, 2]) assert.match(value, new RegExp(`data-watch-player="1-player-${index}"`));
assert.match(value, /Highest modeled value/); assert.match(value, /asset price, not observed form/);
assert.doesNotMatch(value, /FPPG \(EMA\)/);
const preseason = render('quiet-preseason');
assert.match(preseason, /Rising modeled value/); assert.match(preseason, /data-guide-recap-status="true"/);
assert.doesNotMatch(preseason, /data-guide-recap="true"|data-team-news/);
assert.match(render('news-unavailable'), /Team news is temporarily unavailable/);
const missing = render('missing-edition');
assert.match(missing, /data-scouting-notebook/); assert.match(missing, /data-guide-cohort/);
assert.match(render('signed-out'), /data-scouting-notebook/);
cases += 9;
console.log(JSON.stringify({ evidence: 'production-component static markup with synthetic inputs and fixture Link adapter', cases, network: 'forbidden', result: 'passed' }));
