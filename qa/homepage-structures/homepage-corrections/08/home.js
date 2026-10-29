import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// This isolated homepage reads the existing fixture; it owns no data producer.
// Fail explicitly at the boundary instead of silently making up a pairing.
const teams = data.home?.directory;
const standings = data.home?.hub?.standings;
if (!Array.isArray(teams) || !teams.length || !Array.isArray(standings) || !Array.isArray(data.archive)) {
  throw new Error('Rival halves requires the supplied league and archive fixture.');
}
const teamById = new Map(teams.map(team => [team.identity.id, team]));
const faceById = new Map(data.faces.map(face => [face.team.id, face]));
const rankById = new Map(standings.map(row => [row.team.id, row.rank]));
const pairs = [...new Map(teams.map(team => [team.currentMatchup.home.id, team.currentMatchup])).values()];
if (pairs.some(pair => !teamById.has(pair.home.id) || !teamById.has(pair.away.id))) {
  throw new Error('A supplied matchup references an unknown team.');
}
const personal = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
let pairIndex = Math.max(0, pairs.findIndex(pair => pair.home.id === personal?.team.id || pair.away.id === personal?.team.id));
const currentEdition = data.archive.find(edition => edition.id === '2026-W41');
const historicalEdition = data.archive.find(edition => edition.id === '2026-W40');
const link = (href, label, className = '') => `<a class="${className}" href="${esc(href)}">${esc(label)}</a>`;
const playerLink = player => link(`/player/${player.id ?? player.playerId}`, player.name ?? player.fullName);
const teamLink = team => link(`/teams/${team.id}`, team.name);
const record = row => `${row.wins}–${row.losses}${row.ties ? `–${row.ties}` : ''}`;
const date = value => new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
const portrait = (player, eager = false) => inventory.portraits[player.id ?? player.playerId]
  ? `<img src="${esc(inventory.portraits[player.id ?? player.playerId])}" alt="" width="160" height="120" loading="${eager ? 'eager' : 'lazy'}">`
  : `<span class="initials" aria-hidden="true">${esc((player.name ?? player.fullName).split(' ').map(part => part[0]).slice(0, 2).join(''))}</span>`;
const score = value => value == null ? 'Pending' : value.toFixed(1);
const savedPick = pair => data.weekly?.matchups.find(pick => pick.teamIds.includes(pair.home.id) && pick.teamIds.includes(pair.away.id));
const readyPick = pair => {
  const pick = savedPick(pair);
  return aiState === 'ready' && data.weekly?.status === 'ready' && pick?.status === 'ready' &&
    String(data.weekly.season) === String(data.home.hub.season.seasonYear) && data.weekly.week === pair.week ? pick : null;
};
const probability = (pick, id) => pick?.result.probabilities.find(row => row.choice === id)?.probability;
const unavailableAI = () => aiState === 'stale' ? 'Stale saved slate · current probabilities withheld.' : 'Saved weekly pick unavailable · no probability inferred.';
const half = (content, side) => `<div class="half ${side}">${content}</div>`;
const paired = (label, left, right, className = '') => `<div class="paired ${className}">${half(left, 'home')}<div class="seam">${label}</div>${half(right, 'away')}</div>`;

function pickProvenance(pair) {
  const pick = savedPick(pair);
  if (!pick || !data.weekly) return '<p class="muted">No saved choice, model or input snapshot is supplied.</p>';
  const result = pick.result;
  return `<details class="source-note"><summary>Model source & evidence</summary><p>${aiState === 'stale' ? 'Old saved example. ' : ''}Returned choice: ${esc(teamById.get(result.choice)?.identity.name ?? result.choice)}. Independent confidence: ${Math.round(result.confidence * 100)}%. ${esc(result.probabilityLabel)}.</p><p>Saved ${esc(date(data.weekly.generatedAt))}. Season ${esc(data.weekly.season)}, Week ${data.weekly.week}; league ${esc(data.weekly.leagueId)}. Model ${esc(result.model)}; prompt ${esc(result.promptVersion)}.</p><p>Input snapshot: ${result.snapshot == null ? 'not supplied' : esc(JSON.stringify(result.snapshot))}. Slate snapshot: ${data.weekly.snapshot == null ? 'not supplied' : esc(JSON.stringify(data.weekly.snapshot))}. Baseline: ${pick.baseline == null ? 'not supplied' : esc(JSON.stringify(pick.baseline))}.</p><p>Input evidence: ${esc(pick.evidence.join(' '))} Returned evidence: ${result.evidence.length ? esc(result.evidence.join(' ')) : 'none supplied'}. ${esc(pick.message)}. No model generation on page load.</p></details>`;
}

