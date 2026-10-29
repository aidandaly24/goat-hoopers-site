import {inventory,data,mode,aiState,esc,money} from '../../data.js';

const $=s=>document.querySelector(s);
const teams=data.home.directory;
const member=mode==='member'&&data.personal.kind==='member';
const mine=member?data.personal.summary:null;
const current=mine?.matchup??teams[0].currentMatchup;
const byId=new Map(teams.map(t=>[t.identity.id,t]));
const players=[...new Map(teams.flatMap(t=>t.players.map(p=>[p.id,{...p,team:t.identity}]))).values()];
const playerById=new Map(players.map(p=>[p.id,p]));
const values=new Map([...(mine?.rosterValues??[]),...data.faces.map(f=>f.player).filter(Boolean)].map(p=>[p.id,p.value]));
const normalize=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const record=t=>`${t.wins}–${t.losses}${t.ties?'–'+t.ties:''}`;
const date=v=>v==null?'Not supplied':new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC';
const score=v=>v==null?'Pending':Number(v).toFixed(1);
const name=id=>byId.get(String(id))?.identity.name??String(id);
const teamLink=t=>`<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const playerLink=p=>`<a href="/player/${esc(p.id)}">${esc(p.fullName??p.name)}</a>`;
const links=items=>`<div class="linkrow">${items.map(([label,href])=>`<a href="${esc(href)}">${esc(label)}</a>`).join('')}</div>`;
const note=s=>`<p class="note">${esc(s)}</p>`;
const entry=(id,title,fact,keywords,render)=>({id,type:'task',title,fact,keywords,render});

function matchup(m){return `<p class="kicker">Week ${m.week}. Current score. Incomplete.</p><div class="versus">${[['home','homePoints'],['away','awayPoints']].map(([side,pts])=>`<div><h3>${teamLink(m[side])}</h3><p>${esc(m[side].managerName)}. ${record(m[side])} current record.</p><p class="score">${score(m[pts])}</p><p class="note">${m[pts]==null?'Score not reported':'Known score'}. ${side}.</p></div>`).join('')}</div>${note('A known 0.0 is a score; Pending is missing. This pairing is incomplete and no winner is asserted.')}`}

function rosterRows(ps,withValues=false){return `<ul class="roster-list">${ps.map(p=>`<li>${playerLink(p)}<span class="roster-meta">${esc(p.position??'Position unavailable')} for ${esc(p.nbaTeam??playerById.get(p.id)?.nbaTeam??'NBA team unavailable')}</span>${withValues?`<span class="roster-value numeric">${money(p.value)} FAAB</span>`:''}</li>`).join('')}</ul>`}

function teamAnswer(t){const m=t.currentMatchup;const previous=t.previousSeason;return `<p>Managed by ${esc(t.identity.managerName)}. ${record(t.currentRecord)} current record. ${t.players.length} roster players.</p>${m?`<p>Week ${m.week}: ${teamLink(m.home)} ${score(m.homePoints)} / ${teamLink(m.away)} ${score(m.awayPoints)}. Incomplete.</p>`:note('Current opponent unavailable.')}${links([['Team profile',`/teams/${t.identity.id}`],['Roster on profile',`/teams/${t.identity.id}#team-roster`]])}${previous?`<p>${esc(previous.season)}: ${previous.wins}–${previous.losses}, finish ${previous.finish}${previous.finish===1?', champion':''}${previous.ownerNote?`. ${esc(previous.ownerNote)}`:''}</p>`:''}<details><summary>All ${t.players.length} roster players — position and NBA team</summary>${rosterRows(t.players)}</details>`}

function weekAnswer(){const pairs=teams.filter((t,i)=>t.currentMatchup&&teams.findIndex(x=>x.currentMatchup&&x.currentMatchup.home.id===t.currentMatchup.home.id)===i);return `${matchup(current)}${links([['AI Decides','/ai-decides'],['Teams','/teams']])}<details><summary>All five current Week ${current.week} pairings</summary>${pairs.map(t=>`<p>${teamLink(t.currentMatchup.home)} ${score(t.currentMatchup.homePoints)} / ${teamLink(t.currentMatchup.away)} ${score(t.currentMatchup.awayPoints)}. Incomplete.</p>`).join('')}</details><p><button data-open="picks" type="button" class="answer-end">Read the five saved picks here</button></p>`}

function myAnswer(){if(!mine)return note('The personal team edition is available only in the member fixture.');return `<p class="kicker">${esc(mine.team.name)}, managed by ${esc(mine.team.managerName)}</p><p>${record(mine.team)} current record. Standing ${mine.standing.rank} of ${mine.season.totalTeams}. ${mine.coverage.roster} roster players.</p>${links([['My team','/team'],['Full roster','/teams/1#team-roster']])}<p class="big-number numeric">${money(mine.valuation.total)}</p><p>Current modeled FAAB ${mine.valuation.complete?'total':'subtotal'}. ${mine.valuation.priced} priced / ${mine.valuation.unpriced} unpriced.</p>${note(`Basis: ${mine.market.pricingBasis} modeled player prices, summed across the current roster. Computed ${date(mine.market.updatedAt)}. This is not a FAAB balance or a transaction price.`)}<ul class="top-values">${mine.players.map(p=>`<li>${playerLink(p)}<strong>${money(p.value)} FAAB</strong><span class="note">${esc(p.position)}. Modeled value change ${p.changePct>=0?'Up':'Down'} ${Math.abs(p.changePct)}%</span></li>`).join('')}</ul><details><summary>All ${mine.rosterValues.length} roster values</summary>${rosterRows(mine.rosterValues,true)}</details><p>${esc(inventory.missing.history)}</p>${links([['Open player market','/stocks#player-board']])}<button type="button" class="answer-end" data-open="form">Open your form and completed-week notebook</button>`}

function aiAnswer(){if(!data.weekly)return `<h3>Saved picks unavailable</h3>${note('No saved slate is supplied in this missing-AI state. No choice, probability or confidence is inferred.')} ${links([['AI Decides','/ai-decides']])}`;const w=data.weekly;return `<p class="kicker">Saved Week ${w.week}, ${w.season}. ${aiState==='stale'?'Stale — past saved slate':'Ready'}.</p>${aiState==='stale'?note('Stale saved results are retained for reading. They are not a fresh forecast.'):''}<p>These are actual returned choices from the fixture. A model’s choice and its highest probability can disagree; confidence is a separate field.</p>${w.matchups.map(p=>{const r=p.result;return `<article class="prediction"><h3>${esc(name(p.teamIds[0]))} / ${esc(name(p.teamIds[1]))}</h3><p class="choice">Returned choice: <strong>${esc(name(r.choice))}</strong></p><div class="prob-labels">${r.probabilities.map(x=>`<span>${esc(name(x.choice))}: <strong>${Math.round(x.probability*100)}%</strong></span>`).join('')}</div><div class="probability" aria-hidden="true"><span style="width:${r.probabilities[0].probability*100}%"></span></div><p>Independent confidence: <strong>${Math.round(r.confidence*100)}%</strong></p>${note(r.probabilityLabel)}<details><summary>Saved model, input and evidence</summary><p>Generated ${date(w.generatedAt)}</p><p>Model: ${esc(r.model)}. Prompt: ${esc(r.promptVersion)}.</p><p>Input snapshot: ${r.snapshot?'Supplied':'Not supplied'}. Slate snapshot: ${w.snapshot?'Supplied':'Not supplied'}.</p><p>League ${esc(w.leagueId)}. Season ${esc(w.season)}, Week ${w.week}. Roster IDs ${p.teamIds.map(esc).join(' / ')}</p><p>Slate state: ${esc(w.status)}. Pick state: ${esc(p.status)}. ${esc(p.message)}.</p><p>Input evidence: ${p.evidence.map(esc).join(' ')||'Not supplied'}</p><p>Returned evidence: ${r.evidence.map(esc).join(' ')||'No returned evidence supplied.'}</p></details></article>`}).join('')}${links([['Open AI Decides','/ai-decides']])}`}

function formAnswer(){if(!mine)return note('Personal scouting is not shown in the public edition.');const g=mine.playerGuide;const list=(rows,unit)=>`<ul class="guide-list">${rows.map(p=>`<li><div>${playerLink(p)}<p class="note">${esc(p.note)}</p></div><div class="metric numeric"><strong>${p.value} ${unit}</strong><span>${p.games} GP</span></div></li>`).join('')}</ul>`;return `<h3>Players to watch</h3><p>${esc(g.watch.label)}</p>${list(g.watch.rows,'EMA FP/G')}${note(g.watch.message)}<h3>Your best in completed Week ${g.previousWeek}</h3>${list(g.best,'fantasy points')}<h3>The rough week in completed Week ${g.previousWeek}</h3>${list(g.rough,'fantasy points')}<p>${esc(g.period)}</p>${note(g.coverage)}${note(g.recapMessage)}${note(inventory.missing.recap)}${links([['Player market','/stocks#player-board']])}`}

function directoryAnswer(){return `<div class="toolbar"><label for="directory-query">Filter teams or their players<input id="directory-query" type="search" value="${esc(directoryQuery)}" placeholder="Team, manager, player, position…" autocomplete="off"></label><label for="directory-sort">Sort teams<select id="directory-sort"><option value="standing" ${directorySort==='standing'?'selected':''}>Current standing</option><option value="name" ${directorySort==='name'?'selected':''}>Team A–Z</option><option value="players" ${directorySort==='players'?'selected':''}>Roster count</option></select></label></div><p id="directory-count" role="status" aria-live="polite">10 teams</p><div id="directory-entries">${directoryEntries(directoryQuery,directorySort)}</div>`}
function directoryEntries(q='',sort='standing'){const needle=normalize(q);let list=teams.filter(t=>normalize([t.identity.name,t.identity.managerName,...t.players.flatMap(p=>[p.fullName,p.position,p.nbaTeam])].join(' ')).includes(needle));list=[...list].sort((a,b)=>sort==='name'?a.identity.name.localeCompare(b.identity.name):sort==='players'?b.players.length-a.players.length||Number(a.identity.id)-Number(b.identity.id):data.home.hub.standings.find(x=>x.team.id===a.identity.id).rank-data.home.hub.standings.find(x=>x.team.id===b.identity.id).rank);return list.length?list.map(t=>`<article class="team-entry"><h3>${teamLink(t.identity)}</h3>${teamAnswer(t)}</article>`).join(''):`<p>No team or roster matches “${esc(q)}”. Clear the filter to restore all ten teams.</p>`}

function standingsAnswer(){return `<p class="kicker">Current standings</p><ol class="standing-list">${data.home.hub.standings.map(s=>`<li><span class="numeric">${s.rank}</span>${teamLink(s.team)}<span class="record"><span>W ${s.wins}</span> <span>L ${s.losses}</span> <span>PF ${(s.pointsFor/100).toFixed(2)}</span></span></li>`).join('')}</ol>${note('PF displays pointsFor / 100. These are current fixture standings, not previous-season records.')}<h3>Lineup Power</h3>${note(inventory.missing.power)}${links([['League teams','/teams'],['League intel','/intel']])}`}

function facesAnswer(){return `<p class="kicker">Each franchise’s highest current modeled player value</p><ul class="face-list">${data.faces.map(f=>`<li>${inventory.portraits[f.player.id]?`<img src="${esc(inventory.portraits[f.player.id])}" alt="" loading="lazy" width="64" height="72">`:`<span aria-hidden="true">${esc(f.player.name[0])}</span>`}<div>${playerLink(f.player)}<p>${teamLink(f.team)}${f.champion?', 2025 champion':''}</p></div><div class="face-value"><p class="value numeric">${money(f.player.value)}</p><p class="note">${esc(f.player.position)}, modeled FAAB</p></div></li>`).join('')}</ul>${links([['All teams','/teams'],['Player market','/stocks#player-board']])}`}

function spotlight(s){return `<article class="spotlight"><p class="kicker">${esc(s.periodLabel)}</p><h3>${playerLink({id:s.playerId,name:s.name})}</h3><p>${esc(s.position)} with ${teamLink(byId.get(s.teamId).identity)}</p><h4>${esc(s.headline)}</h4><p class="opinion">${esc(s.opinion)}</p><div class="statline">${s.stats.map(x=>`<span><strong class="numeric">${esc(x.value)}</strong>${esc(x.label)}</span>`).join('')}</div><p>${esc(s.statPeriod)}</p><details><summary>Why this pick? Period and source</summary><p>${esc(s.selectionReason)}</p><p><a href="${esc(s.source.url)}">${esc(s.source.label)}</a>. Checked ${esc(s.source.checkedAt)}</p><p>Current owner is ${teamLink(playerById.get(s.playerId)?.team??byId.get(s.teamId).identity)}. The dated editorial team attribution is retained above.</p></details></article>`}
function editionBody(e,full=true){const g=e.game;return `<p class="kicker">${esc(e.dateLabel)}. ${esc(e.status)}.</p><h3>${esc(e.title)}</h3><p>${esc(e.startsAt)} to ${esc(e.endsAt)} (end exclusive). ${e.publishedAt?'Published '+esc(e.publishedAt):'Not published.'}</p><h4>${esc(g.title)}</h4><p>${esc(g.note)}. ${esc(g.state)}${g.leagueWeek?'. Dated Week '+g.leagueWeek:''}.</p><p>${g.teamIds.map(id=>teamLink(byId.get(id).identity)).join(' / ')}${g.scores?'. Score: '+g.scores.map(x=>Number(x).toFixed(1)).join(' / '):'. No final score'}</p><p class="prose">${esc(g.context)}</p>${note(g.selectionReason)}${links([['Edition permalink',`/weekly/${e.id}`]])}${full?e.playerSpotlights.map(spotlight).join(''):''}${e.happenings.length?`<h4>Happenings in this dated edition</h4><ul class="text-list">${e.happenings.map(x=>`<li><a href="${esc(x.href)}">${esc(x.title)}</a>, ${esc(x.dateLabel)}<p>${esc(x.text)}</p></li>`).join('')}</ul>`:''}<details><summary>Edition sources and checked dates</summary><ul class="text-list">${e.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a>. Checked ${esc(s.checkedAt)}</li>`).join('')}</ul></details>`}
function editionAnswer(){return `<p class="note">Dated editorial sample. These October drafts are not the synthetic current Week 3, an official current-week award or a new publication.</p>${editionBody(data.archive[0])}<button type="button" class="answer-end" data-open="archive">Read both dated editions</button>`}

