import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const reader = document.querySelector('#reader');
const directory = data.home.directory;
const teams = new Map(directory.map(entry => [entry.identity.id, entry.identity]));
const personal = mode === 'member' ? data.personal.summary : null;
// The home-edition teamIds conflict with its preserved draft prose. The archive
// carries a coherent dated edition; current pairings always use the directory.
const edition = data.archive[0];
const record = team => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ''}`;
const teamName = id => teams.get(String(id))?.name ?? String(id);
const date = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC' : 'Not supplied';
const pct = value => `${Math.round(value * 100)}%`;
const profile = (id, label) => `<a href="/teams/${esc(id)}">${esc(label ?? teamName(id))}</a>`;
const playerLink = (id, label) => `<a href="/player/${esc(id)}">${esc(label)}</a>`;
const portrait = (id, name, cls = '') => inventory.portraits[id] ? `<img class="${cls}" src="${esc(inventory.portraits[id])}" alt="${esc(name)}" loading="lazy">` : '';
const chapterHead = () => '';
const foot = extra => `<footer class="chapter-foot"><p>${extra ?? 'Fixture as of 12 Nov 2026.'}</p><button type="button" data-open-provenance>Data provenance</button></footer>`;

const pairMap = new Map();
directory.forEach(entry => { const m = entry.currentMatchup; if (m) pairMap.set([m.home.id, m.away.id].join(':'), m); });
const matchups = [...pairMap.values()];
let selectedMatch = Math.max(0, matchups.findIndex(m => personal && [m.home.id, m.away.id].includes(personal.team.id)));
let selectedTeam = directory[0].identity.id;
let directoryQuery = '';
let directorySort = 'standing';
let leagueView = 'directory';
let archiveIndex = 0;

function pickFor(match) {
  return data.weekly?.matchups.find(pick => pick.teamIds.includes(match.home.id) && pick.teamIds.includes(match.away.id));
}

function provenance(pick) {
  const r = pick?.result;
  if (!r) return `<p>No saved model result is available for this pairing.</p>`;
  const evidence = [...(pick.evidence ?? []), ...(r.evidence ?? [])];
  return `<dl><dt>Returned choice</dt><dd>${esc(teamName(r.choice))}</dd><dt>Probabilities</dt><dd>${r.probabilities.map(p => `${esc(teamName(p.choice))}: ${pct(p.probability)}`).join(' · ')}</dd><dt>Confidence</dt><dd>${pct(r.confidence)} · independent of the returned probabilities</dd><dt>Saved at</dt><dd>${date(data.weekly.generatedAt)}</dd><dt>Model</dt><dd>${esc(r.model)}</dd><dt>Prompt</dt><dd>${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot ? esc(JSON.stringify(r.snapshot)) : 'Not supplied (null)'}</dd><dt>Slate snapshot</dt><dd>${data.weekly.snapshot ? esc(JSON.stringify(data.weekly.snapshot)) : 'Not supplied (null)'}</dd><dt>Evidence</dt><dd>${evidence.length ? evidence.map(esc).join('<br>') : 'No further evidence returned.'}</dd><dt>Basis</dt><dd>${esc(r.probabilityLabel)}. Saved fixture slate for ${esc(data.weekly.season)}, Week ${data.weekly.week}; no result generated here.</dd></dl>`;
}

function scoreReader() {
  const m = matchups[selectedMatch];
  if (!m) return '<p>No matchup supplied.</p>';
  const own = personal && [m.home.id, m.away.id].includes(personal.team.id);
  return `<p class="kicker">${own ? 'Your pairing' : 'League pairing'} · Week ${m.week}</p><h1>${esc(m.home.name)}<br><span class="muted">meets</span><br>${esc(m.away.name)}</h1><p class="week-context">A known score and an unknown score are different states. This fixture pairing is still incomplete.</p><div class="scoreboard"><div><div class="score-team"><h2>${profile(m.home.id)}</h2><p>${esc(m.home.managerName)} · ${record(m.home)}</p></div><div class="score-team"><h2>${profile(m.away.id)}</h2><p>${esc(m.away.managerName)} · ${record(m.away)}</p></div></div><div class="score-value num"><span class="score-number ${m.homePoints == null ? 'pending' : ''}">${m.homePoints == null ? 'Pending' : m.homePoints.toFixed(1)}</span><span class="score-number ${m.awayPoints == null ? 'pending' : ''}">${m.awayPoints == null ? 'Pending' : m.awayPoints.toFixed(1)}</span></div></div><p class="incomplete">Incomplete · no final result</p><p class="meta">${m.homePoints === 0 ? '0.0 is a known zero. ' : ''}Pending means no score supplied.</p><div class="links"><a href="/ai-decides">Open AI Decides</a>${personal ? '<a href="/team">My team</a>' : '<a href="/teams">Meet the teams</a>'}</div>`;
}

function slateRows() {
  return matchups.map((m, index) => {
    const pick = pickFor(m), r = pick?.result;
    const unavailable = aiState === 'missing' || !r;
    const stale = aiState === 'stale' || data.weekly?.status === 'stale';
    return `<article class="match-row ${index === selectedMatch ? 'active' : ''}" data-match-row="${index}"><button class="match-select" type="button" data-match="${index}" aria-pressed="${index === selectedMatch}">${esc(m.home.name)} / ${esc(m.away.name)}</button>${unavailable ? '<p class="pick-line">Saved AI unavailable · no probability supplied.</p>' : `<p class="pick-line"><strong>${stale ? 'Stale saved choice' : 'Returned choice'}: ${esc(teamName(r.choice))}</strong> · ${pct(r.probabilities.find(p => p.choice === r.choice)?.probability ?? 0)}</p><p class="pick-line meta">Confidence ${pct(r.confidence)} · ${stale ? 'past saved context; not a current forecast' : 'separate from probability'}</p><div class="probabilities">${r.probabilities.map(p => `<div class="probability"><span>${esc(teamName(p.choice))}</span><strong class="num">${pct(p.probability)}</strong>${!stale ? `<div class="probability-meter" aria-hidden="true"><i style="width:${p.probability * 100}%"></i></div>` : ''}</div>`).join('')}</div><details><summary>Saved evidence & provenance</summary><div class="provenance">${provenance(pick)}</div></details>`}</article>`;
  }).join('');
}

function weekChapter() {
  return `${chapterHead('01', 'This week')}<div class="week-spread"><div id="score-reader" class="week-lead">${scoreReader()}</div><div class="slate"><div class="slate-heading"><h2>Five pairings.<br>One saved slate.</h2><span class="num">W${matchups[0]?.week ?? '—'} / 2026</span></div><p class="meta">${aiState === 'stale' ? 'Stale fixture picks · saved 10 Nov, not refreshed.' : aiState === 'missing' ? 'The saved AI slate is unavailable.' : 'Synthetic saved picks · 10 Nov 2026, 12:00 UTC.'}</p><div id="slate-rows">${slateRows()}</div></div></div>${foot()}`;
}

function clubChapter() {
  const s = personal, v = s.valuation;
  return `${chapterHead('02', 'My club')}<div class="club-spread"><div><div class="club-identity"><div><h1>${esc(s.team.name)}</h1><p class="meta">${esc(s.team.managerName)} · ${record(s.team)} · Standing ${s.standing.rank} of 10</p><p>${s.coverage.roster} roster players</p></div><div class="links"><a href="/team">My team</a><a href="/teams/${esc(s.team.id)}#team-roster">View roster</a></div></div><p class="value-total num">${money(v.total)}</p><p><strong>${v.complete ? 'Current modeled FAAB roster value' : 'Partial modeled FAAB subtotal'}</strong></p><p class="meta">${v.priced} priced · ${v.unpriced} unpriced · ${s.market.pricingBasis} basis<br>Computed ${date(s.market.updatedAt)} · fixture data</p><div class="anchor-players">${s.players.map(p => `<figure>${portrait(p.id,p.name)}<figcaption>${playerLink(p.id,p.name)}<strong class="num">${money(p.value)}</strong><span>${esc(p.position)} · modeled value</span><span class="meta"> · Up ${p.changePct}% (fixture)</span></figcaption></figure>`).join('')}</div><div class="links"><a href="/stocks#player-board">Explore the player market</a><a href="/trade-analyzer">Analyze a trade</a></div></div><aside class="club-ledger stack"><div class="history-empty"><h2>Recorded history</h2><p class="meta">${esc(inventory.missing.history)}</p></div><details class="roster-ledger" open><summary>All ${s.rosterValues.length} roster values</summary><p class="meta">${s.coverage.priced}/${s.coverage.roster} priced. Model values are not cash balances or historical performance.</p>${s.rosterValues.map(p => `<div class="value-row">${playerLink(p.id,p.name)}<span class="num">${money(p.value)}<br><span class="meta">${esc(p.position)}</span></span></div>`).join('')}</details><details><summary>Valuation coverage & basis</summary><p>${v.knownRoster ? 'Known roster' : 'Roster not fully known'} · ${v.priced} priced / ${s.coverage.roster} roster players. Unpriced: ${v.unpriced}. ${v.rank ? `Modeled value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied ? ' (tied)' : ''}.` : 'Value rank unavailable.'}</p><p class="meta">Source check ${date(s.checkedAt)}. This is the in-season modeled quote; no recorded history is inferred from it.</p></details></aside></div>${foot()}`;
}

function formRows(rows, unit) {
  return rows.map(p => `<div class="form-row"><div>${playerLink(p.id,p.name)}<p class="meta">${esc(p.note)}</p></div><div class="form-value"><strong class="num">${p.value} ${unit}</strong><span>${p.games} GP</span></div></div>`).join('');
}

function scoutChapter() {
  const s = personal, g = s.playerGuide;
  return `${chapterHead('03', 'Scoutbook')}<div class="scout-spread"><div class="stack"><div><h1>Who needs<br>a closer look?</h1><p class="meta">A notebook for ${esc(s.team.name)}.</p></div><div><h2>On form</h2><p>${esc(g.watch.label)}</p><p class="meta">2026 in-season sample · shown observed games</p>${formRows(g.watch.rows, 'EMA FP/G')}<p class="meta">${esc(g.watch.message)}</p></div></div><div class="scout-completed"><h2>The completed week</h2><p class="meta">Synthetic completed-week fixture</p><p>${esc(g.period)}</p><div class="completed-split"><div><h3>Your best</h3>${formRows(g.best,'FP')}</div><div><h3>The rough week</h3>${formRows(g.rough,'FP')}</div></div><p class="notice">${esc(inventory.missing.recap)}</p><p>${esc(g.coverage)}</p><p class="meta">Displayed: ${g.best.length} best and ${g.rough.length} rough from ${g.eligiblePlayed} eligible played players. Lists can overlap. ${esc(g.recapMessage)}</p></div><aside class="scout-wire"><div><h2>Team wire</h2>${s.news.map(n => `<div class="wire-item"><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="meta">${esc(n.outlet.name)}<br>${date(n.publishedAt)} · synthetic</p></div>`).join('')}<a class="text-link" href="/intel">All news</a></div><div><h2>Recent moves</h2>${s.moves.map(m => `<div class="wire-item"><p>${esc(m.summary)}</p><p class="meta">${esc(m.type.replaceAll('_',' '))} · Week ${m.week}<br>${date(m.createdAt)} · synthetic</p><p class="meta">No add/drop player legs supplied.</p></div>`).join('')}<a class="text-link" href="/transactions">Transactions</a></div></aside></div>${foot()}`;
}

function matchingTeams() {
  const q = directoryQuery.trim().toLocaleLowerCase();
  const rows = directory.filter(entry => `${entry.identity.name} ${entry.identity.managerName}`.toLocaleLowerCase().includes(q) || entry.players.some(p => `${p.fullName} ${p.position} ${p.nbaTeam}`.toLocaleLowerCase().includes(q)));
  rows.sort((a,b) => directorySort === 'name' ? a.identity.name.localeCompare(b.identity.name) : directorySort === 'size' ? b.players.length-a.players.length : b.currentRecord.pointsFor-a.currentRecord.pointsFor);
  return rows;
}

function rosterPanel(entry) {
  if (!entry) return '<p class="empty-result">No matching teams or players. Try a different name, position or NBA team.</p>';
  const t = entry.identity, m = entry.currentMatchup;
  const q = directoryQuery.trim().toLocaleLowerCase();
  const teamMatch = `${t.name} ${t.managerName}`.toLocaleLowerCase().includes(q);
  const players = teamMatch ? entry.players : entry.players.filter(p => `${p.fullName} ${p.position} ${p.nbaTeam}`.toLocaleLowerCase().includes(q));
  return `<h2>${esc(t.name)}</h2><p>${esc(t.managerName)} · ${record(entry.currentRecord)} · ${entry.players.length} roster players</p><p class="meta">${m ? `Week ${m.week} vs ${esc(m.home.id === t.id ? m.away.name : m.home.name)} · incomplete` : 'No current opponent supplied'}</p><div class="links">${profile(t.id,'Team profile')}<a href="/teams/${esc(t.id)}#team-roster">Full roster</a></div><p class="meta">${players.length} of ${entry.players.length} player references shown</p><ul class="roster-list">${players.map(p => `<li>${playerLink(p.id,p.fullName)}<p class="meta">${esc(p.position)} · ${esc(p.nbaTeam)}</p></li>`).join('')}</ul><details class="rule"><summary>2025 franchise record</summary><p>${entry.previousSeason.wins}–${entry.previousSeason.losses}, finish ${entry.previousSeason.finish}. ${esc(entry.previousSeason.ownerNote ?? 'Same franchise record; previous season.')}</p></details>`;
}

function directoryPanels() {
  const rows = matchingTeams();
  if (!rows.some(e => e.identity.id === selectedTeam)) selectedTeam = rows[0]?.identity.id;
  return `<div class="directory-controls"><label>Find a team, manager or player<input id="directory-search" type="search" value="${esc(directoryQuery)}" placeholder="Try Embiid, NeuralNets, PG…" autocomplete="off"></label><label>Sort teams<select id="directory-sort"><option value="standing" ${directorySort === 'standing'?'selected':''}>Points for</option><option value="name" ${directorySort === 'name'?'selected':''}>Team name</option><option value="size" ${directorySort === 'size'?'selected':''}>Roster size</option></select></label></div><p id="search-count" class="meta" aria-live="polite">${rows.length} teams · ${new Set(rows.flatMap(e => e.players.map(p => p.id))).size} unique player references</p><div class="directory-spread"><div class="team-index">${rows.map(e => {const t=e.identity,m=e.currentMatchup;return `<button type="button" class="team-choice" data-team="${esc(t.id)}" aria-pressed="${t.id===selectedTeam}"><span class="num">${String(directory.findIndex(d=>d.identity.id===t.id)+1).padStart(2,'0')}</span><span><strong>${esc(t.name)}</strong><span class="meta">${esc(t.managerName)} · ${record(e.currentRecord)}</span><span class="meta">${m?`W${m.week} vs ${esc(m.home.id===t.id?m.away.name:m.home.name)}`:'Opponent unavailable'}</span></span><span class="meta num">${e.players.length}<br>players</span></button>`;}).join('')}</div><div class="roster-reader" id="roster-reader">${rosterPanel(rows.find(e=>e.identity.id===selectedTeam))}</div></div>`;
}

function standings() {
  return `<p class="meta">2026 · synthetic current standings · PF shown in fantasy points</p><table class="standing-table"><thead><tr><th scope="col">#</th><th scope="col">Team</th><th scope="col">W</th><th scope="col">L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s => `<tr><td>${s.rank}</td><td>${profile(s.team.id)}${personal&&personal.team.id===s.team.id?'<span class="meta">Your team</span>':''}</td><td>${s.wins}</td><td>${s.losses}</td><td>${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table><p class="notice">${esc(inventory.missing.power)}</p><p class="meta">No Power ranking is inferred from standings or modeled player values.</p>`;
}

