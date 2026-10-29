import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const $ = selector => document.querySelector(selector);
const home = data.home;
const member = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
const teams = home.hub.teams;
const team = id => teams.find(t => t.id === String(id));
const teamName = id => team(id)?.name ?? 'Unknown team';
const rec = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const teamLink = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const when = value => value == null ? 'Unavailable' : new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC');
const pct = value => `${Math.round(value * 100)}%`;
const points = value => value == null ? 'Pending' : Number(value).toFixed(1);
const currentPair = member?.matchup ?? home.directory[0].currentMatchup;
const pairs = home.directory.map(t => t.currentMatchup).filter((p, index, list) => p && list.findIndex(x => x && x.home.id === p.home.id && x.away.id === p.away.id) === index);
let active = 'matchup';
let directorySearch = '';
let directorySort = 'rank';
let lastTrigger = null;

const positions = [
  { id: 'matchup', position: 'Centre circle', title: `Week ${currentPair.week}`, fact: `${currentPair.home.name} / ${currentPair.away.name}`, score: true },
  { id: 'roster', position: 'Left wing', title: member ? 'Your team' : 'Faces & values', fact: member ? `${money(member.valuation.total)} modeled FAAB` : '10 franchise players · modeled FAAB' },
  { id: 'standings', position: 'Right wing', title: 'Standings', fact: `${home.hub.standings[0].team.name} leads · ${rec(home.hub.standings[0])}` },
  { id: 'edition', position: 'Left baseline', title: 'Weekly edition', fact: home.edition.title },
  { id: 'league', position: 'Right baseline', title: 'Teams & players', fact: '10 teams · 228 players' },
  { id: 'wire', position: 'Sideline', title: 'League wire', fact: '3 roster moves' },
];

$('#routes').innerHTML = [
  ['./index.html', 'Home'], ['/intel', 'News'], ['/stocks#player-board', 'Stocks'], ['/history', 'History'], ['/arcade', 'Arcade'], ['/ai-decides', 'AI Decides'], ['/teams', 'Teams'], ['/transactions', 'Transactions'], ['/trade-analyzer', 'Trade analyzer'], ['/weekly', 'Weekly archive'], ['/arcade/free-throw', 'Free Throw'], ...(member ? [['/team', 'Your team'], ['/teams/1#team-roster', 'Your full roster']] : []),
].map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
$('#compare').href = `?view=${mode === 'member' ? 'public' : 'member'}${aiState !== 'ready' ? `&ai=${esc(aiState)}` : ''}`;
$('#compare').textContent = mode === 'member' ? 'Public view' : 'Member view';
$('#zones').innerHTML = positions.map(p => `<button type="button" class="zone zone-${p.id}" data-zone="${p.id}" aria-controls="field-notes" aria-expanded="false"><strong>${esc(p.title)}</strong>${p.score ? `<span class="zone-fact">${esc(currentPair.home.name)}<br>vs ${esc(currentPair.away.name)}</span><span class="court-score"><span>${points(currentPair.homePoints)}</span><span>/ ${points(currentPair.awayPoints)}</span></span><span class="zone-fact">Incomplete</span>` : p.id === 'roster' && member ? `<span class="zone-fact"><span class="number">${money(member.valuation.total)}</span> modeled FAAB</span>` : `<span class="zone-fact">${esc(p.fact)}</span>`}<span class="sr-only">${esc(p.position)} field notes</span></button>`).join('');

function title(text, lead = '') {
  return `<h2 id="notes-title" tabindex="-1">${text}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}`;
}

function matchup() {
  return title(`Week ${currentPair.week}`) +
    `<div class="status"><strong>Incomplete scoring</strong>, ${esc(home.hub.season.seasonYear)}. Checked ${when(home.checkedAt)}</div>` +
    [currentPair.home, currentPair.away].map((t, i) => `<div class="pair"><h3>${teamLink(t)}</h3><span class="score">${points(i === 0 ? currentPair.homePoints : currentPair.awayPoints)}</span><p class="manager">${esc(t.managerName)} · ${rec(t)} current record</p></div>`).join('') +
    `<div class="action-links"><a href="/ai-decides">AI Decides</a><a href="/teams">Compare teams</a>${member ? '<a href="/team">Your team</a>' : ''}</div><h3>Saved AI picks</h3><p class="small">${data.weekly ? `${aiState === 'stale' || data.weekly.status === 'stale' ? '<strong>Stale saved slate.</strong> Historical output retained; it is not a current pick.' : 'Synthetic model output.'} Generated ${when(data.weekly.generatedAt)}.` : '<strong>Saved AI unavailable.</strong> No model result is supplied for this state.'}</p>` + pairs.map(p => aiRow(p)).join('');
}

