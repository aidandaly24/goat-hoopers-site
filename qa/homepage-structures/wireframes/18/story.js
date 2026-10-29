import {inventory,data,mode,aiState,esc,money} from '../../data.js';

const e=esc;
const teamById=new Map(data.home.directory.map(t=>[t.identity.id,t]));
const member=mode==='member' && data.personal.kind==='member';
const personal=member?data.personal.summary:null;
const current=personal?.matchup??data.home.directory[0].currentMatchup;
const edition=data.archive[0];
const playerCount=new Set(data.home.directory.flatMap(t=>t.players.map(p=>p.id))).size;
const chapters=[
  {id:'week',label:'The current pair',short:'This week'},
  {id:'model',label:'What the model returned',short:'The model'},
  {id:'team',label:member?'Your roster, in context':'The league’s anchors',short:member?'Your team':'Ten faces'},
  {id:'scouting',label:'Read the dated scouting',short:'Scouting'},
  {id:'league',label:'Find a team or player',short:'League index'},
  {id:'archive',label:'Look back, then play',short:'The archive'},
];
let active='week',pairIndex=0,spotIndex=0,archiveIndex=1,selectedTeam='1';
const record=t=>`${t.wins}–${t.losses}${t.ties?'–'+t.ties:''}`;
const teamName=id=>teamById.get(id)?.identity.name??id;
const profile=(id,name)=>`<a href="/teams/${e(id)}">${e(name??teamName(id))}</a>`;
const player=(id,name)=>`<a href="/player/${e(id)}">${e(name)}</a>`;
const date=x=>new Date(x).toISOString().replace('T',' ').replace('.000Z',' UTC').replace(':00 UTC',' UTC');
const score=x=>x==null?'Pending':Number(x).toFixed(1);
const ordinal=i=>String(i+1).padStart(2,'0');
const chapter=(i,content)=>`<section class="chapter" id="${chapters[i].id}" aria-labelledby="${chapters[i].id}-heading"><div class="chapter-number">${ordinal(i)} · ${e(chapters[i].short)}</div>${content}</section>`;
const details=(label,body)=>`<details><summary>${label}</summary><div>${body}</div></details>`;
const face=f=>`<div class="face-row">${inventory.portraits[f.player.id]?`<img src="${e(inventory.portraits[f.player.id])}" alt="" loading="lazy">`:''}<p>${player(f.player.id,f.player.name)}<small>${profile(f.team.id)} · ${e(f.player.position)} · ${money(f.player.value)} modeled FAAB</small></p></div>`;

const routes=[['Home','./index.html'+location.search],['News','/intel'],['Stocks','/stocks#player-board'],['History','/history'],['Arcade','/arcade'],['AI Decides','/ai-decides'],['Teams','/teams'],['Transactions','/transactions'],['Trade analyzer','/trade-analyzer'],['Weekly archive','/weekly'],['Free-throw practice','/arcade/free-throw']];
if(member)routes.push(['My team','/team'],['My full roster','/teams/1#team-roster']);
document.querySelector('#destinations').innerHTML=routes.map(([label,href])=>`<a href="${e(href)}"${label==='Home'?' aria-current="page"':''}>${label}</a>`).join('');
document.querySelector('#provenance').innerHTML=`<p>${e(inventory.warning)}</p><p>The current-metric fixture is checked ${e(data.home.checkedAt)}; its November 12 date is a fixture date. Dated October drafts retain their original sources and dates. This prototype reads local data only; it makes no AI, scoring or pricing requests. The member/public switch is a design comparison, not authentication.</p><p>History and Lineup Power have no connected producer. The preserved home-edition pair conflicts with its prose; this story uses the coherent archive entries for dated editorial and the directory for current Week 3.</p><button id="close-provenance">Return to the story</button>`;
document.querySelector('#comparison').href=`?view=${member?'public':'member'}${aiState!=='ready'?'&ai='+encodeURIComponent(aiState):''}`;
document.querySelector('#comparison').textContent=`Compare ${member?'public':'member'} edition`;
document.querySelector('#chapter-nav').innerHTML=chapters.map((c,i)=>`<a href="#${c.id}" data-jump="${c.id}"><b>${ordinal(i)}</b> ${e(c.short)}</a>`).join('');
document.querySelector('#chapter-jump').innerHTML=chapters.map((c,i)=>`<option value="${c.id}">${ordinal(i)} · ${e(c.short)}</option>`).join('');