function faces() {
  return `<p class="meta">One current modeled-value anchor from each of the ten franchises · synthetic prices.</p><div class="face-index">${data.faces.map(f => `<article class="face-entry">${f.player?portrait(f.player.id,f.player.name):''}<div><strong>${f.player?playerLink(f.player.id,f.player.name):'No player supplied'}</strong><p>${profile(f.team.id)}${f.champion?' · 2025 champion':''}</p><p class="meta">${esc(f.team.managerName)}</p></div><span class="num">${f.player?money(f.player.value):'Unpriced'}<br><span class="meta">modeled FAAB</span></span></article>`).join('')}</div>`;
}

function leagueChapter() {
  return `${chapterHead(personal?'04':'02','League index')}<div class="league-top"><div><h1>Ten franchises.<br>Every name.</h1><p class="meta">228 unique roster references · local search</p></div><div class="view-tabs" role="tablist" aria-label="League view">${[['directory','Directory'],['standings','Standings'],['faces','Faces']].map(([id,label]) => `<button role="tab" id="tab-${id}" type="button" data-league="${id}" aria-selected="${leagueView===id}" aria-controls="league-panel">${label}</button>`).join('')}</div></div><div id="league-panel" role="tabpanel" aria-labelledby="tab-${leagueView}">${leagueView==='directory'?directoryPanels():leagueView==='standings'?standings():faces()}</div>${foot()}`;
}

