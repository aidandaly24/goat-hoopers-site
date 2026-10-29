import {inventory, data, mode, aiState, esc, money} from '../../data.js';

// This isolated home reads the shared fixture. No provider, model or auth calls.
if (!Array.isArray(data.home?.directory) || !Array.isArray(data.archive) || !Array.isArray(data.faces)) {
  throw new Error('The local folio fixture is incomplete.');
}
const member = mode === 'member' && data.personal.kind === 'member';
const personal = member ? data.personal.summary : null;
const directory = data.home.directory;
const identities = new Map(directory.map(t => [t.identity.id, t.identity]));
const byName = id => identities.get(String(id))?.name ?? String(id);
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamLink = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const playerLink = (id, label) => `<a href="/player/${esc(id)}">${esc(label)}</a>`;
const date = value => value == null ? 'Unavailable' : new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC');
const portrait = (id, label) => inventory.portraits[id] ? `<img src="${esc(inventory.portraits[id])}" alt="${esc(label)}" loading="lazy">` : '';
const pair = personal?.matchup ?? directory.find(t => t.currentMatchup)?.currentMatchup;
const chapters = [
  {id: 'week', title: 'Week 3, in progress', sub: 'The pairing. The picks. Nothing called final.'},
  {id: 'club', title: member ? 'Your club, in the margins' : 'Across the ten clubs', sub: member ? 'Current modeled value beside the scouting notebook' : 'A few roster anchors, then every club on the next leaf'},
  {id: 'league', title: 'A league, indexed', sub: 'Ten clubs and the table, with room for every name'},
  {id: 'stories', title: 'Pages from the season', sub: 'October drafts. A good week, a rough one, a watch.'},
  {id: 'next', title: 'Beyond this book', sub: 'A price to inspect, a game to play, a page to keep'}
];

