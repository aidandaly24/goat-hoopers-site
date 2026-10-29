import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// Surface contract: what matters around the league? → inspect the week and a
// pair of lockers → public/member, incomplete/zero, saved/stale/missing, draft
// archive → one document on phones → no hidden primary home or internal reader.
const member = mode === 'member' && data.personal.kind === 'member';
const personal = member ? data.personal.summary : null;
const teams = data.home.hub.teams;
const doors = data.home.directory;
const pairs = doors.filter((_, index) => index % 2 === 0).map(door => door.currentMatchup);
const byId = id => teams.find(team => team.id === id);
const name = id => byId(id)?.name ?? id;
const profile = (id, label = name(id)) => `<a href="/teams/${esc(id)}">${esc(label)}</a>`;
const player = (id, label) => `<a href="/player/${esc(id)}">${esc(label)}</a>`;
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = team => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ''}`;
const pct = value => `${Math.round(value * 100)}%`;
const date = value => new Date(value).toISOString().replace('T', ' ').replace(/\.000Z$|Z$/, ' UTC');
const label = text => `<p class="station-label">${text}</p>`;
const close = (id, text) => `<button class="local-close" data-close="${id}">${text}</button>`;

// Validate the imported fixture boundary before interpolating identities.
if (new Set(teams.map(team => team.id)).size !== 10 || doors.length !== 10 || pairs.length !== 5 ||
    doors.some(door => !byId(door.identity.id) || !Array.isArray(door.players)) ||
    pairs.some(pair => !byId(pair.home.id) || !byId(pair.away.id)) || !data.archive.length) {
  throw new Error('The clubhouse fixture boundary is incomplete.');
}

let comparison = null;
let query = '';
let sort = 'standing';
const retained = new Set();
document.querySelector('#viewer').textContent = member
  ? `${personal.team.name} · ${personal.team.managerName} · member edition`
  : 'Public league edition · ten franchises, one room';
const toggle = document.querySelector('#view-toggle');
toggle.href = `?view=${member ? 'public' : 'member'}${aiState === 'ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;
toggle.textContent = member ? 'Public edition' : 'Member edition';

function savedPick(index) {
  const matchup = data.weekly?.matchups[index];
  if (!matchup?.result) return '<p class="pick-note">Saved model call unavailable. No substitute pick.</p>';
  const result = matchup.result;
  return `<p class="pick-note"><b>${aiState === 'stale' ? 'Stale returned choice' : 'Returned choice'}: ${esc(name(result.choice))}</b><br>Confidence ${pct(result.confidence)} · ${result.probabilities.map(item => `${esc(name(item.choice))} ${pct(item.probability)}`).join(' / ')}</p>
    <details class="model-source" id="model-${index}"><summary>Saved call details</summary><dl><dt>Saved</dt><dd>${date(data.weekly.generatedAt)}</dd><dt>Period</dt><dd>${data.weekly.season} · Week ${data.weekly.week}</dd><dt>Roster IDs</dt><dd>${matchup.teamIds.map(esc).join(' / ')} · current display names above</dd><dt>Model / prompt</dt><dd>${esc(result.model)} / ${esc(result.promptVersion)}</dd><dt>Input snapshot</dt><dd>${result.snapshot == null ? 'Unavailable (null)' : esc(JSON.stringify(result.snapshot))}</dd><dt>Evidence</dt><dd>${[...matchup.evidence, ...result.evidence].map(esc).join(' ') || 'No result evidence supplied.'}</dd><dt>Baseline</dt><dd>${matchup.baseline == null ? 'Unavailable' : 'Supplied'}</dd></dl><p>${esc(result.probabilityLabel)}. Returned choice, probability and confidence are independent. ${aiState === 'stale' ? 'This is old output, not a current pick.' : 'Synthetic saved output; no generation on render.'}</p>${close(`model-${index}`, 'Close saved call details')}</details>`;
}

document.querySelector('#score-wall').innerHTML = `${label('At the score wall')}<h2 id="score-title" tabindex="-1">Week ${pairs[0].week}</h2><p class="score-date">Incomplete fixture scores · Nov 12</p><p class="qualifier">0.0 is a known zero. Pending means no score supplied.</p>${aiState === 'stale' ? '<p class="model-status"><b>Stale saved slate.</b> Retained for inspection.</p>' : aiState === 'missing' ? '<p class="model-status"><b>Saved slate unavailable.</b> Pairings remain available.</p>' : '<p class="model-status">Saved model calls · synthetic estimates</p>'}<ol class="matchups">${pairs.map((pair, index) => `<li class="matchup" data-pair="${index}"><p class="pair-label">${member && [pair.home.id, pair.away.id].includes(personal.team.id) ? 'Your matchup' : `Matchup ${index + 1}`}</p>${[['home', pair.homePoints], ['away', pair.awayPoints]].map(([side, value]) => `<div class="score-team"><strong>${profile(pair[side].id)}</strong><span>${score(value)}</span></div>`).join('')}${savedPick(index)}<button class="compare" data-compare="${index}" aria-pressed="false">Compare these two lockers</button></li>`).join('')}</ol><div class="links"><a href="/ai-decides">Open AI Decides</a>${member ? '<a href="/team">My team</a>' : '<a href="/teams">Team profiles</a>'}</div><p class="qualifier">Checked ${date(data.home.checkedAt)}</p>`;

document.querySelector('#team-lockers').innerHTML = `<div class="locker-heading"><div>${label('Along the back wall')}<h2 id="locker-title" tabindex="-1">The ten franchises.</h2></div><p>Current records. Familiar faces.<br>Room for a two-team comparison.</p></div><div class="locker-controls"><label>Find team, manager or player<input id="locker-search" type="search" placeholder="Embiid, NeuralNets…"></label><label>Order the lockers<select id="locker-sort"><option value="standing">Standing</option><option value="name">Team A–Z</option><option value="size">Roster size</option></select></label></div><p class="locker-count" id="locker-count" role="status"></p><div id="comparison-context"></div><div class="cabinet" id="cabinet"></div>`;

function doorMarkup(door) {
  const team = door.identity;
  const face = data.faces.find(item => item.team.id === team.id);
  const pair = door.currentMatchup;
  const opponent = pair.home.id === team.id ? pair.away : pair.home;
  const shown = query ? door.players.filter(item => item.fullName.toLowerCase().includes(query.toLowerCase())) : door.players.slice(0, 5);
  const selected = comparison != null && [pairs[comparison].home.id, pairs[comparison].away.id].includes(team.id);
  return `<article class="locker${selected ? ' compared' : ''}" id="team-${esc(team.id)}"><div class="locker-name">${face ? `<img src="${esc(inventory.portraits[face.player.id])}" alt="" loading="lazy">` : ''}<div><h3>${profile(team.id)}</h3><p>${esc(team.managerName)}${member && team.id === personal.team.id ? ' · you' : ''}</p></div></div><p class="locker-record"><b>${record(door.currentRecord)}</b> · ${door.players.length} players${face?.champion ? ' · 2025 champion' : ''}</p><p class="opponent">Week ${pair.week} vs ${profile(opponent.id)} · incomplete</p>${face ? `<p class="face-value">${player(face.player.id, face.player.name)}<br>${esc(face.player.position)} · ${money(face.player.value)} modeled FAAB</p>` : ''}${selected ? '<p class="comparison-mark">At the comparison bench</p>' : ''}<details class="locker-detail" id="locker-${esc(team.id)}" ${retained.has(team.id) || (query && shown.length) ? 'open' : ''}><summary>Inside this locker</summary><div class="door-interior"><p>${query && shown.length ? 'Player search matches' : `Five roster references · ${door.players.length} on the full profile`}</p><ul class="roster-list">${shown.map(item => `<li>${player(item.id, item.fullName)}<small>${esc(item.position)} · ${esc(item.nbaTeam)}</small></li>`).join('') || '<li>No player-name match; team or manager matched.</li>'}</ul><p class="previous">${door.previousSeason.season}: ${door.previousSeason.wins}–${door.previousSeason.losses} · finish ${door.previousSeason.finish}${door.previousSeason.ownerNote ? `. ${esc(door.previousSeason.ownerNote)}` : ''}</p><a class="text-link" href="/teams/${esc(team.id)}#team-roster">Full roster &amp; franchise history</a>${close(`locker-${team.id}`, 'Close this locker')}</div></details></article>`;
}

function renderDoors() {
  const matches = doors.filter(door => [door.identity.name, door.identity.managerName, ...door.players.map(item => item.fullName)].some(text => text.toLowerCase().includes(query.toLowerCase())));
  const rank = id => data.home.hub.standings.find(item => item.team.id === id)?.rank ?? Infinity;
  matches.sort((a, b) => sort === 'name' ? a.identity.name.localeCompare(b.identity.name) : sort === 'size' ? b.players.length - a.players.length || rank(a.identity.id) - rank(b.identity.id) : rank(a.identity.id) - rank(b.identity.id));
  document.querySelector('#cabinet').innerHTML = matches.map(doorMarkup).join('') || '<p>No matching team, manager or player. Clear the search to bring back all ten.</p>';
  document.querySelector('#locker-count').textContent = `${matches.length} of ${doors.length} franchises · searches all ${new Set(doors.flatMap(door => door.players.map(item => item.id))).size} player references`;
  document.querySelector('#comparison-context').innerHTML = comparison == null ? '' : `<div class="comparison-context"><p><b>Comparing ${esc(pairs[comparison].home.name)} / ${esc(pairs[comparison].away.name)}</b><br>The two locker notes stay open while you read around the room.</p><div class="links">${[pairs[comparison].home.id, pairs[comparison].away.id].map(id => `<button data-jump="${id}">${esc(name(id))} notes</button>`).join('')}<button id="clear-comparison">Clear comparison marks</button></div></div>`;
  document.querySelectorAll('[data-compare]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.compare) === comparison)));
}

function guideRows(rows, unit) {
  return `<ul class="guide-list">${rows.map(item => `<li><span>${player(item.id, item.name)}<small>${item.games} GP · ${esc(item.note)}</small></span><b>${item.value} ${unit}</b></li>`).join('')}</ul>`;
}
function moves(rows) {
  return `<ul class="wire-list">${rows.map(move => `<li><p>${esc(move.summary)}</p><small>Week ${move.week} · ${esc(move.type)} · ${date(move.createdAt)}</small><small>${move.adds.length || move.drops.length ? `${move.adds.length} adds / ${move.drops.length} drops supplied` : 'Add/drop legs not supplied; players cannot be inferred.'}</small></li>`).join('')}</ul>`;
}
const draft = data.archive[0];
document.querySelector('#bench').innerHTML = `${label('Take it to the bench')}<div class="bench-heading"><div><h2 id="bench-title" tabindex="-1">${member ? esc(personal.team.name) : 'Around our league.'}</h2><p class="measure-note">${member ? `${esc(personal.team.managerName)} · ${record(personal.team)} · standing ${personal.standing.rank} of ${teams.length}` : `${teams.length} teams · ${data.home.hub.season.playoffTeams} playoff places · ${data.home.hub.season.seasonYear} fixture`}</p></div><div class="links">${member ? `<a href="/team">My team</a><a href="/teams/${esc(personal.team.id)}#team-roster">My full roster</a>` : '<a href="/teams">All team profiles</a><a href="/history">League history</a>'}</div></div>${member ? memberBench() : publicBench()}`;

function memberBench() {
  const guide = personal.playerGuide;
  const shared = guide.rough.filter(item => guide.best.some(best => best.id === item.id));
  return `<div class="bench-leaves"><div><h3>Current modeled FAAB ${personal.valuation.complete ? 'total' : 'subtotal'}</h3><p class="big-value">${money(personal.valuation.total)}</p><p class="measure-note">${personal.valuation.priced} of ${personal.coverage.roster} priced · ${personal.valuation.unpriced} unpriced<br>Modeled value rank ${personal.valuation.rank.rank} of ${personal.valuation.rank.teams}. Not a FAAB balance.</p><ul class="value-list">${personal.players.map(item => `<li><span>${player(item.id, item.name)}<small>${esc(item.position)} · highest modeled values</small></span><b>${money(item.value)}</b></li>`).join('')}</ul><p class="measure-note">${esc(personal.market.pricingBasis)} basis · computed ${date(personal.market.updatedAt)}</p><details id="values"><summary>All ${personal.rosterValues.length} values &amp; coverage</summary><p>${personal.coverage.roster} roster players; ${personal.valuation.priced} priced; ${personal.valuation.unpriced} unpriced.</p><ul class="value-list">${personal.rosterValues.map(item => `<li><span>${player(item.id, item.name)}<small>${esc(item.position)}</small></span><b>${money(item.value)}</b></li>`).join('')}</ul>${close('values', 'Roll up the value receipt')}</details><a class="text-link" href="/stocks#player-board">Inspect prices on the stock board</a></div><div><h3>Players to watch</h3><p class="measure-note">${esc(guide.watch.label)}</p>${guideRows(guide.watch.rows, 'EMA FP/G')}<p class="measure-note">${esc(guide.watch.message)}</p><p class="measure-note">Current Week ${guide.currentWeek}. Availability remains unknown.</p></div></div><div class="completed-guide"><h3>The completed-week notebook</h3><p class="measure-note">${esc(guide.period)} · synthetic completed records</p><div class="bench-leaves"><div><h4>Your best</h4>${guideRows(guide.best, 'FP')}</div><div><h4>The rough week</h4>${guideRows(guide.rough.filter(item => !guide.best.some(best => best.id === item.id)), 'FP')}<p class="measure-note">${shared.map(item => `${esc(item.name)} (${item.value} FP / ${item.games} GP)`).join(', ')} also belongs to this list and appears once in Your best.</p></div></div><p class="measure-note">${esc(guide.coverage)}</p><p class="measure-note">${esc(inventory.missing.recap)}</p></div><div class="team-wire"><h3>Your team wire</h3><ul class="wire-list">${personal.news.map(item => `<li><a href="${esc(item.url)}">${esc(item.headline)}</a><small>${esc(item.outlet.name)} · ${date(item.publishedAt)}</small></li>`).join('')}</ul>${moves(personal.moves)}<a class="text-link" href="/transactions">All league transactions</a></div>`;
}
function publicBench() {
  return `<p class="public-intro">A week at the score wall, ten familiar lockers and the stories left on the bench. Pick a pairing above to compare the teams; each full profile keeps the roster and franchise record together.</p><div class="public-lead"><h3>${esc(draft.game.title)}</h3><p class="measure-note">${esc(draft.dateLabel)} · draft archive · opening-week preview at its source date</p><p>${esc(draft.game.context)}</p><p class="measure-note">This October preview is not the current November Week 3 pairing.</p><a class="text-link" href="/weekly/${esc(draft.id)}">Read the dated opening edition</a></div><h3>From the October noticeboard</h3><ul class="wire-list">${draft.happenings.map(item => `<li><a href="${esc(item.href)}">${esc(item.title)}</a><p>${esc(item.text)}</p><small>${esc(item.dateLabel)} · from ${esc(draft.dateLabel)}</small></li>`).join('')}</ul><p class="measure-note">Public edition. Personal values, form guides and team wire belong to the member edition.</p>`;
}

document.querySelector('#press-desk').innerHTML = `${label('On the archive shelf')}<h2 id="press-title" tabindex="-1">Weekly editions.</h2><p class="shelf-note">Two retained drafts. Their dates stay on the folders.</p><div class="folders">${data.archive.map((edition, index) => `<article class="folder"><p class="date-label">${esc(edition.dateLabel)}<br>${esc(edition.status)} · not published</p><h3>${esc(edition.title)}</h3><h4>${esc(edition.game.title)}</h4><p class="measure-note">${esc(edition.game.note)}</p><p>${edition.game.state === 'final' ? `<b>2025 final · ${score(edition.game.scores[0])}–${score(edition.game.scores[1])}</b><br>${edition.game.teamIds.map(id => profile(id)).join(' / ')}` : `At source: upcoming · league Week ${edition.game.leagueWeek}<br>${edition.game.teamIds.map(id => profile(id)).join(' / ')}`}</p><p>${esc(edition.game.context)}</p><details id="edition-${index}"><summary>Selection, dates &amp; sources</summary><p>${esc(edition.game.selectionReason)}</p><p>${esc(edition.startsAt)} to ${esc(edition.endsAt)} (end exclusive). Published: ${edition.publishedAt ?? 'not published'}.</p><ul class="source-list">${edition.sources.map(source => `<li><a href="${esc(source.url)}">${esc(source.label)}</a><small>Checked ${esc(source.checkedAt)}</small></li>`).join('')}</ul>${close(`edition-${index}`, 'Close source notes')}</details><a class="text-link" href="/weekly/${esc(edition.id)}">Read this dated edition</a></article>`).join('')}</div><a class="text-link" href="/weekly">All weekly editions</a>`;

document.querySelector('#scouting').innerHTML = `<div class="sheet-heading">${label('The October scouting sheet')}<h2 id="scout-title" tabindex="-1">Three notes left on the bench.</h2><p class="measure-note">${esc(draft.dateLabel)} · proposed draft editorial, not current fantasy-week awards. Current roster links; original NBA / college stat periods.</p></div><div class="spotlights">${draft.playerSpotlights.map((item, index) => `<article class="spotlight"><div class="spotlight-person"><img src="${esc(inventory.portraits[item.playerId])}" alt="" loading="lazy"><div><p class="station-label">${esc(item.periodLabel)}</p><h3>${esc(item.headline)}</h3><p>${player(item.playerId, item.name)} · ${esc(item.position)}<br>${profile(item.teamId)}</p></div></div><p>${esc(item.opinion)}</p><dl class="stats">${item.stats.map(stat => `<div><dt>${esc(stat.label)}</dt><dd>${esc(stat.value)}</dd></div>`).join('')}</dl><p class="measure-note">${esc(item.statPeriod)}</p><details id="spotlight-${index}"><summary>Why this pick &amp; source</summary><p>${esc(item.selectionReason)}</p><p><a href="${esc(item.source.url)}">${esc(item.source.label)}</a> · checked ${esc(item.source.checkedAt)}</p>${close(`spotlight-${index}`, 'Close editorial note')}</details></article>`).join('')}</div>`;

document.querySelector('#ledger').innerHTML = `${label('The league ledger')}<h2 id="ledger-title" tabindex="-1">Standings &amp; recent moves.</h2><p class="measure-note">Synthetic current records · PF = supplied pointsFor ÷ 100</p><ol class="standings">${data.home.hub.standings.map(item => `<li><span class="rank">${item.rank}</span><span class="standing-team">${profile(item.team.id)}${member && item.team.id === personal.team.id ? ' · you' : ''}<small>${esc(item.team.managerName)}</small></span><span class="standing-record"><b>${record(item)}</b><small>W–L${item.ties ? '–T' : ''}</small></span><span class="standing-points"><b>${(item.pointsFor / 100).toFixed(1)}</b><small>PF</small></span></li>`).join('')}</ol><div class="league-wire"><h3>Week 3 transaction wire</h3>${moves(data.home.hub.transactions)}<a class="text-link" href="/transactions">Open the transaction ledger</a></div><div class="missing-producers"><p>${esc(inventory.missing.power)}</p><p>${esc(inventory.missing.history)}</p></div><div class="links"><a href="/stocks#player-board">Stocks</a><a href="/trade-analyzer">Trade analyzer</a><a href="/intel">News &amp; intel</a><a href="/history">History</a></div>`;
document.querySelector('#games').innerHTML = `${label('Beside the games crate')}<h2 id="games-title" tabindex="-1">Meet you on court.</h2><a class="court-view" href="/arcade"><img src="${esc(inventory.assets.court)}" alt="GOAT Hoopers hardwood arena" loading="lazy"><span>Visit the Arcade</span></a><h3>Free throw practice</h3><img class="game-preview" src="${esc(inventory.assets.game)}" alt="The free throw practice court and game controls" loading="lazy"><p>Aim, release, and take another shot.</p><a class="play" href="/arcade/free-throw">Play free throw</a><p class="game-note">The existing playable game. No invented prizes or rankings.</p><a class="text-link" href="/arcade">All playable games</a>`;
document.querySelector('#fixture-detail').innerHTML = `<p>${esc(inventory.warning)}</p><p>Fixture checked ${date(data.home.checkedAt)}. Actual date in this browser: ${new Date().toISOString().slice(0, 10)} UTC. November fixture time is not a claim about today's league.</p><p>October editorial retains draft status, exact source periods and checked dates. The completed 2025 final belongs to its dated historical folder. Current Week 3 scores are incomplete.</p><p>Only imported local facts, approved portraits, the arena and free throw preview are used. No live provider, login, new model generation or write operation is connected. Product links lead to the supplied existing routes.</p>`;

renderDoors();
function closeDetail(detail) {
  detail.open = false;
  detail.querySelector(':scope > summary')?.focus({ preventScroll: true });
  detail.querySelector(':scope > summary')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  if (detail.classList.contains('locker-detail')) retained.delete(detail.id.replace('locker-', ''));
}
document.addEventListener('toggle', event => {
  const detail = event.target;
  if (!detail.classList?.contains('locker-detail')) return;
  const id = detail.id.replace('locker-', '');
  if (detail.open) retained.add(id); else retained.delete(id);
}, true);
document.addEventListener('click', event => {
  const compare = event.target.closest('[data-compare]');
  if (compare) {
    comparison = Number(compare.dataset.compare);
    query = '';
    document.querySelector('#locker-search').value = '';
    retained.add(pairs[comparison].home.id);
    retained.add(pairs[comparison].away.id);
    renderDoors();
    document.querySelector('#locker-title').focus({ preventScroll: true });
    document.querySelector('#team-lockers').scrollIntoView({ block: 'start', behavior: 'instant' });
    return;
  }
  const jump = event.target.closest('[data-jump]');
  if (jump) {
    const detail = document.getElementById(`locker-${jump.dataset.jump}`);
    if (detail) { detail.open = true; detail.querySelector('summary').focus(); }
    return;
  }
  const closing = event.target.closest('[data-close]');
  if (closing) { const detail = document.getElementById(closing.dataset.close); if (detail) closeDetail(detail); return; }
  if (event.target.closest('#clear-comparison')) {
    comparison = null;
    renderDoors();
    document.querySelector('#locker-title').focus({ preventScroll: true });
  }
});
document.querySelector('#locker-search').addEventListener('input', event => { query = event.target.value.trim(); renderDoors(); });
document.querySelector('#locker-sort').addEventListener('change', event => { sort = event.target.value; renderDoors(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const detail = document.activeElement.closest('details[open]');
  if (detail) { event.preventDefault(); closeDetail(detail); }
});
function adaptText() { document.documentElement.classList.toggle('large-text', parseFloat(getComputedStyle(document.documentElement).fontSize) > 20); }
adaptText();
new MutationObserver(adaptText).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
new ResizeObserver(adaptText).observe(document.documentElement);
document.documentElement.dataset.homepageReady = '07';