function aiRow(p) {
  const saved = data.weekly?.matchups.find(m => m.teamIds.includes(p.home.id) && m.teamIds.includes(p.away.id));
  const result = saved?.result;
  const isCurrentPair = p.home.id === currentPair.home.id && p.away.id === currentPair.away.id;
  return `<article class="ai-row"><h3${isCurrentPair ? ' class="sr-only"' : ''}>${esc(p.home.name)} / ${esc(p.away.name)}</h3>${isCurrentPair ? '' : `<p class="small">Week ${p.week} · ${rec(p.home)} / ${rec(p.away)} · ${points(p.homePoints)} / ${points(p.awayPoints)} · incomplete</p>`}${result ? `<p class="ai-choice">Returned choice: ${esc(teamName(result.choice))} (${pct(result.probabilities.find(p => p.choice === result.choice)?.probability ?? 0)})</p>${result.probabilities.map(prob => `<div class="probability"><div><span>${esc(teamName(prob.choice))}</span><strong>${pct(prob.probability)}</strong></div><meter min="0" max="1" value="${prob.probability}" aria-label="${esc(teamName(prob.choice))} model probability">${pct(prob.probability)}</meter></div>`).join('')}<p class="small">Independent confidence: ${pct(result.confidence)}. ${esc(result.probabilityLabel)}.</p><details><summary>Model, input & evidence</summary><dl><dt>Saved status</dt><dd>${esc(aiState === 'stale' ? 'Stale' : saved.status)} · ${esc(saved.message)}</dd><dt>Generated</dt><dd>${when(data.weekly.generatedAt)}</dd><dt>Model / prompt</dt><dd>${esc(result.model)} / ${esc(result.promptVersion)}</dd><dt>Input snapshot</dt><dd>${result.snapshot ? esc(JSON.stringify(result.snapshot)) : 'Unavailable — null in the fixture.'}</dd><dt>Slate snapshot / baseline</dt><dd>${data.weekly.snapshot ? esc(JSON.stringify(data.weekly.snapshot)) : 'Slate snapshot unavailable'} / ${saved.baseline ? esc(JSON.stringify(saved.baseline)) : 'baseline unavailable'}</dd><dt>Input evidence</dt><dd>${saved.evidence.map(esc).join(' ') || 'None supplied.'}</dd><dt>Result evidence</dt><dd>${result.evidence.map(esc).join(' ') || 'No additional result evidence supplied.'}</dd><dt>Scope</dt><dd>Season ${esc(data.weekly.season)}, Week ${data.weekly.week}, team IDs ${saved.teamIds.map(esc).join(' / ')}. Synthetic fixture only.</dd></dl></details>` : '<p class="status">Saved pick unavailable · no probabilities or confidence invented.</p>'}</article>`;
}

function faces(showHeading = true) {
  return `${showHeading ? '<h3>Faces of the ten teams</h3>' : ''}<p class="small">Each franchise’s top player by supplied modeled value. A price is a model, not a transaction or form score.</p>` + data.faces.map(f => `<div class="face-row">${inventory.portraits[f.player.id] ? `<img src="${esc(inventory.portraits[f.player.id])}" alt="" width="52" height="60">` : '<span aria-hidden="true"></span>'}<div>${playerLink(f.player.id, f.player.name)}<small>${esc(f.player.position)} · ${teamLink(f.team)}${f.champion ? ' · defending champion' : ''}</small></div><span class="number">${money(f.player.value)}</span></div>`).join('');
}

