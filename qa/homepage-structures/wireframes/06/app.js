import {inventory, data, mode, aiState, esc, money} from '../../data.js';

const $ = (s) => document.querySelector(s);
const home = data.home;
const personal = mode === 'member' ? data.personal.summary : null;
const teams = home.hub.teams;
const byId = new Map(teams.map(t => [t.id, t]));
const directories = home.directory;
const uniquePlayers = new Set(directories.flatMap(t => t.players.map(p => p.id))).size;
const pairs = directories.map(t => t.currentMatchup).filter((p, i, a) => p && a.findIndex(o => o.home.id === p.home.id && o.away.id === p.away.id) === i);
const portrait = (id, name, cls = '') => inventory.portraits[id] ? `<img class="${cls}" src="${esc(inventory.portraits[id])}" alt="${esc(name)}" loading="lazy" width="72" height="72">` : '';
const teamName = id => byId.get(String(id))?.name ?? `Roster ${id}`;
const teamLink = id => `<a href="/teams/${esc(id)}">${esc(teamName(id))}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const percent = v => `${Math.round(v * 100)}%`;
const score = v => v == null ? 'Pending' : Number(v).toFixed(1);
const date = (v, includeTime = false) => new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',year:'numeric', ...(includeTime ? {hour:'2-digit',minute:'2-digit',timeZoneName:'short'} : {}),timeZone:'UTC'}).format(new Date(v));
let scope = 'all';
let period = 'all';
let view = 'log';
let selectedPair = personal ? pairs.findIndex(p => [p.home.id,p.away.id].includes(personal.team.id)) : 0;
if (selectedPair < 0) selectedPair = 0;
let directoryQuery = '';
let directorySort = 'rank';
let returnLog = {scope:'all',period:'all',scroll:0};

function event({id, side = 'right', day, month, body, aside = '', type = 'league', source = 'nov12'}) {
  return {id, type: type.split(' '), source, html:`<article class="event ${side}" id="event-${id}"><div class="stamp"><strong>${esc(day)}</strong><span>${esc(month)}</span></div>${aside ? `<aside class="event-aside">${aside}</aside>` : ''}<div class="event-body">${body}</div></article>`};
}

function matchupHTML() {
  const p = pairs[selectedPair];
  const pick = data.weekly?.matchups.find(r => r.teamIds.includes(p.home.id) && r.teamIds.includes(p.away.id));
  const chosen = pick?.result?.choice;
  const saved = chosen ? `<p class="model-choice">Saved returned choice: <strong>${esc(teamName(chosen))}</strong> (${percent(pick.result.probabilities.find(x => x.choice === chosen)?.probability ?? 0)}). Independent confidence ${percent(pick.result.confidence)}.</p>` : '<p class="status-note">Saved AI unavailable. No choice inferred.</p>';
  return `<p class="kicker">Week ${p.week} / checked snapshot</p><h2>${personal && [p.home.id,p.away.id].includes(personal.team.id) ? 'Your week, still open.' : 'A week in progress.'}</h2>
    <label class="matchup-choice">Current pairing<select id="pairing">${pairs.map((p,i) => `<option value="${i}" ${i===selectedPair?'selected':''}>${esc(p.home.name)} / ${esc(p.away.name)}</option>`).join('')}</select></label>
    ${[['home',p.homePoints],['away',p.awayPoints]].map(([key,pts]) => `<div class="pair-score">${teamLink(p[key].id)}<span class="score">${score(pts)}</span><span class="team-meta">${esc(p[key].managerName)} · ${record(p[key])} current record</span><span class="score-label">${pts==null?'not received':'known points'}</span></div>`).join('')}
    <p class="status-note">Incomplete · ${p.homePoints === 0 ? 'Known 0.0 is a score. ' : ''}Pending is missing evidence. This is not a final.</p>
    ${aiState === 'stale' ? '<p class="status-note">Stale saved AI · historical context only.</p>' : ''}${saved}
    <div class="actions"><button type="button" data-jump="ai">Read the saved slate</button><a href="/ai-decides">AI Decides</a></div>`;
}

function memberAside() {
  if (!personal) return `<p class="day">Checked ${date(home.checkedAt)}</p><p class="large-date">10 teams.<br>One league.</p><p class="quiet-context">A synthetic Week 3 snapshot. The October issues below remain dated drafts.</p><div class="actions"><button type="button" data-view="directory">Open league register</button></div>`;
  return `<p class="kicker">Your edition</p><h2>${esc(personal.team.name)}</h2><p>${esc(personal.team.managerName)}<br>${record(personal.team)} · standing ${personal.standing.rank} / ${teams.length}<br>${personal.coverage.roster} roster players</p><div class="actions"><a href="/team">My team</a><a href="/teams/1#team-roster">Full team roster</a></div><p class="quiet-context">Checked ${date(personal.checkedAt,true)}. Current examples are synthetic.</p>`;
}

function valuationHTML() {
  const v = personal.valuation;
  return `<p class="kicker">Modeled market / current roster</p><h2>${v.complete ? 'Your roster value.' : 'Your priced subtotal.'}</h2><p class="total">${money(v.total)}</p><p>${v.priced} priced / ${personal.coverage.roster} roster · ${v.unpriced} unpriced</p><p>FAAB-denominated model · ${esc(personal.market.pricingBasis)} basis<br>Computed ${date(personal.market.updatedAt,true)}</p>
    <p>Supplied modeled value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied?' (tied)':''}.</p><details><summary>All ${personal.rosterValues.length} roster values</summary>${personal.rosterValues.map(p => `<div class="value-row"><span>${playerLink(p.id,p.name)}<span class="meta">${esc(p.position)}</span></span><span class="num">${money(p.value)}</span></div>`).join('')}</details><p class="small">${esc(inventory.missing.history)}</p><div class="actions"><a href="/stocks#player-board">Inspect the player market</a><a href="/trade-analyzer">Analyze a trade</a></div>`;
}

function topValuesHTML() {
  return `<p class="kicker">Three highest modeled values</p>${personal.players.map(p => `<div class="top-value">${portrait(p.id,p.name)}<div>${playerLink(p.id,p.name)}<span class="change">${esc(p.position)} · modeled change ${p.changePct == null ? 'unavailable' : `${p.changePct > 0 ? 'Up' : p.changePct < 0 ? 'Down' : 'Flat'} ${Math.abs(p.changePct).toFixed(1)}%`}</span></div><strong class="num">${money(p.value)}</strong></div>`).join('')}<p class="mini-note">Price movement is a model observation, not playing form or fantasy points. No recorded history series is connected.</p>`;
}

function aiRowsHTML() {
  if (!data.weekly) return `<p class="kicker">Saved AI / source unavailable</p><h2>No saved slate.</h2><p class="status-note">AI unavailable in this requested state. No choices, probabilities or confidence are invented.</p><a href="/ai-decides">Open AI Decides</a>`;
  return `<p class="kicker">Saved ${date(data.weekly.generatedAt,true)} / Week ${data.weekly.week}</p><h2>What the model returned.</h2><p>${aiState === 'stale' ? '<strong>Stale saved slate. These picks are historical context.</strong>' : 'Synthetic saved slate. No generation occurs here.'} Choices stay separate from probability and confidence.</p>${data.weekly.matchups.map(row => {
    const r = row.result;
    return `<div class="ai-row"><div class="ai-pair">${row.teamIds.map(teamLink).join(' / ')}</div><p>Returned choice: <strong>${esc(teamName(r.choice))}</strong> (roster ${esc(r.choice)})</p><div class="distribution">${r.probabilities.map(p => `<span>${esc(teamName(p.choice))} <strong>${percent(p.probability)}</strong></span>`).join('')}</div><p>Independent confidence <strong>${percent(r.confidence)}</strong></p><details><summary>Saved source and input details</summary><dl class="metadata"><dt>Status</dt><dd>${esc(aiState === 'stale' ? 'stale' : row.status)} · ${esc(row.message)}</dd><dt>Saved at</dt><dd>${date(data.weekly.generatedAt,true)}</dd><dt>Season / week</dt><dd>${esc(data.weekly.season)} / ${data.weekly.week}</dd><dt>League</dt><dd>${esc(data.weekly.leagueId)}</dd><dt>Model</dt><dd>${esc(r.model)}</dd><dt>Prompt</dt><dd>${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot || data.weekly.snapshot ? esc(JSON.stringify(r.snapshot ?? data.weekly.snapshot)) : 'Not supplied (null)'}</dd><dt>Evidence</dt><dd>${esc([...row.evidence,...r.evidence].join(' ') || 'Not supplied')}</dd><dt>Probability</dt><dd>${esc(r.probabilityLabel)}</dd><dt>Identity</dt><dd>Roster IDs ${row.teamIds.map(esc).join(', ')}. Names are current display names.</dd></dl></details></div>`;
  }).join('')}<div class="actions"><a href="/ai-decides">Open AI Decides</a></div>`;
}

function watchHTML() {
  const w = personal.playerGuide.watch;
  return `<p class="kicker">Scouting / observed at fixture check</p><h2>On form, with limits.</h2><p>${esc(w.label)}</p>${w.rows.map(p => `<div class="value-row"><span>${playerLink(p.id,p.name)}<span class="meta">${p.games} observed games · ${esc(p.note)}</span></span><strong class="num">${p.value.toFixed(1)}<br>EMA FPPG</strong></div>`).join('')}<p>${esc(w.message)}</p>`;
}

function completedHTML() {
  const g = personal.playerGuide;
  const merged = new Map();
  for (const [key,label] of [['best','Best'],['rough','Rough']]) for (const r of g[key]) {
    if (!merged.has(r.id)) merged.set(r.id,{...r,tags:[]});
    merged.get(r.id).tags.push(label);
  }
  return `<p class="kicker">Completed source period / Week ${g.previousWeek}</p><h2>The week we can look back on.</h2><p>${esc(g.period)}</p><p>Best ${g.best.length} / ${g.eligiblePlayed} eligible · Rough ${g.rough.length} / ${g.eligiblePlayed} eligible. Shared selections appear once.</p><ul class="recorded-list">${[...merged.values()].sort((a,b)=>b.value-a.value).map(p => `<li><div class="row-head">${playerLink(p.id,p.name)}<span class="number">${p.value.toFixed(1)} pts · ${p.games} GP</span></div><span class="tag">${p.tags.join(' + ')}${p.tags.length>1?' · overlapping cohort':''}</span><p>${esc(p.note)}</p></li>`).join('')}</ul><details><summary>Period and participation coverage</summary><p>${esc(g.recapMessage)}</p><p>${esc(g.coverage)}</p><p>${esc(inventory.missing.recap)}</p></details>`;
}

function sourceList(sources) {
  return `<ul class="source-list">${sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a><span>Checked ${esc(s.checkedAt)}</span></li>`).join('')}</ul>`;
}