function identity(team, points, side) {
  const owned = personal?.team.id === team.identity.id;
  return `<div class="team-identity"><p class="label">${owned ? 'Your team' : side === 'home' ? 'Home side' : 'Away side'}</p><h2>${teamLink(team.identity)}</h2><p class="manager">${esc(team.identity.managerName)}</p><div class="score ${points == null ? 'pending' : ''}">${score(points)}</div><p class="score-status">${points == null ? 'Score unknown' : 'Known current score'} · not final</p><p class="record"><strong class="num">${record(team.currentRecord)}</strong> <span>current record · #${rankById.get(team.identity.id)}</span></p></div>`;
}

function anchor(team) {
  const face = faceById.get(team.identity.id);
  if (!face) return '<p>Anchor quote unavailable.</p>';
  return `<div class="anchor">${portrait(face.player, true)}<div><p class="label">Highest modeled FAAB</p><h3>${playerLink(face.player)}</h3><p><strong class="quote num">${money(face.player.value)}</strong> <span>FAAB · ${esc(face.player.position)}</span></p></div></div>`;
}

function pickHalf(pair, id) {
  const pick = readyPick(pair);
  const value = probability(pick, id);
  const label = `<p class="phone-team">${esc(teamById.get(id).identity.name)}</p>`;
  if (!pick || value == null) return `${label}<p class="ai-unavailable">${unavailableAI()}</p>`;
  return `${label}<div class="probability num">${Math.round(value * 100)}<span>%</span></div><div class="prob-track" aria-hidden="true"><span style="width:${value * 100}%"></span></div><p class="pick-kind">${pick.result.choice === id ? 'Returned model choice' : 'Other returned probability'}</p>`;
}

function rosterLens(team) {
  const owned = personal?.team.id === team.identity.id;
  const listedPlayers = owned ? personal.players : team.featuredPlayerIds.slice(0, 3).map(id => team.players.find(player => player.id === id)).filter(Boolean);
  const value = owned ? `<p class="label">Your modeled FAAB ${personal.valuation.complete ? 'total' : 'subtotal'}</p><p class="value-total num">${money(personal.valuation.total)}</p><p>${personal.valuation.priced}/${personal.coverage.roster} players priced · ${personal.valuation.unpriced} unpriced. Value rank ${personal.valuation.rank.rank} of ${personal.valuation.rank.teams}.</p>`
    : `<p class="label">Roster in focus</p><h3>${team.players.length} players, one side.</h3><p>2025: <strong class="num">${record(team.previousSeason)}</strong> · finished ${team.previousSeason.finish}. ${esc(team.previousSeason.ownerNote ?? '')}</p><p class="muted">Full-roster modeled value unavailable for this side.</p>`;
  return `<h3 class="phone-team">${esc(team.identity.name)}</h3>${value}<ul class="player-lines">${listedPlayers.map(player => `<li><span>${playerLink(player)}<small>${esc(player.position)}${player.nbaTeam ? ` · ${esc(player.nbaTeam)}` : ''}${owned ? ` · +${player.changePct}% modeled change` : ''}</small></span>${owned ? `<strong class="num">${money(player.value)}</strong>` : ''}</li>`).join('')}</ul>${owned ? `<p class="source-line">${esc(personal.market.pricingBasis)} pricing · computed ${esc(date(personal.market.updatedAt))}. Modeled quotes, not transactions.</p>` : ''}<div class="actions">${link(owned ? '/team' : `/teams/${team.identity.id}`, owned ? 'My team' : 'Team profile')}${link(`/teams/${team.identity.id}#team-roster`, `Full ${team.players.length}-player roster`)}</div>`;
}

