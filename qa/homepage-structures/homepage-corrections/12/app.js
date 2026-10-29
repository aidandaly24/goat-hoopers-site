import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const $ = selector => document.querySelector(selector);
const directory = data.home.directory;
const byId = new Map(directory.map(team => [team.identity.id, team]));
const faces = new Map(data.faces.map(face => [face.team.id, face]));
const pairs = [...new Map(directory.map(team => [team.currentMatchup.home.id, team.currentMatchup])).values()];
const member = mode === 'member' && data.personal.kind === 'member';
const personal = member ? data.personal.summary : null;
let pairIndex = 0;
let third = null;
let traced = null;
let dateIndex = 0;
let pinReturn = null;

const name = id => byId.get(String(id))?.identity.name ?? String(id);
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = team => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ''}`;
const percent = value => `${Math.round(value * 100)}%`;
const stamp = value => value == null ? 'Not supplied' : new Date(value).toISOString().replace('T', ' · ').replace('.000Z', ' UTC');
const playerLink = (id, label) => `<a href="/player/${esc(id)}">${esc(label)}</a>`;
const teamLink = id => `<a href="/teams/${esc(id)}">${esc(name(id))}</a>`;
const faceImage = id => inventory.portraits[faces.get(id).player.id];
const currentPair = () => pairs[pairIndex];
const activeIds = () => [currentPair().home.id, currentPair().away.id, ...(third ? [third] : [])];
const saved = pair => data.weekly?.matchups.find(row => row.teamIds.includes(pair.home.id) && row.teamIds.includes(pair.away.id));

$('#mode').href = `?view=${member ? 'public' : 'member'}&ai=${encodeURIComponent(aiState)}`;
$('#mode').textContent = member ? 'Public view' : 'Member view';

function focusAt(id) {
  const node = document.getElementById(id);
  if (!node) return;
  node.focus({ preventScroll: true });
  node.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function curatedPlayers(id) {
  const team = byId.get(id), face = faces.get(id);
  const landmark = team.players.find(player => player.id === face.player.id);
  return [...(landmark ? [landmark] : []), ...team.players.filter(player => player.id !== face.player.id)].slice(0, 3);
}

function teamTerritory(id, role) {
  const team = byId.get(id), face = faces.get(id), own = member && id === personal.team.id;
  const previous = team.previousSeason;
  return `<article class="team-territory ${role}" id="team-${id}" tabindex="-1">
    <p class="eyebrow">${role === 'third' ? 'Pinned comparison · separate from this game' : own ? 'Your franchise · home team' : role === 'home' ? 'Home team' : 'Away team'}</p>
    <div class="team-heading"><img src="${esc(faceImage(id))}" width="96" height="96" alt=""><div><h3>${teamLink(id)}</h3><p>${esc(team.identity.managerName)}</p></div></div>
    <p class="team-facts"><strong>${record(team.currentRecord)}</strong> current record <span>${team.players.length} rostered</span></p>
    <p>${playerLink(face.player.id, face.player.name)} · ${esc(face.player.position)} · ${money(face.player.value)} modeled FAAB${face.champion ? ' · defending champion franchise' : ''}</p>
    <h4>Roster connections</h4><ul class="roster-examples">${curatedPlayers(id).map(player => `<li><span>${playerLink(player.id, player.fullName)}<small>${esc(player.position)} · ${esc(player.nbaTeam)}</small></span><button data-trace="${esc(player.id)}" aria-label="Trace current owner of ${esc(player.fullName)}">Trace →</button></li>`).join('')}</ul>
    <a class="destination" href="/teams/${id}#team-roster">All ${team.players.length} rostered players →</a>
    <p class="previous">${esc(previous.season)} · ${previous.wins}–${previous.losses} · finish ${previous.finish}${previous.ownerNote ? ` · previous manager. ${esc(previous.ownerNote)}` : ''}</p>
    ${own ? '<a class="destination" href="/team">Manage your team →</a>' : ''}
    ${role === 'third' ? '<button class="remove" data-remove-third>Remove comparison ↶</button>' : ''}
  </article>`;
}

function savedMetadata(pair) {
  const row = saved(pair), result = row?.result;
  if (!result) return '';
  return `<details><summary>Model, inputs and evidence</summary><dl>
    <dt>Saved</dt><dd>${esc(stamp(data.weekly.generatedAt))}</dd>
    <dt>Model / prompt</dt><dd>${esc(result.model)} / ${esc(result.promptVersion)}</dd>
    <dt>Input scope</dt><dd>Season ${esc(data.weekly.season)}, Week ${data.weekly.week}; roster IDs ${row.teamIds.map(esc).join(' / ')}.</dd>
    <dt>Input snapshots / baseline</dt><dd>Result snapshot: ${result.snapshot == null ? 'not supplied' : esc(JSON.stringify(result.snapshot))}; slate snapshot: ${data.weekly.snapshot == null ? 'not supplied' : esc(JSON.stringify(data.weekly.snapshot))}; baseline: ${row.baseline == null ? 'not supplied' : esc(JSON.stringify(row.baseline))}.</dd>
    <dt>Source evidence</dt><dd>${row.evidence.length ? row.evidence.map(esc).join('<br>') : 'Not supplied'}</dd>
    <dt>Result evidence</dt><dd>${result.evidence.length ? result.evidence.map(esc).join('<br>') : 'No additional result evidence supplied.'}</dd>
  </dl></details>`;
}

function decision(pair, full = false) {
  const result = saved(pair)?.result;
  if (!result) return '<p class="status">AI unavailable · no saved result</p>';
  const probability = result.probabilities.find(item => item.choice === result.choice)?.probability;
  return `<div class="decision"><p class="eyebrow">${aiState === 'stale' ? 'Stale saved AI · not fresh evidence' : 'Saved AI · synthetic'}</p>
    <p class="returned">Returned choice: <strong>${esc(name(result.choice))}</strong>${probability == null ? '' : ` · ${percent(probability)}`}</p>
    <ul class="probabilities">${result.probabilities.map(item => `<li><span>${esc(name(item.choice))}</span><strong>${percent(item.probability)}</strong></li>`).join('')}</ul>
    <p>Independent confidence <strong>${percent(result.confidence)}</strong>.</p>
    ${full ? `<p class="muted">${esc(result.probabilityLabel)}. Saved ${esc(stamp(data.weekly.generatedAt))}.</p>${savedMetadata(pair)}` : ''}
  </div>`;
}

function ownership() {
  if (!traced) return '<p class="relation-note">Trace a roster example to connect the player with their current owner.</p>';
  const owner = directory.find(team => team.players.some(player => player.id === traced));
  const player = owner.players.find(player => player.id === traced);
  return `<div class="ownership"><h4>Current ownership</h4><p>${playerLink(player.id, player.fullName)} → ${teamLink(owner.identity.id)}</p><p class="muted">${esc(player.position)} · ${esc(player.nbaTeam)}. Current membership only; historical ownership is not inferred.</p><button data-clear-trace>Clear traced player ↶</button></div>`;
}

function renderComparison(focusId = null) {
  const pair = currentPair();
  $('#comparison').innerHTML = `<div class="matchup-space ${third ? 'triad' : ''}">
    <section class="bridge" id="bridge" tabindex="-1" aria-label="Selected matchup relationship"><p class="eyebrow">Week ${pair.week} · incomplete</p><h3>${esc(pair.home.name)}<span class="versus">versus</span>${esc(pair.away.name)}</h3>
      <div class="scores"><span><strong>${score(pair.homePoints)}</strong>Home</span><span><strong class="${pair.awayPoints == null ? 'pending' : ''}">${score(pair.awayPoints)}</strong>Away</span></div>
      <p class="status">Synthetic · 0.0 is known; Pending is unsupplied.</p>${decision(pair, true)}${ownership()}
      ${third ? `<p class="comparison-note">${esc(name(third))} is pinned alongside. The game above still has two teams.</p>` : '<a class="destination" href="#league-title">Choose a third franchise below ↓</a>'}
    </section>
    ${teamTerritory(pair.home.id, 'home')}${teamTerritory(pair.away.id, 'away')}${third ? teamTerritory(third, 'third') : ''}
  </div><div class="comparison-actions"><button data-reset>Reset comparison ↶</button><a href="/trade-analyzer">Take these questions to Trade Analyzer →</a></div>`;
  document.querySelectorAll('[data-pin]').forEach(button => {
    button.setAttribute('aria-pressed', String(third === button.dataset.pin));
    button.textContent = activeIds().includes(button.dataset.pin) ? third === button.dataset.pin ? 'Pinned · return ↑' : 'In focus ↑' : 'Compare +';
  });
  document.querySelectorAll('[data-pair]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.pair) === pairIndex)));
  if (focusId) focusAt(focusId);
}

function renderLeague() {
  $('#league').innerHTML = `<p>2026 fixture records · ${data.home.hub.season.playoffTeams} playoff places · playoffs begin Week ${data.home.hub.season.playoffWeekStart}. PF is supplied pointsFor ÷ 100.</p>
    <ol class="standings">${data.home.hub.standings.map(row => {
      const id = row.team.id, team = byId.get(id), face = faces.get(id);
      const opponent = [team.currentMatchup.home, team.currentMatchup.away].find(item => item.id !== id);
      return `<li><span class="rank" aria-label="Rank ${row.rank}">${row.rank}</span><div class="standing-team"><h3>${teamLink(id)}</h3><p>${esc(team.identity.managerName)} · ${record(row)} · ${team.players.length} players</p><p class="muted">Week 3 vs ${esc(opponent.name)}</p><p class="landmark">${playerLink(face.player.id, face.player.name)} · ${money(face.player.value)} modeled</p>${team.previousSeason.ownerNote ? `<p class="muted">${team.previousSeason.season}: ${team.previousSeason.wins}–${team.previousSeason.losses}, previous manager</p>` : ''}</div><div class="standing-action"><strong>${(row.pointsFor / 100).toFixed(2)} <small>PF</small></strong><button id="pin-league-${id}" data-pin="${id}">Compare +</button></div></li>`;
    }).join('')}</ol><p class="muted">${esc(inventory.missing.power)}</p><a class="destination" href="/teams">Full team directory and rosters →</a>`;
}

function renderConnections() {
  $('#connections').innerHTML = `<p class="status">${data.weekly ? `${aiState === 'stale' ? 'Stale slate' : 'Saved slate'} · ${esc(stamp(data.weekly.generatedAt))}` : 'Unavailable · no saved AI slate'}</p>
    <ol class="matchup-list">${pairs.map((pair, index) => `<li><div class="pair-line"><span>${teamLink(pair.home.id)}<strong>${score(pair.homePoints)}</strong></span><span>${teamLink(pair.away.id)}<strong class="${pair.awayPoints == null ? 'pending' : ''}">${score(pair.awayPoints)}</strong></span></div>
      <p class="muted">Week ${pair.week} · incomplete synthetic score</p>${decision(pair)}${savedMetadata(pair)}<button id="pair-${index}" data-pair="${index}" aria-pressed="${index === pairIndex}">Focus this connection ↑</button></li>`).join('')}</ol>`;
}

function guideRows(rows, unit) {
  return `<ul class="metric-list">${rows.map(row => `<li><span>${playerLink(row.id, row.name)}<small>${esc(row.note)}</small></span><strong>${row.value} ${unit}<small>${row.games} GP</small></strong></li>`).join('')}</ul>`;
}

function renderMember() {
  if (!member) {
    $('#member').innerHTML = '<aside class="public-note"><h2>A league view for everyone.</h2><p>Public team profiles and rosters are open. Personal valuation, form, team news and management actions belong to the member edition.</p><a class="destination" href="/login">Sign in to your team →</a></aside>';
    return;
  }
  const valuation = personal.valuation, guide = personal.playerGuide;
  $('#member').innerHTML = `<section class="member-territory" aria-labelledby="member-title"><div class="section-heading"><div><p class="eyebrow">Member edition · synthetic personal context</p><h2 id="member-title">Inside ${esc(personal.team.name)}</h2></div><a class="destination" href="/team">Manage your team →</a></div>
    <div class="member-space"><div class="value-node"><h3>Current modeled FAAB</h3><p class="subtotal">${money(valuation.total)}</p><p>${valuation.priced}/${valuation.priced + valuation.unpriced} players priced · ${valuation.unpriced} unpriced · value rank ${valuation.rank.rank}/${valuation.rank.teams}${valuation.rank.tied ? ' (tied)' : ''}.</p><p>${valuation.complete ? 'Complete priced coverage' : 'Partial subtotal'} · ${esc(personal.market.pricingBasis)} basis · ${esc(stamp(personal.market.updatedAt))}. This is modeled value, not a cash balance.</p>
      <ul class="metric-list">${personal.players.map(player => `<li><span>${playerLink(player.id, player.name)}<small>${esc(player.position)} · ${player.changePct == null ? 'change unavailable' : `${player.changePct > 0 ? '+' : ''}${player.changePct}% historical change`}</small></span><strong>${money(player.value)}</strong></li>`).join('')}</ul><p class="muted">${esc(inventory.missing.history)}</p><a class="destination" href="/stocks#player-board">Inspect player prices →</a>
      <h3>Your sample team wire</h3><ul class="news-list">${personal.news.map(item => `<li><a href="${esc(item.url)}">${esc(item.headline)}</a><small>${esc(item.outlet.name)} · ${esc(stamp(item.publishedAt))}</small></li>`).join('')}</ul>
    </div><div class="form-node"><h3>On form</h3><p>${esc(guide.watch.label)}</p>${guideRows(guide.watch.rows, 'FPPG')}<p class="muted">${esc(guide.watch.message)}</p><h3>Completed-week lens</h3><p><strong>${esc(guide.period)}</strong></p><p>${esc(inventory.missing.recap)}</p><p>${esc(guide.coverage)}</p><h4>Best recorded</h4>${guideRows(guide.best.slice(0, 1), 'points')}<h4>Rough recorded</h4>${guideRows(guide.rough.slice(0, 1), 'points')}<p class="muted">${esc(guide.recapMessage)} One example from each list; full context belongs to your team.</p><a class="destination" href="/team">Open your team context →</a></div></div></section>`;
}

function story(story, index) {
  return `<article class="story" id="story-${story.teamId}"><div class="story-owner"><span>Current roster owner</span>${teamLink(story.teamId)}<button id="pin-story-${index}" data-pin="${esc(story.teamId)}">Compare +</button></div>
    <div class="story-heading"><img src="${esc(inventory.portraits[story.playerId] || faceImage(story.teamId))}" width="88" height="88" loading="lazy" alt=""><div><p class="eyebrow">${esc(story.role.replaceAll('-', ' '))}</p><h4>${playerLink(story.playerId, story.name)}</h4><p>${esc(story.periodLabel)} · ${esc(story.position)}</p></div></div>
    <h3>${esc(story.headline)}</h3><p>${esc(story.opinion)}</p><dl class="spot-stats">${story.stats.map(stat => `<div><dt>${esc(stat.label)}</dt><dd>${esc(stat.value)}</dd></div>`).join('')}</dl><p class="stat-period">${esc(story.statPeriod)}</p><p>${esc(story.selectionReason)}</p><p class="muted">Current ownership is separate from these dated statistics. <a href="${esc(story.source.url)}">${esc(story.source.label)}</a> · checked ${esc(story.source.checkedAt)}.</p></article>`;
}

function renderEdition(focus = false) {
  const edition = data.archive[dateIndex];
  $('#edition-nav').innerHTML = data.archive.map((item, index) => `<button data-date="${index}" aria-pressed="${dateIndex === index}">${esc(item.dateLabel)}</button>`).join('');
  $('#edition').innerHTML = `<div class="edition-lead" id="edition-lead" tabindex="-1"><div><p class="eyebrow">${esc(edition.dateLabel)} · ${esc(edition.status)} · not published</p><h3>${esc(edition.title)}</h3><p>This dated draft is outside its edition period. It is retained as an archive example.</p><a class="destination" href="/weekly/${esc(edition.id)}">Open this dated edition →</a></div><div class="edition-game"><p>${edition.game.teamIds.map(teamLink).join(' × ')}</p><h4>${esc(edition.game.title)}</h4>${edition.game.scores ? `<p class="historical-score">${edition.game.scores.map(score).join(' – ')}<small>Historical final · 2025</small></p>` : ''}<p class="status">${esc(edition.game.note)} · ${esc(edition.game.state)}${edition.game.leagueWeek == null ? '' : ` · League Week ${edition.game.leagueWeek}`}</p><p>${esc(edition.game.context)}</p><p class="muted">${esc(edition.game.selectionReason)}</p></div></div>
    ${edition.playerSpotlights.length ? `<div class="story-space">${edition.playerSpotlights.map(story).join('')}</div>` : '<p class="historical-note">The final above is a dated result. Current franchise rosters do not reconstruct historical ownership.</p>'}
    <div class="edition-tail"><div><h3>Happening in that edition</h3><ul class="news-list">${edition.happenings.map(item => `<li><a href="${esc(item.href)}">${esc(item.title)}</a><p>${esc(item.text)}</p><small>${esc(item.dateLabel)} · dated archive</small></li>`).join('')}</ul></div><details><summary>Edition dates, selection and sources</summary><p>${esc(edition.startsAt)} to ${esc(edition.endsAt)} (end exclusive). Publication: ${edition.publishedAt == null ? 'not published' : esc(edition.publishedAt)}.</p><ul class="source-list">${edition.sources.map(source => `<li><a href="${esc(source.url)}">${esc(source.label)}</a><small>Checked ${esc(source.checkedAt)}</small></li>`).join('')}</ul></details></div>`;
  document.querySelectorAll('[data-pin]').forEach(button => button.setAttribute('aria-pressed', String(third === button.dataset.pin)));
  if (focus) focusAt('edition-lead');
}

function renderWire() {
  $('#wire').innerHTML = `<ul class="news-list">${data.home.hub.transactions.map(move => `<li><h3>${esc(move.summary)}</h3><p>${move.teamIds.map(teamLink).join(' / ')} · Week ${move.week}</p><p class="muted">${esc(stamp(move.createdAt))} · ${esc(move.type)}. Adds: ${move.adds.length ? esc(JSON.stringify(move.adds)) : 'not supplied'}; drops: ${move.drops.length ? esc(JSON.stringify(move.drops)) : 'not supplied'}. Missing legs do not establish that no players moved.</p></li>`).join('')}</ul>`;
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.pin) {
    const id = button.dataset.pin;
    if (!byId.has(id)) return;
    if (!activeIds().includes(id)) { third = id; pinReturn = button.id; }
    renderComparison(`team-${id}`);
  } else if (button.hasAttribute('data-remove-third')) {
    const returnId = pinReturn;
    third = null;
    renderComparison();
    focusAt(returnId && document.getElementById(returnId) ? returnId : 'league-title');
  } else if (button.hasAttribute('data-pair')) {
    const index = Number(button.dataset.pair);
    if (!Number.isInteger(index) || index < 0 || index >= pairs.length) return;
    pairIndex = index;
    third = null;
    traced = null;
    renderComparison('bridge');
  } else if (button.dataset.trace) {
    const owner = directory.find(team => team.players.some(player => player.id === button.dataset.trace));
    if (!owner) return;
    traced = button.dataset.trace;
    if (!activeIds().includes(owner.identity.id)) third = owner.identity.id;
    renderComparison('bridge');
  } else if (button.hasAttribute('data-clear-trace')) {
    traced = null;
    renderComparison('bridge');
  } else if (button.hasAttribute('data-date')) {
    const index = Number(button.dataset.date);
    if (!Number.isInteger(index) || index < 0 || index >= data.archive.length) return;
    dateIndex = index;
    renderEdition(true);
  } else if (button.hasAttribute('data-reset')) {
    pairIndex = 0;
    third = null;
    traced = null;
    renderComparison('comparison-title');
  } else if (button.hasAttribute('data-return')) focusAt('comparison-title');
});

renderLeague();
renderConnections();
renderMember();
renderEdition();
renderWire();
renderComparison();
await document.fonts.ready;
document.documentElement.dataset.homepageReady = '12';
