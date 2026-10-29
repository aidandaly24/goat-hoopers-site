import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// Query commons: a complete open home, with local search as an additional route.
// Question → what matters in this league? Action → read, search, then open a real destination.
// States → member/public, ready/stale/missing AI, known zero/missing score, dated draft.
// Narrow → questions become passage headings; all answers retain normal document flow.
// Forbidden → internal readers, hidden primary home, invented current results or missing prices.
const $ = selector => document.querySelector(selector);
const teams = data.home?.directory;
if (!Array.isArray(teams) || teams.length !== 10 || !Array.isArray(data.archive) || !Array.isArray(data.faces)) {
  $('#commons').innerHTML = '<p>The local league fixture is incomplete. Reload this study to retry.</p>';
  throw new Error('ONLY11: required local fixture boundary failed');
}
const member = mode === 'member' && data.personal.kind === 'member';
const mine = member ? data.personal.summary : null;
const byId = new Map(teams.map(team => [team.identity.id, team]));
const players = [...new Map(teams.flatMap(team => team.players.map(player => [player.id, { ...player, team: team.identity }]))).values()];
const playerById = new Map(players.map(player => [player.id, player]));
const values = new Map([...(mine?.rosterValues ?? []), ...data.faces.map(face => face.player).filter(Boolean)].map(player => [player.id, player.value]));
const current = mine?.matchup ?? teams[0].currentMatchup;
const pairs = [...new Map(teams.filter(team => team.currentMatchup).map(team => [team.currentMatchup.home.id, team.currentMatchup])).values()];
const edition = data.archive[0]; // The coherent dated archive; home.edition's conflicting pairing is not joined to its prose.
const shortDate = value => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const date = value => value == null ? 'Not supplied' : new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = team => `${team.wins}–${team.losses}${team.ties ? '–' + team.ties : ''}`;
const name = id => byId.get(String(id))?.identity.name ?? String(id);
const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const teamLink = team => `<a href="/teams/${esc(team.id)}">${esc(team.name)}</a>`;
const playerLink = player => `<a href="/player/${esc(player.id)}">${esc(player.fullName ?? player.name)}</a>`;
const links = items => `<div class="linkrow">${items.map(([label, href]) => `<a href="${esc(href)}">${esc(label)}</a>`).join('')}</div>`;
const note = text => `<p class="note">${esc(text)}</p>`;
const question = (number, label, title, context, action = '') => `<div class="question"><p class="number">${number} / ${label}</p><h2>${title}</h2>${context ? `<p>${context}</p>` : ''}${action}</div>`;

function rosterRows(rows, prices = false) {
  return `<ul class="roster-list">${rows.map(player => `<li><div>${playerLink(player)}<small>${esc(player.position ?? 'Position unavailable')} · ${esc(player.nbaTeam ?? playerById.get(player.id)?.nbaTeam ?? 'NBA team unavailable')}</small></div>${prices ? `<span class="roster-value numeric">${money(player.value)} FAAB</span>` : ''}</li>`).join('')}</ul>`;
}

function modelSource(pick) {
  const result = pick.result, weekly = data.weekly;
  return `<details class="model-source"><summary>Saved model and evidence</summary><p>Saved ${date(weekly.generatedAt)}. ${esc(weekly.status)} slate; ${esc(pick.status)} pick.</p><p>Model ${esc(result.model)}. Prompt ${esc(result.promptVersion)}. Input snapshot ${result.snapshot ? 'supplied' : 'not supplied'}; slate snapshot ${weekly.snapshot ? 'supplied' : 'not supplied'}.</p><p>League ${esc(weekly.leagueId)}, ${esc(weekly.season)}, Week ${weekly.week}. Roster IDs ${pick.teamIds.map(esc).join(' / ')}.</p><p>${esc(pick.message)}. Input evidence: ${pick.evidence.map(esc).join(' ') || 'Not supplied'}</p><p>Returned evidence: ${result.evidence.map(esc).join(' ') || 'Not supplied'}</p></details>`;
}

