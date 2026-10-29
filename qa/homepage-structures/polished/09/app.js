import {inventory,data,mode,aiState,esc,money} from '../../data.js';
const $=s=>document.querySelector(s);
const team=id=>data.home.directory.find(d=>d.identity.id===String(id))?.identity;
const teamLink=t=>`<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const playerLink=(id,name)=>`<a href="/player/${esc(id)}">${esc(name)}</a>`;
const record=t=>`${t.wins}–${t.losses}${t.ties?`–${t.ties}`:''}`;
const pct=n=>`${Math.round(n*100)}%`;
const date=v=>v?new Date(v).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'})+' UTC':'Unavailable';
const member=mode==='member'&&data.personal.kind==='member';
const summary=member?data.personal.summary:null;
const currentPair=summary?.matchup??data.home.directory[0].currentMatchup;
const score=v=>v==null?'<span class="score pending">Pending</span>':`<span class="score">${Number(v).toFixed(1)}</span>`;
const local=(id,label,desc='')=>`<a href="#branch-${id}" data-jump="${id}">${esc(label)}${desc?`<small>${esc(desc)}</small>`:''}</a>`;
const branch=(code,id,label,desc)=>`<li>${local(id,label,desc)}</li>`;
function heading(s,title,sub){return `<h3 class="local-title">${esc(title)}</h3>${sub?`<p class="lede">${esc(sub)}</p>`:''}`;}
function matchup(p){return `<div class="matchup" aria-label="Week ${p.week} current matchup">${[[p.home,p.homePoints],[p.away,p.awayPoints]].map(([t,n])=>`<div class="competitor"><a class="team-name" href="/teams/${esc(t.id)}">${esc(t.name)}</a>${score(n)}<span class="team-meta">${esc(t.managerName)}; ${record(t)} current record</span></div>`).join('')}<p class="matchup-caption">Known 0.0 is a recorded zero. Pending means the fixture has no score. This pairing is not a final result.</p></div>`;}
function faceMarkup(){return `<div class="faces">${data.faces.map(f=>`<div class="face">${inventory.portraits[f.player.id]?`<img src="${esc(inventory.portraits[f.player.id])}" alt="" loading="lazy">`:`<span class="initials" aria-hidden="true">${esc(f.player.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</span>`}<div>${playerLink(f.player.id,f.player.name)}<small>${teamLink(f.team)}<br>${esc(f.player.position)}; ${money(f.player.value)} modeled FAAB${f.champion?'; 2025 champion':''}</small></div></div>`).join('')}</div>`;}
function guideRows(rows){return `<div class="form-row form-heading"><span>Player / evidence</span><span>Points</span><span>GP</span></div>${rows.map(p=>`<div class="form-row"><div>${playerLink(p.id,p.name)}<small>${esc(p.note)}</small></div><span>${p.value.toFixed(1)}</span><span>${p.games}</span></div>`).join('')}`;}
function teamView(s){
 if(!member)return heading(s,'Ten teams. Ten anchors.','Each franchise’s supplied highest modeled-value player. Public profiles and league tools stay open; personal team details are member only.')+`<span class="status">SYNTHETIC modeled FAAB values</span>${faceMarkup()}<div class="actions">${local('league','Search teams and all rosters')}<a class="action" href="/stocks#player-board">Open player market</a></div>`;
 const g=summary.playerGuide;
 return heading(s,summary.team.name,`${summary.team.managerName}; ${record(summary.team)} current record; Standing ${summary.standing.rank} of ${summary.season.totalTeams}; ${summary.coverage.roster} roster players.`)+`<span class="status">MEMBER FIXTURE; SYNTHETIC</span><div class="actions"><a class="action" href="/team">My team</a><a class="action" href="/teams/${esc(summary.team.id)}#team-roster">View roster</a></div><p class="eyebrow">Current modeled FAAB ${summary.valuation.complete?'total':'subtotal'}</p><p class="valuation">${money(summary.valuation.total)}</p><p class="small">${summary.valuation.priced} priced / ${summary.coverage.roster} roster; ${summary.valuation.unpriced} unpriced; ${esc(summary.market.pricingBasis)} pricing basis</p><p class="small muted">Computed ${esc(date(summary.market.updatedAt))}. Modeled asset value, not a FAAB balance or realized transaction.${summary.valuation.complete&&summary.valuation.rank?` Value rank ${summary.valuation.rank.rank} of ${summary.valuation.rank.teams}${summary.valuation.rank.tied?' (tied)':''}.`:''}</p><ol class="top-values">${summary.players.map((p,i)=>`<li><div>${playerLink(p.id,p.name)}<small>${esc(p.position)}; ${p.changePct==null?'Change unavailable':`${p.changePct>0?'Up':p.changePct<0?'Down':'Flat'} ${Math.abs(p.changePct).toFixed(1)}% modeled change`}</small></div><strong>${money(p.value)}</strong></li>`).join('')}</ol><details><summary>All ${summary.rosterValues.length} roster values</summary><div><table class="roster-values"><thead><tr><th scope="col">Player</th><th scope="col">Pos.</th><th scope="col">Modeled FAAB</th></tr></thead><tbody>${summary.rosterValues.map(p=>`<tr><td>${playerLink(p.id,p.name)}</td><td>${esc(p.position)}</td><td>${money(p.value)}</td></tr>`).join('')}</tbody></table></div></details><p class="notice">${esc(inventory.missing.history)}</p><div class="actions"><a href="/stocks#player-board">Inspect player values in Stocks</a></div><h3>Watch on form</h3><p class="small">${esc(g.watch.label)}</p>${guideRows(g.watch.rows)}<p class="small muted">${esc(g.watch.message)}</p><h3>Completed Week ${g.previousWeek}: best & rough</h3><p class="small">SYNTHETIC COMPLETED-WEEK FIXTURE; ${esc(g.period)}</p><p class="small muted">${esc(g.coverage)}</p><details open><summary>Your best; ${g.best.length} shown</summary><div>${guideRows(g.best)}</div></details><details><summary>The rough week; ${g.rough.length} shown</summary><div>${guideRows(g.rough)}</div></details><p class="small muted">${esc(g.recapMessage)} ${esc(inventory.missing.recap)}</p><h3>Team wire</h3><ul class="text-list">${summary.news.map(n=>`<li><a href="${esc(n.url)}">${esc(n.headline)}</a><small>${esc(n.outlet.name)}; ${esc(date(n.publishedAt))}; Synthetic</small></li>`).join('')}</ul><h3>Recent moves</h3><ul class="text-list">${summary.moves.map(m=>`<li>${esc(m.summary)}<small>Week ${m.week}; ${esc(m.type)}; ${esc(date(m.createdAt))}; Synthetic</small></li>`).join('')}</ul>${local('current','Return to your current pairing')}`;
}
function league(s){return heading(s,'The league register.','Find a franchise, a manager or any player on a current roster. The route continues through their profile.')+`<span class="status">SYNTHETIC current records, scores and modeled values</span><details><summary>All ten franchise player anchors</summary><div>${faceMarkup()}</div></details><div class="search-controls"><div><label for="league-search">Team, manager or player</label><input id="league-search" type="search" placeholder="Try Embiid or NeuralNets" autocomplete="off"></div><div><label for="league-sort">Sort teams</label><select id="league-sort"><option value="rank">Standing</option><option value="name">Team name A–Z</option><option value="roster">Roster size</option></select></div></div><p class="result-count" id="result-count" aria-live="polite"></p><div id="register"></div><h3>Current standings</h3><p class="small muted">All ten teams; PF in fantasy points (stored pointsFor ÷ 100); Synthetic.</p><table class="standings"><thead><tr><th scope="col">#</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s=>`<tr><td>${s.rank}</td><td>${teamLink(s.team)}<small>${esc(s.team.managerName)}${member&&s.team.id===summary.team.id?'; Your team':''}</small></td><td>${s.wins}–${s.losses}${s.ties?`–${s.ties}`:''}</td><td>${(s.pointsFor/100).toFixed(2)}</td></tr>`).join('')}</tbody></table><p class="notice">${esc(inventory.missing.power)}</p><div class="actions"><a href="/teams" class="action">Open all team profiles</a>${local('current','Back to Week 3')}</div>`;}
function renderRegister(){
 const term=$('#league-search').value.trim().toLocaleLowerCase();
 let rows=data.home.directory.filter(d=>[d.identity.name,d.identity.managerName,...d.players.map(p=>p.fullName)].some(x=>x.toLocaleLowerCase().includes(term)));
 const sort=$('#league-sort').value;
 const ranks=new Map(data.home.hub.standings.map(s=>[s.team.id,s.rank]));
 rows.sort((a,b)=>sort==='name'?a.identity.name.localeCompare(b.identity.name)||Number(a.identity.id)-Number(b.identity.id):sort==='roster'?b.players.length-a.players.length||Number(a.identity.id)-Number(b.identity.id):ranks.get(a.identity.id)-ranks.get(b.identity.id));
 let shownPlayers=0;
 $('#register').innerHTML=rows.map(d=>{
 const t=d.identity,pair=d.currentMatchup,opponent=pair?(pair.home.id===t.id?pair.away:pair.home):null;
 const teamMatch=[t.name,t.managerName].some(x=>x.toLocaleLowerCase().includes(term));
 const players=term&&!teamMatch?d.players.filter(p=>p.fullName.toLocaleLowerCase().includes(term)):d.players;
 shownPlayers+=players.length;
 return `<article class="team-register"><h3>${teamLink(t)}</h3><p class="register-meta">${esc(t.managerName)}; ${record(d.currentRecord)} current record; ${d.players.length} roster players</p><p class="register-meta">${opponent?`Week ${pair.week}: ${teamLink(opponent)}; Current ${pair.homePoints==null?'Pending':Number(pair.homePoints).toFixed(1)} / ${pair.awayPoints==null?'Pending':Number(pair.awayPoints).toFixed(1)}; Incomplete`:'Current opponent unavailable'}</p>${d.previousSeason.ownerNote?`<p class="register-meta">${d.previousSeason.season}: ${d.previousSeason.wins}–${d.previousSeason.losses}; ${esc(d.previousSeason.ownerNote)}</p>`:''}<details ${term?'open':''}><summary>${term?'Matching roster references':'Open roster'}; ${players.length} players</summary><div><p class="small muted">Previous season ${esc(d.previousSeason.season)}: ${d.previousSeason.wins}–${d.previousSeason.losses}; Finish ${d.previousSeason.finish}.${d.previousSeason.ownerNote?` ${esc(d.previousSeason.ownerNote)}`:''}</p><ul class="roster-list">${players.map(p=>`<li>${playerLink(p.id,p.fullName)}<small>${esc(p.position)}; ${esc(p.nbaTeam??'NBA team unavailable')}</small></li>`).join('')}</ul><a class="action" href="/teams/${esc(t.id)}#team-roster">Full team roster</a></div></details></article>`;
 }).join('')||'<p class="notice">No matching team or player. Clear the search to show all ten teams.</p>';
 $('#result-count').textContent=`${rows.length} of 10 teams; ${shownPlayers} player references shown${term?' for “'+$('#league-search').value+'”':'; 228 unique players across all rosters'}`;
}
function archive(s){
 const a=data.archive.find(a=>a.id===(s.id==='archive-40'?'2026-W40':'2026-W41'));
 return heading(s,a.title,a.dateLabel)+`<span class="status">DATED SAMPLE DRAFT; ${esc(a.id)}; ${a.publishedAt?'Published '+esc(date(a.publishedAt)):'Not published'}</span><p class="notice">This is a dated editorial stop, retained as a draft. Its ${a.game.state==='final'?'historical result':'opening-week preview'} is separate from the current synthetic Week 3 pairing.</p><h3>${esc(a.game.title)}</h3><p class="small muted">${esc(a.game.note)}; ${a.game.state==='final'?'Historical final':`Upcoming in this dated Week ${a.game.leagueWeek} preview`}</p><p>${esc(a.game.context)}</p><div class="archive-nav">${a.game.teamIds.map((id,i)=>`<div>${teamLink(team(id))}${a.game.scores?`<b class="score">; ${Number(a.game.scores[i]).toFixed(1)}</b>`:''}</div>`).join('')}</div><details><summary>Why this game / dated selection</summary><div><p>${esc(a.game.selectionReason)}</p><p>Editorial period: ${esc(a.startsAt)} through ${esc(a.endsAt)} (end exclusive).</p></div></details>${a.playerSpotlights.map(p=>`<article class="spotlight"><p class="role">${esc(p.role.replaceAll('-',' '))}; ${esc(p.periodLabel)}</p><h3>${esc(p.headline)}</h3><p class="player-link">${playerLink(p.playerId,p.name)}; ${esc(p.position)}; ${teamLink(team(p.teamId))}</p><p>${esc(p.opinion)}</p><div class="stats">${p.stats.map(s=>`<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('')}</div><p class="small muted">${esc(p.statPeriod)}</p><details><summary>Selection reason and source date</summary><div><p>${esc(p.selectionReason)}</p><p><a href="${esc(p.source.url)}">${esc(p.source.label)}</a>; Checked ${esc(p.source.checkedAt)}</p><p>Team link reflects the supplied roster identity; the stat period is ${esc(p.statPeriod)}.</p></div></details></article>`).join('')}<h3>League happenings</h3><ul class="text-list">${a.happenings.map(h=>`<li><a href="${esc(h.href)}"><b>${esc(h.title)}</b></a><p class="small">${esc(h.text)}</p><small>${esc(h.dateLabel)}; Dated edition</small></li>`).join('')}</ul><details><summary>All edition sources</summary><div><ul class="source-list">${a.sources.map(x=>`<li><a href="${esc(x.url)}">${esc(x.label)}</a><small>Checked ${esc(x.checkedAt)}</small></li>`).join('')}</ul></div></details><h3>Continue along the route</h3><div class="archive-nav">${data.archive.map(x=>local(x.id==='2026-W40'?'archive-40':'archive-41',x.title,x.dateLabel+'; '+x.status)).join('')}</div><div class="actions"><a class="action" href="/weekly/${esc(a.id)}">Open stable edition URL</a>${local('current','Return to current Week 3')}</div>`;
}
function tools(s){return heading(s,'Take the working branch.','Tools keep their real destinations. This route does not simulate trades, stock execution or game scores.')+`<ul class="tool-destinations"><li><a href="/stocks#player-board">Stocks</a><p>Explore the modeled player market.</p></li><li><a href="/trade-analyzer">Trade analyzer</a><p>Open the existing trade workspace.</p></li><li><a href="/arcade/free-throw">Play Free Throw</a><p>The implemented game. Results and rewards are not invented in this study.</p></li><li><a href="/arcade">Arcade</a><p>Browse the existing game destination.</p></li><li><a href="/intel">News</a><p>League coverage and player updates.</p></li><li><a href="/transactions">Transactions</a><p>Inspect the league’s move record.</p></li></ul><h3>Recent league moves</h3><p class="small muted">SYNTHETIC fixture transactions; empty add/drop lists do not assert specific player movement.</p><ul class="text-list">${data.home.hub.transactions.map(m=>`<li>${esc(m.summary)}<small>Week ${m.week}; ${esc(m.type)}; ${esc(date(m.createdAt))}</small></li>`).join('')}</ul><div class="actions">${local('league','Browse all teams')}${local('current','Return to current junction')}</div>`;}
function beyond(s){return heading(s,'The route stops here.','No next dated edition or future game outcome was supplied.')+`<p class="unavailable">A dashed line is not a forecast.</p><h3>Recorded team-value history</h3><p>${esc(inventory.missing.history)}</p><h3>Lineup Power</h3><p>${esc(inventory.missing.power)}</p><div class="actions"><a class="action" href="/history">Open league history</a><a class="action" href="/weekly">Browse weekly archive</a></div><p class="small muted">The two dated draft editions and current Week 3 receipt are the only chronological evidence in this fixture. No gap is filled with invented milestones.</p><ul class="branch-links">${branch('03','current','Back to known current evidence','Inspect the incomplete Week 3 pairing.')}${branch('01','archive-40','Read the dated historical recap','Verified 2025 final, preserved in a sample draft.')}</ul>`;}

// This revision retains real content at each origin. There is no active-topic reader.
const branchBox=(id,code,title,note,content,open=false)=>`<details class="route-branch" data-branch="${id}" id="branch-${id}" ${open?'open':''}><summary><span><b>${esc(title)}</b><small>${esc(note)}</small></span></summary><div class="branch-body">${content}</div></details>`;
const homeUrl=`?view=${mode}${aiState==='ready'?'':`&ai=${encodeURIComponent(aiState)}`}`;
$('.brand').href=homeUrl;$('#home-link').href=homeUrl;
$('#compare').href=`?view=${member?'public':'member'}${aiState==='ready'?'':`&ai=${encodeURIComponent(aiState)}`}`;
$('#compare').textContent=member?'Public edition':'Member fixture';
$('#account').innerHTML=member?'<a href="/team">My team</a>':'<a href="/login">Sign in</a>';
$('#current').innerHTML=`<div class="route-join"><div><p class="eyebrow">Current matchup</p><h1 id="current-title" tabindex="-1">Week ${currentPair.week}</h1></div></div><p class="period-note">Incomplete current scores; Week 3 calendar bounds unavailable</p>${matchup(currentPair)}<p class="receipt">Fixture receipt ${esc(date(data.home.checkedAt))}</p>`;
$('#current .matchup-caption').textContent='0.0 is known; Pending is missing. Scores are incomplete.';
function modelRoute(){
 if(!data.weekly)return '<p class="unavailable">Saved AI slate unavailable.</p><p>The current pairing and other evidence branches remain open. No probabilities are inferred.</p><a href="/ai-decides">Open AI Decides</a>';
 const stale=data.weekly.status==='stale';
 return `<p class="context-note">${stale?'STALE saved outputs. Their valid freshness window has passed. ':'Saved model outputs. '}The returned choice, model probabilities and confidence are distinct. No generation on render.</p>${data.weekly.matchups.map((p,i)=>{
 const r=p.result,a=team(p.teamIds[0]),b=team(p.teamIds[1]),pair=data.home.directory.find(d=>d.identity.id===a.id)?.currentMatchup;
 if(!r)return `<p>${esc(a.name)} / ${esc(b.name)}: saved result unavailable.</p>`;
 const selected=r.probabilities.find(x=>x.choice===r.choice),other=r.probabilities.filter(x=>x.choice!==r.choice);
 return `<details class="pick-node" data-pick="${i}"><summary><span><b>${esc(a.name)} / ${esc(b.name)}</b><span class="returned">Returned ${esc(team(r.choice).name)} ${selected?pct(selected.probability):'probability unavailable'}</span><small>${other.map(x=>`${esc(team(x.choice).name)} ${pct(x.probability)}`).join('; ')}; Confidence ${pct(r.confidence)}${stale?'; STALE':''}</small></span></summary><div class="pick-evidence"><p>${teamLink(a)}; ${esc(a.managerName)}; ${record(a)}<br>${teamLink(b)}; ${esc(b.managerName)}; ${record(b)}</p><p>Current scores ${pair?.homePoints==null?'Pending':Number(pair.homePoints).toFixed(1)} / ${pair?.awayPoints==null?'Pending':Number(pair.awayPoints).toFixed(1)}; Incomplete</p><p>${esc(r.probabilityLabel)}</p><div class="probabilities">${r.probabilities.map(x=>`<span>${esc(team(x.choice).name)}<br><b>${pct(x.probability)}</b></span>`).join('')}</div><dl class="metadata"><dt>Saved</dt><dd>${esc(date(data.weekly.generatedAt))}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot?esc(JSON.stringify(r.snapshot)):'Unavailable in fixture'}</dd><dt>Slate snapshot</dt><dd>${data.weekly.snapshot?esc(JSON.stringify(data.weekly.snapshot)):'Unavailable in fixture'}</dd><dt>Evidence</dt><dd>${esc([...p.evidence,...r.evidence].join(' ')||'No evidence supplied')}</dd><dt>Source message</dt><dd>${esc(p.message)}</dd></dl></div></details>`;
 }).join('')}<a class="action" href="/ai-decides">Open AI Decides</a>`;
}
$('#model-status').textContent=!data.weekly?'Saved slate unavailable':`${data.weekly.status==='stale'?'STALE; ':''}Week ${data.weekly.week}; five returned choices`;
$('#model-content').innerHTML=modelRoute();
if(member){
 let raw=teamView({id:'team',code:'B'}).replace(/^<h3 class="local-title">[\s\S]*?<\/p>/,'');
 raw=raw.replace('<span class="status">MEMBER FIXTURE; SYNTHETIC</span>','');
 const watch=raw.indexOf('<h3>Watch on form</h3>'),wire=raw.indexOf('<h3>Team wire</h3>');
 $('#team-arm').innerHTML=`<div class="route-join"><div><p class="eyebrow">Your team</p><h2 id="team-title">${esc(summary.team.name)}</h2></div></div><p class="identity">${esc(summary.team.managerName)} manages ${summary.coverage.roster} roster players. Current record ${record(summary.team)}; standing ${summary.standing.rank} of ${summary.season.totalTeams}.</p>${branchBox('values','B1','Modeled roster value','Current quote; not a FAAB balance',raw.slice(0,watch),true)}${branchBox('form','B2','Form & completed-week evidence','Watch samples / completed Week 2 kept separate',raw.slice(watch,wire))}${branchBox('wire','B3','Team news & moves','Supplied synthetic team updates',raw.slice(wire))}`;
}else{
 $('#team-arm').innerHTML=`<div class="route-join"><div><p class="eyebrow">Public franchises</p><h2 id="team-title">Ten player anchors</h2></div></div>${branchBox('team','B1','Franchise faces','Player / team / modeled value',teamView({id:'team',code:'B'}),true)}`;
}
$('#league-content').innerHTML=league({id:'league',code:'C'}).replace(/^<h3 class="local-title">.*?<\/h3>/,'');
renderRegister();$('#league-search').addEventListener('input',renderRegister);$('#league-sort').addEventListener('change',renderRegister);
$('#archive-content').innerHTML=data.archive.map(a=>{
 const id=a.id==='2026-W40'?'archive-40':'archive-41';
 let content=archive({id,code:id==='archive-40'?'01':'02'}).replace(/^<h3 class="local-title">[\s\S]*?<\/p>/,'');
 content=content.replace(/<p class="notice">[\s\S]*?<\/p>/,'').replace(/<span class="status">[\s\S]*?<\/span>/,`<p class="status">Edition ${esc(a.id)}</p>`);
 const period=a.game.state==='final'?'The game recounted is the 2025 final; its game date is not supplied here. It is separate from the current Week 3 fixture.':'The game is an upcoming Week 1 pairing inside this dated draft, separate from the current Week 3 fixture.';
 return branchBox(id,id==='archive-40'?'01':'02',a.title,`${a.dateLabel}; unpublished sample draft`,`<p class="period-note">Edition period: ${esc(a.dateLabel)}. ${period}</p>${content}`);
}).join('');
for(const stop of document.querySelectorAll('#archive-content>.route-branch')){
 const spotlights=[...stop.querySelectorAll('.spotlight')];if(spotlights.length){const set=document.createElement('div');set.className='spotlight-set';spotlights[0].before(set);spotlights.forEach(n=>set.append(n));}
}
$('#tools-content').innerHTML=tools({id:'tools',code:'D'}).replace(/^<h3 class="local-title">.*?<\/h3>/,'');
$('#beyond-content').innerHTML=beyond({id:'beyond',code:'?'}).replace(/^<h3 class="local-title">.*?<\/h3>/,'').replace('<p class="unavailable">A dashed line is not a forecast.</p>','').replace('The two dated draft editions and current Week 3 receipt are the only chronological evidence in this fixture. No gap is filled with invented milestones.','No Week 3 calendar bounds or future milestones are inferred from these supplied source periods.');

const branchIds=()=>[...document.querySelectorAll('details[data-branch][open]')].map(d=>d.dataset.branch);
const resolve=id=>id==='team'&&member?'values':id;
function updateIndex(){
 const index=$('.branch-index');index.querySelector(':scope>summary').textContent=`Branches (${branchIds().length} open)`;
 for(const link of index.querySelectorAll('[data-jump]')){
  const label=link.dataset.label??link.textContent;link.dataset.label=label;
  const id=resolve(link.dataset.jump),open=id==='current'||document.getElementById('branch-'+id)?.open;
  link.innerHTML=`<span>${esc(label)}</span><small>${open?'Open':'Folded'}</small>`;
 }
}
function targetFor(id){id=resolve(id);return id==='current'?$('#current-title'):id==='team-arm'?$('#team-title'):document.querySelector(`#branch-${CSS.escape(id)}>summary`);}
function focusBranch(id,scroll=true){const target=targetFor(id);if(target){target.focus({preventScroll:true});if(scroll)target.scrollIntoView({block:'start',behavior:'instant'});}}
function saveBranches(at){updateIndex();const state={open:branchIds(),at};history.pushState(state,'',`#open=${state.open.join(',')}&at=${encodeURIComponent(at)}`);}
function setBranches(ids){document.documentElement.dataset.input='instant';const set=new Set(ids.map(resolve));for(const d of document.querySelectorAll('details[data-branch]'))d.open=set.has(d.dataset.branch);updateIndex();}
function jump(id,{record=true}={}){
 id=resolve(id);const target=document.getElementById('branch-'+id);if(target)target.open=true;
 if(record)saveBranches(id);
 document.querySelector('.branch-index').open=false;
 focusBranch(id);
}
document.documentElement.dataset.input='instant';
addEventListener('pointerdown',()=>document.documentElement.dataset.input='pointer',{passive:true});
addEventListener('keydown',()=>document.documentElement.dataset.input='keyboard');
// Each native disclosure owns its evidence and connector.
for(const d of document.querySelectorAll('details[data-branch]')){
 d.querySelector(':scope>summary').addEventListener('click',event=>{event.preventDefault();d.open=!d.open;saveBranches(d.dataset.branch);});
}
for(const root of [document.body])root.addEventListener('click',e=>{const trigger=e.target.closest('[data-jump]');if(trigger){e.preventDefault();jump(trigger.dataset.jump);}});
function fromHash(){const q=new URLSearchParams(location.hash.slice(1));return q.has('open')?{open:q.get('open').split(',').filter(Boolean),at:q.get('at')||'current'}:null;}
const initial=fromHash();if(initial)setBranches(initial.open);
history.replaceState({open:branchIds(),at:initial?.at??'current'},'');
updateIndex();
addEventListener('popstate',e=>{const state=e.state??fromHash();if(state){setBranches(state.open);focusBranch(state.at);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const disclosures=[...document.querySelectorAll('header details[open],.branch-index[open]')];const last=disclosures.at(-1);if(last){last.open=false;last.querySelector('summary').focus();}}});
const common=member?['picks','values']:['picks','team'];
const studyStates=[
 {id:'default',label:'Current junction with two retained evidence branches',open:common,target:'current'},
 {id:'model-and-team',label:'Model source plus team form retained together',open:[...common,...(member?['form']:[])],target:'picks',pick:true},
 {id:'team-evidence',label:member?'Values, form and team wire concurrently open':'Public franchise anchors',open:[...common,...(member?['form','wire']:[])],target:member?'values':'team'},
 {id:'league-and-current',label:'Local roster search with current branches retained',open:[...common,'league'],target:'league'},
 {id:'dated-draft',label:'Dated opening draft expanded at its own origin',open:[...common,'archive-41'],target:'archive-41'},
 {id:'two-editions',label:'Both dated editions retained with current context',open:[...common,'archive-41','archive-40'],target:'archive-41'},
 {id:'tools',label:'Working tools and synthetic moves expanded locally',open:[...common,'tools'],target:'tools'},
 {id:'unavailable',label:'Unavailable continuation without invented outcomes',open:[...common,'beyond'],target:'beyond'}
];
window.goatStudy={states:studyStates.map(({id,label})=>({id,label})),activate(id){const s=studyStates.find(s=>s.id===id)??studyStates[0];setBranches(s.open);for(const p of document.querySelectorAll('.pick-node'))p.open=!!s.pick&&p.dataset.pick==='0';if(s.target==='current')window.scrollTo({top:0,behavior:'instant'});else focusBranch(s.target);return Promise.resolve(s.id);}};
document.body.dataset.studyReady='09';