function roster() {
  if (!member) return title('Faces & values') + faces(false) + `<div class="status">${esc(inventory.missing.power)}</div><p>${esc(inventory.missing.history)}</p><div class="action-links"><a href="/stocks#player-board">Explore Stocks</a><a href="/trade-analyzer">Analyze a trade</a></div>`;
  const v = member.valuation;
  const guide = member.playerGuide;
  const uniqueRecap = new Map();
  for (const [label, rows] of [['Best', guide.best], ['Rough', guide.rough]]) for (const row of rows) {
    const existing = uniqueRecap.get(row.id);
    if (existing) existing.labels.push(label); else uniqueRecap.set(row.id, { ...row, labels: [label] });
  }
  return title(esc(member.team.name), `Managed by ${esc(member.team.managerName)}. ${member.coverage.roster} players, standing ${member.standing.rank} of ${teams.length}, record ${rec(member.team)}.`) +
    `<div class="action-links"><a href="/team">Manage your team</a><a href="/teams/1#team-roster">Full team roster</a><a href="/stocks#player-board">Stocks</a></div><h3>Current modeled FAAB ${v.complete ? 'total' : 'subtotal'}</h3><p class="metric">${money(v.total)}</p><p>${v.priced} priced / ${member.coverage.roster} rostered · ${v.unpriced} unpriced</p><p class="small">${esc(member.market.pricingBasis)} pricing basis · computed ${when(member.market.updatedAt)}. ${v.rank ? `Supplied model value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied ? ' (tied)' : ''}.` : 'League value rank unavailable.'}</p><h3>Top three modeled values</h3><ol class="top-values">${member.players.map(p => `<li>${playerLink(p.id, p.name)} <span class="number">${money(p.value)}</span><br><small>${esc(p.position)} · known historical change ${p.changePct > 0 ? '+' : ''}${p.changePct}% (price, not form)</small></li>`).join('')}</ol><details class="reader-details"><summary>All ${member.rosterValues.length} roster values</summary>${member.rosterValues.map(p => `<div class="value-row"><div>${playerLink(p.id, p.name)}<small>${esc(p.position)}</small></div><span class="number">${money(p.value)}</span></div>`).join('')}</details><p class="status">${esc(inventory.missing.history)}</p><p class="small">${esc(inventory.missing.power)}</p><h3>Scouting: players to watch</h3><p>${esc(guide.watch.label)}</p><p class="small">${esc(guide.watch.message)}</p>${guide.watch.rows.map(p => `<div class="form-row"><div>${playerLink(p.id, p.name)}<small>${p.games} observed games · ${esc(p.note)}</small></div><span class="number">${p.value} EMA FP/G</span></div>`).join('')}<h3>Best / rough completed week</h3><p class="small">${esc(guide.period)}. ${esc(guide.recapMessage)} ${esc(inventory.missing.recap)}</p><p class="status">${esc(guide.coverage)} ${uniqueRecap.size} unique shown / ${guide.eligiblePlayed} eligible; original selections ${guide.best.length} best and ${guide.rough.length} rough.</p>${[...uniqueRecap.values()].sort((a,b) => b.value-a.value).map(p => `<div class="form-row"><div>${playerLink(p.id, p.name)}<small>${p.labels.join(' + ')}${p.labels.length > 1 ? ' · shared selection listed once' : ''} · ${p.games} GP · ${esc(p.note)}</small></div><span class="number">${p.value} FP</span></div>`).join('')}<h3>Your team wire</h3>${member.news.map(n => `<p><a href="${esc(n.url)}">${esc(n.headline)}</a><br><small>${esc(n.outlet.name)} · ${when(n.publishedAt)} · synthetic</small></p>`).join('')}<h3>Your recent moves</h3>${member.moves.map(moveMarkup).join('')}${faces()}`;
}

function league() {
  return title('Teams & players') + `<div class="filters"><label>Team, manager or player<input id="directory-search" type="search" value="${esc(directorySearch)}" placeholder="Try Embiid or NeuralNets" autocomplete="off"></label><label>Sort teams<select id="directory-sort"><option value="rank">Standing</option><option value="name">Team name</option><option value="roster">Roster count</option></select></label></div><p class="result-count" id="directory-count" aria-live="polite"></p><div id="directory-results"></div><div class="action-links"><a href="/teams">All team profiles</a><a href="/transactions">All transactions</a></div>`;
}