function modelPick(pair, lead = false) {
  const pick = data.weekly?.matchups.find(item => item.teamIds.includes(pair.home.id) && item.teamIds.includes(pair.away.id));
  if (!pick?.result) return `<p class="model-note">Saved pick unavailable. No choice, probability or confidence is inferred.</p>`;
  const result = pick.result;
  if (!lead) return `<p class="model-note">Returned choice: <strong>${esc(name(result.choice))}</strong>. Independent confidence <strong class="numeric">${Math.round(result.confidence * 100)}%</strong>. ${aiState === 'stale' ? 'Stale; not a fresh forecast.' : 'Saved fixture result.'}</p>${modelSource(pick)}`;
  const probabilities = result.probabilities.map(item => `<p>${esc(name(item.choice))} <strong class="numeric">${Math.round(item.probability * 100)}%</strong></p>`).join('');
  return `${lead ? `<h3>What did the saved model return?</h3>` : ''}<p class="${lead ? 'returned' : 'model-note'}">Returned choice: <strong>${esc(name(result.choice))}</strong></p><div class="probabilities">${probabilities}</div>${lead ? `<div class="probability" aria-hidden="true"><span style="width:${result.probabilities[0].probability * 100}%"></span></div>` : ''}<p class="model-note">Independent confidence <strong class="numeric">${Math.round(result.confidence * 100)}%</strong>. ${aiState === 'stale' ? 'Stale saved result; not a fresh forecast.' : 'Saved fixture result.'}</p>${lead ? note(result.probabilityLabel + '. The returned choice differs from the larger probability; both are retained.') : ''}${modelSource(pick)}`;
}

function weekHome() {
  return `<section class="passage" id="week" aria-labelledby="week-title">${question('01', 'IN PLAY', '<span id="week-title">How’s our week looking?</span>', `Week ${current.week} · Incomplete`)}<div class="answer"><p class="status">${member ? 'Your pairing' : 'League pairing'} · No final result</p><div class="scoreboard">${[['home', 'homePoints'], ['away', 'awayPoints']].map(([side, points]) => `<div><h3>${teamLink(current[side])}</h3><p class="note">${esc(current[side].managerName)} · ${record(current[side])} current record</p><p class="score ${current[points] == null ? 'pending' : ''}">${score(current[points])}</p><p class="note">${current[points] == null ? 'Score not reported' : 'Known current score'} · ${side}</p></div>`).join('')}</div><p class="measure">There’s no result to call yet. A known <span class="numeric">0.0</span> is a score; <strong>Pending</strong> means the score is missing.</p>${links([[member ? 'My team' : 'League teams', member ? '/team' : '/teams']])}<div class="saved-pick">${modelPick(current, true)}${data.weekly ? note(`Week ${data.weekly.week} saved slate · ${shortDate(data.weekly.generatedAt)} · ${aiState === 'stale' ? 'Stale' : 'Ready'}`) : note('Missing saved slate')}${links([['Open all five saved picks', '/ai-decides']])}</div></div></section>`;
}