function sources(items) {
  return `<ul class="source-list">${items.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><br><span class="meta">Checked ${esc(s.checkedAt)}</span></li>`).join('')}</ul>`;
}

function story(p) {
  return `<article>${portrait(p.playerId,p.name,'story-portrait')}<p class="kicker">${esc(p.periodLabel)}</p><h2>${playerLink(p.playerId,p.name)}</h2><p class="meta">${esc(p.position)} · ${profile(p.teamId)}</p><h3>${esc(p.headline)}</h3><p>${esc(p.opinion)}</p><div class="stats">${p.stats.map(s=>`<span><strong>${esc(s.value)}</strong>${esc(s.label)}</span>`).join('')}</div><p class="meta">${esc(p.statPeriod)}</p><details class="story-detail"><summary>Why this pick & source</summary><p>${esc(p.selectionReason)}</p><p><a class="text-link" href="${esc(p.source.url)}">${esc(p.source.label)}</a><br>Checked ${esc(p.source.checkedAt)}</p></details></article>`;
}

function editionChapter() {
  return `${chapterHead(personal?'05':'03','The edition','Dated editorial · draft')}<div class="edition-spread"><article class="edition-prose"><p class="kicker">${esc(edition.dateLabel)} · ${esc(edition.status)}</p><h1 class="chapter-title">${esc(edition.title)}</h1><p class="edition-deck">${esc(edition.game.title)}</p><p>${esc(edition.game.context)}</p><p class="notice">Dated opening-week editorial sample. This draft is not the current Week 3 fixture or an official current-week award.</p><p class="meta">${esc(edition.game.note)} · Week ${edition.game.leagueWeek} · ${esc(edition.game.state)}<br>${edition.game.teamIds.map(id=>profile(id)).join(' / ')} · scores not supplied</p><details><summary>Selection & edition provenance</summary><p>${esc(edition.game.selectionReason)}</p><p class="meta">${esc(edition.startsAt)} through ${esc(edition.endsAt)} (end exclusive). Published at: ${edition.publishedAt?esc(edition.publishedAt):'not published'}. Draft sample retained from the dated source.</p>${sources(edition.sources)}</details><a class="text-link" href="/weekly/${esc(edition.id)}">Open this dated edition</a></article><aside class="edition-wire"><h2>Around the league</h2><p class="meta">Dated October happenings</p>${edition.happenings.map(h=>`<div class="wire-item"><p class="meta">${esc(h.dateLabel)}</p><a href="${esc(h.href)}"><strong>${esc(h.title)}</strong></a><p>${esc(h.text)}</p></div>`).join('')}<a class="text-link" href="/intel">Go to News</a></aside></div><div class="story-shelf">${edition.playerSpotlights.map(story).join('')}</div>${foot('All three opinions retain their supplied period and source.<br>NBA/college averages are not fantasy-week scores.')}`;
}

function archiveSheet() {
  const a=data.archive[archiveIndex],g=a.game;
  return `<p class="kicker">${esc(a.dateLabel)} · ${esc(a.status)}</p><h2>${esc(a.title)}</h2><p class="edition-deck">${esc(g.title)}</p><p>${esc(g.context)}</p><p class="meta">${esc(g.note)} · ${g.leagueWeek===null?'historical final':`Week ${g.leagueWeek}`} · ${esc(g.state)}</p><p class="links">${g.teamIds.map((id,i)=>profile(id,`${teamName(id)}${g.scores?` · ${g.scores[i].toFixed(1)}`:''}`)).join(' / ')}</p><p class="notice">Both archive entries are drafts. The 2025 final is a historical record; these samples were not published by Muse.</p><details open><summary>Editorial selection</summary><p>${esc(g.selectionReason)}</p></details><details><summary>Sources, happenings & date bounds</summary><p class="meta">${esc(a.startsAt)} through ${esc(a.endsAt)} (end exclusive). Publication: ${a.publishedAt?esc(a.publishedAt):'not published'}.</p>${a.happenings.map(h=>`<p><a class="text-link" href="${esc(h.href)}">${esc(h.title)}</a><br>${esc(h.text)} · ${esc(h.dateLabel)}</p>`).join('')}${sources(a.sources)}</details><div class="links"><a href="/weekly/${esc(a.id)}">Open /weekly/${esc(a.id)}</a><a href="/weekly">All weekly editions</a><a href="/history">League history</a></div>`;
}

function archiveChapter() {
  return `${chapterHead(personal?'06':'04','Archive','Dated drafts & history')}<div class="archive-spread"><div><h1 class="chapter-title">Turn back<br>a week.</h1><p class="meta">Select a dated edition. Its pair, date and context stay together.</p><div class="archive-choices">${data.archive.map((a,i)=>`<button type="button" data-archive="${i}" aria-pressed="${i===archiveIndex}"><span class="meta">${esc(a.dateLabel)} · ${esc(a.status)}</span><span>${esc(a.title)}</span></button>`).join('')}</div><p class="notice">${esc(inventory.missing.history)}</p><p class="meta">Historical league results and recorded team-value history are separate sources.</p></div><article id="archive-sheet" class="archive-sheet">${archiveSheet()}</article></div>${foot()}`;
}

function toolsChapter() {
  const tools=[['/intel','News','League intelligence'],['/stocks#player-board','Stocks','Modeled player values'],['/ai-decides','AI Decides','Saved picks & experiments'],['/teams','Teams','Public franchise profiles'],['/transactions','Transactions','The move ledger'],['/trade-analyzer','Trade analyzer','Compare a proposed deal'],['/history','History','Past league seasons'],['/weekly','Weekly archive','Dated editorial']];
  return `${chapterHead(personal?'07':'05','Play & tools')}<div class="tool-spread"><div><h1 class="chapter-title">Where next?</h1><p class="meta">Working destinations from the league publication.</p><ul class="tool-list">${tools.map(([href,label,description])=>`<li><a href="${href}"><span>${label}<br><span class="meta">${description}</span></span><span aria-hidden="true">↗</span></a></li>`).join('')}</ul></div><div class="game-workspace"><p class="kicker">The arcade</p><h2>A few shots<br>between matchups.</h2><img class="game-preview" src="${esc(inventory.assets.game)}" alt="Free throw game preview"><a class="text-link game-link" href="/arcade/free-throw">Play Free Throw →</a><p class="meta">Existing practice game. No fantasy scores or invented rewards are carried into the arcade.</p><div class="links"><a href="/arcade">Arcade home</a>${personal?'<a href="/team">My team</a><a href="/teams/1#team-roster">My roster</a>':''}</div><div class="rule stack"><div><h2>About this study</h2><p>${esc(inventory.warning)}</p></div><div><h3>AI fixture states</h3><div class="local-state"><a href="?view=${mode}&ai=ready">Saved</a><a href="?view=${mode}&ai=stale">Stale</a><a href="?view=${mode}&ai=missing">Unavailable</a></div></div><p class="meta">Fact inventory benchmark: ${esc(inventory.benchmark)}. No provider call, generation or authentication occurs here.</p></div></div></div>${foot()}`;
}

const chapters=[{id:'week',label:'This week',render:weekChapter},...(personal?[{id:'team',label:'My club',render:clubChapter},{id:'scout',label:'Scoutbook',render:scoutChapter}]:[]),{id:'league',label:'League index',render:leagueChapter},{id:'edition',label:'The edition',render:editionChapter},{id:'archive',label:'Archive',render:archiveChapter},{id:'tools',label:'Play & tools',render:toolsChapter}];
reader.innerHTML=chapters.map((c,i)=>`<section class="chapter" id="chapter-${c.id}" data-chapter="${c.id}" aria-label="${i+1}. ${c.label}" ${i?'inert':''}>${c.render()}</section>`).join('');
const panels=[...reader.querySelectorAll('.chapter')];
let chapterIndex=0;
let resizeTimer;
let provenanceOrigin=null;
const conceptProvenance=document.querySelector('#concept-provenance');
document.querySelector('#comparison').href=`?view=${mode==='member'?'public':'member'}`;
document.querySelector('#comparison').textContent=mode==='member'?'Public edition':'Member edition';
document.querySelector('#chapter-links').innerHTML=chapters.map((c,i)=>`<button type="button" data-go="${c.id}" aria-current="${i===0?'page':'false'}"><span class="chapter-number">${String(i+1).padStart(2,'0')}</span>${c.label}</button>`).join('');
document.querySelector('#chapter-select').innerHTML=chapters.map((c,i)=>`<option value="${c.id}">${String(i+1).padStart(2,'0')} / ${c.label}</option>`).join('');

function markChapter(index, announce=true) {
  if(index!==chapterIndex&&conceptProvenance.open){conceptProvenance.open=false;provenanceOrigin=null;}
  chapterIndex=Math.max(0,Math.min(chapters.length-1,index));
  panels.forEach((panel,i)=>{panel.inert=i!==chapterIndex;});
  document.querySelectorAll('[data-go]').forEach(b=>b.setAttribute('aria-current',b.dataset.go===chapters[chapterIndex].id?'page':'false'));
  document.querySelector('#chapter-select').value=chapters[chapterIndex].id;
  document.querySelector('#previous').disabled=chapterIndex===0;
  document.querySelector('#next').disabled=chapterIndex===chapters.length-1;
  if(announce) document.querySelector('#announcement').textContent=`Chapter ${chapterIndex+1} of ${chapters.length}: ${chapters[chapterIndex].label}`;
}

function goTo(id, updateHash=true) {
  const i=chapters.findIndex(c=>c.id===id);
  if(i<0)return;
  // Native viewport movement, immediate for keyboard and frequent navigation.
  reader.scrollTo({left:panels[i].offsetLeft-reader.offsetLeft,behavior:'instant'});
  markChapter(i);
  if(updateHash&&location.hash!==`#chapter-${id}`) history.pushState(null,'',`#chapter-${id}`);
}