function updateDirectory() {
  const q = directorySearch.trim().toLocaleLowerCase();
  const entries = home.directory.filter(t => [t.identity.name,t.identity.managerName,...t.players.map(p => p.fullName)].some(text => text.toLocaleLowerCase().includes(q)));
  entries.sort((a,b) => directorySort === 'name' ? a.identity.name.localeCompare(b.identity.name) : directorySort === 'roster' ? b.players.length-a.players.length || a.identity.name.localeCompare(b.identity.name) : home.hub.standings.find(s => s.team.id===a.identity.id).rank-home.hub.standings.find(s=>s.team.id===b.identity.id).rank);
  let playerCount = 0;
  $('#directory-results').innerHTML = entries.map(t => {
    const identityMatch = `${t.identity.name} ${t.identity.managerName}`.toLocaleLowerCase().includes(q);
    const players = !q || identityMatch ? t.players : t.players.filter(p => p.fullName.toLocaleLowerCase().includes(q));
    playerCount += players.length;
    const p = t.currentMatchup;
    const opponent = p.home.id === t.identity.id ? p.away : p.home;
    const old = t.previousSeason;
    return `<details class="team-entry" ${q ? 'open' : ''}><summary><strong>${esc(t.identity.name)}</strong><span class="team-summary">${esc(t.identity.managerName)} · ${rec(t.currentRecord)} current · ${t.players.length} players</span><span class="opponent">Week ${p.week}: vs ${esc(opponent.name)} · ${points(p.homePoints)} / ${points(p.awayPoints)} incomplete</span>${old?.ownerNote ? `<span class="team-summary">${old.season}: ${old.wins}–${old.losses} · ${esc(old.ownerNote)}</span>` : ''}</summary><div><a href="/teams/${esc(t.identity.id)}#team-roster">${esc(t.identity.name)} full profile & roster</a>${old ? `<p class="previous">${old.season} record ${old.wins}–${old.losses} · finish ${old.finish}. ${esc(old.ownerNote || '')}</p>` : ''}<p class="small">${players.length} of ${t.players.length} player references shown</p>${players.map(p => `<div class="player-row"><div>${playerLink(p.id,p.fullName)}<small>${esc(p.position)} · ${esc(p.nbaTeam ?? 'NBA team unavailable')}</small></div><span class="number">#${esc(p.id)}</span></div>`).join('')}</div></details>`;
  }).join('') || '<p class="empty">No team or player matches this search. Clear the search to restore all ten teams.</p>';
  $('#directory-count').textContent = `${entries.length} of ${home.directory.length} teams · ${playerCount} player references shown (228 unique in the full directory).`;
}