function wireAnswer(){const moves=[...new Map([...data.home.hub.transactions,...(mine?.moves??[])].map(x=>[x.id,x])).values()];return `${mine?`<h3>Your team wire</h3><ul class="text-list">${mine.news.map(n=>`<li><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="note">${esc(n.outlet.name)}, ${date(n.publishedAt)}</p></li>`).join('')}</ul>`:''}<h3>Recent league moves</h3><ul class="text-list">${moves.map(m=>`<li><strong>${esc(m.summary)}</strong><p>${m.teamIds.map(id=>teamLink(byId.get(id).identity)).join(' / ')}. Week ${m.week}, ${esc(m.type.replaceAll('_',' '))}.</p><p class="note">${date(m.createdAt)}. ${m.adds.length} add / ${m.drops.length} drop details supplied${mine&&m.teamIds.includes(mine.team.id)?'. Your team':''}</p></li>`).join('')}</ul>${links([['News','/intel'],['All transactions','/transactions']])}`}
const destinations=[['Home','/'],['News','/intel'],['Stocks / player board','/stocks#player-board'],['History','/history'],['Arcade','/arcade'],['AI Decides','/ai-decides'],['Teams','/teams'],['Transactions','/transactions'],['Trade analyzer','/trade-analyzer'],['Weekly archive','/weekly'],['Play Free Throw','/arcade/free-throw'],...(member?[['My team','/team'],['My roster','/teams/1#team-roster']]:[])];
function toolsAnswer(){return `<p>Choose a destination. Search and inline answers stay local to this study; these links preserve the real app routes.</p><ul class="destination-list">${destinations.map(([label,href])=>`<li><a href="${href}">${label}</a></li>`).join('')}</ul>`}