function pairReading() {
  const pair = pairs[pairIndex];
  const home = teamById.get(pair.home.id), away = teamById.get(pair.away.id), pick = readyPick(pair);
  return `<div id="pair-reading" aria-label="Selected matchup">${paired(`<span>Week</span><strong class="week-number num">${pair.week}</strong><span>2026</span><span>Current · not final</span>`, identity(home, pair.homePoints, 'home'), identity(away, pair.awayPoints, 'away'), 'identity-row')}${paired('Roster anchors', anchor(home), anchor(away), 'anchor-row')}${paired('Saved model probabilities', pickHalf(pair, pair.home.id), pickHalf(pair, pair.away.id), 'probability-row')}<div class="shared-note"><p>${pick ? `Returned choice: <strong>${esc(teamById.get(pick.result.choice).identity.name)}</strong> · independent confidence <strong class="num">${Math.round(pick.result.confidence * 100)}%</strong>. The returned choice differs from the larger probability in this sample.` : unavailableAI()}</p><p class="muted">Synthetic model estimates, not calibrated sports odds.${data.weekly ? ` Saved ${esc(date(data.weekly.generatedAt))}.` : ''}</p>${pickProvenance(pair)}${link('/ai-decides', 'Open AI Decides')}</div>${paired('Roster lens', rosterLens(home), rosterLens(away), 'roster-lens')}<div class="shared-note compact-note"><p>${esc(inventory.missing.history)} ${esc(inventory.missing.power)}</p></div></div>`;
}

function memberDesk() {
  if (!personal) {
    const champion = teams.find(team => faceById.get(team.identity.id)?.champion);
    const neural = teamById.get('8');
    return `<section class="context-desk page-section" aria-labelledby="context-heading"><div class="section-heading"><p class="label">Before Week 3</p><h2 id="context-heading">The names behind the numbers.</h2></div><div class="context-columns"><article><h3>${teamLink(champion.identity)}</h3><p class="large-copy">The defending champion.</p><p>2025: <strong class="num">${record(champion.previousSeason)}</strong>, finish ${champion.previousSeason.finish}. Managed by ${esc(champion.identity.managerName)}.</p>${link('/history', 'Read the inaugural season')}</article><article><h3>${teamLink(neural.identity)}</h3><p class="large-copy">A different manager. A new chapter.</p><p>2025: <strong class="num">${record(neural.previousSeason)}</strong>, finish ${neural.previousSeason.finish}. ${esc(neural.previousSeason.ownerNote)}</p><p>These are previous-season records, separate from the synthetic 2026 table.</p></article></div></section>`;
  }
  const guide = personal.playerGuide;
  return `<section class="context-desk page-section" aria-labelledby="context-heading"><div class="section-heading"><p class="label">${esc(personal.team.name)} · member desk</p><h2 id="context-heading">Form to watch. A week to learn from.</h2></div><div class="context-columns"><article><h3>On form</h3><p>${esc(guide.watch.label)}</p><ul class="form-lines">${guide.watch.rows.map(player => `<li><span>${playerLink(player)}<small>${esc(player.note)}</small></span><strong class="num">${player.value}<small>FP/G · ${player.games} GP</small></strong></li>`).join('')}</ul><p class="source-line">${esc(guide.watch.message)}</p></article><article><h3>Completed Week ${guide.previousWeek}</h3><p class="source-line">${esc(guide.period)}</p><div class="recap-contrast"><div><p class="label">Best recorded</p><h4>${playerLink(guide.best[0])}</h4><strong class="recap-points num">${guide.best[0].value}</strong><p>fantasy points · ${guide.best[0].games} GP</p></div><div><p class="label">Rough week</p><h4>${playerLink(guide.rough[0])}</h4><strong class="recap-points num">${guide.rough[0].value}</strong><p>fantasy points · ${guide.rough[0].games} GP</p></div></div><p class="source-line">${esc(guide.coverage)} Curated first entry from each supplied list. ${esc(inventory.missing.recap)}</p></article></div></section>`;
}

