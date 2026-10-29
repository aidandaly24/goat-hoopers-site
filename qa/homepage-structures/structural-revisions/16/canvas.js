import {inventory,data,mode,aiState,esc,money} from '../../data.js';

const $ = s => document.querySelector(s);
const directory = data.home.directory;
const personal = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
const team = id => directory.find(t => t.identity.id === String(id));
const face = id => data.faces.find(f => f.team.id === String(id));
const name = id => team(id)?.identity.name ?? String(id);
const allPlayers = new Map(directory.flatMap(t => t.players.map(p => [p.id,p])));
const currentGames = directory.map(t=>t.currentMatchup).filter((m,i,a)=>m&&a.findIndex(x=>x?.home.id===m.home.id&&x?.away.id===m.away.id)===i);
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const score = v => v == null ? 'Pending' : Number(v).toFixed(1);
const pct = v => `${Math.round(v*100)}%`;
const when = v => new Date(v).toLocaleString('en-US',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' UTC';
const linkTeam = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const sourceLink = s => `<a href="${esc(s.url)}">${esc(s.label)}</a> · checked ${esc(s.checkedAt)}`;
const storageKey = `goat16-composition-v1-${mode}`;
const state = {layout:[],arranging:false,sourceOpen:false,open:new Set(),query:'',sort:'name',valueQuery:'',valueSort:'value',saved:false};

const keep = (id,label) => `<button type="button" data-add="${esc(id)}">${state.layout.some(x=>x.id===id)?'Locate':'Keep'} ${esc(label)}</button>`;

const disclosure = (id,label,content,extra='') => `<details data-detail="${esc(id)}" ${state.open.has(id)?'open':''} ${extra}><summary>${label}</summary>${content}</details>`;
function playerList(players,values){
 return `<ul class="roster">${players.map(p=>{const ref=allPlayers.get(p.id);return `<li class="player" data-player-id="${esc(p.id)}"><div><a href="/player/${esc(p.id)}">${esc(p.fullName??p.name)}</a><span class="bio">${esc(p.position??ref?.position)} · ${esc(p.nbaTeam??ref?.nbaTeam)}</span></div>${values?`<span class="price">${money(values.get(p.id))}</span>`:''}</li>`;}).join('')}</ul>`;
}
function clubContent(id){
 const t=team(id), f=face(id), rank=data.home.hub.standings.find(s=>s.team.id===id), m=t.currentMatchup;
 const opponent=m.home.id===id?m.away:m.home;
 const own=personal?.team.id===id;
 const ownScore=m.home.id===id?m.homePoints:m.awayPoints;
 const opponentScore=m.home.id===id?m.awayPoints:m.homePoints;
 return `<div class="club-body"><div class="club-intro"><img class="portrait" src="${esc(inventory.portraits[f.player.id])}" width="240" height="240" alt="${esc(f.player.name)}"><h2 id="title-club-${id}">${linkTeam(t.identity)}</h2><p>${esc(t.identity.managerName)}</p><p>${record(t.currentRecord)} current · standing #${rank.rank}<br>${t.players.length} roster players${own?' · your franchise':''}</p><p class="featured"><a href="/player/${esc(f.player.id)}">${esc(f.player.name)}</a><br>${money(f.player.value)} modeled FAAB · ${esc(f.player.position)}</p></div><div><p>Week ${m.week}: ${score(ownScore)} vs ${esc(opponent.name)} ${score(opponentScore)}.</p><p class="note">Current pairing is incomplete. Known zero is distinct from Pending.</p><p class="note">${esc(t.previousSeason.season)}: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}. ${esc(t.previousSeason.ownerNote??'')}</p><div class="club-links"><a href="/teams/${id}#team-roster">Team roster</a>${own?'<a href="/team">My team</a>':''}${keep('game-'+currentGames.findIndex(g=>g.home.id===m.home.id),'this matchup')}</div>${disclosure(`roster-${id}`,`Open all ${t.players.length} roster references`,playerList(t.players), 'class="club-roster"')}</div></div>`;
}
function aiContent(m,index){
 const saved=data.weekly?.matchups.find(p=>p.teamIds.includes(m.home.id)&&p.teamIds.includes(m.away.id));
 if(!saved?.result)return `<div class="model"><p class="choice">Saved AI unavailable</p><p class="note">No saved result is connected for this pairing. No probability or choice is inferred.</p><a href="/ai-decides">Open AI Decides</a></div>`;
 const r=saved.result, stale=aiState==='stale'||data.weekly.status==='stale';
 return `<div class="model"><p class="eyebrow">${stale?'Stale saved AI · not a current prediction':'Saved AI · synthetic'}</p><p class="choice">Returned choice: ${esc(name(r.choice))}</p><div class="probability-lines">${r.probabilities.map(p=>`<p><span>${esc(name(p.choice))}</span><strong>${pct(p.probability)}</strong></p>`).join('')}</div><p class="note">Confidence ${pct(r.confidence)}, separate from the probabilities.</p>${disclosure(`model-${index}`,'Time, model & evidence',`<p>${esc(r.probabilityLabel)}. Returned choice is retained even if its probability is lower.</p><p>Saved ${when(data.weekly.generatedAt)} · season ${esc(data.weekly.season)} · Week ${data.weekly.week}.</p><p>Model: ${esc(r.model)}<br>Prompt: ${esc(r.promptVersion)}<br>Input snapshot: ${r.snapshot?esc(JSON.stringify(r.snapshot)):'unavailable (null)'}<br>Slate snapshot: ${data.weekly.snapshot?esc(JSON.stringify(data.weekly.snapshot)):'unavailable (null)'}<br>Baseline: ${saved.baseline?esc(JSON.stringify(saved.baseline)):'unavailable (null)'}</p><p>Input evidence: ${esc(saved.evidence.join(' '))}<br>Returned evidence: ${r.evidence.length?esc(r.evidence.join(' ')):'none supplied'}</p><a href="/ai-decides">AI Decides</a>`)}</div>`;
}
function gameContent(index){
 const m=currentGames[index];
 return `<h2 id="title-game-${index}" class="pair-title">Week ${m.week} matchup</h2><p class="note">Synthetic current scores and saved model result</p><div class="score-line">${[[m.home,m.homePoints],[m.away,m.awayPoints]].map(([t,v])=>`<div class="score-side"><h3>${linkTeam(t)}</h3><p class="note">${esc(t.managerName)} · ${record(t)}</p><p class="score">${score(v)}</p>${keep('club-'+t.id,'franchise context')}</div>`).join('')}</div><p class="pair-note">Incomplete · 0.0 is a known score; Pending is unknown. Fixture checked ${when(data.home.checkedAt)}.</p>${aiContent(m,index)}`;
}
function valueContent(){
 const v=personal.valuation, map=new Map(personal.rosterValues.map(p=>[p.id,p.value]));
 const q=state.valueQuery.toLowerCase();let rows=personal.rosterValues.filter(p=>`${p.name} ${p.position} ${allPlayers.get(p.id)?.nbaTeam}`.toLowerCase().includes(q));
 rows.sort((a,b)=>state.valueSort==='name'?a.name.localeCompare(b.name):(b.value??-Infinity)-(a.value??-Infinity)||a.name.localeCompare(b.name));
 return `<p class="eyebrow">${esc(personal.team.name)} · current modeled quote</p><h2 id="title-value">${v.complete?'Roster value':'Priced roster subtotal'}</h2><p class="value">${money(v.total)}</p><p>Modeled value rank <strong>${v.rank.rank} of ${v.rank.teams}</strong>${v.rank.tied?' · tied':''}.</p><p class="note">${v.priced}/${personal.coverage.roster} priced · ${v.unpriced} unpriced · ${esc(personal.market.pricingBasis)} basis · ${when(personal.market.updatedAt)}. FAAB model dollars, not a trade or cash balance.</p><div class="value-top">${personal.players.map(p=>`<div><a href="/player/${p.id}">${esc(p.name)}</a><p><strong>${money(p.value)}</strong> · ${p.changePct==null?'change unavailable':`${p.changePct>0?'+':''}${p.changePct}%`}</p></div>`).join('')}</div>${disclosure('all-values',`Inspect all ${personal.rosterValues.length} roster values`,`<div class="search-controls"><label>Find a roster value<input type="search" id="value-filter" value="${esc(state.valueQuery)}" placeholder="Player, position or NBA team"></label><label>Sort values<select id="value-sort"><option value="value" ${state.valueSort==='value'?'selected':''}>Modeled value, high first</option><option value="name" ${state.valueSort==='name'?'selected':''}>Player name</option></select></label></div><p class="note" aria-live="polite">${rows.length} of ${personal.rosterValues.length} players · modeled FAAB dollars</p>${playerList(rows,map)}`)}<p class="history-gap">${esc(inventory.missing.history)}</p><div class="club-links"><a href="/stocks#player-board">Stocks player board</a><a href="/trade-analyzer">Trade analyzer</a></div>`;
}
function guideList(rows,unit){
 return `<ul class="guide">${rows.map(p=>`<li><a href="/player/${p.id}">${esc(p.name)}</a><span>${p.value} ${unit} · ${p.games} GP</span></li>`).join('')}</ul>`;
}
function formContent(){
 const g=personal.playerGuide;
 return `<p class="eyebrow">${esc(personal.team.name)} · synthetic scouting</p><h2 id="title-form">Scouting form.</h2><h3>${esc(g.watch.label)}</h3>${guideList(g.watch.rows,'FP/G')}<p class="note">${esc(g.watch.message)}</p>${disclosure('completed-recap',`Completed Week ${g.previousWeek} · best & rough`,`<p class="note">${esc(g.period)}</p><p>${esc(inventory.missing.recap)}</p><h3>Best recorded points</h3>${guideList(g.best,'FP')}<h3>Rough recorded points</h3>${guideList(g.rough,'FP')}<p class="note">${esc(g.coverage)} Eligible played: ${g.eligiblePlayed}.</p>`)}${keep('wire','the team wire')}`;
}
function wireContent(){
 return `<p class="eyebrow">${esc(personal.team.name)} · synthetic wire</p><h2 id="title-wire">Team news & moves.</h2>${personal.news.map(n=>`<article class="wire-item"><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="note">${esc(n.outlet.name)} · ${when(n.publishedAt)}</p></article>`).join('')}<h3>Recent team moves</h3>${personal.moves.map(m=>`<p>${esc(m.summary)}<br><span class="note">Week ${m.week} · ${esc(m.type)} · ${when(m.createdAt)}. No individual add/drop names supplied.</span></p>`).join('')}<a href="/transactions">All transactions</a>`;
}
function leagueRows(){
 const q=state.query.trim().toLowerCase();const rows=directory.filter(t=>`${t.identity.name} ${t.identity.managerName} ${t.players.map(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`).join(' ')}`.toLowerCase().includes(q));
 rows.sort((a,b)=>state.sort==='points'?b.currentRecord.pointsFor-a.currentRecord.pointsFor||a.identity.name.localeCompare(b.identity.name):state.sort==='rank'?data.home.hub.standings.find(s=>s.team.id===a.identity.id).rank-data.home.hub.standings.find(s=>s.team.id===b.identity.id).rank:a.identity.name.localeCompare(b.identity.name));
 return `<p class="note" aria-live="polite">${rows.length} of 10 franchises · ${allPlayers.size} unique player references.</p><div class="league-results">${rows.length?rows.map(t=>{const m=t.currentMatchup,op=m.home.id===t.identity.id?m.away:m.home;return `<article class="directory-team"><h3>${linkTeam(t.identity)}</h3><p class="record-line">${esc(t.identity.managerName)} · ${record(t.currentRecord)} current<br>Week ${m.week}: ${esc(op.name)} · incomplete · home ${score(m.homePoints)} / away ${score(m.awayPoints)}</p><p class="note">${t.previousSeason.season}: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}. ${esc(t.previousSeason.ownerNote??'')}</p><button type="button" class="add-context" data-add="club-${t.identity.id}">Keep this franchise independently</button>${disclosure(`league-roster-${t.identity.id}`,`${t.players.length} roster references`,playerList(t.players),q?'open':'')}</article>`;}).join(''):'<p>No matching team or player. Clear the search to restore all ten franchises.</p>'}</div>`;
}
function leagueContent(){
 return `<p class="eyebrow">Whole-league reference · synthetic current metrics</p><h2 id="title-league">League references.</h2><p>Keep this reference while adding any franchise independently. Searching this field does not replace other canvas items.</p><div class="search-controls"><label>Find teams, managers & players<input type="search" id="team-filter" value="${esc(state.query)}" placeholder="Try Curry or NeuralNets"></label><label>Sort franchises<select id="team-sort"><option value="name" ${state.sort==='name'?'selected':''}>Team name</option><option value="rank" ${state.sort==='rank'?'selected':''}>Standing, first to last</option><option value="points" ${state.sort==='points'?'selected':''}>Points for, high first</option></select></label><button type="button" id="clear-team-filter">Clear search</button></div><div id="league-results">${leagueRows()}</div>${disclosure('standings','All ten current standings',`<table class="standings"><thead><tr><th scope="col">#</th><th scope="col">Franchise</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s=>`<tr><td>${s.rank}</td><td>${linkTeam(s.team)}</td><td>${s.wins}–${s.losses}</td><td>${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table><p class="note">PF = fantasy points for, converted from fixture hundredths.</p>`)}<p class="history-gap">${esc(inventory.missing.power)}</p>`;
}
function spotlight(s,index,editionId){
 return `<article class="spotlight"><img src="${esc(inventory.portraits[s.playerId])}" width="100" height="140" alt="" loading="lazy"><p class="eyebrow">${esc(s.periodLabel)}</p><h3>${esc(s.headline)}</h3><p><a href="/player/${esc(s.playerId)}">${esc(s.name)}</a> · ${esc(s.position)} · <a href="/teams/${esc(s.teamId)}">${esc(name(s.teamId))}</a></p><p>${esc(s.opinion)}</p><div class="stats">${s.stats.map(s=>`<strong>${esc(s.value)}<small>${esc(s.label)}</small></strong>`).join('')}</div><p class="note">${esc(s.statPeriod)}</p>${disclosure(`selection-${editionId}-${index}`,'Selection & source',`<p>${esc(s.selectionReason)}</p><p class="note">${sourceLink(s.source)}</p>`)}</article>`;
}
function editionContent(index){
 const e=data.archive[index],g=e.game;
 return `<p class="eyebrow">Dated editorial · ${esc(e.status)}, unpublished</p><h2 id="title-edition-${index}">${esc(e.title)}</h2><p class="edition-dates">${esc(e.dateLabel)} · ${esc(e.id)} · period ${esc(e.startsAt.slice(0,10))} to ${esc(e.endsAt.slice(0,10))}, end exclusive. This dated sample is separate from current synthetic Week 3.</p><div class="editorial-game"><h3>${esc(g.title)}</h3><p>${esc(g.context)}</p><p>${g.teamIds.map((id,i)=>`${esc(name(id))}${g.scores?` ${Number(g.scores[i]).toFixed(1)}`:''}`).join(' · ')} · ${esc(g.state)}</p><p class="note">${esc(g.note)}${g.leagueWeek?` · Week ${g.leagueWeek}`:''}. ${esc(g.selectionReason)}</p></div>${e.playerSpotlights.length?disclosure(`spotlights-${index}`,`${e.playerSpotlights.length} dated player spotlights`,e.playerSpotlights.map((s,i)=>spotlight(s,i,e.id)).join('')):'<p class="note">This dated archive entry includes no player spotlights.</p>'}${disclosure(`happenings-${index}`,e.happenings.length?'Dated happenings & all edition sources':'Edition sources',`${e.happenings.map(h=>`<article class="wire-item"><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p><p class="note">${esc(h.dateLabel)}</p></article>`).join('')}<ul class="source-list">${e.sources.map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul>`)}<div class="club-links"><a href="/weekly/${esc(e.id)}">Open ${esc(e.dateLabel)} archive route</a><button type="button" data-add="edition-${index===0?1:0}">Keep ${esc(data.archive[index===0?1:0].dateLabel)} alongside</button></div>`;
}
function toolsContent(){
 return `<p class="eyebrow">Useful destinations</p><h2 id="title-tools">League tools & play.</h2><a href="/arcade/free-throw" class="play-preview"><img src="${esc(inventory.assets.game)}" width="480" height="270" alt="Free-throw practice court preview" loading="lazy"><span>Play existing free-throw practice</span></a><ul class="tools-list"><li><a href="/stocks#player-board">Stocks player board</a><p>Inspect modeled FAAB values.</p></li><li><a href="/trade-analyzer">Trade analyzer</a><p>Compare both sides of a proposed deal.</p></li><li><a href="/intel">News & intel</a></li><li><a href="/ai-decides">AI Decides</a></li><li><a href="/teams">Team profiles</a></li><li><a href="/transactions">Transactions</a>${data.home.hub.transactions.map(m=>`<p>${esc(m.summary)} · Week ${m.week} · ${when(m.createdAt)}</p>`).join('')}</li><li><a href="/history">History</a><p>${esc(inventory.missing.history)}</p></li><li><a href="/arcade">Arcade</a></li><li><a href="/weekly">Weekly archive</a>${data.archive.map(e=>`<a href="/weekly/${esc(e.id)}">${esc(e.dateLabel)} · ${esc(e.title)}</a><p>${esc(e.status)} · unpublished</p>`).join('')}</li></ul><p class="note">${esc(inventory.missing.power)}</p>`;
}

const materials = new Map();
function register(id,kind,label,context,render,group){materials.set(id,{id,kind,label,context,render,group});}
directory.forEach(t=>register(`club-${t.identity.id}`,'club',t.identity.name,`${face(t.identity.id).player.name} · roster + identity`,()=>clubContent(t.identity.id),'Franchises'));
currentGames.forEach((g,i)=>register(`game-${i}`,'game',`${g.home.name} / ${g.away.name}`,`Current Week ${g.week} score + saved AI`,()=>gameContent(i),'Current pairings'));
if(personal){register('value','value','Your modeled roster value','All 24 values, coverage and supplied rank',valueContent,'Evidence & dated reading');register('form','form','Your form and completed-week recap','EMA watch + best/rough points',formContent,'Evidence & dated reading');register('wire','wire','Your team wire','News and recent moves',wireContent,'Evidence & dated reading');}
register('league','league','League reference field','10 teams, 228 player references, standings',leagueContent,'Evidence & dated reading');
data.archive.forEach((e,i)=>register(`edition-${i}`,'edition',`${e.dateLabel} · ${e.title}`,`${e.status}, unpublished · dated editorial`,()=>editionContent(i),'Evidence & dated reading'));
register('tools','tools','Play and useful destinations','Stocks, trade, routes and missing producers',toolsContent,'Evidence & dated reading');
const defaults = personal?['game-0','club-1','club-2','value','form','wire']:['game-0','club-1','club-2'];
const entries = ids => ids.map(id=>({id,pinned:false}));
function restoreSaved(){
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved?.schema===1&&Array.isArray(saved.layout)){const seen=new Set();state.layout=saved.layout.filter(x=>x&&typeof x.id==='string'&&typeof x.pinned==='boolean'&&materials.has(x.id)&&!seen.has(x.id)&&seen.add(x.id)).map(x=>({id:x.id,pinned:x.pinned}));if(saved.layout.length&&state.layout.length===0)throw Error('No valid saved items');state.layout.sort((a,b)=>Number(b.pinned)-Number(a.pinned));state.saved=true;return;}}catch{}
 state.layout=entries(defaults);
}
function persist(){
 try{localStorage.setItem(storageKey,JSON.stringify({schema:1,layout:state.layout}));state.saved=true;}catch{state.saved=false;}
}
function renderSource(){
 const groups=['Franchises','Current pairings','Evidence & dated reading'];
 $('#material-options').innerHTML=`<div class="source-groups">${groups.map(group=>`<section><h3>${group}</h3><ul>${[...materials.values()].filter(m=>m.group===group).map(m=>`<li><button type="button" data-add="${m.id}" ${state.layout.some(x=>x.id===m.id)?'disabled':''}>${state.layout.some(x=>x.id===m.id)?'Kept: ':'Add: '}${esc(m.label)}<span>${esc(m.context)}</span></button></li>`).join('')}</ul></section>`).join('')}</div>`;
 $('#material-source').hidden=!state.sourceOpen;$('#add-material').setAttribute('aria-expanded',String(state.sourceOpen));
}
function renderPiece(entry,index){
 const m=materials.get(entry.id), prev=state.layout[index-1], next=state.layout[index+1];
 return `<section class="piece" data-piece="${m.id}" data-kind="${m.kind}" data-pinned="${entry.pinned}" aria-label="${esc(m.label)}">${entry.pinned?'<p class="pin-label">Pinned to the beginning</p>':''}<div class="piece-actions" role="group" aria-label="Arrange ${esc(m.label)}"><button type="button" data-action="earlier" data-id="${m.id}" ${!prev||prev.pinned!==entry.pinned?'disabled':''}>Move earlier</button><button type="button" data-action="later" data-id="${m.id}" ${!next||next.pinned!==entry.pinned?'disabled':''}>Move later</button><button type="button" data-action="pin" data-id="${m.id}" aria-pressed="${entry.pinned}">${entry.pinned?'Unpin':'Pin first'}</button><button type="button" data-action="remove" data-id="${m.id}">Remove item</button></div>${m.render()}</section>`;
}
function renderCanvas(){
 $('#canvas').dataset.arranging=String(state.arranging);
 $('#canvas').innerHTML=state.layout.length?state.layout.map(renderPiece).join(''):'<div class="empty-canvas"><h2>Your canvas is clear.</h2><p>Add the league material you want to keep, or restore the coherent starting composition.</p><button type="button" id="empty-add">Add league material</button><button type="button" id="empty-restore">Restore default</button></div>';
 $('#arrange').setAttribute('aria-pressed',String(state.arranging));$('#arrange').textContent=state.arranging?'Finish arranging':'Arrange';$('#arrange').setAttribute('aria-label',state.arranging?'Finish arranging composition':'Arrange composition');$('#restore').hidden=!state.arranging;$('#arrange-help').hidden=!state.arranging;
 $('#layout-status').textContent=`${state.layout.length} kept items · ${state.saved?'order saved in this browser only':'local QA order; no account writes'}`;
}
function render(){renderCanvas();renderSource();}
function focusPiece(id,action){
 const piece=document.querySelector(`[data-piece="${id}"]`);if(!piece)return;
 const target=action?piece.querySelector(`[data-action="${action}"]:not([disabled])`):piece.querySelector('h2');
 const focus=target??piece;focus.tabIndex=focus.tabIndex<0?-1:focus.tabIndex;focus.focus({preventScroll:true});piece.scrollIntoView({block:'nearest',behavior:'instant'});
}
function add(id,{focus=true}={}){
 if(!materials.has(id))return;
 if(!state.layout.some(x=>x.id===id))state.layout.push({id,pinned:false});
 state.sourceOpen=false;persist();render();if(focus)focusPiece(id);
}
function pin(id){
 const i=state.layout.findIndex(x=>x.id===id);if(i<0)return;
 const [entry]=state.layout.splice(i,1);entry.pinned=!entry.pinned;
 const firstUnpinned=state.layout.findIndex(x=>!x.pinned);
 if(entry.pinned)state.layout.unshift(entry);else state.layout.splice(firstUnpinned<0?state.layout.length:firstUnpinned,0,entry);
}
function layoutAction(action,id){
 const i=state.layout.findIndex(x=>x.id===id);if(i<0)return;
 if(action==='pin')pin(id);
 if(action==='earlier'||action==='later'){const j=i+(action==='earlier'?-1:1);if(state.layout[j]&&state.layout[j].pinned===state.layout[i].pinned)[state.layout[i],state.layout[j]]=[state.layout[j],state.layout[i]];}
 if(action==='remove')state.layout.splice(i,1);
 persist();render();if(action==='remove'){const remaining=state.layout[Math.min(i,state.layout.length-1)];if(remaining)focusPiece(remaining.id,'remove');else $('#empty-add').focus();}else focusPiece(id,action);
}
function defaultLayout(){state.layout=entries(defaults);state.open=new Set();state.query='';state.sort='name';state.valueQuery='';state.valueSort='value';state.arranging=false;state.sourceOpen=false;persist();render();}
function updateLeagueResults(){const target=$('#league-results');if(target)target.innerHTML=leagueRows();}
function rerenderValue(){const piece=document.querySelector('[data-piece="value"]');if(!piece)return;const active=document.activeElement, id=active?.id, cursor=active?.selectionStart;const index=state.layout.findIndex(x=>x.id==='value');piece.outerHTML=renderPiece(state.layout[index],index);if(id&&document.getElementById(id)){document.getElementById(id).focus({preventScroll:true});if(cursor!=null)document.getElementById(id).setSelectionRange(cursor,cursor);}}

document.addEventListener('toggle',e=>{const d=e.target;if(d.matches?.('details[data-detail]')){if(d.open)state.open.add(d.dataset.detail);else state.open.delete(d.dataset.detail);}},true);
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.add){add(b.dataset.add);return;}
 if(b.dataset.action){layoutAction(b.dataset.action,b.dataset.id);return;}
 if(b.id==='arrange'){state.arranging=!state.arranging;renderCanvas();}
 if(b.id==='add-material'||b.id==='empty-add'){state.sourceOpen=!state.sourceOpen;renderSource();if(state.sourceOpen){$('#material-title').tabIndex=-1;$('#material-title').focus({preventScroll:true});$('#material-source').scrollIntoView({block:'start',behavior:'instant'});}}
 if(b.id==='close-source'){state.sourceOpen=false;renderSource();$('#add-material').focus({preventScroll:true});}
 if(b.id==='restore'||b.id==='empty-restore'){defaultLayout();$('#arrange').focus({preventScroll:true});}
 if(b.id==='clear-team-filter'){state.query='';$('#team-filter').value='';updateLeagueResults();$('#team-filter').focus();}
});
document.addEventListener('input',e=>{if(e.target.id==='team-filter'){state.query=e.target.value;updateLeagueResults();}if(e.target.id==='value-filter'){state.valueQuery=e.target.value;rerenderValue();}});
document.addEventListener('change',e=>{if(e.target.id==='team-sort'){state.sort=e.target.value;updateLeagueResults();}if(e.target.id==='value-sort'){state.valueSort=e.target.value;rerenderValue();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('.route-menu').open){$('.route-menu').open=false;$('.route-menu summary').focus();}else if(state.sourceOpen){state.sourceOpen=false;renderSource();$('#add-material').focus();}}});
$('#edition-label').textContent=personal?`${personal.team.name} · member composition`:'Public league composition';
$('#comparison-links').innerHTML=`<a href="?view=${mode==='member'?'public':'member'}">Compare ${mode==='member'?'public':'member'} view</a><a href="?view=${mode}&ai=stale">Stale AI fixture</a><a href="?view=${mode}&ai=missing">Missing AI fixture</a>`;
restoreSaved();render();
const presets={
 default(){state.layout=entries(defaults);},
 arrange(){state.layout=entries(defaults);state.arranging=true;state.open.add('roster-1');},
 pinned(){state.layout=entries(defaults);pin('club-2');state.arranging=true;state.open.add('roster-2');},
 'three-teams'(){state.layout=entries([...defaults,'club-5','game-2','club-8']);pin('club-5');},
 picks(){state.layout=entries([...defaults,...[1,2,3,4].map(i=>`game-${i}`)]);pin('game-1');},
 league(){state.layout=entries([...defaults,'league']);pin('league');state.open.add('standings');},
 editorial(){state.layout=entries([...defaults,'edition-0','edition-1']);pin('edition-0');state.open.add('spotlights-0');},
 tools(){state.layout=entries([...defaults,'tools']);pin('tools');}
};
window.goatStudy={states:[{id:'default',label:'Default retained scores, two franchises and member evidence'},{id:'arrange',label:'Accessible arrangement controls and independent roster'},{id:'pinned',label:'Second franchise promoted while prior material remains'},{id:'three-teams',label:'Added franchises and their current matchup retained concurrently'},{id:'picks',label:'All five current matchups with saved AI on the canvas'},{id:'league',label:'Pinned searchable league reference with original composition retained'},{id:'editorial',label:'Dated editorial and historical final alongside current context'},{id:'tools',label:'Playable game and real destinations kept on the canvas'}],activate(id){if(!presets[id])throw Error(`Unknown state ${id}`);state.open=new Set();state.arranging=false;state.sourceOpen=false;state.saved=false;state.query='';state.sort='name';state.valueQuery='';state.valueSort='value';presets[id]();state.layout=state.layout.filter((x,i,a)=>a.findIndex(v=>v.id===x.id)===i);render();return true;}};
document.body.dataset.studyReady='16';