function source(s) { return `<li><a href="${esc(s.url)}">${esc(s.label)}</a>; checked ${esc(s.checkedAt)}</li>`; }
function chapter(c, body, notes) {
  return `<section class="chapter chapter-${c.id}" id="${c.id}" aria-labelledby="heading-${c.id}"><h2 id="heading-${c.id}" class="spine-heading"><button class="spine" id="spine-${c.id}" data-fold="${c.id}" aria-expanded="false" aria-controls="notes-${c.id}"><span class="chapter-title">${esc(c.title)}</span><span class="chapter-subtitle">${esc(c.sub)}</span><span class="spine-action">Unfold notes</span></button></h2><div class="spread">${body}<div class="notes-leaf" id="notes-${c.id}" hidden>${notes}<button data-close="${c.id}">Fold notes</button></div><nav class="folio-foot" aria-label="${esc(c.title)} neighbouring leaves">${c.id !== 'week' ? `<a href="#${chapters[chapters.indexOf(c) - 1].id}">Previous: ${esc(chapters[chapters.indexOf(c) - 1].title)}</a>` : '<span>Keep reading the open folio</span>'}${c.id !== 'next' ? `<a href="#${chapters[chapters.indexOf(c) + 1].id}">Next: ${esc(chapters[chapters.indexOf(c) + 1].title)}</a>` : '<a href="#cover">Return to cover</a>'}</nav></div></section>`;
}
function savedPicks() {
  if (!data.weekly) return `<p class="status"><strong>Saved picks unavailable.</strong> No saved slate is supplied for this state.</p><p>No model runs here.</p><a href="/ai-decides">Open AI Decides</a>`;
  return `<p class="small">${aiState === 'stale' ? '<strong>Stale saved slate; reference only.</strong>' : 'Synthetic saved slate.'} Saved ${esc(date(data.weekly.generatedAt))}.</p><ol class="picks">${data.weekly.matchups.map(p => {
    const r = p.result;
    if (!r) return `<li><strong>${esc(p.teamIds.map(byName).join(' / '))}</strong><p>Saved pick unavailable.</p></li>`;
    return `<li><p class="pick-pair">${p.teamIds.map(id => teamLink(identities.get(id))).join(' / ')}</p><p><strong>Returned choice: ${esc(byName(r.choice))}</strong></p><p class="probabilities">${r.probabilities.map(v => `<span>${esc(byName(v.choice))} <b>${Math.round(v.probability * 100)}%</b></span>`).join('')}</p><p class="small">Independent confidence ${Math.round(r.confidence * 100)}%.</p></li>`;
  }).join('')}</ol><p class="small">Model probabilities, not calibrated sports odds. The returned 35% choice is preserved even when the other club has 65%.</p>`;
}
function aiNotes() {
  if (!data.weekly) return '<h3>Model notes</h3><p>No saved slate, snapshots or probabilities are supplied.</p>';
  return `<h3>Saved model receipts</h3><p>Season ${esc(data.weekly.season)}, Week ${data.weekly.week}; slate ${esc(data.weekly.status)}. Weekly snapshot: ${data.weekly.snapshot == null ? 'not supplied' : esc(JSON.stringify(data.weekly.snapshot))}.</p>${data.weekly.matchups.map(p => `<details class="receipt"><summary>${esc(p.teamIds.map(byName).join(' / '))}; ${esc(p.status)}</summary>${p.result ? `<p>Actual returned choice: ${esc(byName(p.result.choice))}; roster ID ${esc(p.result.choice)}. Model ${esc(p.result.model)}; prompt ${esc(p.result.promptVersion)}. Generated ${esc(date(data.weekly.generatedAt))}.</p><p>Input snapshot: ${p.result.snapshot == null ? 'not supplied' : esc(JSON.stringify(p.result.snapshot))}. Input evidence: ${p.evidence.map(esc).join(' ') || 'not supplied'} Returned evidence: ${p.result.evidence.map(esc).join(' ') || 'not supplied'}.</p><p>Baseline: ${p.baseline == null ? 'not supplied' : esc(JSON.stringify(p.baseline))}. ${esc(p.result.probabilityLabel)}.</p>` : '<p>No saved result.</p>'}</details>`).join('')}`;
}
function week() {
  const side = (t, score) => `<section class="team"><h3>${teamLink(t)}</h3><p>${esc(t.managerName)}</p><p class="small">Current record ${record(t)}</p><p class="score ${score == null ? 'pending' : ''}">${score == null ? 'Pending' : Number(score).toFixed(1)}</p></section>`;
  const matchup = pair ? `<div class="matchup">${side(pair.home, pair.homePoints)}<span class="versus">vs</span>${side(pair.away, pair.awayPoints)}</div>` : '<p>Current matchup unavailable.</p>';
  return chapter(chapters[0], `<div class="spread-columns week-spread"><div class="paper-leaf"><p class="eyebrow">Current matchup · synthetic</p>${matchup}<p class="status"><strong>Incomplete.</strong> 0.0 is a known score; Pending means no supplied score. Neither proves a completed result.</p><p class="small">Fixture checked ${esc(date(data.home.checkedAt))}. This is later than the review date, October 29.</p><div class="link-line">${member ? `<a href="/team">My team</a><a href="/teams/${esc(personal.team.id)}#team-roster">My roster</a>` : '<a href="/teams">Meet the clubs</a>'}<a href="#league">See the table</a></div><p class="margin-note">The season has more than one page. The October stories below keep their own dates and do not narrate this current matchup.</p></div><aside class="navy-leaf"><div class="leaf-heading"><h3>Five picks, as returned</h3><a href="/ai-decides">AI playground</a></div>${savedPicks()}</aside></div>`, aiNotes());
}
function guideRows(rows, unit) { return rows.map(p => `<li><span>${playerLink(p.id, p.name)}</span><span><strong>${p.value}</strong> ${unit}; ${p.games} GP</span></li>`).join(''); }
function club() {
  if (!personal) {
    const anchors = [data.faces[0], data.faces[1], data.faces[7]];
    return chapter(chapters[1], `<div class="spread-columns public-spread"><div class="navy-leaf"><p class="eyebrow">The public club desk</p><h3>Names you know.<br>Clubs worth following.</h3><p class="margin-note">Ten franchises share the table. These three anchors introduce the featured pair and NeuralNets; the full club index stays open below.</p><div class="link-line"><a href="#league">All ten clubs</a><a href="/teams">Team profiles</a></div><p class="small">No private roster subtotal or personal scouting is included in this edition.</p></div><div class="paper-leaf"><ol class="public-anchors">${anchors.map(f => `<li>${portrait(f.player.id, f.player.name)}<div><h3>${playerLink(f.player.id, f.player.name)}</h3><p>${teamLink(f.team)}</p><p>${esc(f.team.managerName)}</p><p><strong>${money(f.player.value)}</strong> modeled FAAB; ${esc(f.player.position)}</p></div></li>`).join('')}</ol><p class="small">Synthetic current modeled values, not transaction balances.</p></div></div>`, `<h3>Public edition</h3><p>All ten roster anchors and public roster routes appear in the league index. The member fixture adds its own quote, source coverage, team wire and scouting.</p><a href="?view=member#club">Compare member edition</a>`);
  }
  const p = personal, g = p.playerGuide;
  const rank = p.valuation.rank;
  return chapter(chapters[1], `<div class="spread-columns club-spread"><div class="paper-leaf"><p class="eyebrow">${esc(p.team.managerName)} · ${p.coverage.roster} roster players</p><h3 class="club-name">${teamLink(p.team)}</h3><p class="small">Standing ${p.standing.rank} of ${p.season.totalTeams}; current ${record(p.team)}.</p><p class="value-label">${p.valuation.complete ? 'Current modeled FAAB value' : 'Partial modeled FAAB subtotal'}</p><p class="value">${money(p.valuation.total)}</p><p>${p.valuation.priced} priced / ${p.coverage.roster} roster; ${p.valuation.unpriced} unpriced.${rank ? ` Value rank ${rank.rank} of ${rank.teams}.` : ' Value rank unavailable.'}</p><p class="small">${esc(p.market.pricingBasis)} modeled player prices. Quote ${esc(date(p.market.updatedAt))}; not a transaction balance.</p><ol class="top-values">${p.players.map(v => `<li>${portrait(v.id, v.name)}<div><strong>${playerLink(v.id, v.name)}</strong><span>${esc(v.position)}; ${v.changePct == null ? 'change unavailable' : `${v.changePct > 0 ? 'Up' : v.changePct < 0 ? 'Down' : 'Flat'} ${Math.abs(v.changePct)}%`}</span></div><strong>${money(v.value)}</strong></li>`).join('')}</ol><p class="small"><strong>Recorded value history unavailable.</strong> No producer is connected; no price line is invented.</p><div class="link-line"><a href="/team">My team</a><a href="/teams/${esc(p.team.id)}#team-roster">Full roster</a><a href="/stocks#player-board">Player board</a></div></div><div class="navy-leaf"><h3>Scouting notebook</h3><p class="small">${esc(g.watch.label)}</p><ul class="guide">${guideRows(g.watch.rows, 'EMA FPPG')}</ul><p class="small">${esc(g.watch.message)} Availability unknown.</p><h3 class="section-gap">Best & rough, completed Week 2</h3><p class="small">${esc(g.period)}</p><div class="completed"><section><h4>Best of the supplied cohort</h4><ol>${guideRows(g.best, 'points')}</ol></section><section><h4>Rough week</h4><ol>${guideRows(g.rough, 'points')}</ol></section></div><p class="small">${esc(g.coverage)} Synthetic recorded-week fixture, not official awards.</p><h3 class="section-gap">On your wire</h3><ul class="wire">${p.news.map(n => `<li><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="small">${esc(n.outlet.name)}; ${esc(date(n.publishedAt))}.</p></li>`).join('')}</ul></div></div>`, `<h3>Roster value coverage</h3><p>${p.valuation.priced} priced; ${p.valuation.unpriced} unpriced. ${esc(inventory.missing.history)}</p><ul class="roster-values">${p.rosterValues.map(v => `<li>${playerLink(v.id, v.name)}<span>${esc(v.position)}; ${money(v.value)}</span></li>`).join('')}</ul><h3>Completed-week basis</h3><p>${esc(g.recapMessage)} ${esc(inventory.missing.recap)} Eligible played: ${g.eligiblePlayed}.</p>`);
}
function league() {
  const rows = data.home.hub.standings.map(s => {
    const d = directory.find(d => d.identity.id === s.team.id), f = data.faces.find(f => f.team.id === s.team.id);
    return `<tr><th scope="row"><span class="rank">${s.rank}</span><span>${teamLink(s.team)}<small>${esc(s.team.managerName)}${f?.champion ? '; 2025 champion' : ''}</small></span></th><td data-label="W–L">${record(s)}</td><td data-label="PF">${(s.pointsFor / 100).toFixed(1)}</td><td class="roster-context"><a href="/teams/${esc(s.team.id)}#team-roster">${d.players.length} players</a>${f ? `<span>${playerLink(f.player.id, f.player.name)}<small>${money(f.player.value)} modeled FAAB</small></span>` : ''}${d.previousSeason.ownerNote ? `<small>${esc(d.previousSeason.ownerNote)}</small>` : ''}</td></tr>`;
  }).join('');
  return chapter(chapters[2], `<div class="league-intro"><h3>The table is open.</h3><p>2026 current standings and roster anchors. All current metrics are synthetic. PF is supplied pointsFor / 100; previous-season records stay separate.</p><p><strong>${data.home.hub.season.playoffTeams} playoff teams.</strong> Playoffs start Week ${data.home.hub.season.playoffWeekStart}.</p></div><table class="standings"><caption>Ten clubs · current W–L and points for (PF)</caption><thead><tr><th scope="col">Rank / club / manager</th><th scope="col">W–L</th><th scope="col">PF</th><th scope="col">Roster / anchor</th></tr></thead><tbody>${rows}</tbody></table><div class="league-bottom"><p><strong>Lineup Power unavailable.</strong> No producer snapshot is connected; no ranking is invented.</p><div class="link-line"><a href="/teams">All club profiles</a><a href="/transactions">Transactions</a><a href="/trade-analyzer">Trade analyzer</a></div></div>`, `<h3>Previous seasons, with their owners</h3><ul class="past-records">${directory.map(d => `<li><strong>${teamLink(d.identity)}</strong><span>${esc(d.previousSeason.season)}: ${d.previousSeason.wins}–${d.previousSeason.losses}; finish ${d.previousSeason.finish}.</span>${d.previousSeason.ownerNote ? `<p>${esc(d.previousSeason.ownerNote)}</p>` : ''}</li>`).join('')}</ul><p>Full rosters and player records use the direct team/profile destinations. The homepage curates anchor references rather than printing the 228-name dataset.</p>`);
}
function stories() {
  const e = data.archive[0], old = data.archive[1];
  return chapter(chapters[3], `<div class="story-spread"><div class="navy-leaf editorial"><p class="eyebrow">${esc(e.dateLabel)} · dated draft, not published</p><h3 class="story-title">${esc(e.title)}</h3><p class="small">${esc(e.startsAt)} to ${esc(e.endsAt)} (end exclusive). Archived October editorial, separate from current Week 3.</p><h4 class="section-gap">${esc(e.game.title)}</h4><p>${e.game.teamIds.map(id => teamLink(identities.get(id))).join(' vs ')}.</p><p><strong>${e.game.state === 'final' ? 'Historical final' : 'Upcoming in this dated draft; scores Pending'}.</strong></p><p>${esc(e.game.context)}</p><div class="section-gap"><h4>In the league margins</h4><ul class="wire">${e.happenings.map(h => `<li><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p><p class="small">${esc(h.dateLabel)} · dated 2026 editorial</p></li>`).join('')}</ul></div><a class="reading-link" href="/weekly/${esc(e.id)}">Read this dated edition</a></div><div class="story-picks">${e.playerSpotlights.map(s => `<article class="spotlight"><div class="story-portrait">${portrait(s.playerId, s.name)}</div><div><p class="eyebrow">${esc(s.periodLabel)}</p><h3>${esc(s.headline)}</h3><p><strong>${playerLink(s.playerId, s.name)}</strong>; ${esc(s.position)}; ${teamLink(identities.get(s.teamId))}</p><p class="stats">${s.stats.map(v => `${esc(v.value)} ${esc(v.label)}`).join(' / ')}</p><p class="small">${esc(s.statPeriod)} · source checked ${esc(s.source.checkedAt)}</p><p>${esc(s.opinion)}</p><p class="small">Dated sample editorial opinion; not a calculated weekly award.</p></div></article>`).join('')}</div></div><div class="archive-strip"><div><p class="eyebrow">${esc(old.dateLabel)} · draft sample, not published</p><h3>${esc(old.title)}</h3><p><strong>2025 historical final: ${old.game.scores.map(s => Number(s).toFixed(1)).join(' – ')}.</strong></p><p>${esc(old.game.context)}</p><p class="small">Historical result; not current Week 3. Source checked ${esc(old.sources[0].checkedAt)}.</p></div><div class="archive-actions"><a href="/weekly/${esc(old.id)}">Read the historical draft</a><a href="/weekly">All weekly editions</a><a href="/history">League history</a></div></div>`, `<h3>Selection and source notes</h3><p>${esc(e.game.selectionReason)}</p><ul class="source-list">${e.sources.map(source).join('')}</ul>${e.playerSpotlights.map(s => `<section class="source-note"><h4>${esc(s.name)}</h4><p>${esc(s.selectionReason)}</p><ul class="source-list">${source(s.source)}</ul></section>`).join('')}<section class="source-note"><h4>${esc(old.title)}</h4><p>${esc(old.startsAt)} to ${esc(old.endsAt)} (end exclusive). ${esc(old.game.selectionReason)}</p><ul class="source-list">${old.sources.map(source).join('')}</ul></section>`);
}
function next() {
  return chapter(chapters[4], `<div class="exit-spread"><div class="paper-leaf"><p class="eyebrow">Work the roster</p><h3 class="exit-title">What is the next move worth?</h3><p>Use the modeled FAAB player board to inspect a quote, or compare the two sides of a proposed trade. A modeled value is not a waiver balance.</p><div class="link-line"><a href="/stocks#player-board">Open Stocks</a><a href="/trade-analyzer">Compare a trade</a></div><div class="section-gap"><h4>Recent league moves · synthetic</h4><ul class="wire">${data.home.hub.transactions.map(m => `<li><p>${esc(m.summary)}</p><p class="small">Week ${m.week}; ${esc(m.type)}; ${esc(date(m.createdAt))}. No add/drop legs supplied.</p></li>`).join('')}</ul></div><a class="reading-link" href="/transactions">All transactions</a></div><div class="navy-leaf"><a href="/arcade/free-throw" class="game-image"><img src="${esc(inventory.assets.game)}" alt="Existing free-throw practice game" loading="lazy"></a><p class="eyebrow">Away from the table</p><h3>Take a few shots.</h3><p>Open the existing free-throw practice game. This folio does not start a ranked run or award FAAB.</p><div class="link-line"><a href="/arcade/free-throw">Play free throw</a><a href="/arcade">Visit the Arcade</a></div><div class="section-gap"><h4>Keep the league close</h4><div class="closing-links"><a href="/intel">News</a><a href="/ai-decides">AI Decides</a><a href="/teams">Teams</a><a href="/weekly">Weekly archive</a><a href="/history">History</a>${member ? '<a href="/team">My team</a>' : '<a href="/login">Member sign in</a>'}</div></div></div></div>`, `<h3>About this folio</h3><p>${esc(inventory.warning)} Current fixture checked ${esc(date(data.home.checkedAt))}; this is not actual today. The review date is October 29, 2026. All current scores, prices, form, news, moves and saved picks are synthetic.</p><p>${esc(inventory.missing.history)} ${esc(inventory.missing.power)} No model or provider runs, and switching the public/member fixture grants no account access.</p><a href="?view=${member ? 'public' : 'member'}">Compare ${member ? 'public' : 'member'} edition</a>`);
}