function valueHome() {
  if (!mine) {
    const curated = [data.faces[0], data.faces[1], data.faces[2], data.faces[7]];
    return `<section class="passage" id="value" aria-labelledby="value-title">${question('02', 'ROSTER COMPANY', '<span id="value-title">Who sets the bar?</span>', 'Four franchise anchors, selected for a quick look around the league.', links([['All ten teams', '/teams'], ['Player market', '/stocks#player-board']]))}<div class="answer"><h3>A face and a modeled value</h3><p class="measure">Each player below is their franchise’s highest current modeled FAAB value. These values describe the supplied market model, not player form or a trade price.</p><ul class="face-list">${curated.map(face => `<li><img src="${esc(inventory.portraits[face.player.id])}" alt="" width="64" height="72" loading="lazy"><div>${playerLink(face.player)}<p class="face-value">${money(face.player.value)}</p><p class="note">${esc(face.player.position)} · modeled FAAB</p><p>${teamLink(face.team)}</p></div></li>`).join('')}</ul><p class="cohort-note note">4 of 10 franchise anchors shown. Search any team or player for current ownership; full rosters remain on team profiles.</p>${note(`Fixture checked ${date(data.home.checkedAt)}.`)}${note(inventory.missing.history)}<p class="note">This is the public league edition. Personal roster totals, form and team wire belong to the member fixture.</p></div></section>`;
  }
  const guide = mine.playerGuide;
  const completed = [...new Map([...guide.best, ...guide.rough].map(player => [player.id, player])).values()].sort((a, b) => b.value - a.value);
  return `<section class="passage" id="value" aria-labelledby="value-title">${question('02', 'YOUR WORKING ROSTER', '<span id="value-title">What are you carrying?</span>', `${esc(mine.team.name)}. ${mine.coverage.roster} roster players.`, links([['My roster', `/teams/${mine.team.id}#team-roster`], ['Player market', '/stocks#player-board']]))}<div class="answer"><p class="total">${money(mine.valuation.total)}</p><p>Current modeled FAAB ${mine.valuation.complete ? 'total' : 'subtotal'} · <span class="numeric">${mine.valuation.priced} priced / ${mine.valuation.unpriced} unpriced</span></p><p class="note">${esc(mine.market.pricingBasis)} model · computed ${date(mine.market.updatedAt)}. A roster valuation, not your FAAB balance.</p><ul class="price-list">${mine.players.map(player => `<li>${playerLink(player)}<strong>${money(player.value)}</strong><small>${esc(player.position)} · modeled FAAB · ${player.changePct >= 0 ? 'Up' : 'Down'} ${Math.abs(player.changePct)}% versus saved quote</small></li>`).join('')}</ul><details><summary>All ${mine.rosterValues.length} current roster values</summary>${rosterRows(mine.rosterValues, true)}<p class="note">${mine.valuation.priced} priced of ${mine.coverage.roster}. No quote is replaced with zero.</p></details><p class="note">${esc(inventory.missing.history)}</p><div class="notebook"><div><h3>Who’s worth a closer look?</h3><p class="note">${esc(guide.watch.label)}</p><ul class="watch-list">${guide.watch.rows.map(player => `<li>${playerLink(player)}<strong class="numeric">${player.value} EMA FP/G · ${player.games} observed games</strong><p class="note">${esc(player.note)}</p></li>`).join('')}</ul>${note(guide.watch.message)}</div><div><h3>And the completed week?</h3><p class="note">${esc(guide.period)}</p><ul class="completed-list">${completed.map(player => `<li><div>${playerLink(player)}<small>${guide.best.some(row => row.id === player.id) ? 'Best list' : ''}${guide.best.some(row => row.id === player.id) && guide.rough.some(row => row.id === player.id) ? ' + ' : ''}${guide.rough.some(row => row.id === player.id) ? 'Rough list' : ''}</small></div><div class="metric numeric">${player.value} FP<small>${player.games} GP</small></div></li>`).join('')}</ul><p class="note cohort-note">${esc(guide.coverage)}</p><details><summary>Completed-week evidence</summary><p>${esc(guide.recapMessage)}</p><p>${esc(inventory.missing.recap)}</p></details></div></div></div></section>`;
}