function renderLeague() {
  const panel=document.querySelector('#league-panel');
  panel.innerHTML=leagueView==='directory'?directoryPanels():leagueView==='standings'?standings():faces();
  panel.setAttribute('aria-labelledby',`tab-${leagueView}`);
  document.querySelectorAll('[data-league]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.league===leagueView)));
}

document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-open-provenance')){provenanceOrigin=b;conceptProvenance.open=true;conceptProvenance.querySelector('summary').focus({preventScroll:true});}
  if(b.id==='close-provenance'){conceptProvenance.open=false;(provenanceOrigin??conceptProvenance.querySelector('summary')).focus({preventScroll:true});provenanceOrigin=null;}
  if(b.dataset.go)goTo(b.dataset.go);
  if(b.id==='previous')goTo(chapters[chapterIndex-1]?.id);
  if(b.id==='next')goTo(chapters[chapterIndex+1]?.id);
  if(b.dataset.match!==undefined){selectedMatch=Number(b.dataset.match);document.querySelector('#score-reader').innerHTML=scoreReader();document.querySelectorAll('[data-match]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.match)===selectedMatch)));document.querySelectorAll('[data-match-row]').forEach(el=>el.classList.toggle('active',Number(el.dataset.matchRow)===selectedMatch));document.querySelector('#announcement').textContent=`Reading ${matchups[selectedMatch].home.name} versus ${matchups[selectedMatch].away.name}`;}
  if(b.dataset.league){leagueView=b.dataset.league;renderLeague();}
  if(b.dataset.team){selectedTeam=b.dataset.team;document.querySelectorAll('[data-team]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.team===selectedTeam)));document.querySelector('#roster-reader').innerHTML=rosterPanel(directory.find(e=>e.identity.id===selectedTeam));document.querySelector('#announcement').textContent=`Roster: ${teamName(selectedTeam)}`;if(matchMedia('(max-width:760px)').matches)document.querySelector('#roster-reader').scrollIntoView({block:'start',behavior:'instant'});}
  if(b.dataset.archive!==undefined){archiveIndex=Number(b.dataset.archive);document.querySelector('#archive-sheet').innerHTML=archiveSheet();document.querySelectorAll('[data-archive]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.archive)===archiveIndex)));}
});
document.addEventListener('input',event=>{
  if(event.target.id==='directory-search'){
    directoryQuery=event.target.value;
    const selectionStart=event.target.selectionStart;
    renderLeague();
    const input=document.querySelector('#directory-search');input.focus({preventScroll:true});input.setSelectionRange(selectionStart,selectionStart);
  }
});
document.addEventListener('change',event=>{
  if(event.target.id==='chapter-select')goTo(event.target.value);
  if(event.target.id==='directory-sort'){directorySort=event.target.value;renderLeague();document.querySelector('#directory-sort').focus({preventScroll:true});}
});
reader.addEventListener('keydown',event=>{
  const leagueTab=event.target.closest('[data-league]');
  if(leagueTab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();const views=['directory','standings','faces'];const next=event.key==='Home'?0:event.key==='End'?2:(views.indexOf(leagueView)+(event.key==='ArrowRight'?1:2))%3;leagueView=views[next];renderLeague();document.querySelector(`#tab-${leagueView}`).focus();return;
  }
  if(event.target!==reader)return;
  if(event.key==='ArrowRight'){event.preventDefault();goTo(chapters[chapterIndex+1]?.id);}
  if(event.key==='ArrowLeft'){event.preventDefault();goTo(chapters[chapterIndex-1]?.id);}
  if(event.key==='Home'){event.preventDefault();goTo(chapters[0].id);}
  if(event.key==='End'){event.preventDefault();goTo(chapters.at(-1).id);}
});
reader.addEventListener('scroll',()=>{const index=Math.round(reader.scrollLeft/reader.clientWidth);if(index!==chapterIndex)markChapter(index);},{passive:true});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>goTo(chapters[chapterIndex].id,false),50);});
window.addEventListener('hashchange',()=>{const id=location.hash ? location.hash.replace('#chapter-','') : 'week';if(chapters.some(c=>c.id===id))goTo(id,false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&conceptProvenance.open){conceptProvenance.open=false;(provenanceOrigin??conceptProvenance.querySelector('summary')).focus({preventScroll:true});provenanceOrigin=null;}});

window.goatStudy={
  states:[{id:'default',label:'This week: score reader & saved slate'},...(personal?[{id:'team',label:'My club: values and complete roster'},{id:'scout',label:'Scoutbook: form, completed week & team wire'}]:[]),{id:'league',label:'League index: searchable roster reader'},{id:'standings',label:'League index: standings'},{id:'edition',label:'Dated October editorial spread'},{id:'archive',label:'Archive: historical final'},{id:'tools',label:'Play & league tools'}],
  async activate(id){
    if(id==='default'){selectedMatch=0;document.querySelector('#score-reader').innerHTML=scoreReader();document.querySelector('#slate-rows').innerHTML=slateRows();goTo('week');}
    else if(id==='standings'){leagueView='standings';renderLeague();goTo('league');}
    else if(id==='league'){leagueView='directory';directoryQuery='';selectedTeam=directory[0].identity.id;renderLeague();goTo('league');}
    else if(id==='archive'){archiveIndex=1;document.querySelector('#archive-sheet').innerHTML=archiveSheet();document.querySelectorAll('[data-archive]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.archive)===archiveIndex)));goTo('archive');}
    else goTo(id);
    panels[chapterIndex].scrollTop=0;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {chapter:chapters[chapterIndex].id,mode,aiState};
  }
};
markChapter(0,false);
const initial=location.hash.replace('#chapter-','');
if(chapters.some(c=>c.id===initial))goTo(initial,false);
document.body.dataset.studyReady='03';