document.querySelector('#leaves').innerHTML = [week(), club(), league(), stories(), next()].join('');
document.querySelector('#edition-name').textContent = member ? 'Member folio' : 'Public folio';
document.querySelector('#compare').href = `?view=${member ? 'public' : 'member'}`;
document.querySelector('#compare').textContent = `${member ? 'Public' : 'Member'} edition`;
function fold(id, open, returnFocus = false) {
  const button = document.querySelector(`#spine-${id}`), notes = document.querySelector(`#notes-${id}`);
  if (!button || !notes) return;
  notes.hidden = !open;
  button.setAttribute('aria-expanded', String(open));
  button.querySelector('.spine-action').textContent = open ? 'Fold notes' : 'Unfold notes';
  button.closest('.chapter').classList.toggle('notes-open', open);
  document.querySelector('#announcer').textContent = `${chapters.find(c => c.id === id).title}: notes ${open ? 'unfolded' : 'folded'}. Main pages remain open.`;
  if (returnFocus) button.focus();
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-fold]');
  if (button) {
    const id = button.dataset.fold, open = button.getAttribute('aria-expanded') !== 'true';
    fold(id, open);
    if (open) {
      const notes = document.querySelector(`#notes-${id}`);
      notes.setAttribute('tabindex', '-1');
      notes.focus({preventScroll: true});
      notes.scrollIntoView({block: 'start', behavior: 'instant'});
    }
    return;
  }
  const close = event.target.closest('[data-close]');
  if (close) fold(close.dataset.close, false, true);
});
document.addEventListener('keydown', event => {
  const c = event.target.closest('.chapter');
  if (event.key === 'Escape' && c?.classList.contains('notes-open')) {
    event.preventDefault(); fold(c.id, false, true); return;
  }
  const spine = event.target.closest('[data-fold]');
  if (!spine) return;
  let i = chapters.findIndex(c => c.id === spine.dataset.fold);
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') i = (i + 1) % chapters.length;
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') i = (i - 1 + chapters.length) % chapters.length;
  else if (event.key === 'Home') i = 0;
  else if (event.key === 'End') i = chapters.length - 1;
  else return;
  event.preventDefault(); document.querySelector(`#spine-${chapters[i].id}`).focus();
});
// Native same-page anchors retain browser history and focus the destination.
document.addEventListener('click', event => {
  const a = event.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (target) { target.setAttribute('tabindex', '-1'); requestAnimationFrame(() => target.focus({preventScroll: true})); }
});
await document.fonts.ready;
document.documentElement.dataset.homepageReady = '13';