function leagueHome() {
  return `<section class="passage" id="league" aria-labelledby="league-title">${question('03', 'THE WHOLE ROOM', '<span id="league-title">Where does everyone stand?</span>', 'Ten teams. Current fixture order, with the rest of Week 3 alongside.', links([['Explore teams', '/teams'], ['League intel', '/intel']]))}<div class="answer league-reading"><div><h3>Current standings</h3><p class="note">Rank · team / manager · W–L / PF</p><ol class="standing-list">${data.home.hub.standings.map(standing => `<li class="${mine?.team.id === standing.team.id ? 'is-mine' : ''}"><span class="numeric">${standing.rank}</span><div class="standing-name">${teamLink(standing.team)}<small>${esc(standing.team.managerName)}${mine?.team.id === standing.team.id ? ' · Your team' : ''}</small></div><div class="standing-record numeric">${record(standing)}<small>${(standing.pointsFor / 100).toFixed(2)} PF</small></div></li>`).join('')}</ol><p class="note">PF displays supplied pointsFor / 100. Current records stay separate from 2025 history.</p><details><summary>NeuralNets’ previous-manager context</summary><p>2025: ${byId.get('8').previousSeason.wins}–${byId.get('8').previousSeason.losses}. ${esc(byId.get('8').previousSeason.ownerNote)} This is not today’s manager’s current record.</p></details><p class="note">${esc(inventory.missing.power)}</p></div><div><h3>Elsewhere in Week ${current.week}</h3><p class="note">All four other pairings are incomplete. Values are current scores.</p><ol class="pairing-list">${pairs.filter(pair => pair.home.id !== current.home.id).map(pair => `<li><h4>${teamLink(pair.home)} / ${teamLink(pair.away)}</h4><p class="pair-score">${score(pair.homePoints)} / ${score(pair.awayPoints)}</p>${data.weekly?.matchups.find(pick => pick.teamIds.includes(pair.home.id))?.result.probabilities.map(item => `<p class="pair-probability">${esc(name(item.choice))}: <strong class="numeric">${Math.round(item.probability * 100)}%</strong></p>`).join('') ?? ''}${modelPick(pair)}</li>`).join('')}</ol>${links([['Open AI Decides', '/ai-decides']])}</div></div></section>`;
}

function wireHome() {
  return `<section class="passage" id="wire" aria-labelledby="wire-title">${question('04', 'THE CONVERSATION', '<span id="wire-title">What changed around here?</span>', 'Sample Week 3 moves, with their limits left in view.', links([['All transactions', '/transactions'], ['News', '/intel']]))}<div class="answer wire-reading"><div><h3>Three moves on the league wire</h3><ul class="wire-list">${data.home.hub.transactions.map(move => `<li><h3>${esc(move.summary)}</h3><p>${move.teamIds.map(id => teamLink(byId.get(id).identity)).join(' / ')} · Week ${move.week} · ${esc(move.type.replaceAll('_', ' '))}</p><p class="note">${date(move.createdAt)}. No player add/drop legs supplied; the affected players are unknown.</p></li>`).join('')}</ul></div><div>${mine ? `<h3>Your team headlines</h3><ul class="wire-list">${mine.news.map(story => `<li><a href="${esc(story.url)}">${esc(story.headline)}</a><p class="note">${esc(story.outlet.name)} · ${date(story.publishedAt)}</p></li>`).join('')}</ul><p class="note">These supplied headlines contain no further report or injury claim.</p>` : `<h3>Keep the question specific.</h3><p>Search a team to see its current roster and opponent. Search a player to check ownership and any supplied quote.</p><p><button class="action" type="button" data-query="NeuralNets">Look up NeuralNets</button></p><p class="note">Personal team headlines are not supplied in the public fixture.</p>`}<h3>Looking for a trade?</h3><p>Use modeled values as context, then build both sides in the existing analyzer.</p>${links([['Trade analyzer', '/trade-analyzer'], ['Stocks', '/stocks#player-board']])}</div></div></section>`;
}

function spotlight(story) {
  return `<article class="spotlight"><p class="kicker">${esc(story.periodLabel)}</p><h3>${playerLink({ id: story.playerId, name: story.name })}</h3><p class="take">${esc(story.headline)}</p><p>${esc(story.opinion)}</p><div class="statline">${story.stats.map(stat => `<span><strong>${esc(stat.value)}</strong>${esc(stat.label)}</span>`).join('')}</div><p>${esc(story.statPeriod)}</p><p class="note">Dated editorial attribution: ${teamLink(byId.get(story.teamId).identity)}. Current roster: ${teamLink(playerById.get(story.playerId)?.team ?? byId.get(story.teamId).identity)}.</p><details><summary>Selection and source</summary><p>${esc(story.selectionReason)}</p><p><a href="${esc(story.source.url)}">${esc(story.source.label)}</a> · checked ${esc(story.source.checkedAt)}</p></details></article>`;
}