function editionHTML(ed) {
  const g = ed.game;
  return `<p class="kicker">Dated sample issue / ${esc(ed.status)}</p><h2>${esc(ed.title)}</h2><p>${esc(ed.dateLabel)} · ${ed.publishedAt ? `Published ${date(ed.publishedAt)}` : 'Not published'}</p><h3>${esc(g.title)}</h3><p>${esc(g.note)}${g.leagueWeek == null ? '' : ` · source Week ${g.leagueWeek}`}</p><p>${g.teamIds.map(teamLink).join(' / ')}${g.scores ? ` · ${g.scores.map(score).join(' – ')} · ${esc(g.state)}` : ` · ${esc(g.state)} in this dated issue`}</p><p>${esc(g.context)}</p><details><summary>Why this dated game was selected</summary><p>${esc(g.selectionReason)}</p><p>Issue window ${date(ed.startsAt)} to ${date(ed.endsAt)} (end exclusive). This is separate from the synthetic current Week 3 snapshot.</p></details>
    ${(ed.playerSpotlights ?? []).map(p => `<section class="story"><div class="story-identity">${portrait(p.playerId,p.name)}<div><p class="kicker">${esc(p.periodLabel)}</p><h3>${playerLink(p.playerId,p.name)}</h3></div></div><p>${esc(p.position)} · current roster ${teamLink(p.teamId)}</p><h4>${esc(p.headline)}</h4><p>${esc(p.opinion)}</p><div class="stats">${p.stats.map(s=>`<span><strong>${esc(s.value)}</strong>${esc(s.label)}</span>`).join('')}</div><p>${esc(p.statPeriod)}</p><details><summary>Opinion, selection and source</summary><p>${esc(p.selectionReason)}</p>${sourceList([p.source])}</details></section>`).join('')}
    <details><summary>Issue sources and dated happenings</summary>${ed.happenings.map(h => `<div class="wire-item"><strong>${esc(h.dateLabel)} · ${esc(h.title)}</strong><p>${esc(h.text)} <a href="${esc(h.href)}">Related profile</a></p></div>`).join('')}${sourceList(ed.sources)}</details><div class="actions"><a href="/weekly/${esc(ed.id)}">Read archived issue ${esc(ed.id)}</a></div>`;
}