function slate() {
  return `<section id="slate" class="slate page-section" aria-labelledby="slate-heading"><div class="section-heading"><p class="label">Week 3 · 2026</p><h2 id="slate-heading">The whole week, head to head.</h2><p>All five current pairings. Current scores are incomplete; saved choices are model estimates.</p></div><div class="slate-labels" aria-hidden="true"><span>Home side</span><span>Current / saved</span><span>Away side</span></div>${pairs.map((pair, index) => {
    const pick = readyPick(pair);
    const side = id => `<h3>${teamLink(teamById.get(id).identity)}</h3><p><strong class="slate-score num">${score(id === pair.home.id ? pair.homePoints : pair.awayPoints)}</strong><span>current · not final</span></p><p class="saved-prob">${pick ? `${Math.round(probability(pick, id) * 100)}% saved probability${pick.result.choice === id ? ' · returned choice' : ''}` : unavailableAI()}</p>`;
    return `<article class="slate-pair" data-pair-row="${index}" ${index === pairIndex ? 'data-selected="true"' : ''}><div class="slate-matchup">${half(side(pair.home.id), 'home')}<div class="seam"><span>Week ${pair.week}</span>${pick ? `<span>${Math.round(pick.result.confidence * 100)}% independent confidence</span>` : ''}<button data-compare="${index}" aria-pressed="${index === pairIndex}" aria-label="Compare ${esc(pair.home.name)} and ${esc(pair.away.name)}">Compare</button></div>${half(side(pair.away.id), 'away')}</div><div class="slate-provenance">${pickProvenance(pair)}</div></article>`;
  }).join('')}<p class="source-line">${data.weekly ? `Saved ${esc(date(data.weekly.generatedAt))} · ${esc(data.weekly.status)} slate.` : 'No saved slate supplied.'} A returned choice and independent confidence remain separate from probabilities.</p></section>`;
}

function league() {
  return `<section id="league" class="league page-section" aria-labelledby="league-heading"><div class="section-heading"><p class="label">Ten teams · 2026</p><h2 id="league-heading">A place in the table. A move on the wire.</h2></div><div class="league-columns"><div><table class="standings"><caption>Current synthetic standings · PF in fantasy points</caption><thead><tr><th scope="col" aria-label="Rank">#</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${standings.map(row => `<tr ${personal?.team.id === row.team.id ? 'class="your-standing"' : ''}><td class="num">${row.rank}</td><td>${teamLink(row.team)}${personal?.team.id === row.team.id ? '<span class="you">You</span>' : ''}<span class="manager">${esc(row.team.managerName)} · ${teamById.get(row.team.id).players.length} players</span></td><td class="num">${record(row)}</td><td class="num">${(row.pointsFor / 100).toFixed(1)}</td></tr>`).join('')}</tbody></table><p class="source-line">PF uses supplied pointsFor ÷ 100. Six playoff teams; playoffs begin Week ${data.home.hub.season.playoffWeekStart}. ${esc(inventory.missing.power)}</p>${link('/teams', 'Explore all team profiles')}</div><aside class="wire" aria-labelledby="wire-heading"><h3 id="wire-heading">Recent league moves</h3><p class="source-line">Synthetic Week 3 summaries · ${esc(date(data.home.hub.transactions[0].createdAt))}</p>${data.home.hub.transactions.map(move => `<article class="wire-item"><h4>${esc(move.summary)}</h4><p>${move.teamIds.map(id => teamLink(teamById.get(id).identity)).join(', ')} · ${esc(move.type.replaceAll('_', ' '))}</p><p class="source-line">Add/drop legs are not supplied.</p></article>`).join('')}${link('/transactions', 'All transactions')}${personal ? `<div class="personal-wire"><h3>Your team wire</h3>${personal.news.map(item => `<article class="wire-item"><h4>${link(item.url, item.headline)}</h4><p class="source-line">${esc(item.outlet.name)} · ${esc(date(item.publishedAt))}</p></article>`).join('')}${link('/intel', 'News & Intel')}</div>` : `<div class="personal-wire"><h3>Follow the league</h3><p>Current matchups, team profiles and the dated notebook are open to this public preview. Personal valuation, form and team news belong to the member edition.</p>${link('/intel', 'News & Intel')}</div>`}</aside></div></section>`;
}