function readingHome() {
  return `<section class="passage" id="reading" aria-labelledby="reading-title">${question('05', 'DATED READING', '<span id="reading-title">What are we still talking about?</span>', `${esc(edition.dateLabel)}. Draft, not published.`, links([['Read the dated edition', `/weekly/${edition.id}`]]))}<div class="answer"><p class="editorial-intro">Three opinions from <em>${esc(edition.title)}</em>. October’s lens stays separate from current Week 3.</p><p class="note">Historical NBA averages and one college watch. These are sample editorial picks, not current-week awards or a new forecast.</p><div class="editorial-grid">${edition.playerSpotlights.map(spotlight).join('')}</div></div></section>`;
}

function archiveHome() {
  return `<section class="passage" id="archive" aria-labelledby="archive-title">${question('06', 'BEFORE YOU GO', '<span id="archive-title">Another chapter?</span>', 'Two dated drafts remain available. Nothing is silently replaced.', links([['Weekly archive', '/weekly'], ['League history', '/history']]))}<div class="answer">${data.archive.map(item => `<article class="archive-item"><p class="kicker">${esc(item.dateLabel)} · ${esc(item.status)} · not published</p><h3><a href="/weekly/${esc(item.id)}">${esc(item.title)}</a></h3><p><strong>${esc(item.game.title)}</strong></p>${item.game.scores ? `<p class="final-score">${item.game.scores.map(value => Number(value).toFixed(1)).join(' / ')} <span class="note">· 2025 final</span></p>` : `<p class="note">${item.game.teamIds.map(id => teamLink(byId.get(id).identity)).join(' / ')} · Dated Week ${item.game.leagueWeek} · upcoming in this draft · no final score</p>`}<p class="measure">${esc(item.game.context)}</p><details><summary>Edition context and sources</summary><p>${esc(item.game.selectionReason)}</p><p>Edition bounds: ${esc(item.startsAt)} to ${esc(item.endsAt)} (end exclusive).</p>${item.happenings.map(happening => `<p><a href="${esc(happening.href)}">${esc(happening.title)}</a> · ${esc(happening.dateLabel)}<br>${esc(happening.text)}</p>`).join('')}<ul>${item.sources.map(source => `<li><a href="${esc(source.url)}">${esc(source.label)}</a> · checked ${esc(source.checkedAt)}</li>`).join('')}</ul></details></article>`).join('')}<div class="closing"><div><h3>Got a minute at the line?</h3><p>Free Throw is available as local practice. Take a few shots, then return to the league.</p><p class="note">Practice scores stay in session. No league reward is claimed here.</p>${links([['Play Free Throw', '/arcade/free-throw'], ['Arcade', '/arcade']])}</div><a href="/arcade/free-throw" aria-label="Play Free Throw practice"><img src="${esc(inventory.assets.game)}" alt="Free Throw practice court preview" width="480" height="270" loading="lazy"></a></div></div></section>`;
}