const tasks=[
 entry('week',member?'Your week, as it stands':'This week, as it stands',`Week ${current.week}. ${current.home.name} ${score(current.homePoints)} / ${current.away.name} ${score(current.awayPoints)}. Incomplete.`,'current matchup matchups score opponent this week today home',weekAnswer),
 ...(member?[entry('mine','Your roster, priced',`${money(mine.valuation.total)} modeled FAAB. ${mine.coverage.priced} of ${mine.coverage.roster} priced. ${mine.team.name}.`,'my team your team my roster roster values value prices faab reaves dropper',myAnswer)]:[]),
 entry('directory','Find a team or player','10 teams, 228 unique players. Full rosters.','teams team directory players player roster find search managers',directoryAnswer),
 entry('picks','Read the five saved picks',!data.weekly?'Saved slate unavailable':`${aiState==='stale'?'Stale. ':''}Week 3. Choice: Ware the Hoes At? at 35%. Confidence 20%.`,'ai decides predictions picks this week model saved probability confidence',aiAnswer),
 entry('standings','See where the league stands','10 current positions. W / L / PF.','standings league rankings rank points power lineup',standingsAnswer),
 ...(member?[entry('form','Check your player form','Damian Lillard: 38 EMA FP/G over 8 observed games.','scouting watch form best rough completed week notebook performance lillard',formAnswer)]:[]),
 entry('edition','Read the dated league edition','Oct 5–11, 2026. Draft with three editorial picks.','editorial edition stories story news jokic embiid dybantsa draft october',editionAnswer),
 entry('faces','Meet the franchise faces','10 team anchors by highest modeled player value.','faces anchors league players stars values',facesAnswer),
 entry('wire','Catch up on news and moves',`${mine?'2 team headlines, ':''}3 sample league moves in Week 3.`,'news transactions transaction moves wire latest happening',wireAnswer),
 entry('archive','Browse the weekly archive','Two dated drafts: Oct 5–11 and Sep 28–Oct 4.','history weekly archive old editions final champion',()=>data.archive.map(e=>`<article class="archive-entry">${editionBody(e)}</article>`).join('')),
 entry('history','Check recorded value history','Unavailable. No recorded line is supplied.','history recorded value chart power unavailable',()=>`<h3>Recorded team-value history</h3><p>${esc(inventory.missing.history)}</p><h3>Lineup Power</h3><p>${esc(inventory.missing.power)}</p>${links([['League history','/history'],['Stocks','/stocks#player-board']])}`),
 entry('tools','Open a tool or destination','Stocks, Trade analyzer, Arcade and Free Throw.','action tools destinations home news stocks market history arcade free throw game ai decides teams transactions trade analyzer weekly',toolsAnswer)
];
const teamResults=teams.map(t=>({id:'team-'+t.identity.id,type:'team',title:t.identity.name,fact:`${t.identity.managerName}. ${record(t.currentRecord)} current record. ${t.players.length} players.`,keywords:`team teams manager ${t.identity.managerName}`,render:()=>teamAnswer(t)}));
const playerResults=players.map(p=>({id:'player-'+p.id,type:'player',title:p.fullName,fact:`${p.position} for ${p.nbaTeam}. On ${p.team.name}.${values.has(p.id)?' '+money(values.get(p.id))+' modeled FAAB.':''}`,keywords:`player players ${p.position} ${p.nbaTeam} ${p.team.name}`,render:()=>`<p class="kicker">${esc(p.position)} for ${esc(p.nbaTeam)}</p><p>Current roster: ${teamLink(p.team)}</p>${values.has(p.id)?`<p class="big-number">${money(values.get(p.id))}</p><p>Current modeled FAAB value</p>${note(`Value from the supplied ${mine?.rosterValues.some(x=>x.id===p.id)?'member roster':'franchise face'} projection. ${date(data.home.checkedAt)}.`)}`:note('A modeled player quote is not supplied for this roster reference. No price is inferred.')} ${links([['Player profile','/player/'+p.id],['Player market','/stocks#player-board'],['Full team roster','/teams/'+p.team.id+'#team-roster']])}${data.archive[0].playerSpotlights.filter(s=>s.playerId===p.id).map(spotlight).join('')}`}));
const all=[...tasks,...teamResults,...playerResults];
let filter='all', sort='relevance', limit=25, expanded=new Set();
let directoryQuery='', directorySort='standing';
history.scrollRestoration='manual';

