import { fixture as f } from '../fixture.js';

const params = new URLSearchParams(location.search);
const persona = ['reaves','neural','guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const person = f.personas[persona];
const member = person.kind === 'member';
const stage = params.get('stage') === 'structure' ? 'structure' : 'designed';
document.documentElement.dataset.persona = persona;
document.documentElement.dataset.stage = stage;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const price = n => n === null ? 'Unpriced' : Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const team = id => f.teams.find(t => t.id === id);
const record = t => `${t.wins}–${t.losses}`;
const external = (path,label,cls='') => `<a class="${cls}" href="https://goathoopers.com${path}" data-external>${esc(label)}<span class="exit">on GOAT</span></a>`;
const home = `${location.pathname}?persona=${persona}${stage==='structure'?'&stage=structure':''}`;
const inspect = (type,id,label,cls='',origin='') => `<button type="button" class="${cls}" data-action="inspect-${type}" data-inspect="${type}" data-id="${esc(id)}" id="${esc(origin || `${type}-${id}`)}" aria-expanded="false" aria-controls="inspection">${label}</button>`;
const points = n => n === null ? '<span class="unknown">Score unavailable</span>' : esc(num(n));

function header(){
  const more = f.destinations.filter(d=>['/news','/table','/transactions','/draft','/intel','/ai-decides','/trade-analyzer','/history','/weekly'].includes(d.href));
  return `<header class="site-header"><div class="wrap masthead"><a class="brand" href="${home}" aria-label="GOAT Hoopers home"><img src="${f.assets.logo}" width="260" height="58" alt="GOAT Hoopers"></a><nav class="primary" aria-label="Primary navigation"><a href="${home}" aria-current="page">Home</a>${external('/teams','Teams')}${external('/stocks','Stocks')}${external('/arcade','Arcade')}<details id="more-navigation"><summary>More league links</summary><div class="more-links">${more.map(d=>external(d.href,d.label)).join('')}</div></details></nav><div class="account">${external(member?'/team':'/login',member?'My Team':'Sign in')}</div></div></header><div class="wrap utility"><div class="utility-left"><a href="#sources" class="demo-label">Synthetic demo</a><span>2026 season · Week 3</span><span class="outgoing">Site links open the current GOAT site</span></div><label class="persona" for="persona">Demo persona <select id="persona"><option value="reaves" ${persona==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${persona==='guest'?'selected':''}>Guest</option></select></label></div>`;
}

function memberWall(){
  const portraits = person.players.filter(p=>p.portrait).slice(0,3);
  const ownScore=person.matchup.home===person.teamId?person.matchup.homePoints:person.matchup.awayPoints;
  const opponentScore=person.matchup.home===person.teamId?person.matchup.awayPoints:person.matchup.homePoints;
  return `<div class="club-title"><div><p class="eyebrow">Your club</p><h1 id="page-title" tabindex="-1">${esc(person.team.name)}</h1><p class="team-line">Managed by ${esc(person.team.manager)} · <span class="numeric">${record(person.team)}</span> · ${person.standing.rank}${person.standing.rank===1?'st':'th'} of 10</p></div><p class="season-note">Your league. Your people.<br><strong>${person.players.length} players</strong> in this demo roster</p></div><section class="club-wall" aria-label="Your roster members"><div class="wall-people"><p class="wall-intro">A few familiar faces from your roster. Select a player to look closer.</p><div class="portrait-cluster">${portraits.map((p,i)=>inspect('player',p.id,`<img src="${p.portrait}" alt="" width="300" height="201"><span class="person-caption"><span class="person-name">${esc(p.name)}</span><span class="person-price">${price(p.modeledFaab)}${p.modeledFaab===null?'':' modeled FAAB'}</span><span class="inspect-hint">Inspect player</span></span>`,`wall-person person-${['one','two','three'][i]}`,`portrait-${p.id}`)).join('')}</div></div><div class="wall-route"><p class="eyebrow">Your team area</p><h2>All ${person.players.length} players.</h2><p>Inspect your roster’s quotes and available points.</p>${inspect('roster',person.teamId,'Inspect your roster','action','inspect-roster')}${external('/team','My Team','route-link')}<p class="small">Open your full team area.</p></div><p class="portrait-note">Portraits identify roster members only. Their placement does not show a lineup, ranking or availability.</p></section><section class="opponent" aria-labelledby="opponent-heading"><div><p class="eyebrow">This week's opponent</p><h2 id="opponent-heading">${esc(person.opponent.name)}</h2></div><div><p class="score"><span>${points(ownScore)}</span><span aria-hidden="true">/</span><span>${points(opponentScore)}</span></p><p class="score-label">${esc(person.team.name)} / ${esc(person.opponent.name)}<br>Synthetic ${ownScore===null||opponentScore===null?'score sample':'in-progress score'}</p></div><div class="opponent-actions">${inspect('matchup',person.matchup.id,'Inspect this matchup','text-action','inspect-matchup')}${external(`/teams/${person.opponent.id}`,'Teams')}${external('/intel','Intel')}<span>Opponent profiles · matchup research</span></div></section>`;
}

function pairings(matchups,showInspection=true){
  return `<ul class="pairings">${matchups.map(m=>`<li>${showInspection?`<button type="button" data-action="inspect-matchup" data-inspect="matchup" data-id="${m.id}" id="pair-${m.id}" aria-controls="inspection" aria-expanded="false">`:''}<span class="pairing-names">${esc(team(m.home).name)}<span class="vs">vs</span>${esc(team(m.away).name)}</span><span class="pairing-score">${points(m.homePoints)} / ${points(m.awayPoints)}</span>${showInspection?'</button>':''}</li>`).join('')}</ul>`;
}

function guestWall(){
  return `<div class="club-title"><div><p class="eyebrow">The league home</p><h1 id="page-title" tabindex="-1">Week 3. All together.</h1><p class="team-line">Ten teams, six playoff places, one GOAT Hoopers league.</p></div><p class="season-note">Browse the league.<br>${external('/login','Sign in for your actual team')}</p></div><section class="guest-wall" aria-label="Public league overview"><div class="guest-scene"><div><p class="eyebrow">A seat in the stands</p><h2>Meet the league.</h2><p>Start with a team, follow this week's pairings, or get to know the player market.</p></div><img src="${f.assets.court}" width="1440" height="810" alt="The GOAT Hoopers basketball arena"><p>${external('/teams','Teams')} — public profiles and the people running them.</p></div><div class="guest-games"><h2>This week's pairings</h2><p class="small">Synthetic score sample · Select a pairing for its public context.</p>${pairings(f.matchups)}</div></section>`;
}

function digest(){
  const rows=person.players.filter(p=>p.participation==='verified_demo'&&p.completedWeekPoints!==null);
  return `<section class="section" aria-labelledby="digest-heading"><div class="section-head"><div><p class="eyebrow">From your last completed week</p><h2 id="digest-heading">Your players in Week 2.</h2><p>${rows.length} of ${person.players.length} roster players have counted-game evidence in this synthetic sample.</p></div><p class="period">Synthetic completed Week 2<br>October 19–25, 2026</p></div><ul class="week-digest">${rows.sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints).map(p=>`<li>${inspect('player',p.id,`<span class="person-name">${esc(p.name)}</span><span class="points">${num(p.completedWeekPoints)}<small>counted points</small></span>`,'',`digest-${p.id}`)}</li>`).join('')}</ul><div class="inline-context"><p>Select a name to read that player’s points and current modeled price. The sample covers only the players listed here.</p>${external('/stocks','Stocks — research player prices','route-link')}</div></section>`;
}

function contexts(){
  const v=person.valuation;
  const ai=person.savedAi;
  const change=person.changes.find(c=>c.target==='valuation');
  return `<section class="section quotes-context" aria-label="Current quotes and saved matchup context"><article><p class="eyebrow">A current model quote</p><h2>${v.complete?'Your roster, priced together.':'Your current player prices.'}</h2><p class="quote-number">${v.complete?price(v.modeledFaabSubtotal):`${v.priced} of ${v.roster}`}<span class="unit">${v.complete?'modeled FAAB · complete roster quote':'players priced'}</span></p>${!v.complete?`<p class="coverage">${price(v.modeledFaabSubtotal)} modeled FAAB subtotal · incomplete</p>`:`<p class="coverage">${v.priced} of ${v.roster} players priced</p>`}<p class="small">Modeled prices are not a cash balance or player performance. No league value rank is supplied.</p>${inspect('roster',person.teamId,v.complete?'Inspect all player quotes':'Inspect priced and unpriced players','text-action','quotes-roster')}<p class="changes">${esc(change?.headline || '')} · Checked October 30, 08:10 UTC.</p></article><article><p class="eyebrow">Another angle on this week</p><h2>${ai.status==='ready'?'A saved model view.':'No saved model this week.'}</h2>${ai.status==='ready'?`<div class="model-pair">${ai.probabilities.map(r=>`<p>${esc(team(r.teamId).name)}<strong>${Math.round(r.probability*100)}%</strong></p>`).join('')}</div><p class="small">Synthetic saved model estimate; not calibrated odds. Saved October 26, 08:00 UTC.</p>${inspect('matchup',person.matchup.id,'Inspect model and matchup context','text-action','model-matchup')}`:`<p>No saved model estimate is included for this pairing. ${esc(person.opponent.name)}’s recorded zero and your unavailable score remain different states.</p>${inspect('matchup',person.matchup.id,'Inspect the available matchup facts','text-action','model-matchup')}`}<p>${external('/ai-decides','AI Decides','route-link')}<span class="small">Saved picks and decision tools on the current site.</span></p></article></section>`;
}

function guestContext(){
  const unbeaten=f.standings.filter(t=>t.wins===2&&t.losses===0);
  return `<section class="section" aria-labelledby="guest-clubs-heading"><div class="section-head"><div><p class="eyebrow">A little league context</p><h2 id="guest-clubs-heading">Three teams at 2–0.</h2><p>After two recorded games in this synthetic season, these teams share an unbeaten record. This is current record context, not a prediction.</p></div>${external('/table','The Table — league leaderboard','route-link')}</div><div class="guest-clubs">${unbeaten.map(t=>inspect('team',t.id,`<strong>${esc(t.name)}</strong>${esc(t.manager)} · ${record(t)}<br><span class="small">Inspect public team</span>`,'',`public-team-${t.id}`)).join('')}</div></section>`;
}

function almanac(){
  const games=member?f.matchups.filter(m=>m.id!==person.matchup.id):[];
  return `<section class="almanac" aria-labelledby="almanac-heading"><div class="wrap"><p class="eyebrow">The rest of the league</p><h2 id="almanac-heading">There's more around the corner.</h2><div class="almanac-layout"><div>${member?`<p class="small">Other pairings · synthetic Week 3 score sample</p>${pairings(games)}`:`<h3>Follow the season</h3><p>Six playoff places are available across ten teams. The playoffs begin in Week 20 in this demo league setup.</p><p>${external('/intel','Intel — matchup research','route-link')}${external('/stocks','Stocks — modeled player prices','route-link')}</p>`}</div><div class="almanac-copy"><p><strong>Ten teams make this league.</strong> ${external('/teams','Teams')} has the public profiles; ${external('/table','The Table')} keeps the wider league picture together.</p><p>For the next decision, ${external('/draft','Draft')} is the rookie board and ${external('/trade-analyzer','Trade Analyzer')} is the place to compare an exchange.</p><p>The current move log lives in ${external('/transactions','Transactions')}. Player and league reporting lives in ${external('/news','News')}.</p><div class="tool-links">${external('/weekly','Weekly archive')}${external('/history','History')}</div></div></div><div class="play-row"><img src="${f.assets.game}" width="540" height="340" alt="Preview of GOAT free-throw practice" loading="lazy"><div><p class="eyebrow">Away from the roster</p><h3>A few shots between decisions.</h3><p>Head to Arcade for the actual free-throw game. This preview stays a homepage.</p>${external('/arcade','Arcade — open the game area','route-link')}</div></div></div></section>`;
}

function sources(){return `<section id="sources" class="wrap sources" aria-labelledby="sources-heading"><h2 id="sources-heading">About this demo</h2><div><p><strong>Synthetic design demo.</strong> Current scores, records, standings, player points, changes, prices and model output were constructed for this sample. As of October 30, 2026, 08:30 UTC. They are not reported league events.</p><p>Team identities, player references and approved images come from the authorized project checkout. Portraits identify roster members only. Current NBA team labels and availability are not asserted. Prior-season records, when shown, retain their season and previous-manager notes.</p><p>Local Inspect controls read only this supplied fixture. No live league, account, market, AI or backend connection exists here. Links marked “on GOAT” leave this prototype for the current site. No trades, lineup changes, sign-ins or notifications are simulated.</p></div></section>`;}
function footer(){
  const groups=[['The league',['/teams','/table','/news','/transactions']],['Your next decision',['/stocks','/intel','/draft','/ai-decides','/trade-analyzer']],['Keep exploring',['/history','/weekly','/arcade','/team','/login']]];
  return `<footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand"><img src="${f.assets.logoDark}" width="260" height="58" alt="GOAT Hoopers"><p>A fan-made fantasy basketball league hub. Not affiliated with the NBA or Sleeper.</p><p>2026 season · Week 3<br>All destination links open the current GOAT site.</p></div>${groups.map(([heading,paths])=>`<nav aria-label="${heading}"><h2>${heading}</h2>${paths.map(path=>{const d=f.destinations.find(d=>d.href===path);return `<a href="https://goathoopers.com${path}" data-external>${esc(d.label)}</a>`;}).join('')}</nav>`).join('')}</div><div class="footer-end"><span>GOAT Hoopers · Built for the league</span><a href="#top">Back to top</a></div></div></footer>`;
}

document.querySelector('#app').innerHTML=`<div id="top">${header()}<main id="main" class="wrap"><div>${member?memberWall():guestWall()}</div><section id="inspection" class="inspection" data-testid="inspection" aria-labelledby="inspection-title" hidden></section>${member?`${digest()}${contexts()}`:guestContext()}</main>${almanac()}${sources()}${footer()}</div>`;
document.title=`GOAT Hoopers · ${member?person.team.name:'League home'} · Synthetic demo`;

let baseOrigin=null;
let previouslyOpen=false;
const inspection=document.querySelector('#inspection');

function playerDetail(id){
  const p=member?person.players.find(p=>p.id===id):null;
  if(!p)return ['Player detail unavailable','<p>This guest view contains public league context. Choose a labelled member demo to inspect its synthetic roster.</p>'];
  return [p.name,`<p class="label">${esc(person.team.name)} · ${esc(p.position)} · synthetic roster member</p><div class="detail-facts"><p>Current modeled FAAB<strong data-result="player-quote">${price(p.modeledFaab)}</strong></p><p>Completed Week 2 points<strong data-result="player-points">${p.completedWeekPoints===null?'Unavailable':num(p.completedWeekPoints)}</strong></p></div><p>${p.modeledFaab===null?'No quote is supplied for this player. Unpriced is not zero.':'The modeled quote was checked October 30, 2026, 08:10 UTC. It is neither a cash balance nor a performance grade.'}</p><p>${p.completedWeekPoints===null?'No counted-game evidence is supplied for this player. This does not establish whether they played.':'Synthetic completed Week 2, October 19–25, 2026. These supplied counted points cover this sample only; no game count or box-score breakdown is included.'}</p><p>${external(`/player/${p.id}`,'Player profile')}${external('/stocks','Stocks — inspect price research','route-link')}</p>`];
}

function rosterDetail(){
  if(!member)return ['Roster unavailable','<p>No private team is claimed in this guest demo.</p>'];
  const v=person.valuation;
  return [`${person.team.name} roster`, `<p data-result="roster-coverage">${v.priced} of ${v.roster} players priced · ${price(v.modeledFaabSubtotal)} modeled FAAB ${v.complete?'complete quote':'incomplete subtotal'}.</p><p class="small">Checked October 30, 08:10 UTC. No league value rank or recorded team-value history is supplied. Prices are not a cash balance.</p><div class="roster-search"><label for="roster-search">Find a roster player</label><input id="roster-search" type="search" autocomplete="off" placeholder="Player name"><span id="roster-count" aria-live="polite">${person.players.length} players</span></div><ul class="roster-list" data-result="roster-players">${person.players.map(p=>`<li data-player-name="${esc(p.name.toLowerCase())}">${inspect('player',p.id,`${esc(p.name)} <span class="small">${esc(p.position)}</span>`,'',`roster-player-${p.id}`)}<span class="value">${price(p.modeledFaab)}</span></li>`).join('')}</ul><p>${external('/team','My Team — full team area','route-link')}${external('/stocks','Stocks — modeled prices','route-link')}</p>`];
}

function matchupDetail(id){
  const m=f.matchups.find(m=>m.id===id);
  if(!m)return ['Matchup unavailable','<p>This pairing is not supplied in the demo.</p>'];
  const a=team(m.home),b=team(m.away);
  const ai=member&&person.matchup.id===id&&person.savedAi.status==='ready'?person.savedAi:null;
  return [`${a.name} vs ${b.name}`,`<p>Week 3 · synthetic ${m.state==='partly_unavailable'?'partly unavailable score sample':'in-progress score'}</p><div class="detail-facts"><p>${esc(a.name)} · ${record(a)}<strong data-result="matchup-home">${points(m.homePoints)}</strong></p><p>${esc(b.name)} · ${record(b)}<strong data-result="matchup-away">${points(m.awayPoints)}</strong></p></div>${m.homePoints===null||m.awayPoints===null?'<p>One score is missing. A recorded zero is known; a missing score is not zero. No leader, tie or margin is inferred.</p>':'<p>These are current synthetic points, not a completed result.</p>'}${ai?`<h3>Saved model context</h3><p data-result="model-probabilities">${ai.probabilities.map(r=>`${esc(team(r.teamId).name)} ${Math.round(r.probability*100)}%`).join(' · ')}</p><p>Returned choice: ${esc(team(ai.returnedChoice).name)}. Independent confidence: ${ai.confidence}. Saved October 26, 2026, 08:00 UTC. Synthetic saved model estimate; not calibrated odds.</p>`:member&&person.matchup.id===id?'<p data-result="model-unavailable">No saved model estimate is included for your pairing.</p>':''}<p>${external(`/teams/${a.id}`,`${a.name} profile`)}<br>${external(`/teams/${b.id}`,`${b.name} profile`)}${external('/intel','Intel — matchup research','route-link')}</p>`];
}

function teamDetail(id){
  const t=team(id);if(!t)return ['Team unavailable','<p>No team reference supplied.</p>'];
  const m=f.matchups.find(m=>m.home===id||m.away===id),opp=m?team(m.home===id?m.away:m.home):null;
  const h=t.previousSeason;
  return [t.name,`<p>Managed by ${esc(t.manager)} · public synthetic team context</p><div class="detail-facts"><p>Current record<strong>${record(t)}</strong></p><p>Current points for<strong>${num(t.pointsFor)}</strong></p></div>${opp?`<p>Week 3 opponent: ${esc(opp.name)}.</p>`:''}<p>${h.season}: ${h.wins}–${h.losses}, finish ${h.finish}. ${esc(h.ownerNote || '')}</p>${external(`/teams/${id}`,'Teams — open public profile','route-link')}`];
}

function renderInspection({focus=true,restore=true}={}){
  const match=location.hash.match(/^#\/(player|roster|matchup|team)\/([^/]+)$/);
  document.querySelectorAll('[data-inspect]').forEach(el=>el.setAttribute('aria-expanded','false'));
  if(!match){
    inspection.hidden=true;inspection.innerHTML='';
    if(previouslyOpen&&restore){const origin=document.getElementById(baseOrigin);(origin||document.querySelector('#page-title')).focus({preventScroll:true});}
    previouslyOpen=false;return;
  }
  const [,type,id]=match;
  const detail=type==='player'?playerDetail(id):type==='roster'?rosterDetail():type==='matchup'?matchupDetail(id):teamDetail(id);
  inspection.innerHTML=`<div class="inspection-head"><div><p class="eyebrow">Local inspection · synthetic demo</p><h2 id="inspection-title" data-testid="inspection-title" tabindex="-1">${esc(detail[0])}</h2></div><button type="button" class="action quiet close" id="close-inspection" data-action="close-inspection">Close</button></div>${detail[1]}`;
  inspection.hidden=false;previouslyOpen=true;
  document.querySelectorAll(`[data-inspect="${type}"][data-id="${CSS.escape(id)}"]`).forEach(el=>el.setAttribute('aria-expanded','true'));
  if(focus){document.querySelector('#inspection-title').focus({preventScroll:true});inspection.scrollIntoView({block:'start',behavior:'instant'});}
  const search=document.querySelector('#roster-search');
  search?.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();let count=0;inspection.querySelectorAll('[data-player-name]').forEach(row=>{row.hidden=!row.dataset.playerName.includes(query);if(!row.hidden)count++;});document.querySelector('#roster-count').textContent=`${count} of ${person.players.length} players`;});
}

document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-inspect]');
  if(trigger){
    if(!location.hash.startsWith('#/'))baseOrigin=trigger.id;
    const hash=`#/${trigger.dataset.inspect}/${trigger.dataset.id}`;
    if(location.hash!==hash)history.pushState({study12:true},'',hash);
    renderInspection();
  }
  if(event.target.closest('#close-inspection')){
    if(history.state?.study12)history.back();
    else {history.replaceState(null,'',location.pathname+location.search);renderInspection();}
  }
});
window.addEventListener('popstate',()=>renderInspection());
window.addEventListener('hashchange',()=>renderInspection({focus:location.hash.startsWith('#/')}));
document.querySelector('#persona').addEventListener('change',event=>{const url=new URL(location.href);url.searchParams.set('persona',event.target.value);url.hash='';location.assign(url);});
const more=document.querySelector('#more-navigation');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&more.open){more.open=false;more.querySelector('summary').focus();event.preventDefault();}});
renderInspection({focus:location.hash.startsWith('#/'),restore:false});
await document.fonts.ready;
await Promise.all(Array.from(document.images).filter(img=>img.loading!=='lazy').map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
document.documentElement.dataset.personalStudyReady='12';