$('#edition-label').textContent = member ? `Member fixture · ${mine.team.name}` : 'Public league fixture · 2026 season';
$('#search-coverage').textContent = `${teams.length} teams and ${players.length} players`;
$('#commons').innerHTML = `<div class="commons-heading"><h2>Already on the table</h2><p>Open answers. No search required.</p></div>${weekHome()}${valueHome()}${leagueHome()}${wireHome()}${readingHome()}${archiveHome()}`;
const switchUrl = new URL(location.href);
switchUrl.search = '';
switchUrl.hash = '';
switchUrl.searchParams.set('view', member ? 'public' : 'member');
if (aiState !== 'ready') switchUrl.searchParams.set('ai', aiState);
for (const id of ['edition-switch', 'edition-switch-footer']) {
  $('#' + id).href = switchUrl.href;
  $('#' + id).textContent = member ? 'View public edition' : 'View member edition';
}
const destinations = [['Home', '/'], ['News', '/intel'], ['Stocks / player board', '/stocks#player-board'], ['History', '/history'], ['Arcade', '/arcade'], ['AI Decides', '/ai-decides'], ['Teams', '/teams'], ['Transactions', '/transactions'], ['Trade analyzer', '/trade-analyzer'], ['Weekly archive', '/weekly'], ['Play Free Throw', '/arcade/free-throw'], ...(member ? [['My team', '/team'], ['My roster', `/teams/${mine.team.id}#team-roster`]] : [])];
$('#destination-links').innerHTML = destinations.map(([label, href]) => `<a href="${href}">${label}</a>`).join('');

function teamAnswer(team) {
  const pairing = team.currentMatchup;
  return `<p>${esc(team.identity.managerName)} manages ${esc(team.identity.name)}. ${record(team.currentRecord)} current record; ${team.players.length} players.</p>${pairing ? `<p>Week ${pairing.week}: ${teamLink(pairing.home)} ${score(pairing.homePoints)} / ${teamLink(pairing.away)} ${score(pairing.awayPoints)}. Current scores, incomplete.</p>` : note('Current opponent unavailable.')}<p>${esc(team.previousSeason.season)}: ${team.previousSeason.wins}–${team.previousSeason.losses}; finish ${team.previousSeason.finish}${team.previousSeason.finish === 1 ? ', champion' : ''}. ${esc(team.previousSeason.ownerNote ?? '')}</p>${links([['Team profile', `/teams/${team.identity.id}`], ['Full roster', `/teams/${team.identity.id}#team-roster`]])}<details><summary>All ${team.players.length} roster references</summary>${rosterRows(team.players)}</details>`;
}

function playerAnswer(player) {
  return `<p>${esc(player.position)} · ${esc(player.nbaTeam)}. Current roster: ${teamLink(player.team)}.</p>${values.has(player.id) ? `<p class="total">${money(values.get(player.id))}</p><p>Current modeled FAAB value. ${mine?.rosterValues.some(row => row.id === player.id) ? 'Member roster quote' : 'Franchise anchor quote'}.</p>${note(`Fixture checked ${date(data.home.checkedAt)}. Not a transaction price or performance rating.`)}` : note('A modeled quote is not supplied for this roster reference. No price is inferred.')}${links([['Player profile', `/player/${player.id}`], ['Player market', '/stocks#player-board'], ['Team roster', `/teams/${player.team.id}#team-roster`]])}`;
}
const taskResults = [
  ['week', member ? 'Your week, as it stands' : 'This week, as it stands', `Week ${current.week}: ${score(current.homePoints)} / ${score(current.awayPoints)}. Incomplete.`, 'this week matchup scores opponent ai decides probability picks', '#week'],
  ['value', member ? 'Your roster, priced' : 'Franchise anchors', member ? `${money(mine.valuation.total)} modeled FAAB; ${mine.valuation.priced} of ${mine.coverage.roster} priced.` : 'Four current franchise faces and modeled values.', 'roster value faab prices form watch notebook history', '#value'],
  ['league', 'Current league positions', 'Ten standings and four other current pairings.', 'teams standings rank power league matchups predictions picks', '#league'],
  ['wire', 'News and moves', 'Three sample Week 3 moves; no player legs supplied.', 'news transactions trade analyzer wire changes', '#wire'],
  ['reading', 'Three dated editorial picks', 'Oct 5–11, 2026 draft. NBA lookbacks and college watch.', 'edition embiid jokic dybantsa story october', '#reading'],
  ['archive', 'Two dated league editions', 'Draft archive, including the 2025 final lookback.', 'archive history weekly champion old editions', '#archive'],
  ['tools', 'League tools and destinations', 'Stocks, teams, trade analyzer, Arcade and more.', 'tools stocks arcade free throw play trade analyzer actions', '#destinations']
].map(([id, title, fact, keywords, href]) => ({ id, title, fact, keywords, type: 'task', render: () => `<p>${esc(fact)}</p><p>The open answer remains in the commons below.</p>${links([['Read the open answer', href]])}` }));
const teamResults = teams.map(team => ({ id: 'team-' + team.identity.id, title: team.identity.name, fact: `${team.identity.managerName} · ${record(team.currentRecord)} · ${team.players.length} players`, keywords: `team manager ${team.identity.managerName}`, type: 'team', render: () => teamAnswer(team) }));
const playerResults = players.map(player => ({ id: 'player-' + player.id, title: player.fullName, fact: `${player.position} · ${player.nbaTeam} · ${player.team.name}`, keywords: `player ${player.position} ${player.nbaTeam} ${player.team.name}`, type: 'player', render: () => playerAnswer(player) }));
const all = [...taskResults, ...teamResults, ...playerResults];
let state = { query: '', filter: 'all', sort: 'relevance', limit: 12, opened: null };
history.scrollRestoration = 'manual';