function standings() {
  return title('Standings', 'Current season. PF is fantasy points.') + `<table class="standings"><caption class="sr-only">All ten teams, rank, current win-loss record and Points For</caption><thead><tr><th scope="col">Rank</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${home.hub.standings.map(s => `<tr><td>${s.rank}</td><td>${teamLink(s.team)}<small>${esc(s.team.managerName)}</small></td><td class="number">${rec(s)}</td><td class="number">${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table><p class="status">${esc(inventory.missing.power)}</p><p class="small">${home.hub.season.playoffTeams} playoff places · playoffs begin Week ${home.hub.season.playoffWeekStart}. No projection is inferred.</p><div class="action-links"><a href="/history">Prior-season history</a><a href="/teams">Team profiles</a></div>`;
}

function sourceList(sources) {
  return `<ul class="source-list">${sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a><small>Source checked ${esc(s.checkedAt)}</small></li>`).join('')}</ul>`;
}

function spotlight(s) {
  return `<article class="story"><p class="small">${esc(s.periodLabel)} · ${esc(s.role)}</p><h3>${esc(s.headline)}</h3><p class="story-person">${playerLink(s.playerId,s.name)} · ${esc(s.position)} · ${teamLink(team(s.teamId))}</p><p>${esc(s.opinion)}</p><div class="stats">${s.stats.map(stat=>`<div><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></div>`).join('')}</div><p class="small">${esc(s.statPeriod)}</p><details class="reader-details"><summary>Why this pick / source</summary><p>${esc(s.selectionReason)}</p>${sourceList([s.source])}</details></article>`;
}

function edition() {
  const e = home.edition;
  return title(esc(e.title), `${esc(e.dateLabel)} · ${esc(e.status)} edition · dated editorial, separate from the current Week ${currentPair.week} fixture.`) + `<h3>${esc(e.game.title)}</h3><p class="small">${esc(e.game.note)} · Week ${e.game.leagueWeek} · ${esc(e.game.state)} · ${e.game.scores ? e.game.scores.map(points).join(' / ') : 'No scores'}</p><p>${esc(e.game.context)}</p><details class="reader-details"><summary>Editorial game selection</summary><p>${esc(e.game.selectionReason)}</p><p class="small">Edition ${esc(e.id)} · ${esc(e.startsAt)} to ${esc(e.endsAt)} · publication ${e.publishedAt ? esc(e.publishedAt) : 'not published'}</p></details><h3>Three player spotlights</h3>${e.playerSpotlights.map(spotlight).join('')}<h3>Around that edition</h3>${e.happenings.map(h=>`<div class="wire-item"><h3><a href="${esc(h.href)}">${esc(h.title)}</a></h3><p>${esc(h.text)}</p><small>${esc(h.dateLabel)} · dated editorial</small></div>`).join('')}<details class="reader-details"><summary>Edition sources, with checked dates</summary>${sourceList(e.sources)}</details><h3>Browse the dated archive</h3>${data.archive.map(a=>`<details class="archive-entry"><summary>${esc(a.title)}<small>${esc(a.dateLabel)} · ${esc(a.status)}</small></summary><p>${esc(a.game.title)}</p><p class="small">${esc(a.game.note)} · ${esc(a.game.state)}${a.game.scores ? ` · ${a.game.scores.map(points).join(' / ')}` : ' · no scores'}</p><p>${esc(a.game.context)}</p><p class="small">${esc(a.game.selectionReason)}</p><div class="action-links"><a href="/weekly/${esc(a.id)}">Read ${esc(a.dateLabel)}</a></div>${a.happenings.map(h=>`<p><a href="${esc(h.href)}">${esc(h.title)}</a> · ${esc(h.text)} <small>${esc(h.dateLabel)}</small></p>`).join('')}${sourceList(a.sources)}</details>`).join('')}<div class="action-links"><a href="/weekly">All weekly editions</a></div>`;
}

function moveMarkup(m) {
  return `<div class="wire-item"><p>${esc(m.summary)}</p><small>Week ${m.week} · ${esc(m.type)} · ${when(m.createdAt)} · synthetic<br>${m.adds.length ? `${m.adds.length} added` : 'No player-level add supplied'}; ${m.drops.length ? `${m.drops.length} dropped` : 'no player-level drop supplied'}.</small></div>`;
}

function wire() {
  return title('League wire', 'Recent league moves, dated story sources and the tools to act on them.') + `<h3>Recent synthetic moves</h3>${home.hub.transactions.map(moveMarkup).join('')}<div class="action-links"><a href="/transactions">Transactions</a><a href="/intel">News & intel</a></div><h3>Make your next move</h3><div class="action-links"><a href="/stocks#player-board">Stocks player board</a><a href="/trade-analyzer">Trade analyzer</a><a href="/ai-decides">AI Decides</a><a href="/arcade">Arcade</a><a href="/arcade/free-throw">Play Free Throw</a></div><h3>Dated editorial happenings</h3>${home.edition.happenings.map(h=>`<div class="wire-item"><h3><a href="${esc(h.href)}">${esc(h.title)}</a></h3><p>${esc(h.text)}</p><small>${esc(h.dateLabel)} · ${esc(home.edition.dateLabel)}, draft</small></div>`).join('')}<details class="reader-details"><summary>Source register</summary>${sourceList(home.edition.sources)}</details><h3>Data boundaries</h3><p>${esc(inventory.missing.power)}</p><p>${esc(inventory.missing.history)}</p><p class="small">Fixture checked ${when(home.checkedAt)}. ${esc(inventory.warning)}</p>`;
}

const renderers = { matchup, roster, standings, edition, league, wire };
function drawNavigation() {
  const floor = $('.playing-floor');
  const selected = $(`[data-zone="${active}"]`);
  if (!floor || !selected) return;
  const f = floor.getBoundingClientRect();
  const z = selected.getBoundingClientRect();
  const w = f.width, h = f.height;
  const useVertical = getComputedStyle($('.court-lines.narrow')).display !== 'none';
  const useLeft = z.left + z.width / 2 < f.left + w / 2;
  const startX = useLeft ? z.left - f.left - 5 : z.right - f.left + 5;
  const startY = z.top - f.top + z.height / 2;
  const edge = useLeft ? 8 : w - 8;
  const path = useVertical
    ? `M ${startX} ${startY} H ${edge} V ${h-8} H ${w/2}`
    : `M ${startX} ${startY} H ${edge} V 8 H ${w-8}`;
  $('#navigation-link').setAttribute('viewBox', `0 0 ${w} ${h}`);
  $('#selection-route').setAttribute('d', path);
  $('#selection-origin').setAttribute('cx', startX);
  $('#selection-origin').setAttribute('cy', startY);
  $('#selection-end').setAttribute('d', useVertical ? `M ${w/2-5} ${h-15} L ${w/2} ${h-8} L ${w/2+5} ${h-15}` : `M ${w-15} 3 L ${w-8} 8 L ${w-15} 13`);
}
function activate(id, options = {}) {
  if (!renderers[id]) return false;
  active = id;
  $('#arena').classList.remove('folded');
  $('#note-position').textContent = positions.find(p=>p.id===id).position;
  document.querySelectorAll('[data-zone]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.zone===id)));
  $('#reader').innerHTML = renderers[id]() + '<div class="note-end"><button type="button" data-return>Back to court</button></div>';
  if(id==='league') {
    $('#directory-sort').value = directorySort;
    updateDirectory();
    $('#directory-search').addEventListener('input', event=>{ directorySearch=event.target.value; updateDirectory(); });
    $('#directory-sort').addEventListener('change', event=>{ directorySort=event.target.value; updateDirectory(); });
  }
  if (options.focus) {
    $('#notes-title').focus({preventScroll:true});
    const headingBounds = $('#notes-title').getBoundingClientRect();
    if (matchMedia('(max-width:52rem)').matches || headingBounds.top < 0 || headingBounds.bottom > innerHeight) $('#field-notes').scrollIntoView({behavior:'instant',block:'start'});
  }
  drawNavigation();
  return true;
}
function closeNotes() {
  $('#arena').classList.add('folded');
  document.querySelectorAll('[data-zone]').forEach(button=>button.setAttribute('aria-expanded','false'));
  const trigger = lastTrigger?.dataset.zone === active ? lastTrigger : $(`[data-zone="${active}"]`);
  trigger.focus({preventScroll:true});
  trigger.scrollIntoView({behavior:'instant',block:'nearest'});
}
document.addEventListener('click', event=>{
  const zone = event.target.closest('[data-zone]');
  if(zone){lastTrigger=zone;activate(zone.dataset.zone,{focus:true});}
  if(event.target.closest('[data-return]')) closeNotes();
});
$('#close-notes').addEventListener('click',closeNotes);
document.addEventListener('keydown',event=>{
  if(event.key !== 'Escape') return;
  const disclosure = event.target.closest('.route-menu[open], .concept-note[open]');
  if(disclosure){disclosure.open=false;disclosure.querySelector('summary').focus();return;}
  if(!$('#arena').classList.contains('folded')) closeNotes();
});
window.goatStudy = {
  states: positions.map(p=>({id:p.id,label:p.title})),
  activate(id) { const ok=activate(id); if(ok){ if(matchMedia('(max-width:52rem)').matches&&id!=='matchup') $('#field-notes').scrollIntoView({behavior:'instant',block:'start'}); else window.scrollTo(0,0); } return ok; },
};
activate('matchup');
new ResizeObserver(drawNavigation).observe($('.playing-floor'));
document.fonts.ready.then(() => { drawNavigation(); document.body.dataset.studyReady='02'; });