function getResults(){
  const q=normalize($('#query').value.trim());
  let list=q||filter!=='all'?all.filter(r=>(filter==='all'||r.type===filter)&&(!q||q.split(/\s+/).every(word=>normalize(`${r.title} ${r.fact} ${r.keywords}`).includes(word)))):tasks;
  if(sort==='name')list=[...list].sort((a,b)=>a.title.localeCompare(b.title));
  else if(q){const weight=r=>normalize(r.title).startsWith(q)?120:normalize(r.title).includes(q)?100:normalize(r.keywords).includes(q)?40:20;list=[...list].sort((a,b)=>weight(b)-weight(a))}
  return list;
}
function answerMarkup(r){return `<div class="answer-nav"><button type="button" data-search>Change search</button></div>${r.render()}<button class="answer-end" type="button" data-close="${esc(r.id)}">Back to results</button>`}
function render(){
  const q=$('#query').value.trim(),list=getResults();
  $('#clear-query').hidden=!q;
  $('#result-heading').textContent=q?`Results for “${q}”`:filter==='all'?'At a glance':`${filter==='team'?'Team':filter==='player'?'Player':'Task'} index`;
  $('#result-count').textContent=q||filter!=='all'?`${list.length} ${list.length===1?'match':'matches'}${list.length>limit?`, showing ${Math.min(limit,list.length)}`:''}`:`${tasks.length} actions`;
  $('#results').innerHTML=list.slice(0,limit).map(r=>`<article class="result ${expanded.has(r.id)?'is-open':''}" data-result="${esc(r.id)}"><div class="result-top"><button class="result-toggle" type="button" data-result-id="${esc(r.id)}" id="trigger-${esc(r.id)}" aria-expanded="${expanded.has(r.id)}" aria-controls="answer-${esc(r.id)}"><span class="result-title">${esc(r.title)}</span><span class="result-fact">${esc(r.fact)}</span><span class="open-word">${expanded.has(r.id)?'Close':'Open'}</span></button></div><div class="answer" id="answer-${esc(r.id)}" ${expanded.has(r.id)?'':'hidden'}>${expanded.has(r.id)?answerMarkup(r):''}</div></article>`).join('')||`<div class="empty"><h3>No local match.</h3><p>Try a surname, team name, NBA abbreviation, or a task such as “roster” or “trade”.</p><button type="button" data-reset>Return to the index</button></div>`;
  $('#more-results').hidden=list.length<=limit;
  syncFilters();
  updateDirectoryCount();
}
function syncFilters(){document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)))}
function disclosures(){return [...document.querySelectorAll('.result .answer details[open]')].map(el=>{const parent=el.closest('.result');return {id:parent.dataset.result,index:[...parent.querySelectorAll('.answer details')].indexOf(el)}})}
function snapshot(focusId=null,openedId=null){return {goatCommandIndex:11,query:$('#query').value,filter,sort,limit,expanded:[...expanded],directoryQuery,directorySort,disclosures:disclosures(),focusId,openedId,scroll:scrollY}}
function stateUrl(s){const u=new URL(location.href);for(const key of ['q','type','order','open'])u.searchParams.delete(key);if(s.query)u.searchParams.set('q',s.query);if(s.filter!=='all')u.searchParams.set('type',s.filter);if(s.sort!=='relevance')u.searchParams.set('order',s.sort);if(s.expanded.length)u.searchParams.set('open',s.expanded.join(','));return u}
function replaceNavigation(focusId=null,openedId=null){const s=snapshot(focusId,openedId);history.replaceState(s,'',stateUrl(s))}
function pushNavigation(focusId=null,openedId=null){if(history.state?.goatCommandIndex===11)history.replaceState({...history.state,scroll:scrollY},'');const s=snapshot(focusId,openedId);history.pushState(s,'',stateUrl(s))}
function commitSearch(focusId=null){const s=history.state;if(s?.goatCommandIndex!==11||s.query!==$('#query').value||s.filter!==filter||s.sort!==sort){if(s?.goatCommandIndex===11)history.replaceState({...s,focusId:focusId??s.focusId,scroll:scrollY},'');pushNavigation(focusId)}else history.replaceState({...s,focusId:focusId??s.focusId,scroll:scrollY,disclosures:disclosures()},'')}
function restore(s){
  if(s?.goatCommandIndex!==11)return;
  $('#query').value=s.query;filter=s.filter;sort=s.sort;limit=s.limit;expanded=new Set(s.expanded);directoryQuery=s.directoryQuery??'';directorySort=s.directorySort??'standing';$('#result-sort').value=sort;render();
  for(const d of s.disclosures??[]){const el=document.querySelector(`[data-result="${d.id}"]`)?.querySelectorAll('.answer details')[d.index];if(el)el.open=true}
  window.scrollTo({top:s.scroll??0,behavior:'instant'});if(s.focusId)document.getElementById(s.focusId)?.focus({preventScroll:true});
}
function toggle(id){
  const r=all.find(r=>r.id===id);if(!r)return;
  if(expanded.has(id)&&history.state?.openedId===id){history.back();return}
  commitSearch('trigger-'+id);
  const open=!expanded.has(id);
  if(open)expanded.add(id);else expanded.delete(id);
  const trigger=$(`#trigger-${id}`),answer=$(`#answer-${id}`);
  if(trigger&&answer){trigger.closest('.result').classList.toggle('is-open',open);trigger.setAttribute('aria-expanded',String(open));trigger.querySelector('.open-word').textContent=open?'Close':'Open';answer.hidden=!open;if(open&&!answer.innerHTML)answer.innerHTML=answerMarkup(r)}else render();
  if(open)pushNavigation('trigger-'+id,id);else replaceNavigation('trigger-'+id);
  $(`#trigger-${id}`)?.focus({preventScroll:true});if(!open)$(`#trigger-${id}`)?.scrollIntoView({block:'center',behavior:'instant'});
}
function focusSearch(){const input=$('#query');input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'instant'})}
function openTask(id){commitSearch(document.activeElement?.id||null);$('#query').value='';filter='all';limit=25;expanded.add(id);render();pushNavigation('trigger-'+id,id);const el=$(`#trigger-${id}`);el?.scrollIntoView({block:'start',behavior:'instant'});el?.focus({preventScroll:true})}
function reset(){filter='all';sort='relevance';$('#result-sort').value=sort;$('#query').value='';expanded.clear();limit=25;directoryQuery='';directorySort='standing';render()}
function updateDirectoryCount(){const entries=$('#directory-entries');if(entries){const count=entries.querySelectorAll('.team-entry').length;$('#directory-count').textContent=`${count} ${count===1?'team':'teams'}${directoryQuery?' matching “'+directoryQuery+'”':', 228 unique players'}`}}
function updateDirectory(){directoryQuery=$('#directory-query')?.value??'';directorySort=$('#directory-sort')?.value??'standing';$('#directory-entries').innerHTML=directoryEntries(directoryQuery,directorySort);updateDirectoryCount();replaceNavigation(document.activeElement?.id||null,history.state?.openedId??null)}