function getResults() {
  const query = normalize(state.query.trim());
  let list = all.filter(result => (state.filter === 'all' || state.filter === result.type) && (!query || query.split(/\s+/).every(word => normalize(`${result.title} ${result.fact} ${result.keywords}`).includes(word))));
  if (state.sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (query) {
    const weight = result => normalize(result.title).startsWith(query) ? 100 : normalize(result.title).includes(query) ? 80 : result.type === 'player' ? 50 : 20;
    list.sort((a, b) => weight(b) - weight(a));
  }
  return list;
}
function renderSearch() {
  const active = Boolean(state.query.trim()) || state.filter !== 'all';
  $('#query').value = state.query;
  $('#clear-query').hidden = !active;
  $('#search-results').hidden = !active;
  $('#result-sort').value = state.sort;
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter)));
  if (!active) { $('#results').innerHTML = ''; return; }
  const list = getResults();
  $('#result-heading').textContent = state.query.trim() ? `Results for “${state.query.trim()}”` : 'Local index';
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'match' : 'matches'}${list.length > state.limit ? ` · showing ${state.limit}` : ''}`;
  $('#results').innerHTML = list.slice(0, state.limit).map(result => `<article class="result ${state.opened === result.id ? 'is-open' : ''}"><button type="button" class="result-toggle" id="trigger-${result.id}" data-result="${result.id}" aria-expanded="${state.opened === result.id}" aria-controls="answer-${result.id}"><span class="result-title">${esc(result.title)}</span><span class="result-fact">${esc(result.fact)}</span><span class="open-word">${state.opened === result.id ? 'Close' : 'Open'}</span></button>${state.opened === result.id ? `<div class="inline-answer" id="answer-${result.id}">${result.render()}<button type="button" data-close="${result.id}">Back to results</button></div>` : `<div id="answer-${result.id}" hidden></div>`}</article>`).join('') || `<div class="empty"><h3>No local match.</h3><p>Try a surname, team, NBA abbreviation or league task. The commons remains open below.</p></div>`;
  $('#more-results').hidden = list.length <= state.limit;
}
function stateUrl() {
  const url = new URL(location.href);
  for (const key of ['q', 'type', 'order', 'open']) url.searchParams.delete(key);
  if (state.query) url.searchParams.set('q', state.query);
  if (state.filter !== 'all') url.searchParams.set('type', state.filter);
  if (state.sort !== 'relevance') url.searchParams.set('order', state.sort);
  if (state.opened) url.searchParams.set('open', state.opened);
  return url;
}
function saveNavigation(push = false, focus = null) {
  const snapshot = { commons11: true, ...state, focus, scroll: scrollY };
  if (push) {
    if (history.state?.commons11) history.replaceState({ ...history.state, scroll: scrollY }, '');
    history.pushState(snapshot, '', stateUrl());
  } else history.replaceState(snapshot, '', stateUrl());
}
function focusQuery() { $('#query').focus({ preventScroll: true }); $('#query').scrollIntoView({ block: 'center', behavior: 'instant' }); }
function resetSearch() { state = { query: '', filter: 'all', sort: 'relevance', limit: 12, opened: null }; renderSearch(); saveNavigation(true, 'query'); focusQuery(); }
function closeAnswer(id) {
  if (history.state?.commons11 && history.state.opened === id && history.state.fromResults) { history.back(); return; }
  state.opened = null; renderSearch(); saveNavigation(false, 'trigger-' + id); $('#trigger-' + id)?.focus();
}
$('#search-trigger').addEventListener('click', focusQuery);
$('#query').addEventListener('input', event => { state.query = event.target.value; state.limit = 12; state.opened = null; renderSearch(); });
$('#search-form').addEventListener('submit', event => { event.preventDefault(); renderSearch(); saveNavigation(true, 'query'); $('#results .result-toggle')?.focus(); });
$('#clear-query').addEventListener('click', resetSearch);
$('#return-home').addEventListener('click', () => { resetSearch(); $('#commons').focus({ preventScroll: true }); $('#commons').scrollIntoView({ block: 'start', behavior: 'instant' }); });
$('#result-sort').addEventListener('change', event => { state.sort = event.target.value; state.opened = null; renderSearch(); saveNavigation(true, 'result-sort'); });
$('#more-results').addEventListener('click', () => { state.limit += 12; renderSearch(); saveNavigation(false, 'more-results'); $('#more-results').focus({ preventScroll: true }); });
document.addEventListener('click', event => {
  const example = event.target.closest('[data-query]');
  if (example) { state = { query: example.dataset.query, filter: 'all', sort: 'relevance', limit: 12, opened: null }; renderSearch(); saveNavigation(true, 'query'); focusQuery(); return; }
  const filter = event.target.closest('[data-filter]');
  if (filter) { state.filter = filter.dataset.filter; state.limit = 12; state.opened = null; renderSearch(); saveNavigation(true, 'query'); return; }
  const close = event.target.closest('[data-close]');
  if (close) { closeAnswer(close.dataset.close); return; }
  const result = event.target.closest('[data-result]');
  if (result) {
    const id = result.dataset.result;
    if (state.opened === id) { closeAnswer(id); return; }
    state.opened = null; saveNavigation(false, 'trigger-' + id);
    state.opened = id; renderSearch(); saveNavigation(true, 'trigger-' + id);
    history.replaceState({ ...history.state, fromResults: true }, '');
    $('#trigger-' + id)?.focus({ preventScroll: true });
  }
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (event.target.closest('.inline-answer') || event.target.closest('.result.is-open')) { event.preventDefault(); closeAnswer(state.opened); }
  else if (event.target.id === 'query' && state.query) { event.preventDefault(); resetSearch(); }
});
window.addEventListener('popstate', event => {
  if (!event.state?.commons11) return;
  const saved = event.state;
  state = { query: saved.query, filter: saved.filter, sort: saved.sort, limit: saved.limit, opened: saved.opened };
  renderSearch(); window.scrollTo({ top: saved.scroll ?? 0, behavior: 'instant' });
  if (saved.focus) document.getElementById(saved.focus)?.focus({ preventScroll: true });
});
const initial = new URL(location.href).searchParams;
state.query = initial.get('q') ?? '';
if (['team', 'player', 'task'].includes(initial.get('type'))) state.filter = initial.get('type');
if (initial.get('order') === 'name') state.sort = 'name';
if (all.some(result => result.id === initial.get('open'))) state.opened = initial.get('open');
renderSearch(); saveNavigation();
Promise.resolve(document.fonts?.ready).then(() => { document.documentElement.dataset.homepageReady = '11'; });