function modelRows(){
  if(!data.weekly)return '<p class="model-state">Saved AI unavailable.</p><p>No saved slate is connected in this state. No choice, probability or confidence is inferred.</p><a href="/ai-decides">Open AI Decides</a>';
  return data.weekly.matchups.map((m,i)=>{
    const r=m.result;
    return `<div class="model-row"><h3>${m.teamIds.map(id=>profile(id)).join(' vs ')}</h3><p>Returned choice: <strong>${e(teamName(r.choice))}</strong>. Independent confidence: <strong>${r.confidence*100}%</strong>.</p>${r.probabilities.map(p=>`<div class="probability"><span>${e(teamName(p.choice))}</span><strong>${p.probability*100}%</strong><div class="prob-track" aria-hidden="true"><span style="width:${p.probability*100}%"></span></div></div>`).join('')}<p class="muted">${e(r.probabilityLabel)}</p><button data-pair="${i}" aria-pressed="${i===pairIndex}">Put pairing ${i+1} on stage</button>${details('Saved pick provenance',`<dl class="provenance-list"><dt>Timestamp / status</dt><dd>${e(data.weekly.generatedAt)} · ${e(data.weekly.status)} · ${e(m.status)}</dd><dt>Model / prompt</dt><dd>${e(r.model)} / ${e(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot?e(JSON.stringify(r.snapshot)):'Unavailable in fixture (null); no inputs reconstructed.'}</dd><dt>Slate snapshot / baseline</dt><dd>${data.weekly.snapshot?e(JSON.stringify(data.weekly.snapshot)):'Unavailable (null)'} / ${m.baseline?e(JSON.stringify(m.baseline)):'Unavailable (null)'}</dd><dt>Pair input identity</dt><dd>League ${e(data.weekly.leagueId)} · season ${e(data.weekly.season)} · Week ${data.weekly.week} · roster IDs ${e(m.teamIds.join(' / '))}</dd><dt>Evidence</dt><dd>${m.evidence.map(e).join(' ')} ${r.evidence.length?r.evidence.map(e).join(' '):'The returned result carries no additional evidence.'}</dd><dt>Returned choice / probabilities / confidence</dt><dd>${e(r.choice)} / ${r.probabilities.map(p=>`${e(p.choice)}: ${p.probability*100}%`).join(', ')} / ${r.confidence*100}%</dd></dl>` )}</div>`;
  }).join('');
}
function guideList(rows,unit){return rows.map(p=>`<div class="watch-row"><span>${player(p.id,p.name)}<small>${e(p.note)}</small></span><span><strong>${p.value}</strong> ${unit}<small>${p.games} GP</small></span></div>`).join('');}
function teamChapter(){
  if(!member)return `<h2 id="team-heading">The names behind ten franchises.</h2><p class="deck">A player is a way into a team. These are the supplied top modeled-value faces, each with a direct player and team profile.</p><div class="face-list">${data.faces.map(face).join('')}</div><p class="subhead">A full roster and current opponent for every franchise follows in the <a href="#league" data-jump="league">league index</a>.</p>`;
  const p=personal,g=p.playerGuide;
  return `<h2 id="team-heading">${e(p.team.name)} has ${p.coverage.roster} places to look.</h2><p>${e(p.team.managerName)} · ${record(p.team)} · standing ${p.standing.rank} of ${p.season.totalTeams}.</p><div class="route-line"><a href="/team">Manage my team</a><a href="/teams/1#team-roster">View my roster</a></div><p class="deck">${money(p.valuation.total)} modeled FAAB subtotal, covering ${p.valuation.priced} priced / ${p.valuation.unpriced} unpriced players.</p><p>Basis: ${e(p.market.pricingBasis)} modeled values, calculated ${e(date(p.market.updatedAt))}. This is a model, not a traded balance. Supplied modeled-value rank: ${p.valuation.rank.rank} of ${p.valuation.rank.teams}${p.valuation.rank.tied?' (tied)':''}.</p><ul class="text-list">${p.players.map(x=>`<li>${player(x.id,x.name)} · ${e(x.position)}<br><strong>${money(x.value)}</strong> modeled FAAB · ${x.changePct>0?'+':''}${x.changePct}% supplied change</li>`).join('')}</ul>${details('All 24 roster values',`<ul class="mini-roster" id="own-roster-values">${p.rosterValues.map(x=>`<li><span>${player(x.id,x.name)}<small>${e(x.position)}</small></span><strong>${money(x.value)}</strong></li>`).join('')}</ul>`)}<p class="subhead">${e(inventory.missing.history)}</p><h3 class="subhead">Form is a signal, not a score.</h3><p>${e(g.watch.label)}.</p>${guideList(g.watch.rows,'EMA FP/G')}<p class="muted">${e(g.watch.message)}</p><h3 class="subhead">The completed-week receipt</h3><p>${e(g.period)}</p><p>${e(inventory.missing.recap)}</p><h3>Best in the supplied cohort</h3>${guideList(g.best,'FP')}<h3 class="subhead">Rough in the supplied cohort</h3>${guideList(g.rough,'FP')}<p>${e(g.coverage)}</p>${details('Coverage and recap method',`<p>${e(g.recapMessage)}</p><p>Eligible played: ${g.eligiblePlayed}. Current source week ${g.currentWeek}; completed source week ${g.previousWeek}. These lists describe supplied current-roster players; they can overlap.</p>`)}<h3 class="subhead">Your team wire</h3><ul class="text-list">${p.news.map(n=>`<li><a href="${e(n.url)}">${e(n.headline)}</a><br><small>${e(n.outlet.name)} · ${e(date(n.publishedAt))}</small></li>`).join('')}</ul><h3 class="subhead">Recent team move</h3>${p.moves.map(m=>`<p>${e(m.summary)}<br><small>Week ${m.week} · ${e(m.type)} · ${e(date(m.createdAt))}; no add/drop players supplied.</small></p>`).join('')}`;
}
function spotlights(){return edition.playerSpotlights.map((s,i)=>`<section class="spotlight"><p class="role">${e(s.periodLabel)} · ${e(s.role)}</p><h3>${player(s.playerId,s.name)}: ${e(s.headline)}</h3><p>${e(s.opinion)}</p><div class="stats">${s.stats.map(x=>`<span><strong>${e(x.value)}</strong>${e(x.label)}</span>`).join('')}</div><p>${e(s.statPeriod)} · current team: ${profile(s.teamId)}</p><p class="muted">${e(s.selectionReason)}</p><p><a href="${e(s.source.url)}">${e(s.source.label)}</a> · checked ${e(s.source.checkedAt)}</p><button data-spot="${i}" aria-pressed="${i===spotIndex}">Put ${e(s.name)} on stage</button></section>`).join('');}
function archiveEntries(){return data.archive.map((a,i)=>`<section class="archive-entry"><p>${e(a.dateLabel)} · ${e(a.status)} · unpublished sample</p><h3><a href="/weekly/${e(a.id)}">${e(a.title)}</a></h3><p><strong>${e(a.game.title)}</strong></p><p>${e(a.game.note)} · ${a.game.teamIds.map(id=>profile(id)).join(' vs ')}${a.game.scores?' · '+a.game.scores.map(score).join('–'):' · Upcoming / scores Pending'}</p><p>${e(a.game.context)}</p><p class="muted">${e(a.game.selectionReason)}</p><button data-archive="${i}" aria-pressed="${i===archiveIndex}">Put ${e(a.id)} on stage</button>${details('Edition bounds and sources',`<p>${e(a.startsAt)} to ${e(a.endsAt)} (end exclusive). Published timestamp: ${a.publishedAt??'none'}.</p>${a.sources.map(s=>`<p><a href="${e(s.url)}">${e(s.label)}</a> · checked ${e(s.checkedAt)}</p>`).join('')}${i===1?a.happenings.map(h=>`<p><a href="${e(h.href)}">${e(h.title)}</a>: ${e(h.text)} · ${e(h.dateLabel)}</p>`).join(''):''}`)}</section>`).join('');}

document.querySelector('#evidence').innerHTML=
chapter(0,`<h1 id="week-heading">A zero, an unknown, and the week ahead.</h1><p class="deck">${member?'Your':'The featured'} Week ${current.week} pairing starts the story. Read on to separate the score, the model’s opinion, and the evidence behind each.</p><div class="inline-facts"><span>${profile(current.home.id)}<strong>${score(current.homePoints)}</strong>${e(current.home.managerName)} · ${record(current.home)}</span><span>${profile(current.away.id)}<strong>${score(current.awayPoints)}</strong>${e(current.away.managerName)} · ${record(current.away)}</span></div><h3>This matchup is incomplete.</h3><p>A known 0.0 remains a score. A missing score stays Pending. Neither is a final result.</p><p class="muted">Current Week ${current.week} · fixture check ${e(data.home.checkedAt)}.</p><p>The stage stays with you as each chapter changes its subject. All evidence stays visible in this column; chapter jumps are always available.</p><div class="route-line"><a href="#model" data-jump="model">Read the saved pick</a>${member?'<a href="/team">Open my team</a>':'<a href="/teams">Meet the teams</a>'}</div>`)+
chapter(1,`${data.weekly?'<h2 id="model-heading">The pick and the probability disagree.</h2><p class="deck">The returned choice is the away side at 35%. The other side has 65%. We preserve the model’s actual answer.</p><p>Confidence is a separate 20% signal. Probabilities are not calibrated sports odds.</p>':'<h2 id="model-heading">There is no saved answer.</h2><p class="deck">This state has no saved slate. No choice, probability or confidence is reconstructed.</p>'}${aiState==='stale'?'<p class="model-state" role="status">Stale saved slate — historical values shown; not a current prediction.</p>':aiState==='missing'?'<p class="model-state" role="status">Saved slate missing — no result inferred.</p>':`<p>Saved Week ${data.weekly.week} slate · ${e(data.weekly.generatedAt)}.</p>`}${modelRows()}<div class="route-line"><a href="/ai-decides">Open AI Decides</a><a href="?view=${mode}&ai=stale">Review stale state</a><a href="?view=${mode}&ai=missing">Review missing state</a><a href="?view=${mode}">Ready state</a></div>`)+
chapter(2,teamChapter())+
chapter(3,`<h2 id="scouting-heading">Opinion needs its date attached.</h2><p class="deck">These are the three supplied editorial takes from “${e(edition.title)},” ${e(edition.dateLabel)}. This is an unpublished draft, not current Week ${current.week} awards.</p>${spotlights()}<h3 class="subhead">From the dated edition wire</h3><ul class="text-list">${edition.happenings.map(h=>`<li><a href="${e(h.href)}">${e(h.title)}</a><br>${e(h.text)} <small>· ${e(h.dateLabel)}</small></li>`).join('')}</ul>${details('The edition’s source checks',edition.sources.map(s=>`<p><a href="${e(s.url)}">${e(s.label)}</a> · checked ${e(s.checkedAt)}</p>`).join(''))}<a href="/intel">Read News</a>`)+
chapter(4,`<h2 id="league-heading">Follow a name into the league.</h2><p class="deck">Ten teams. ${playerCount} unique player references. Search a team, manager, player, position or NBA team; open a roster without leaving the story.</p><div class="directory-tools"><label for="team-search">Search teams and players<input id="team-search" type="search" placeholder="Try Embiid, NeuralNets or PG"></label><label for="team-sort">Sort the directory<select id="team-sort"><option value="rank">Standing, first to tenth</option><option value="name">Team name, A–Z</option><option value="roster">Roster count, largest first</option></select></label></div><p id="result-count" role="status" aria-live="polite"></p><div id="directory"></div><p class="subhead">Standings use current fixture W/L and PF (source hundredths divided by 100). The rank remains visible in every directory order.</p><h3 class="subhead">Moves around the league</h3><ul class="text-list">${data.home.hub.transactions.map(m=>`<li>${e(m.summary)}<br><small>Week ${m.week} · ${e(m.type)} · ${e(date(m.createdAt))} · ${m.teamIds.map(id=>profile(id)).join(', ')}. No add/drop players supplied.</small></li>`).join('')}</ul><p>${e(inventory.missing.power)}</p><div class="route-line"><a href="/teams">Full team directory</a><a href="/transactions">All transactions</a><a href="/stocks#player-board">Player stocks</a></div>`)+
chapter(5,`<h2 id="archive-heading">The past has its own scoreboard.</h2><p class="deck">A dated opening watch and a historical final are two separate editions. Their original bounds, draft state and sources travel with them.</p>${archiveEntries()}<p>${e(inventory.missing.history)}</p><div class="route-line"><a href="/history">League history</a><a href="/weekly">All weekly editions</a></div><div class="tool-end"><h3>Turn reading into a move.</h3><p>Inspect modeled player values, compare a trade, or take a free throw.</p><div class="route-line"><a href="/stocks#player-board">Browse Stocks</a><a href="/trade-analyzer">Open trade analyzer</a><a href="/arcade/free-throw">Play free-throw practice</a><a href="/arcade">Open Arcade</a></div></div>`);

function renderDirectory(){
  const query=document.querySelector('#team-search').value.trim().toLocaleLowerCase();
  const sort=document.querySelector('#team-sort').value;
  const rank=id=>data.home.hub.standings.find(s=>s.team.id===id);
  const matches=data.home.directory.filter(t=>[t.identity.name,t.identity.managerName,...t.players.flatMap(p=>[p.fullName,p.position,p.nbaTeam])].join(' ').toLocaleLowerCase().includes(query));
  matches.sort((a,b)=>sort==='name'?a.identity.name.localeCompare(b.identity.name):sort==='roster'?b.players.length-a.players.length||Number(a.identity.id)-Number(b.identity.id):rank(a.identity.id).rank-rank(b.identity.id).rank);
  document.querySelector('#result-count').textContent=`${matches.length} of 10 teams · ${query?'matching search':'all '+playerCount+' player references reachable'}`;
  document.querySelector('#directory').innerHTML=matches.length?matches.map(t=>{
    const id=t.identity.id,s=rank(id),op=t.currentMatchup.home.id===id?t.currentMatchup.away:t.currentMatchup.home;
    const f=data.faces.find(x=>x.team.id===id);
    const playerMatch=query && t.players.some(p=>[p.fullName,p.position,p.nbaTeam].join(' ').toLocaleLowerCase().includes(query));
    return `<details class="team-entry" data-team="${id}"${playerMatch?' open':''}><summary><span class="team-name">${s.rank}. ${e(t.identity.name)}</span><span class="team-meta">${e(t.identity.managerName)}<br>${s.wins} W / ${s.losses} L · ${(s.pointsFor/100).toFixed(2)} PF · ${t.players.length} players</span></summary><div class="team-data"><p>Week ${t.currentMatchup.week}: ${profile(op.id,op.name)} · ${score(t.currentMatchup.homePoints)} / ${score(t.currentMatchup.awayPoints)} (${e(t.currentMatchup.home.name)} / ${e(t.currentMatchup.away.name)}); incomplete.</p><div class="route-line">${profile(id,'Open team profile')}<button data-team-stage="${id}">Put team on stage</button></div>${face(f)}<p class="muted">${t.previousSeason.season}: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}.${t.previousSeason.ownerNote?' '+e(t.previousSeason.ownerNote):''}</p><ul class="mini-roster">${t.players.map(p=>`<li data-player-id="${e(p.id)}"><span>${player(p.id,p.fullName)}</span><small>${e(p.position)} · ${e(p.nbaTeam)}</small></li>`).join('')}</ul></div></details>`;
  }).join(''):'<p>No teams or players match. Try a shorter name, position or NBA team.</p><button id="clear-search">Clear search</button>';
}
renderDirectory();
function scoreboard(m,archived=false){
  const teams=archived?m.teamIds.map(id=>teamById.get(id).identity):[m.home,m.away];
  const scores=archived?(m.scores??[null,null]):[m.homePoints,m.awayPoints];
  return `<div class="scoreboard">${teams.map((t,i)=>`<div class="score-team"><span class="score-name">${e(t.name)}</span><small>${archived?'':e(t.managerName)+' · '+record(t)}</small><strong class="num score-value${scores[i]==null?' pending':''}">${score(scores[i])}</strong></div>`).join('')}</div>`;
}
function renderStage(){
  let html='';
  if(active==='week')html=`<p class="stage-kicker">Current pairing · Week ${current.week}</p><h2>${member?'Your week begins here.':'The week begins here.'}</h2>${scoreboard(current)}<p class="stage-caption">Incomplete · one known score, one Pending.<br>Current fixture check: ${e(date(data.home.checkedAt))}</p>`;
  if(active==='model'){
    const m=data.weekly?.matchups[pairIndex],r=m?.result;
    html=r?`<p class="stage-kicker">${aiState==='stale'?'Stale saved':'Saved'} model · Week ${data.weekly.week}</p><h2>The returned choice</h2><p class="focus-choice">${aiState==='stale'?'Stale pick: ':''}${e(teamName(r.choice))}</p><div class="stage-prob">${r.probabilities.map(p=>`<div class="probability"><span>${e(teamName(p.choice))}</span><strong>${p.probability*100}%</strong><div class="prob-track" aria-hidden="true"><span style="width:${p.probability*100}%"></span></div></div>`).join('')}</div><p class="confidence">Independent confidence: <strong>${r.confidence*100}%</strong></p><p class="stage-caption">The returned 35% choice is kept. The 65% side is not substituted.</p>`:`<p class="stage-kicker">AI Decides</p><h2>Saved slate unavailable</h2><p class="focus-choice">Saved AI unavailable.</p><p class="stage-caption">No choice or probability inferred. The evidence column retains the missing-state explanation.</p>`;
  }
  if(active==='team'){
    html=member?`<p class="stage-kicker">${e(personal.team.name)} · ${personal.coverage.roster} players</p><h2>The modeled subtotal</h2><p class="big-value num">${money(personal.valuation.total)}</p><p class="mobile-stage-copy">${personal.coverage.priced}/${personal.coverage.roster} priced · modeled FAAB</p><div class="stage-full">${personal.players.map(p=>`<div class="top-value"><span>${e(p.name)}</span><strong>${money(p.value)}</strong></div>`).join('')}</div><p class="stage-caption">${e(personal.market.pricingBasis)} basis · ${personal.valuation.unpriced} unpriced<br>${e(date(personal.market.updatedAt))}<br>Recorded history unavailable.</p>`:`<p class="stage-kicker">Ten teams · modeled FAAB values</p><h2>The league has many faces.</h2><div class="index-total"><span><strong>10</strong>franchises</span><span><strong>${playerCount}</strong>players</span></div><p class="focus-choice">${e(data.faces[0].player.name)} · ${money(data.faces[0].player.value)}</p><p class="mobile-stage-copy">${e(data.faces[0].team.name)} · ${e(data.faces[0].player.position)}</p><div class="stage-full">${data.faces.slice(1,4).map(f=>`<div class="top-value"><span>${e(f.player.name)}</span><strong>${money(f.player.value)}</strong></div>`).join('')}</div><p class="stage-caption">All ten faces and their team/profile links remain in the evidence.</p>`;
  }
  if(active==='scouting'){
    const s=edition.playerSpotlights[spotIndex];
    html=`<p class="stage-kicker">Dated draft · ${e(edition.dateLabel)}</p><h2>${e(s.name)}</h2>${inventory.portraits[s.playerId]?`<img class="editorial-portrait" src="${e(inventory.portraits[s.playerId])}" alt="">`:''}<p class="focus-choice">${e(s.name)} · ${e(s.periodLabel)}</p><div class="stage-stats">${s.stats.map(x=>`<span><strong>${e(x.value)}</strong>${e(x.label)}</span>`).join('')}</div><p class="mobile-stage-copy">${s.stats.map(x=>`${e(x.value)} ${e(x.label)}`).join(' · ')}</p><p class="stage-caption">${e(s.statPeriod)}<br>${e(s.source.label)} · checked ${e(s.source.checkedAt)}</p>`;
  }
  if(active==='league'){
    const s=data.home.hub.standings.find(s=>s.team.id===selectedTeam);
    html=`<p class="stage-kicker">League index · current fixture</p><h2>Ten teams, one league.</h2><div class="index-total"><span><strong>10</strong>teams</span><span><strong>${playerCount}</strong>players</span></div><p class="focus-choice">${s.rank}. ${e(s.team.name)}</p><p class="mobile-stage-copy">${s.wins} W / ${s.losses} L · ${(s.pointsFor/100).toFixed(2)} PF</p><p class="stage-caption">${e(s.team.managerName)}</p><ol class="standing-list">${data.home.hub.standings.slice(0,5).map(s=>`<li><span>${s.rank}</span><span>${e(s.team.name)}</span><span>${(s.pointsFor/100).toFixed(2)}</span></li>`).join('')}</ol><p class="stage-caption">PF shown above · all ten ranks, W/L, PF and rosters are in the index.</p>`;
  }
  if(active==='archive'){
    const a=data.archive[archiveIndex];
    html=`<p class="stage-kicker">${e(a.game.note)}</p><h2>${a.game.state==='final'?'A historical final.':'A dated opening watch.'}</h2>${scoreboard(a.game,true)}<p class="mobile-stage-copy">${a.game.state==='final'?'2025 final':'Dated upcoming watch'} · ${e(a.status)}</p><p class="stage-archive-meta">${e(a.dateLabel)} · ${e(a.status)} · unpublished sample</p><p class="stage-caption">${e(a.game.context)}</p>`;
  }
  document.querySelector('#stage-content').innerHTML=html;
  measure();
}
function setChapter(id){
  if(!chapters.some(c=>c.id===id))return;
  active=id;
  const i=chapters.findIndex(c=>c.id===id);
  document.querySelector('#stage-index').textContent=`${ordinal(i)} / 06`;
  document.querySelector('#stage-topic').textContent=chapters[i].short;
  document.querySelector('#chapter-jump').value=id;
  document.querySelectorAll('#chapter-nav a').forEach(a=>a.dataset.jump===id?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current'));
  renderStage();
}
function jump(id){setChapter(id);document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});}
function measure(){
  const stage=document.querySelector('.stage');
  document.body.classList.toggle('reading-enlarged',matchMedia('(max-width:760px)').matches && parseFloat(getComputedStyle(document.documentElement).fontSize)>=24);
  document.documentElement.style.setProperty('--chapter-clearance',`${stage.getBoundingClientRect().height+20}px`);
}
document.addEventListener('click',event=>{
  const jumpLink=event.target.closest('[data-jump]');
  if(jumpLink){event.preventDefault();jump(jumpLink.dataset.jump);history.replaceState(null,'',`#${jumpLink.dataset.jump}`);return;}
  const pair=event.target.closest('[data-pair]');
  if(pair){pairIndex=Number(pair.dataset.pair);setChapter('model');document.querySelectorAll('[data-pair]').forEach(b=>b.setAttribute('aria-pressed',String(b===pair)));return;}
  const spot=event.target.closest('[data-spot]');
  if(spot){spotIndex=Number(spot.dataset.spot);setChapter('scouting');document.querySelectorAll('[data-spot]').forEach(b=>b.setAttribute('aria-pressed',String(b===spot)));return;}
  const archive=event.target.closest('[data-archive]');
  if(archive){archiveIndex=Number(archive.dataset.archive);setChapter('archive');document.querySelectorAll('[data-archive]').forEach(b=>b.setAttribute('aria-pressed',String(b===archive)));return;}
  const team=event.target.closest('[data-team-stage]');
  if(team){selectedTeam=team.dataset.teamStage;setChapter('league');return;}
  if(event.target.closest('#clear-search')){document.querySelector('#team-search').value='';renderDirectory();document.querySelector('#team-search').focus();}
});
document.querySelector('#chapter-jump').addEventListener('change',event=>jump(event.target.value));
document.querySelector('#team-search').addEventListener('input',renderDirectory);
document.querySelector('#team-sort').addEventListener('change',renderDirectory);
let provenanceScroll=0;
const foldTriggers=[...document.querySelectorAll('[aria-controls="provenance"],[aria-controls="destinations"]')];
function closeFolds(){foldTriggers.forEach(b=>{b.setAttribute('aria-expanded','false');document.getElementById(b.getAttribute('aria-controls')).hidden=true;});}
foldTriggers.forEach(button=>button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';if(button.classList.contains('concept')&&!expanded)provenanceScroll=scrollY;closeFolds();button.setAttribute('aria-expanded',String(!expanded));document.getElementById(button.getAttribute('aria-controls')).hidden=expanded;if(button.classList.contains('concept')){if(!expanded){scrollTo(0,0);document.querySelector('#provenance').focus({preventScroll:true});}else scrollTo(0,provenanceScroll);}}));
document.querySelector('#close-provenance').addEventListener('click',()=>{closeFolds();scrollTo(0,provenanceScroll);document.querySelector('.concept').focus({preventScroll:true});});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=foldTriggers.find(b=>b.getAttribute('aria-expanded')==='true');if(open){const isProvenance=open.classList.contains('concept');closeFolds();if(isProvenance)scrollTo(0,provenanceScroll);open.focus({preventScroll:true});}}});
document.querySelector('#footer-provenance').addEventListener('click',event=>{event.preventDefault();closeFolds();const button=document.querySelector('.concept');provenanceScroll=scrollY;button.setAttribute('aria-expanded','true');document.querySelector('#provenance').hidden=false;scrollTo(0,0);document.querySelector('#provenance').focus({preventScroll:true});});
let queued=false;
function syncFromScroll(){
  queued=false;
  const line=document.body.classList.contains('reading-enlarged')?80:matchMedia('(max-width:760px)').matches?document.querySelector('.stage').getBoundingClientRect().height+50:innerHeight*.32;
  let next=chapters[0].id;
  for(const c of chapters){if(document.getElementById(c.id).getBoundingClientRect().top<=line)next=c.id;}
  if(next!==active)setChapter(next);
}
// Bounded scroll work only reads chapter positions; it never changes scroll or hides narrative.
const observer=new IntersectionObserver(()=>{if(!queued){queued=true;requestAnimationFrame(syncFromScroll);}},{threshold:[0,.01,.2,.5,.8,1]});
document.querySelectorAll('.chapter').forEach(c=>observer.observe(c));
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(syncFromScroll);}},{passive:true});
addEventListener('resize',()=>{measure();syncFromScroll();});
const stageResize=new ResizeObserver(measure);stageResize.observe(document.querySelector('.stage'));
setChapter(chapters.some(c=>c.id===location.hash.slice(1))?location.hash.slice(1):'week');
window.goatStudy={states:chapters.map(c=>({id:c.id,label:c.label})),activate(id){jump(id);return Promise.resolve();}};
document.body.dataset.studyReady='18';