function story(player) {
  return `<article class="editorial-story">${portrait(player)}<div><p class="label">${esc(player.periodLabel)}</p><h3>${esc(player.headline)}</h3><h4>${playerLink(player)} · ${esc(player.position)}</h4><p>${esc(player.opinion)}</p><dl class="story-stats">${player.stats.map(stat => `<div><dt>${esc(stat.label)}</dt><dd class="num">${esc(stat.value)}</dd></div>`).join('')}</dl><p class="source-line">${esc(player.statPeriod)}</p><p class="source-line">${link(player.source.url, player.source.label)} · checked ${esc(player.source.checkedAt)}</p><details class="source-note"><summary>Editorial selection & ownership</summary><p>${esc(player.selectionReason)}</p><p>Edition team reference: ${esc(teamById.get(player.teamId).identity.name)}. Current profile links do not assert historical ownership.</p></details></div></article>`;
}

function notebook() {
  if (!currentEdition || !historicalEdition) return '<section class="page-section"><h2>Dated notebook unavailable</h2><p>No replacement editorial is invented.</p></section>';
  const edition = currentEdition, game = edition.game, old = historicalEdition, final = old.game;
  return `<section id="notebook" class="notebook page-section" aria-labelledby="notebook-heading"><div class="section-heading"><p class="label">${esc(edition.dateLabel)} · ${esc(edition.status)} sample · unpublished</p><h2 id="notebook-heading">${esc(edition.title)}</h2><p>Dated editorial, separate from the synthetic current Week 3. NBA and college periods remain attached to their numbers.</p></div><div class="edition-game"><div><p class="label">${esc(game.note)} · Week ${game.leagueWeek} · ${esc(game.state)}</p><h3>${esc(game.title)}</h3><p>${esc(game.context)}</p></div><div><p>${esc(game.selectionReason)}</p>${link(`/weekly/${edition.id}`, 'Open this dated edition')}<p class="source-line">${esc(edition.startsAt)} to ${esc(edition.endsAt)}. Published: ${edition.publishedAt ?? 'not published'}.</p></div></div><div class="editorial-pair">${edition.playerSpotlights.slice(0, 2).map(story).join('')}</div><div class="watch-story">${edition.playerSpotlights.slice(2).map(story).join('')}</div><details class="edition-sources source-note"><summary>Edition sources & check dates</summary><ul>${edition.sources.map(source => `<li>${link(source.url, source.label)} · checked ${esc(source.checkedAt)}</li>`).join('')}</ul></details><article class="archive-final"><div class="archive-heading"><p class="label">${esc(old.dateLabel)} · ${esc(old.status)} sample · unpublished</p><h3>${esc(old.title)}</h3><p>${esc(final.note)}. Historical result; separate from the current scores above.</p></div><div class="final-score"><div><h4>${teamLink(teamById.get(final.teamIds[0]).identity)}</h4><strong class="num">${final.scores[0].toFixed(1)}</strong></div><div class="seam">2025<br>Final</div><div><h4>${teamLink(teamById.get(final.teamIds[1]).identity)}</h4><strong class="num">${final.scores[1].toFixed(1)}</strong></div></div><p>${esc(final.context)}</p><div class="actions">${link(`/weekly/${old.id}`, 'Read the earlier edition')}${link('/weekly', 'Browse the weekly archive')}${link('/history', 'League history')}</div><details class="source-note"><summary>Historical source & dates</summary><p>${esc(final.selectionReason)}</p><p>${esc(old.startsAt)} to ${esc(old.endsAt)}. Published: ${old.publishedAt ?? 'not published'}.</p>${old.sources.map(source => `<p>${link(source.url, source.label)} · checked ${esc(source.checkedAt)}</p>`).join('')}</details></article></section>`;
}