function standingsHTML() {
  return `<ol class="standings"><li class="standings-labels" aria-hidden="true"><span>#</span><span>Team / manager</span><span class="stat">W–L</span><span class="stat">PF</span></li>${home.hub.standings.map(s => `<li><strong>${s.rank}</strong><span>${teamLink(s.team.id)}<span class="manager">${esc(s.team.managerName)}</span></span><span class="stat">${s.wins}–${s.losses}</span><span class="stat">${(s.pointsFor/100).toFixed(1)}</span></li>`).join('')}</ol>`;
}

function registerPreviewHTML() {
  return `<p class="kicker">League register / as-of snapshot</p><h2>Ten names to keep up with.</h2><p>${teams.length} franchises · ${uniquePlayers} unique players. Current records, opponents and all roster references are filed under this check date.</p><div class="actions"><button type="button" data-view="directory">Search teams and players</button><a href="/teams">Team profiles</a></div><details><summary>All 10 current standings</summary><p>Synthetic ${home.hub.season.seasonYear} standings · PF in fantasy points.</p>${standingsHTML()}</details><p>${esc(inventory.missing.power)}</p>`;
}

function allEvents() {
  const events = [event({id:'current',day:'12',month:'NOV',type:'league personal',body:matchupHTML(),aside:memberAside()})];
  if (personal) {
    events.push(event({id:'value',side:'left',day:'12',month:'NOV',type:'personal market',body:valuationHTML(),aside:topValuesHTML()}));
    events.push(event({id:'watch',day:'12',month:'NOV',type:'personal',body:watchHTML(),aside:'<p class="kicker">A source distinction</p><h2>Form is a basketball measure.</h2><p>Read the games and availability note. The market entry above uses a different model and a different unit.</p>'}));
  } else {
    events.push(event({id:'market',side:'left',day:'12',month:'NOV',type:'market league',body:`<p class="kicker">Modeled market / ten franchise faces</p><h2>Who carries each roster?</h2><p>See all ten leading player values in the dated league register, with player and team profile links.</p><div class="actions"><button type="button" data-view="directory">Open the ten-team index</button><a href="/stocks#player-board">Player Stocks</a><a href="/trade-analyzer">Trade analyzer</a></div>`,aside:'<p class="kicker">Model values</p><p>FAAB-denominated values are synthetic, with no claim about historical team performance.</p>'}));
  }
  events.push(event({id:'register',day:'12',month:'NOV',type:'league market',body:registerPreviewHTML(),aside:'<p class="kicker">A dated register</p><p>Roster membership is a snapshot here. The time spine does not imply a reconstructed ownership history.</p>'}));
  events.push(event({id:'moves',side:'left',day:'12',month:'NOV',type:'league personal',body:`<p class="kicker">Sample activity / ${date(home.hub.transactions[0].createdAt,true)}</p><h2>At the transaction desk.</h2>${home.hub.transactions.map(t=>`<div class="wire-item"><p>${esc(t.summary)}</p><span class="small">Week ${t.week} · ${esc(t.type.replaceAll('_',' '))} · no add/drop legs supplied</span></div>`).join('')}<div class="actions"><a href="/transactions">All transactions</a></div>`,aside:personal ? `<p class="kicker">Your team wire / sample</p>${personal.news.map(n=>`<div class="wire-item"><a href="${esc(n.url)}">${esc(n.headline)}</a><p>${esc(n.outlet.name)} · ${date(n.publishedAt)}</p></div>`).join('')}<p>Personal recent move: ${esc(personal.moves[0].summary)}</p><a href="/intel">News desk</a>` : '<p class="kicker">Sample source</p><p>These are supplied roster-move summaries. Player details are not present and are not inferred.</p>'}));
  events.push(event({id:'ai',day:'10',month:'NOV',source:'nov10',type:'league personal',body:aiRowsHTML(),aside:data.weekly ? `<p class="kicker">A saved observation</p><h2>A pick is not the biggest percentage.</h2><p>The first returned choice is Ware the Hoes At? at 35%, while Reaves Dropper has 65%. The saved choice remains unchanged.</p><p>Confidence is independently 20%; it is not the same as either probability.</p>` : '<p class="kicker">Unavailable source</p><h2>No pick to interpret.</h2><p>The requested missing state supplies no saved slate. The dated placeholder keeps the information gap visible.</p>'}));
  if (personal) events.push(event({id:'completed',side:'left',day:'2–9',month:'NOV',source:'week2',type:'personal',body:completedHTML(),aside:'<p class="kicker">End exclusive / Nov 9</p><h2>Completed evidence,<br>small cohort.</h2><p>Five players have verified participation in this synthetic source period. Best and rough selections can overlap.</p>'}));
  const october = data.archive.find(e=>e.id==='2026-W41');
  events.push(event({id:'oct7',side:'left',day:'07',month:'OCT',source:'october',type:'league',body:`<p class="kicker">Dated issue / Oct 7</p><h2>${esc(october.happenings[0].title)}</h2><p>${esc(october.happenings[0].text)}</p><a href="${esc(october.happenings[0].href)}">Open player profile</a>`,aside:'<p class="kicker">October archive begins</p><p>These entries keep their original source dates. They are not fresh November activity.</p>'}));
  events.push(event({id:'oct6',day:'06',month:'OCT',source:'october',type:'league',body:`<p class="kicker">Dated issue / Oct 6</p>${october.happenings.slice(1).map(h=>`<div class="wire-item"><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p><a href="${esc(h.href)}">Related profile</a></div>`).join('')}`}));
  events.push(event({id:'issue41',day:'5–11',month:'OCT',source:'october',type:'league',body:editionHTML(october),aside:`<p class="kicker">Issue 2026-W41</p><h2>Not the current week.</h2><p>Draft · sources checked October 8. The player takes use their supplied NBA or college periods.</p><a href="/weekly/${esc(october.id)}">Open dated edition</a>`}));
  const older = data.archive.find(e=>e.id==='2026-W40');
  events.push(event({id:'issue40',side:'left',day:'28–4',month:'SEP/OCT',source:'october',type:'league',body:editionHTML(older),aside:'<p class="kicker">2025 final / historical recap</p><p>The source is a dated draft looking backward. Its historical final score does not describe a current matchup.</p>'}));
  return events;
}