$('#edition-label').textContent=member?mine.team.name:`${data.home.hub.season.seasonYear} season`;
$('#comparison').href=`?view=${member?'public':'member'}${aiState!=='ready'?'&ai='+encodeURIComponent(aiState):''}`;
$('#comparison').textContent=member?'View public edition':'View member edition';
$('#comparison-footer').href=$('#comparison').href;
$('#comparison-footer').textContent=$('#comparison').textContent;
$('#tools-trigger').addEventListener('click',()=>openTask('tools'));
$('#search-trigger').addEventListener('click',focusSearch);
$('#query').addEventListener('input',()=>{limit=25;expanded.clear();render()});
$('#clear-query').addEventListener('click',()=>{commitSearch('query');reset();pushNavigation('query');focusSearch()});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();render();commitSearch('query');$('#results .result-toggle')?.focus()});
$('#result-sort').addEventListener('change',e=>{commitSearch('result-sort');sort=e.target.value;render();pushNavigation('result-sort')});
$('#more-results').addEventListener('click',()=>{limit+=25;render();replaceNavigation('more-results',history.state?.openedId??null)});
window.addEventListener('popstate',e=>restore(e.state));
document.addEventListener('click',e=>{
  const q=e.target.closest('[data-query]');if(q){commitSearch('query');$('#query').value=q.dataset.query;filter='all';limit=25;expanded.clear();render();pushNavigation('query');focusSearch();return}
  const f=e.target.closest('[data-filter]');if(f){commitSearch('query');filter=f.dataset.filter;limit=25;render();pushNavigation('query');return}
  const r=e.target.closest('[data-result-id]');if(r){toggle(r.dataset.resultId);return}
  const c=e.target.closest('[data-close]');if(c){toggle(c.dataset.close);return}
  const o=e.target.closest('[data-open]');if(o){openTask(o.dataset.open);return}
  if(e.target.closest('[data-search]')){focusSearch();return}
  if(e.target.closest('[data-reset]')){commitSearch('query');reset();pushNavigation('query');focusSearch()}
});
document.addEventListener('input',e=>{if(e.target.id==='directory-query')updateDirectory()});
document.addEventListener('change',e=>{if(e.target.id==='directory-sort')updateDirectory()});
document.addEventListener('toggle',e=>{if(e.target.matches('.answer details'))replaceNavigation(document.activeElement?.id||null,history.state?.openedId??null)},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const answer=e.target.closest('.answer');if(answer){e.preventDefault();toggle(answer.id.replace('answer-',''))}else if(e.target.id==='query'&&$('#query').value){commitSearch('query');reset();pushNavigation('query');focusSearch()}}});
window.goatStudy={states:[{id:'default',label:'Useful empty-query index'},{id:'week',label:'Current incomplete matchup'},{id:'roster',label:member?'Personal modeled roster value':'Public franchise context'},{id:'search',label:'Mixed team and player search'},{id:'directory',label:'Full directory and rosters'},{id:'predictions',label:'Five saved choices and provenance'},{id:'edition',label:'Dated editorial'},{id:'league',label:'Standings and franchise faces'}],activate(id){reset();if(id==='search'){$('#query').value='Reaves';expanded.add('player-2316')}else if(id==='roster'){if(member)expanded.add('mine');else{$('#query').value='Reaves Dropper';expanded.add('team-1')}}else if(id==='week')expanded.add('week');else if(id==='directory')expanded.add('directory');else if(id==='predictions')expanded.add('picks');else if(id==='edition')expanded.add('edition');else if(id==='league'){expanded.add('standings');expanded.add('faces')}render();const target={week:'trigger-week',roster:member?'trigger-mine':'trigger-team-1',search:'result-heading',directory:'trigger-directory',predictions:'trigger-picks',edition:'trigger-edition',league:'trigger-standings'}[id];if(target)document.getElementById(target)?.scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});replaceNavigation(target??null);return Promise.resolve(id)}};
const initial=new URL(location.href).searchParams;
$('#query').value=initial.get('q')??'';
if(['all','team','player','task'].includes(initial.get('type')))filter=initial.get('type');
if(initial.get('order')==='name')sort='name';
$('#result-sort').value=sort;
expanded=new Set((initial.get('open')??'').split(',').filter(id=>all.some(r=>r.id===id)));
render();replaceNavigation();Promise.resolve(document.fonts?.ready).then(()=>document.body.dataset.studyReady='11');
