import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const app = document.querySelector('#app');
const directory = data.home.directory;
const teams = new Map(directory.map(row => [row.identity.id, row.identity]));
const personal = mode === 'member' ? data.personal.summary : null;
const pairs = [...new Map(directory.filter(row => row.currentMatchup).map(row => [row.currentMatchup.home.id, row.currentMatchup])).values()];
const editions = data.archive;
const currentWeek = pairs[0]?.week;
const stamp = value => new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
const shortDate = value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const teamName = id => teams.get(id)?.name ?? id;
const teamLink = id => `<a href="/teams/${esc(id)}">${esc(teamName(id))}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const percent = value => `${Math.round(value * 100)}%`;
const record = team => `${team.wins}–${team.losses}${team.ties ? '–' + team.ties : ''}`;
const pickFor = pair => data.weekly?.matchups.find(pick => pair.home.id && pick.teamIds.includes(pair.home.id) && pick.teamIds.includes(pair.away.id));
const usable = pick => data.weekly?.status === 'ready' && pick?.status === 'ready' && pick.result;
const probability = (pick, id) => pick.result.probabilities.find(item => item.choice === id)?.probability;

// The static fixture is the sole boundary. No calendar weeks, scores or model
// results are derived to fill a missing source field.
function validateSources() {
  if (teams.size !== directory.length || pairs.some(pair => !teams.has(pair.home.id) || !teams.has(pair.away.id))) throw new Error('Invalid source team references');
  for (const edition of editions) {
    if (!(Date.parse(edition.startsAt) < Date.parse(edition.endsAt)) || edition.game.teamIds.some(id => !teams.has(id))) throw new Error('Invalid dated edition source');
  }
  for (const pair of pairs) {
    const pick = pickFor(pair);
    if (!usable(pick)) continue;
    const ids = [pair.home.id, pair.away.id];
    const probabilities = ids.map(id => probability(pick, id));
    if (!ids.includes(pick.result.choice) || probabilities.some(value => !Number.isFinite(value) || value < 0 || value > 1) || Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) > .0001 || !(pick.result.confidence >= 0 && pick.result.confidence <= 1)) throw new Error('Invalid saved model return');
  }
}

function portrait(id, name = '') {
  const url = inventory.portraits[id];
  return url ? `<img class="portrait" src="${esc(url)}" alt="${esc(name)}" width="56" height="56" loading="lazy">` : '';
}

function dateLabel(id) {
  if (id === 'current') return `<span class="month">As of Nov</span><span class="date-number">12</span><span class="date-caption">Week ${currentWeek} · 2026</span>`;
  if (id === 'completed') return '<span class="month">Nov</span><span class="date-number">2–9</span><span class="date-caption">Completed Week 2</span><small>Nov 9 end exclusive</small>';
  const edition = editions.find(item => item.id === id);
  const start = new Date(edition.startsAt);
  const last = new Date(new Date(edition.endsAt).getTime() - 86400000);
  const month = date => date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `<span class="month">${month(start)}</span><span class="date-number">${start.getUTCDate()}–${start.getUTCMonth() !== last.getUTCMonth() ? `<span class="end-month">${month(last)}</span>` : ''}${last.getUTCDate()}</span><span class="date-caption">2026 · dated editorial</span>`;
}

const periods = [
  { id: 'current', title: `Week ${currentWeek} slate`, note: 'Five incomplete pairings' },
  ...(personal ? [{ id: 'completed', title: 'Best & rough week', note: 'Completed source evidence' }] : []),
  ...editions.map(edition => ({ id: edition.id, title: edition.title, note: 'Draft · unpublished sample' }))
];

function sourceNavigation() {
  return `<div class="navigator">
    <div class="navigator-heading"><p>Source-period calendar</p><div class="phone-switch" role="group" aria-label="Source navigation format"><button type="button" data-format="agenda" aria-pressed="true">Agenda</button><button type="button" data-format="calendar" aria-pressed="false">Calendar</button></div></div>
    <label class="phone-jump">Jump to a source period<select id="source-jump">${periods.map(period => `<option value="${esc(period.id)}">${esc(period.id === 'current' ? 'Week ' + currentWeek + ' · as of Nov 12, 2026' : period.id === 'completed' ? 'Nov 2–9, 2026 · Week 2 completed' : editions.find(edition => edition.id === period.id).dateLabel + ' · editorial')}</option>`).join('')}</select></label>
    <nav class="source-nav" data-format="agenda" aria-label="Jump to supplied source period">${periods.map(period => `<a href="#${period.id}" class="period-link">${dateLabel(period.id)}<strong>${esc(period.title)}</strong><small>${esc(period.note)}</small></a>`).join('')}</nav>
    <p class="navigation-note">Supplied periods only. Gaps are unsupplied; widths do not represent elapsed time.</p>
  </div>`;
}

function eventButton(id, label) {
  return `<button type="button" class="event-button" data-event="${esc(id)}" aria-expanded="false" aria-controls="agenda-${esc(id)}">${esc(label)}</button>`;
}

function aiSummary(pair) {
  const pick = pickFor(pair);
  if (!usable(pick)) return `<p class="ai-status">${aiState === 'stale' ? 'Stale saved AI' : 'Saved AI unavailable'} · no current probabilities asserted.</p>`;
  return `<div class="saved-pick"><p><span class="quiet">Saved AI returned</span> <strong>${esc(teamName(pick.result.choice))}</strong></p>
    <div class="probability" aria-hidden="true"><span style="width:${probability(pick, pair.home.id) * 100}%"></span></div>
    <div class="prob-labels"><span>Home ${percent(probability(pick, pair.home.id))}</span><span>Away ${percent(probability(pick, pair.away.id))}</span><span>Confidence ${percent(pick.result.confidence)}</span></div></div>`;
}

function matchupLane(pair, index) {
  const mine = personal && [pair.home.id, pair.away.id].includes(personal.team.id);
  return `<article class="match-lane${mine ? ' your-lane' : ''}" aria-labelledby="pair-${index}">
    <div class="lane-label" id="pair-${index}">${mine ? 'Your pairing' : 'Matchup'} <span>Incomplete</span></div>
    <div class="pair-score">${[pair.home, pair.away].map((team, side) => `<div><div>${teamLink(team.id)}<small>${esc(team.managerName)} · ${record(team)}</small></div><strong class="score">${score(side ? pair.awayPoints : pair.homePoints)}</strong></div>`).join('')}</div>
    ${aiSummary(pair)}
    ${eventButton('match-' + index, 'Matchup notes & saved evidence')}
    <div id="agenda-match-${index}" class="agenda-slot" hidden></div>
  </article>`;
}

function memberNotebook() {
  if (!personal) return `<aside class="notebook" aria-labelledby="league-note-title"><p class="eyebrow">Public edition</p><h3 id="league-note-title">Ten teams. One league.</h3><p>Follow all five pairings and the standings below. Team profiles keep roster detail close to each name.</p><div class="actions"><a href="#standings">League book</a><a href="/teams">Explore teams</a></div><p class="quiet">Member notes are available in the member comparison.</p></aside>`;
  const summary = personal;
  return `<aside class="notebook" aria-labelledby="notebook-title"><p class="eyebrow">Your team notebook</p><h3 id="notebook-title">${esc(summary.team.name)}</h3><p>${esc(summary.team.managerName)} · ${record(summary.team)} · standing ${summary.standing.rank}/${summary.season.totalTeams}</p><div class="actions"><a class="primary-link" href="/team">My team</a><a href="/teams/${esc(summary.team.id)}#team-roster">Full roster</a></div>
    <div class="value-heading"><span>Current modeled FAAB ${summary.valuation.complete ? 'value' : 'subtotal'}</span><strong>${money(summary.valuation.total)}</strong></div>
    <p class="quiet">${summary.valuation.priced} priced / ${summary.valuation.unpriced} unpriced · ${esc(summary.market.pricingBasis)} basis. Computed ${esc(stamp(summary.market.updatedAt))}. Modeled value, not a transaction or FAAB balance.</p>
    <ul class="value-list">${summary.players.map(player => `<li>${portrait(player.id)}<div>${playerLink(player.id, player.name)}<small>Up ${esc(player.changePct)}% modeled quote</small></div><strong>${money(player.value)}</strong></li>`).join('')}</ul>
    <details><summary>All ${summary.rosterValues.length} roster values</summary><ul class="full-values">${summary.rosterValues.map(player => `<li>${playerLink(player.id, player.name)}<span>${money(player.value)}</span></li>`).join('')}</ul></details>
    <h3>Scouting watch</h3><p class="quiet">${esc(summary.playerGuide.watch.label)}</p><ul class="watch-list">${summary.playerGuide.watch.rows.map(player => `<li><div>${playerLink(player.id, player.name)}<small>${esc(player.note)}</small></div><strong>${player.value}<small>EMA pts/GP · ${player.games} games</small></strong></li>`).join('')}</ul><p class="quiet">${esc(summary.playerGuide.watch.message)}</p><a href="/stocks#player-board">Inspect the player board</a>
    <div class="team-wire"><h3>Team wire</h3>${summary.news.map(news => `<p><a href="${esc(news.url)}">${esc(news.headline)}</a><small>${esc(news.outlet.name)} · ${esc(stamp(news.publishedAt))}</small></p>`).join('')}</div>
  </aside>`;
}

function standings() {
  return `<section class="league-book" id="standings" aria-labelledby="standings-title"><div class="section-line"><h3 id="standings-title">The league book</h3><a href="/teams">All team profiles</a></div><p class="quiet">Current synthetic standings · record and points for. Full roster detail stays on each team profile.</p><ol class="standings">${data.home.hub.standings.map(row => {
    const entry = directory.find(item => item.identity.id === row.team.id);
    const face = data.faces.find(item => item.team.id === row.team.id);
    const previous = entry.previousSeason;
    return `<li${personal?.team.id === row.team.id ? ' class="your-standing"' : ''}><span class="rank">${row.rank}</span>${face?.player ? portrait(face.player.id) : ''}<div class="standing-identity">${teamLink(row.team.id)}${personal?.team.id === row.team.id ? ' <span class="you">you</span>' : ''}<small>${esc(row.team.managerName)} · ${entry.players.length} players</small>${previous.ownerNote ? `<small>2025 record: ${previous.wins}–${previous.losses} · previous manager QBs Gremlins</small>` : ''}</div><div class="standing-stats"><strong>${row.wins} W / ${row.losses} L</strong><span>${(row.pointsFor / 100).toFixed(1)} PF</span></div></li>`;
  }).join('')}</ol></section>`;
}

function leagueMoves() {
  return `<section class="moves" aria-labelledby="moves-title"><div class="section-line"><h3 id="moves-title">Recorded moves</h3><a href="/transactions">Transaction ledger</a></div>${data.home.hub.transactions.map(move => `<div class="move"><time datetime="${new Date(move.createdAt).toISOString()}">${esc(stamp(move.createdAt))}</time><p>${esc(move.summary)}</p><small>Week ${move.week} · ${esc(move.type.replaceAll('_', ' '))} · add/drop legs not supplied.</small></div>`).join('')}</section>`;
}

function currentSource() {
  return `<section class="source-section current-source" id="current" aria-labelledby="current-title"><div class="date-rail">${dateLabel('current')}<p>Week start/end<br>not supplied.</p></div><div class="source-body"><div class="section-line"><h2 id="current-title">Week ${currentWeek} pairings</h2></div><p class="section-intro">Five pairings still in progress. 0.0 is a known score; Pending means the source has no score.</p><div class="current-columns"><div class="slate"><div class="slate-note">${data.weekly?.generatedAt ? 'Saved ' + esc(stamp(data.weekly.generatedAt)) : 'No saved slate supplied'} · synthetic model, not calibrated sports odds.</div>${pairs.map(matchupLane).join('')}</div>${memberNotebook()}</div>${leagueMoves()}${standings()}</div></section>`;
}

function completedSource() {
  if (!personal) return '';
  const guide = personal.playerGuide;
  const all = new Map();
  for (const [label, rows] of [['Best week', guide.best], ['Rough week', guide.rough]]) for (const player of rows) {
    if (!all.has(player.id)) all.set(player.id, { ...player, labels: [] });
    all.get(player.id).labels.push(label);
  }
  return `<section class="source-section completed-source" id="completed" aria-labelledby="completed-title"><div class="date-rail">${dateLabel('completed')}</div><div class="source-body"><p class="eyebrow">Your completed source week</p><h2 id="completed-title">What the last week left us</h2><p>${esc(guide.coverage)}</p><div class="completed-layout"><div><h3>Best & rough week</h3><ul class="completed-list">${[...all.values()].map(player => `<li><div>${playerLink(player.id, player.name)}<small>${esc(player.labels.join(' / '))}</small></div><strong>${player.value} pts<small>${player.games} GP</small></strong></li>`).join('')}</ul></div><div class="completed-note"><p>These are synthetic completed-week records for current roster players with verified participation in the fixture.</p><p>DNP, no-game and unknown records are excluded. Joel Embiid appears in both small cohorts; he is printed once here.</p><p class="quiet">${esc(guide.period)}</p><a href="/team">Open your team record</a></div></div></div></section>`;
}

function spotlight(story) {
  return `<article class="spotlight"><div class="spotlight-identity">${portrait(story.playerId)}<div><p class="eyebrow">${esc(story.periodLabel)}</p><h3>${playerLink(story.playerId, story.name)}</h3><small>${esc(story.position)} · ${teamLink(story.teamId)}</small></div></div><h4>${esc(story.headline)}</h4><p>${esc(story.opinion)}</p><p class="story-stats">${story.stats.map(stat => `<span><strong>${esc(stat.value)}</strong> ${esc(stat.label)}</span>`).join('')}</p><p class="quiet">${esc(story.statPeriod)}</p><details><summary>Editorial selection & source</summary><p>${esc(story.selectionReason)}</p><p><a href="${esc(story.source.url)}">${esc(story.source.label)}</a> · checked ${esc(story.source.checkedAt)}</p></details></article>`;
}

function editionSource(edition) {
  return `<section class="source-section editorial-source" id="${esc(edition.id)}" aria-labelledby="title-${esc(edition.id)}"><div class="date-rail">${dateLabel(edition.id)}<p>Draft<br>Unpublished sample</p></div><div class="source-body"><div class="section-line"><div><p class="eyebrow">All-day editorial lane · ${esc(edition.title)}</p><h2 id="title-${esc(edition.id)}">${esc(edition.game.title)}</h2></div>${eventButton(edition.id, 'Edition notes')}</div><div class="edition-lead"><p>${esc(edition.game.context)}</p><div><p>${edition.game.teamIds.map(teamLink).join(' / ')}</p><strong>${edition.game.state === 'final' ? 'Historical final · ' + edition.game.scores.map(score).join('–') : 'Upcoming in this dated edition · no score'}</strong><p class="quiet">${esc(edition.game.note)}</p></div></div><div id="agenda-${esc(edition.id)}" class="agenda-slot" hidden></div>${edition.playerSpotlights.length ? `<p class="editorial-qualification">Sample editorial opinions using the periods printed below; these are not current fantasy-week awards or forecasts.</p><div class="spotlights">${edition.playerSpotlights.map(spotlight).join('')}</div>` : ''}<div class="happenings"><h3>From this edition</h3>${edition.happenings.map(item => `<div><span class="quiet">${esc(item.dateLabel)}</span><p><a href="${esc(item.href)}">${esc(item.title)}</a><br>${esc(item.text)}</p></div>`).join('')}</div><div class="actions"><a href="/weekly/${esc(edition.id)}">Open this archived edition</a><a href="#current">Return to Week ${currentWeek}</a></div></div></section>`;
}

function render() {
  app.innerHTML = `<div class="mast"><div><h1>Week planner</h1><p>Week ${currentWeek}, team notes and the weeks behind it.</p></div><a href="?view=${mode === 'member' ? 'public' : 'member'}&ai=${esc(aiState)}">${mode === 'member' ? 'View public edition' : 'View member edition'}</a></div>${sourceNavigation()}${currentSource()}${completedSource()}<div class="source-gap"><span>Unsupplied interval</span><p>No intervening editorial source is provided. No missing editions or Week 3 boundaries are inferred.</p></div>${editions.map(editionSource).join('')}<section class="closing"><h2>Keep the week moving.</h2><p><a href="/trade-analyzer">Compare a trade</a>, inspect a <a href="/stocks#player-board">modeled player value</a> or take a break with <a href="/arcade/free-throw">Free Throw practice</a>.</p><div class="availability"><p><strong>Recorded team-value history</strong><br>${esc(inventory.missing.history)}</p><p><strong>Lineup Power</strong><br>${esc(inventory.missing.power)}</p></div></section>`;
  bind();
}

let openId = null;
let returnTrigger = null;

function eventContent(id) {
  if (id.startsWith('match-')) {
    const pair = pairs[Number(id.split('-')[1])];
    const pick = pickFor(pair);
    return `<h3 tabindex="-1" class="agenda-title">${esc(pair.home.name)} / ${esc(pair.away.name)}</h3><p>Week ${currentWeek} · incomplete source observation, checked ${esc(stamp(data.home.checkedAt))}. Start and end boundaries are not supplied.</p>${usable(pick) ? `<p><strong>Actual returned choice: ${esc(teamName(pick.result.choice))} (${percent(probability(pick, pick.result.choice))})</strong>. Independent confidence ${percent(pick.result.confidence)}.</p><p>${esc(pick.result.probabilityLabel)}. The returned choice is retained even when its assigned probability is lower.</p>` : `<p><strong>${aiState === 'stale' ? 'Saved AI is stale' : 'Saved AI is unavailable'}</strong>. No current probabilities are asserted.</p>`}<dl><dt>Model / prompt</dt><dd>${esc(pick?.result?.model ?? 'Unavailable')} / ${esc(pick?.result?.promptVersion ?? 'Unavailable')}</dd><dt>Saved</dt><dd>${data.weekly?.generatedAt ? esc(stamp(data.weekly.generatedAt)) : 'Unavailable'}</dd><dt>Input snapshot</dt><dd>${pick?.result?.snapshot ? esc(JSON.stringify(pick.result.snapshot)) : 'Not supplied'}</dd><dt>Evidence</dt><dd>${esc([...(pick?.evidence ?? []), ...(pick?.result?.evidence ?? [])].join(' ') || 'Unavailable')}</dd></dl><div class="actions"><a href="/teams/${pair.home.id}#team-roster">Home roster</a><a href="/teams/${pair.away.id}#team-roster">Away roster</a><a href="/ai-decides">AI Decides</a></div>`;
  }
  const edition = editions.find(item => item.id === id);
  return `<h3 tabindex="-1" class="agenda-title">${esc(edition.title)} · edition notes</h3><p>${esc(edition.game.selectionReason)}</p><p>Draft · ${edition.publishedAt ? 'published ' + esc(edition.publishedAt) : 'unpublished sample'}. The dated archive record is kept separate from the current Week ${currentWeek} slate.</p><p>Source range: ${esc(edition.startsAt)} to ${esc(edition.endsAt)} (end exclusive).</p><ul>${edition.sources.map(source => `<li><a href="${esc(source.url)}">${esc(source.label)}</a> · checked ${esc(source.checkedAt)}</li>`).join('')}</ul>`;
}

function closeAgenda(restore = true) {
  if (!openId) return;
  document.querySelector(`#agenda-${openId}`).hidden = true;
  document.querySelector(`[data-event="${openId}"]`).setAttribute('aria-expanded', 'false');
  openId = null;
  if (restore) returnTrigger?.focus();
}