function directoryRows() {
  const query = directoryQuery.trim().toLocaleLowerCase();
  let rows = directories.map(t => ({...t, matches:t.players.filter(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`.toLocaleLowerCase().includes(query)), teamMatch:`${t.identity.name} ${t.identity.managerName}`.toLocaleLowerCase().includes(query)})).filter(t=>!query || t.teamMatch || t.matches.length);
  const ranks = new Map(home.hub.standings.map(s=>[s.team.id,s.rank]));
  rows.sort((a,b)=> ['name','players'].includes(directorySort) ? a.identity.name.localeCompare(b.identity.name) : directorySort==='roster' ? b.players.length-a.players.length || a.identity.name.localeCompare(b.identity.name) : ranks.get(a.identity.id)-ranks.get(b.identity.id));
  const playerCount = rows.reduce((n,t)=>n+(!query || t.teamMatch ? t.players.length:t.matches.length),0);
  return {playerCount,rows,html:rows.map(t=>{
    const f = data.faces.find(f=>f.team.id===t.identity.id);
    const p = t.currentMatchup;
    const opponent = p.home.id===t.identity.id?p.away:p.home;
    const shown = [...(!query || t.teamMatch ? t.players : t.matches)];
    if(directorySort==='players') shown.sort((a,b)=>a.fullName.localeCompare(b.fullName));
    return `<details class="directory-row" data-team="${esc(t.identity.id)}" ${query?'open':''}><summary>${portrait(f.player.id,f.player.name)}<span class="directory-title"><strong>${esc(t.identity.name)}</strong><span>${esc(t.identity.managerName)} · ${record(t.currentRecord)} · ${t.players.length} players</span><span>${esc(f.player.name)} · ${money(f.player.value)} modeled</span></span></summary><div class="directory-content"><p class="face-value">${playerLink(f.player.id,f.player.name)} · ${esc(f.player.position)} · ${money(f.player.value)} modeled FAAB${f.champion?' · franchise won the 2025 title':''}</p><p>Current Week ${p.week} opponent: ${teamLink(opponent.id)}. Scores ${score(p.homePoints)} / ${score(p.awayPoints)} · incomplete.</p><p>${t.previousSeason.season}: ${t.previousSeason.wins}–${t.previousSeason.losses} · finish ${t.previousSeason.finish}${t.previousSeason.ownerNote?` · ${esc(t.previousSeason.ownerNote)}`:''}</p><div class="actions"><a href="/teams/${esc(t.identity.id)}">Team profile</a><a href="/teams/${esc(t.identity.id)}#team-roster">Full profile roster</a></div><p>${shown.length} displayed player references${query?' matching this search':''}</p><ul class="roster-list">${shown.map(p=>`<li>${playerLink(p.id,p.fullName)}<span>${esc(p.position)} · ${esc(p.nbaTeam || 'NBA team unavailable')} · ID ${esc(p.id)}</span></li>`).join('')}</ul></div></details>`;
  }).join('')};
}

function renderDirectory() {
  const results = directoryRows();
  $('#thread').innerHTML = event({id:'directory',day:'12',month:'NOV',body:`<div class="index-lead"><p class="kicker">League register / checked ${date(home.checkedAt,true)}</p><h2>Look up a name.</h2><p>Ten franchises and ${uniquePlayers} unique roster players. All ten faces show the supplied top modeled player, not a computed performance award.</p><p>${esc(inventory.missing.power)}</p></div><div class="directory-controls"><label>Team, manager, player, position or NBA team<input type="search" id="directory-search" placeholder="Try Embiid, NeuralNets or PG" value="${esc(directoryQuery)}"></label><label>Sort register<select id="directory-sort"><option value="rank" ${directorySort==='rank'?'selected':''}>Current standing</option><option value="name" ${directorySort==='name'?'selected':''}>Team name A–Z</option><option value="roster" ${directorySort==='roster'?'selected':''}>Roster count, high first</option><option value="players" ${directorySort==='players'?'selected':''}>Player names A–Z</option></select></label></div><p class="directory-count" id="directory-count" aria-live="polite">${results.rows.length} teams · ${results.playerCount} roster references${directoryQuery?' matched':''}</p><div id="directory-results">${results.html || '<p>No teams or players match. Clear the search to see all ten franchises.</p>'}</div><details id="index-standings"><summary>All 10 current standings · synthetic</summary>${standingsHTML()}</details><p>Recorded team-value history is unavailable. The register is a single dated snapshot, with no reconstructed trend.</p><div class="actions"><button type="button" data-view="log">Return to the dated log</button><a href="/teams">Open Teams</a></div>`}).html;
}

function updateResults() {
  const r = directoryRows();
  $('#directory-results').innerHTML = r.html || '<p>No teams or players match. Clear the search to see all ten franchises.</p>';
  $('#directory-count').textContent = `${r.rows.length} teams · ${r.playerCount} roster references${directoryQuery?' matched':''}`;
}

function render() {
  document.body.dataset.index = String(view==='directory');
  document.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(view==='log'&&scope===b.dataset.scope)));
  $('#source-period').value = period;
  if (view === 'directory') {
    renderDirectory();
    $('#view-status').textContent = 'Register · as of Nov 12 fixture snapshot';
    $('#index-button').textContent = 'Return to dated log';
  } else {
    const events = allEvents().filter(e=>(scope==='all'||e.type.includes(scope))&&(period==='all'||period===e.source));
    $('#thread').innerHTML = events.map(e=>e.html).join('') || `<article class="event"><div class="stamp"><strong>—</strong><span>No source</span></div><div class="event-body empty-message"><h2>No entries for this combination.</h2><p>${scope==='personal'&&!personal?'The public edition has no personal team data.':'The fixture contains no events with this follow and source-period combination.'}</p><button type="button" data-reset>Show all supplied entries</button></div></article>`;
    $('#view-status').textContent = `${events.length} dated entries · ${scope==='all'?'everything':scope==='personal'?'your team':scope} · newest source first`;
    $('#index-button').textContent = 'Find a team / player';
  }
}

function setState(nextView,nextScope='all',nextPeriod='all') {
  view = nextView;
  scope = nextScope;
  period = nextPeriod;
  render();
}

$('#filters').addEventListener('submit',e=>e.preventDefault());
document.addEventListener('click',e=>{
  const scopeButton=e.target.closest('[data-scope]');
  if(scopeButton) setState('log',scopeButton.dataset.scope,period);
  const viewButton=e.target.closest('[data-view]');
  if(viewButton) {
    if(viewButton.dataset.view==='directory') {returnLog={scope,period,scroll:window.scrollY};setState('directory');$('#journal').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
    else {setState('log',returnLog.scope,returnLog.period);$('#journal').focus({preventScroll:true});window.scrollTo({top:returnLog.scroll,behavior:'instant'});}
  }
  const jump=e.target.closest('[data-jump]');
  if(jump) { setState('log'); const target=$(`#event-${jump.dataset.jump}`); target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'instant'}); }
  if(e.target.closest('#reset-log,[data-reset]')) setState('log');
  if(e.target.closest('#index-button')) {
    if(view==='directory') {setState('log',returnLog.scope,returnLog.period);window.scrollTo({top:returnLog.scroll,behavior:'instant'});}
    else {returnLog={scope,period,scroll:window.scrollY};setState('directory');}
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='source-period') { period=e.target.value; view='log'; render(); }
  if(e.target.id==='pairing') { selectedPair=Number(e.target.value); const old=$('#pairing'); const parent=old.closest('.event-body'); parent.innerHTML=matchupHTML(); $('#pairing').focus(); }
  if(e.target.id==='directory-sort') { directorySort=e.target.value; updateResults(); }
});
document.addEventListener('input',e=>{
  if(e.target.id==='directory-search') {directoryQuery=e.target.value;updateResults();}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('.tools').open) { $('.tools').open=false; $('.tools summary').focus(); }
});

$('#edition-switch').textContent = mode==='member'?'View public edition':'View member edition';
$('#edition-switch').href = `?view=${mode==='member'?'public':'member'}${aiState==='ready'?'':`&ai=${encodeURIComponent(aiState)}`}`;
$('#personal-filter').hidden = !personal;
$('#footer-source').textContent = `Checked fixture ${date(home.checkedAt,true)} · source benchmark ${inventory.benchmark.slice(0,12)}. Architecture study 06; grayscale only.`;

window.goatStudy = {
  states: [
    {id:'default',label:'Chronological league log'},
    {id:'league',label:'League-only dated log'},
    ...(personal?[{id:'personal',label:'My team through time'},{id:'week2',label:'Completed Week 2 evidence'}]:[]),
    {id:'market',label:'Modeled market observations'},
    {id:'ai',label:'Saved AI at its source date'},
    {id:'archive',label:'Dated September / October issues'},
    {id:'directory',label:'Searchable dated team and player register'}
  ],
  activate(id) {
    directoryQuery='';directorySort='rank';
    const map={default:['log'],league:['log','league'],personal:['log','personal'],market:['log','market'],week2:['log','personal','week2'],ai:['log','all','nov10'],archive:['log','league','october'],directory:['directory']};
    if(!map[id]) throw new Error(`Unknown study state ${id}`);
    setState(...map[id]);
    window.scrollTo({top:0,behavior:'instant'});
  }
};
render();
document.body.dataset.studyReady='06';