function ending() {
  return `<section class="next-move page-section" aria-labelledby="next-heading"><div class="section-heading"><p class="label">Your next move</p><h2 id="next-heading">Set the roster. Settle it on court.</h2></div><div class="next-columns"><div><h3>The roster workbench</h3><p>Inspect modeled player prices in Stocks, open a team roster, or put two sides into the trade analyzer.</p><div class="actions">${link('/stocks#player-board', 'Open Stocks')}${link('/trade-analyzer', 'Analyze a trade')}${link(personal ? '/team' : '/teams', personal ? 'My team' : 'Team profiles')}</div></div><div class="play-entry"><img src="${esc(inventory.assets.game)}" alt="Free-throw practice court preview" width="240" height="135" loading="lazy"><div><h3>Free-throw practice</h3><p>A playable change of pace after the league read.</p><div class="actions">${link('/arcade/free-throw', 'Play Free Throw')}${link('/arcade', 'Visit the Arcade')}</div></div></div></div></section>`;
}

document.querySelector('#home-content').innerHTML = `<section id="matchup" class="matchup" aria-labelledby="matchup-heading"><div class="matchup-heading"><div><p class="label">GOAT Hoopers · 2026 season</p><h1 id="matchup-heading" tabindex="-1">Two sides. One week.</h1><p>${personal ? `Your Week 3 starts here, ${esc(personal.team.managerName)}.` : 'Your front row to all ten teams.'} Compare the current pair, then read the league.</p></div><label class="pair-selector" for="pair-selector">Compare a matchup<select id="pair-selector">${pairs.map((pair, index) => `<option value="${index}" ${index === pairIndex ? 'selected' : ''}>${esc(pair.home.name)} vs ${esc(pair.away.name)}</option>`).join('')}</select></label></div>${pairReading()}</section>${memberDesk()}${slate()}${league()}${notebook()}${ending()}`;
const oppositeMode = mode === 'member' ? 'public' : 'member';
document.querySelector('#edition-switch').href = `?view=${oppositeMode}${aiState !== 'ready' ? `&ai=${encodeURIComponent(aiState)}` : ''}`;
document.querySelector('#edition-switch').textContent = `${oppositeMode === 'member' ? 'Member' : 'Public'} preview`;
document.querySelector('#edition-label').textContent = personal ? `Member edition · ${personal.team.name}` : 'Public league edition';
document.querySelector('#footer-team').href = personal ? '/team' : '/teams';
document.querySelector('#footer-team').textContent = personal ? 'My team' : 'Team profiles';

function selectPair(index, focusHeading) {
  if (!Number.isInteger(index) || index < 0 || index >= pairs.length) return;
  pairIndex = index;
  document.querySelector('#pair-reading').outerHTML = pairReading();
  document.querySelector('#pair-selector').value = String(index);
  document.querySelectorAll('[data-compare]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.compare) === index)));
  document.querySelectorAll('[data-pair-row]').forEach(row => row.dataset.selected = String(Number(row.dataset.pairRow) === index));
  if (focusHeading) document.querySelector('#matchup-heading').focus();
}
document.querySelector('#pair-selector').addEventListener('change', event => selectPair(Number(event.target.value), false));
document.addEventListener('click', event => {
  const compare = event.target.closest('[data-compare]');
  if (compare) selectPair(Number(compare.dataset.compare), true);
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.getElementById(anchor.hash.slice(1));
  if (!target) return;
  if (target.id === 'provenance') target.open = true;
  document.querySelector('.global-menu').open = false;
  const focusTarget = target.id === 'provenance' ? target.querySelector('summary') : target.querySelector('h1,h2') ?? target;
  focusTarget.setAttribute('tabindex', '-1');
  requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openDisclosure = document.querySelector('.global-menu[open], #provenance[open]');
  if (openDisclosure) {
    openDisclosure.open = false;
    openDisclosure.querySelector('summary').focus();
  }
});
document.documentElement.dataset.homepageReady = '08';
