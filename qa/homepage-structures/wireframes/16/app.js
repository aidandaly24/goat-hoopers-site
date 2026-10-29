import {inventory,data,mode,aiState,esc,money} from '../../data.js';

const $ = s => document.querySelector(s);
const teams = data.home.directory;
const personal = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
const byId = id => teams.find(t => t.identity.id === String(id));
const faceFor = id => data.faces.find(f => f.team.id === String(id));
const teamName = id => byId(id)?.identity.name ?? String(id);
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const date = value => new Date(value).toLocaleString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}) + ' UTC';
const percent = v => `${Math.round(v * 100)}%`;
const pts = v => v == null ? 'Pending' : Number(v).toFixed(1);
const state = {view:'bench',team:'1',tab:'week',chapter:'slate',query:'',sort:'name',rosterQuery:'',rosterSort:'name'};
const teamLink = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const source = s => `<a href="${esc(s.url)}">${esc(s.label)}</a> · checked ${esc(s.checkedAt)}`;

function scorepair(m){
  if(!m) return '<p>Current matchup unavailable.</p>';
  return `<div class="scorepair"><div class="score-team"><h3>${teamLink(m.home)}</h3><div class="meta">${esc(m.home.managerName)} · ${record(m.home)}</div><div class="score">${pts(m.homePoints)}</div></div><span class="versus">vs</span><div class="score-team"><h3>${teamLink(m.away)}</h3><div class="meta">${esc(m.away.managerName)} · ${record(m.away)}</div><div class="score">${pts(m.awayPoints)}</div></div></div><p class="note">Week ${m.week} · Incomplete, not a final result. Pending means unavailable; 0.0 is a known score.</p>`;
}
function ai(m){
  const pick = data.weekly?.matchups.find(p => p.teamIds.includes(m.home.id) && p.teamIds.includes(m.away.id));
  if(!pick?.result) return '<div class="ai"><p class="status">AI pick unavailable</p><p>No saved result is connected for this pairing.</p><a href="/ai-decides">Open AI Decides</a></div>';
  const r = pick.result;
  const stale = aiState === 'stale' || data.weekly.status === 'stale';
  return `<div class="ai"><p class="kicker">${stale ? 'Stale saved pick · no current prediction' : 'Saved model pick · synthetic'}</p><p class="choice">Returned choice: ${esc(teamName(r.choice))}</p><div class="probabilities">${r.probabilities.map(p=>`<span>${esc(teamName(p.choice))} <strong>${percent(p.probability)}</strong></span>`).join('')}</div><p class="note">Confidence ${percent(r.confidence)} · separate from probability.</p><details><summary>Model, time & evidence</summary><p>${esc(r.probabilityLabel)}. The returned choice is preserved even when its probability is lower.</p><p>Saved ${date(data.weekly.generatedAt)} · season ${esc(data.weekly.season)}, Week ${data.weekly.week}.</p><p>Model: ${esc(r.model)}<br>Prompt: ${esc(r.promptVersion)}<br>Input snapshot: ${r.snapshot ? esc(JSON.stringify(r.snapshot)) : 'unavailable (null in fixture)'}<br>Slate snapshot: ${data.weekly.snapshot ? esc(JSON.stringify(data.weekly.snapshot)) : 'unavailable (null in fixture)'}</p><p>Input evidence: ${esc(pick.evidence.join(' '))}<br>Returned evidence: ${r.evidence.length ? esc(r.evidence.join(' ')) : 'none supplied'}<br>Baseline: ${pick.baseline ? esc(JSON.stringify(pick.baseline)) : 'unavailable'}</p><a href="/ai-decides">Full AI Decides</a></details></div>`;
}
function playerRows(players,values){
 return `<ul class="player-list">${players.map(p=>`<li class="player-row" data-player-id="${esc(p.id)}"><a href="/player/${esc(p.id)}">${esc(p.fullName ?? p.name)}</a><span class="bio">${esc(p.position)} · ${esc(p.nbaTeam ?? byId(state.team)?.players.find(x=>x.id===p.id)?.nbaTeam ?? '')}</span>${values ? `<span class="price">${money(values.find(v=>v.id===p.id)?.value)}</span>` : '<span></span>'}</li>`).join('')}</ul>`;
}
function memberValue(){
 if(!personal || state.team !== personal.team.id) return '';
 const v = personal.valuation;
 return `<div class="reading-section"><p class="kicker">Your modeled FAAB ${v.complete ? 'total' : 'subtotal'}</p><p class="value-line">${money(v.total)}</p><p class="note">${v.priced}/${personal.coverage.roster} priced · ${v.unpriced} unpriced · ${esc(personal.market.pricingBasis)} pricing basis · ${date(personal.market.updatedAt)}. Modeled value, not a transaction or cash balance.</p><div class="top-three">${personal.players.map(p=>`<p><a href="/player/${p.id}">${esc(p.name)}</a><br><strong>${money(p.value)}</strong> · ${p.changePct == null ? 'Change unavailable' : `${p.changePct > 0 ? '+' : ''}${p.changePct}%`}</p>`).join('')}</div><p class="note">Value rank ${v.rank.rank} of ${v.rank.teams}. ${esc(inventory.missing.history)}</p><button type="button" data-tab="roster">Inspect all ${personal.rosterValues.length} roster values</button></div>`;
}
function weekContent(t){
 return `<div class="detail-body"><p class="kicker">${personal && state.team===personal.team.id ? 'Your' : 'Current'} Week ${t.currentMatchup?.week ?? '—'} matchup · synthetic</p>${scorepair(t.currentMatchup)}${t.currentMatchup ? ai(t.currentMatchup) : ''}${memberValue()}<div class="inline-links"><button type="button" data-reader="slate">Read all five matchups</button><a href="/trade-analyzer">Analyze a trade</a></div></div>`;
}
function rosterContent(t){
 const own = personal && state.team === personal.team.id;
 let players = t.players.filter(p => `${p.fullName} ${p.position} ${p.nbaTeam}`.toLowerCase().includes(state.rosterQuery.toLowerCase()));
 players.sort((a,b) => state.rosterSort === 'position' ? a.position.localeCompare(b.position) || a.fullName.localeCompare(b.fullName) : state.rosterSort === 'value' && own ? (personal.rosterValues.find(p=>p.id===b.id)?.value ?? -Infinity) - (personal.rosterValues.find(p=>p.id===a.id)?.value ?? -Infinity) || a.fullName.localeCompare(b.fullName) : a.fullName.localeCompare(b.fullName));
 return `<div class="detail-body">${own ? memberValue() : `<p>Roster references for ${esc(t.identity.name)}. Individual modeled prices are not supplied for this full public roster.</p>`}<div class="roster-tools"><label>Find a player<input id="roster-search" type="search" value="${esc(state.rosterQuery)}" placeholder="Name, position or NBA team"></label><label>Sort roster<select id="roster-sort"><option value="name" ${state.rosterSort==='name'?'selected':''}>Player name</option><option value="position" ${state.rosterSort==='position'?'selected':''}>Position</option>${own ? `<option value="value" ${state.rosterSort==='value'?'selected':''}>Modeled value, high first</option>` : ''}</select></label></div><p class="note" aria-live="polite">${players.length} of ${t.players.length} players${own ? ' · prices in modeled FAAB dollars' : ''}</p>${playerRows(players,own ? personal.rosterValues : null)}<p class="note">${esc(inventory.missing.power)}</p></div>`;
}
function guideRows(rows,unit){
 return `<ul class="guide-list">${rows.map(p=>`<li><a href="/player/${p.id}">${esc(p.name)}</a><span>${p.value} ${unit} · ${p.games} GP</span></li>`).join('')}</ul>`;
}
function scoutingContent(){
 const g = personal.playerGuide;
 return `<div class="detail-body"><div class="reading-section"><p class="kicker">Scouting notebook · synthetic</p><h3>${esc(g.watch.label)}</h3>${guideRows(g.watch.rows,'FP/G')}<p class="note">${esc(g.watch.message)}</p></div><div class="reading-section"><h3>Completed Week ${g.previousWeek}: best & rough</h3><p class="note">${esc(g.period)} · ${esc(inventory.missing.recap)}</p><details open><summary>Best recorded points</summary>${guideRows(g.best,'FP')}</details><details><summary>Rough recorded points</summary>${guideRows(g.rough,'FP')}</details><p class="note">${esc(g.coverage)} Eligible played: ${g.eligiblePlayed}.</p></div><div class="reading-section"><h3>Your team wire · synthetic</h3>${personal.news.map(n=>`<p><a href="${esc(n.url)}">${esc(n.headline)}</a><br><span class="note">${esc(n.outlet.name)} · ${date(n.publishedAt)}</span></p>`).join('')}<h3>Recent moves</h3>${personal.moves.map(m=>`<p>${esc(m.summary)}<br><span class="note">Week ${m.week} · ${date(m.createdAt)} · ${esc(m.type)}. No individual add/drop names supplied.</span></p>`).join('')}<a href="/transactions">All transactions</a></div></div>`;
}
function renderDossier(){
 const t = byId(state.team), f = faceFor(state.team), rank = data.home.hub.standings.find(s=>s.team.id===state.team);
 const own = personal && personal.team.id === state.team;
 if(state.tab==='scouting'&&!own) state.tab='week';
 $('#dossier').innerHTML = `<div class="identity"><p class="number">BENCH ${String(teams.indexOf(t)+1).padStart(2,'0')} / 10 ${own ? '· YOUR FRANCHISE' : ''}</p><h2 id="team-title">${esc(t.identity.name)}</h2><p>${esc(t.identity.managerName)}</p><p>${record(t.currentRecord)} current record · #${rank.rank} standing<br>${t.players.length} roster players</p><details class="identity-meta"><summary>Franchise notes & profile links</summary><p class="note">Featured face: <a href="/player/${f.player.id}">${esc(f.player.name)}</a> · ${money(f.player.value)} modeled FAAB.</p><p class="note">${esc(t.previousSeason.season)}: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}.${t.previousSeason.ownerNote ? ` ${esc(t.previousSeason.ownerNote)}` : ''}</p><div class="links"><a href="/teams/${esc(t.identity.id)}">Franchise profile</a>${own ? '<a href="/team">My team</a>' : ''}<a href="/teams/${esc(t.identity.id)}#team-roster">Full team roster</a></div></details></div><div class="dossier-main"><nav class="dossier-tabs" aria-label="Franchise dossier"><button type="button" data-tab="week" ${state.tab==='week'?'aria-current="page"':''}>This week</button><button type="button" data-tab="roster" ${state.tab==='roster'?'aria-current="page"':''}>Roster${own ? ' & value' : ''}</button>${own ? `<button type="button" data-tab="scouting" ${state.tab==='scouting'?'aria-current="page"':''}>Scouting & wire</button>` : ''}</nav>${state.tab==='roster' ? rosterContent(t) : state.tab==='scouting' ? scoutingContent() : weekContent(t)}</div>`;
}
function renderFilmstrip(){
 const f = data.faces;
 $('#filmstrip').innerHTML = f.map((entry,i)=>`<button class="face" type="button" data-team="${entry.team.id}" aria-controls="dossier" aria-label="${esc(entry.player.name)}; open ${esc(entry.team.name)} dossier; ${money(entry.player.value)} modeled FAAB" style="--height:${[17,15,18,16,17.7,15.8,18.8,17,15,18][i]}rem"><span class="face-num">${String(i+1).padStart(2,'0')}</span><img src="${esc(inventory.portraits[entry.player.id])}" alt="" width="280" height="280"><span class="face-label">${esc(entry.player.name)}<span>${esc(entry.team.name)}</span></span></button>`).join('');
 $('#team-index').innerHTML=f.map((entry,i)=>`<option value="${entry.team.id}">${String(i+1).padStart(2,'0')} ${esc(entry.team.name)}</option>`).join('');
}
function updateFilmstrip(){
 document.querySelectorAll('.face').forEach(b=>{const selected=b.dataset.team===state.team;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.tabIndex=selected?0:-1;b.style.order=(Number(b.dataset.team)-Number(state.team)+10)%10;});
 $('#team-index').value=state.team;
 const i=teams.findIndex(t=>t.identity.id===state.team);
 $('#previous').setAttribute('aria-label',`Previous franchise: ${teams[(i+9)%10].identity.name}`);
 $('#previous').innerHTML=`<span>Previous franchise</span><span class="neighbor-name">${esc(teams[(i+9)%10].identity.name)}</span>`;
 $('#next').setAttribute('aria-label',`Next franchise: ${teams[(i+1)%10].identity.name}`);
 $('#next').innerHTML=`<span>Next franchise</span><span class="neighbor-name">${esc(teams[(i+1)%10].identity.name)}</span>`;
 const selected=document.querySelector('.face.selected');
 if(innerWidth>600) $('#filmstrip').scrollTo({left:0,behavior:'instant'});
 else $('#filmstrip').scrollLeft=0;
}
function slateContent(){
 const matches=teams.map(t=>t.currentMatchup).filter((m,i,a)=>m && a.findIndex(x=>x && x.home.id===m.home.id && x.away.id===m.away.id)===i);
 return `<h2>Week 3, across the bench.</h2><p>All five current pairings · synthetic, incomplete scores. ${aiState==='stale'?'Saved AI slate is stale.':aiState==='missing'?'Saved AI slate is unavailable.':'Saved AI slate from Nov 10, 2026.'}</p>${matches.map(m=>`<section class="slate-row" aria-label="${esc(m.home.name)} versus ${esc(m.away.name)}"><div>${scorepair(m)}<button type="button" data-open-team="${m.home.id}">Open ${esc(m.home.name)} on the bench</button></div>${ai(m)}</section>`).join('')}<p class="note">No generation runs here. Current fixture checked ${date(data.home.checkedAt)}.</p>`;
}
function standings(){
 return `<h3>Current standings · synthetic</h3><table class="standings"><thead><tr><th scope="col">#</th><th scope="col">Franchise</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s=>`<tr><td>${s.rank}</td><td>${teamLink(s.team)}</td><td>${s.wins}–${s.losses}</td><td>${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
}
function directoryList(){
 const q=state.query.trim().toLowerCase();
 const filtered=teams.filter(t=>`${t.identity.name} ${t.identity.managerName} ${t.players.map(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`).join(' ')}`.toLowerCase().includes(q));
 filtered.sort((a,b)=>state.sort==='points' ? b.currentRecord.pointsFor-a.currentRecord.pointsFor || a.identity.id.localeCompare(b.identity.id) : state.sort==='rank' ? data.home.hub.standings.find(s=>s.team.id===a.identity.id).rank-data.home.hub.standings.find(s=>s.team.id===b.identity.id).rank : a.identity.name.localeCompare(b.identity.name));
 return `<p class="note" aria-live="polite">${filtered.length} of 10 franchises · ${new Set(teams.flatMap(t=>t.players.map(p=>p.id))).size} unique player references.</p>${filtered.length ? filtered.map(t=>{const m=t.currentMatchup;const opponent=m.home.id===t.identity.id?m.away:m.home;return `<details class="club" ${q?'open':''}><summary><strong>${esc(t.identity.name)}</strong><span>${esc(t.identity.managerName)} · ${record(t.currentRecord)} · ${t.players.length} players</span></summary><div class="club-content"><p>Week ${m.week}: ${esc(opponent.name)} · incomplete ${pts(m.homePoints)} / ${pts(m.awayPoints)}.</p><p class="note">${t.previousSeason.season}: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}. ${esc(t.previousSeason.ownerNote??'')}</p><div class="club-meta"><a href="/teams/${t.identity.id}">Team profile</a><button type="button" data-open-team="${t.identity.id}">Find on the bench</button></div>${playerRows(t.players,null)}</div></details>`;}).join('') : '<p>No matching franchise or player. Clear the search to see the whole bench.</p>'}`;
}
function directoryContent(){
 return `<h2>Names before numbers.</h2><p>Open any franchise for its full roster, or search for a player to find their team.</p><div class="roster-tools"><label>Search teams, managers & players<input id="league-search" type="search" value="${esc(state.query)}" placeholder="Try Curry or NeuralNets"></label><label>Sort franchises<select id="league-sort"><option value="name" ${state.sort==='name'?'selected':''}>Team name</option><option value="rank" ${state.sort==='rank'?'selected':''}>Standing, first to last</option><option value="points" ${state.sort==='points'?'selected':''}>Points for, high first</option></select></label><button type="button" id="clear-search">Clear search</button></div><div id="directory-results">${directoryList()}</div><div class="reading-section" style="margin-top:2rem">${standings()}<p class="note">PF = fantasy points for, converted from fixture hundredths. ${esc(inventory.missing.power)}</p></div>`;
}
function spotlight(s){
 return `<article class="editorial"><img src="${esc(inventory.portraits[s.playerId])}" alt="" width="100" height="140" loading="lazy"><div><p class="kicker">${esc(s.periodLabel)}</p><h3>${esc(s.headline)}</h3><p><a href="/player/${esc(s.playerId)}">${esc(s.name)}</a> · ${esc(s.position)} · <a href="/teams/${esc(s.teamId)}">${esc(teamName(s.teamId))}</a></p><p>${esc(s.opinion)}</p><div class="stats">${s.stats.map(s=>`<span>${esc(s.value)}<small>${esc(s.label)}</small></span>`).join('')}</div><p class="note">${esc(s.statPeriod)}</p><details><summary>Why this selection & source</summary><p>${esc(s.selectionReason)}</p><p class="note">${source(s.source)}</p></details></div></article>`;
}
function dispatchContent(){
 const e=data.archive[0], old=data.archive[1];
 return `<p class="kicker">Dated editorial · ${esc(e.dateLabel)} · ${esc(e.status)}, unpublished</p><h2>${esc(e.title)}</h2><p class="note">An October sample edition, separate from the synthetic November Week 3 slate. Its period ended ${esc(e.endsAt.slice(0,10))}; this is not current weekly coverage.</p><h3>${esc(e.game.title)}</h3><p class="dispatch-intro">${esc(e.game.context)}</p><p class="note">${esc(e.game.note)} · Week ${e.game.leagueWeek} · ${e.game.teamIds.map(teamName).map(esc).join(' vs ')} · ${esc(e.game.state)}. ${esc(e.game.selectionReason)}</p>${e.playerSpotlights.map(spotlight).join('')}<section class="reading-section"><h3>Around the league · dated October reports</h3>${e.happenings.map(h=>`<article class="happening"><p><a href="${esc(h.href)}">${esc(h.title)}</a> · ${esc(h.dateLabel)}</p><p>${esc(h.text)}</p></article>`).join('')}<details><summary>Edition sources · checked Oct 8, 2026</summary><ul class="source-list">${e.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul></details></section><section class="reading-section"><h3>Browse the dated archive</h3><p><a href="/weekly/${esc(e.id)}">${esc(e.dateLabel)} · ${esc(e.title)}</a><br><span class="note">${esc(e.status)} · ${esc(e.id)} · not published</span></p><p><a href="/weekly/${esc(old.id)}">${esc(old.dateLabel)} · ${esc(old.title)}</a><br><span class="note">${esc(old.status)} · ${esc(old.id)} · not published</span></p><details><summary>Read the historical final</summary><h3>${esc(old.game.title)}</h3><p>${esc(old.game.context)}</p><p>${old.game.teamIds.map((id,i)=>`${esc(teamName(id))} ${Number(old.game.scores[i]).toFixed(1)}`).join(' · ')} · ${esc(old.game.state)}</p><p class="note">${esc(old.game.note)}. ${esc(old.game.selectionReason)}</p><ul class="source-list">${old.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul></details><a href="/weekly">Full weekly archive</a></section>`;
}
function toolsContent(){
 return `<h2>Past the bench.</h2><p>Keep reading, test a trade, or take a shot.</p><a class="arcade-link" href="/arcade/free-throw"><img src="${esc(inventory.assets.game)}" alt="Free-throw practice court preview" width="480" height="270"><span><strong>Play free-throw practice</strong><br>Open the existing game</span></a><ul class="tool-index"><li><a href="/stocks#player-board">Stocks · player board</a><p>Inspect modeled player values. A quote is not a completed trade.</p></li><li><a href="/trade-analyzer">Trade analyzer</a><p>Compare both sides of a deal.</p></li><li><a href="/intel">News & league intel</a><p>Follow league and player reports.</p></li><li><a href="/ai-decides">AI Decides</a><p>Read the saved slate and its evidence.</p></li><li><a href="/transactions">Transactions</a>${data.home.hub.transactions.map(m=>`<p>${esc(m.summary)} · Week ${m.week} · ${date(m.createdAt)}</p>`).join('')}</li><li><a href="/history">History</a><p>${esc(inventory.missing.history)}</p></li><li><a href="/arcade">Arcade</a><p>Discover the existing games.</p></li><li><a href="/teams">Teams</a><p>Full franchise profiles and rosters.</p></li></ul><p class="note">${esc(inventory.warning)} ${esc(inventory.missing.power)}</p>`;
}
function renderReader(){
 $('#reader-context').textContent=`Bench place saved: ${teamName(state.team)}`;
 document.querySelectorAll('[data-chapter]').forEach(b=>{if(b.dataset.chapter===state.chapter)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 $('#reader-content').innerHTML=state.chapter==='slate'?slateContent():state.chapter==='directory'?directoryContent():state.chapter==='dispatch'?dispatchContent():toolsContent();
}
function render(){
 $('#bench').hidden=state.view!=='bench';$('#reader').hidden=state.view!=='reader';
 if(state.view==='bench'){updateFilmstrip();renderDossier();}else renderReader();
 document.title=`${state.view==='bench'?teamName(state.team):'League reader'} · GOAT Hoopers · Structure 16`;
}
function navigate(changes,{focus=false,replace=false}={}){
 Object.assign(state,changes);const hash=state.view==='reader'?`#reader/${state.chapter}`:`#bench/${state.team}/${state.tab}`;
 history[replace?'replaceState':'pushState'](null,'',hash);render();
 if(focus){const target=state.view==='reader'?$('#reader-content h2'):$('#team-title');target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
}
function parseHash(){
 const p=location.hash.slice(1).split('/');
 if(p[0]==='reader'&&['slate','directory','dispatch','tools'].includes(p[1]))Object.assign(state,{view:'reader',chapter:p[1]});
 else if(p[0]==='bench'&&byId(p[1]))Object.assign(state,{view:'bench',team:p[1],tab:['week','roster','scouting'].includes(p[2])?p[2]:'week'});
 render();
}
renderFilmstrip();
$('#mode-links').innerHTML=`<a href="?view=${mode==='member'?'public':'member'}">Compare ${mode==='member'?'public':'member'} view</a><a href="?view=${mode}&ai=stale">Inspect stale AI</a><a href="?view=${mode}&ai=missing">Inspect missing AI</a>`;
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.team)navigate({team:b.dataset.team,tab:'week',rosterQuery:''});
 if(b.dataset.openTeam)navigate({view:'bench',team:b.dataset.openTeam,tab:'week',rosterQuery:''},{focus:true});
 if(b.dataset.reader)navigate({view:'reader',chapter:b.dataset.reader},{focus:true});
 if(b.dataset.chapter)navigate({view:'reader',chapter:b.dataset.chapter},{focus:true});
 if(b.dataset.tab){navigate({tab:b.dataset.tab});document.querySelector(`.dossier-tabs [data-tab="${state.tab}"]`)?.focus({preventScroll:true});}
 if(b.id==='return-bench')navigate({view:'bench'},{focus:true});
 if(b.id==='previous'||b.id==='next'){const i=teams.findIndex(t=>t.identity.id===state.team);navigate({team:teams[(i+(b.id==='next'?1:9))%10].identity.id,tab:'week',rosterQuery:''});}
 if(b.id==='clear-search'){state.query='';$('#league-search').value='';$('#directory-results').innerHTML=directoryList();$('#league-search').focus();}
});
document.addEventListener('change',e=>{
 if(e.target.id==='team-index')navigate({team:e.target.value,tab:'week',rosterQuery:''});
 if(e.target.id==='league-sort'){state.sort=e.target.value;$('#directory-results').innerHTML=directoryList();}
 if(e.target.id==='roster-sort'){state.rosterSort=e.target.value;renderDossier();$('#roster-sort').focus({preventScroll:true});}
});
document.addEventListener('input',e=>{
 if(e.target.id==='league-search'){state.query=e.target.value;$('#directory-results').innerHTML=directoryList();}
 if(e.target.id==='roster-search'){const position=e.target.selectionStart;state.rosterQuery=e.target.value;renderDossier();$('#roster-search').focus({preventScroll:true});$('#roster-search').setSelectionRange(position,position);}
});
$('#filmstrip').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const i=teams.findIndex(t=>t.identity.id===state.team);navigate({team:teams[(i+(e.key==='ArrowRight'?1:9))%10].identity.id,tab:'week'});$('.face.selected').focus({preventScroll:true});}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.more').open){$('.more').open=false;$('.more summary').focus();}});
window.addEventListener('hashchange',parseHash);
window.addEventListener('resize',()=>{if(state.view==='bench')updateFilmstrip();});
window.goatStudy={states:[{id:'bench',label:'Selected franchise and attached week dossier'},{id:'neighbor',label:'Defending champion on the bench'},{id:'roster',label:'Full roster and member modeled values'},...(personal?[{id:'scouting',label:'Member scouting, recap and team wire'}]:[]),{id:'slate',label:'League reader: five current matchups and saved AI'},{id:'directory',label:'League reader: searchable full directory and standings'},{id:'dispatch',label:'League reader: dated editorial and archive'},{id:'tools',label:'League reader: play and explore'}],activate(id){const mapping={bench:{view:'bench',team:'1',tab:'week'},neighbor:{view:'bench',team:'5',tab:'week'},roster:{view:'bench',team:'1',tab:'roster'},scouting:{view:'bench',team:'1',tab:'scouting'},slate:{view:'reader',chapter:'slate'},directory:{view:'reader',chapter:'directory'},dispatch:{view:'reader',chapter:'dispatch'},tools:{view:'reader',chapter:'tools'}};if(!mapping[id])throw Error(`Unknown study state ${id}`);navigate({...mapping[id],query:'',rosterQuery:''},{replace:true});return true;}};
parseHash();document.body.dataset.studyReady='16';