function openAgenda(trigger) {
  const id = trigger.dataset.event;
  if (openId === id) { closeAgenda(); return; }
  closeAgenda(false);
  returnTrigger = trigger;
  openId = id;
  const slot = document.querySelector(`#agenda-${id}`);
  slot.innerHTML = `<section class="attached-agenda" aria-label="Attached source agenda"><div class="agenda-top"><span class="eyebrow">Attached agenda</span><button type="button" data-close>Close agenda</button></div>${eventContent(id)}</section>`;
  slot.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  slot.querySelector('[data-close]').addEventListener('click', () => closeAgenda());
  slot.querySelector('.agenda-title').focus({ preventScroll: true });
  slot.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

function bind() {
  document.querySelectorAll('[data-event]').forEach(button => button.addEventListener('click', () => openAgenda(button)));
  document.querySelectorAll('[data-format]').forEach(button => {
    if (button.tagName !== 'BUTTON') return;
    button.addEventListener('click', () => {
      document.querySelector('.source-nav').dataset.format = button.dataset.format;
      document.querySelector('.phone-jump').hidden = button.dataset.format === 'calendar';
      document.querySelectorAll('button[data-format]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
  document.querySelector('#source-jump').addEventListener('change', event => {
    const target = document.getElementById(event.target.value);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  document.querySelectorAll('.source-nav a').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const menu = document.querySelector('.phone-menu[open]');
  if (menu) { menu.open = false; menu.querySelector('summary').focus(); return; }
  if (openId) { event.preventDefault(); closeAgenda(); }
});
document.querySelector('.brand').href = `?view=${mode}&ai=${encodeURIComponent(aiState)}`;
validateSources();
render();
document.documentElement.dataset.homepageReady = '15';
