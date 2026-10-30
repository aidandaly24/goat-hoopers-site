import { fixture as f } from '../fixture.js';

const params = new URLSearchParams(location.search);
const persona = ['reaves','neural','guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const p = f.personas[persona];
const guest = p.kind === 'signed_out';
document.documentElement.dataset.persona = persona;
if (params.get('stage') === 'structure') document.documentElement.dataset.stage = 'structure';
document.title = `${guest ? 'GOAT Hoopers' : p.team.name} — Your GOAT starting point`;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => Number(n).toLocaleString('en-US', { maximumFractionDigits:2 });
const price = n => n == null ? 'Unpriced' : Number(n).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
const points = n => n == null ? 'Score unavailable' : `${number(n)} points`;
const team = id => f.teams.find(t => t.id === id);
const record = t => `${t.wins}–${t.losses}`;
const local = (route,label,id='',className='') => `<a ${id ? `id="${id}"` : ''} class="${className}" href="#inspect/${route}">${label}</a>`;
const teamLink = (id, suffix='') => local(`team/${id}`,escape(team(id).name),`team-${id}${suffix}`);
const exit = (path,label) => `<a href="https://goathoopers.com${path}">${escape(label)} on GOAT ↗</a>`;
const evidence = guest ? [] : p.players.filter(x => x.completedWeekPoints != null && x.participation === 'verified_demo').sort((a,b) => b.completedWeekPoints-a.completedWeekPoints);
const priced = guest ? [] : p.players.filter(x => x.modeledFaab != null).sort((a,b) => b.modeledFaab-a.modeledFaab);
const unpriced = guest ? [] : p.players.filter(x => x.modeledFaab == null);
const routes = new Map();
let pendingHash = null;
let lastHomeState = null;
const home = document.querySelector('#home-view');
const detail = document.querySelector('#detail-view');

document.querySelectorAll('input[name=persona]').forEach(input=>{
input.checked=input.value===persona;
input.addEventListener('change', event => {
  const url = new URL(location.href); url.searchParams.set('persona',event.target.value); url.hash=''; location.href=url.href;
});
});
const branchTitles = guest ? [['fixtures','Follow the fixtures'],['clubs','Meet the league'],['explore','Explore GOAT']] : persona === 'neural' ? [['squad','Inspect your squad'],['players','Review your players'],['matchup','Open your matchup'],['league','Stay with the league']] : [['players','Review your players'],['squad','Inspect your squad'],['matchup','Open your matchup'],['league','Stay with the league']];
document.querySelector('#local-nav').innerHTML = `<p class="nav-caption">Your starting point</p><a href="#home" aria-current="page">Home</a>${branchTitles.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}`;
document.querySelector('#site-nav').innerHTML = `<p class="nav-caption">The whole GOAT site ↗</p><div class="site-links">${f.destinations.filter(d=>d.href!=='/').map(d=>`<a href="https://goathoopers.com${d.href}">${escape(d.label)} ↗</a>`).join('')}</div>`;

function intro() {
  if (guest) return `<section class="intro" aria-labelledby="home-title"><p class="eyebrow">GOAT Hoopers · 2026 · Week 3</p><div class="intro-row"><h1 id="home-title">Come for the game.<br>Know the league.</h1><p class="intro-stamp">Public league sample<br>30 Oct · 08:30 UTC</p></div><p class="identity">Ten teams. Five matchups. A whole league to explore.</p><p class="context-line">Start with the public slate, meet the managers, or step onto the practice court. Sign in on the existing GOAT site for your actual team.</p><a id="guest-sign-in" class="primary" href="https://goathoopers.com/login">Sign in on GOAT ↗</a></section>`;
  const own = p.matchup.home===p.teamId ? p.matchup.homePoints : p.matchup.awayPoints;
  const theirs = p.matchup.home===p.teamId ? p.matchup.awayPoints : p.matchup.homePoints;
  return `<section class="intro" aria-labelledby="home-title"><p class="eyebrow">Your GOAT starting point · 2026 · Week 3</p><div class="intro-row"><h1 id="home-title">${escape(p.team.name)}</h1><p class="intro-stamp">Fixed synthetic sample<br>30 Oct · 08:30 UTC</p></div><p class="identity">${escape(p.team.manager)} <span aria-hidden="true">/</span> <strong>${record(p.team)}</strong> <span aria-hidden="true">/</span> No. <span class="num">${p.standing.rank}</span> in the 2026 sample</p><p class="context-line">This week: ${local('matchup',`${escape(p.opponent.name)} · ${own==null?'your score unavailable':`${number(own)} to ${number(theirs)} points`}`,'intro-matchup')}${own==null ? ' (opponent has a recorded 0).' : '. In progress, synthetic sample.'}</p></section>`;
}
function branch(id,title,description,body,extra='') {
  return `<section class="branch branch--${extra||id}" id="${id}" aria-labelledby="${id}-title"><div class="branch-head"><h2 id="${id}-title">${title}</h2><p>${description}</p></div><div class="branch-body">${body}</div></section>`;
}
function peopleList(rows,prefix='evidence') {
  return `<ul class="people">${rows.map(x=>`<li>${local(`player/${x.id}`,escape(x.name),`${prefix}-player-${x.id}`,'person-name')}<span class="metric num">${number(x.completedWeekPoints)}<span class="unit">pts</span></span></li>`).join('')}</ul>`;
}
function playerBranch() {
  return branch('players','Review<br>your players','A few names. Real scope. Start with the player behind the points.',`<p class="scope">Synthetic completed Week 2 · 19–25 Oct 2026<br>${evidence.length} of ${p.players.length} roster players have supplied evidence.</p>${peopleList(evidence)}${local('evidence',`Review all ${evidence.length} player results →`,'review-evidence',persona==='reaves'?'primary':'text-action')}<p class="source-line">Missing evidence is not a zero or a poor performance. These are previous-week totals, not contributions to this week's score.</p>`);
}
function squadBranch() {
  const quoteExamples = persona==='reaves' ? priced.filter(x=>['2133','2308'].includes(x.id)) : priced.slice(0,2);
  return branch('squad','Inspect<br>your squad',`${p.players.length} players make this your team. Open the roster when you want the full picture.`,`<div class="quote-total"><span class="num">${price(p.valuation.modeledFaabSubtotal)}</span><span>modeled FAAB ${p.valuation.complete?'value':'subtotal'}</span></div><p class="quote-copy">${p.valuation.priced} of ${p.valuation.roster} current player quotes supplied. ${p.valuation.complete?'Every sample roster player is priced.':'This partial subtotal is not a complete team value.'}</p><div class="quote-links">${quoteExamples.map(x=>local(`player/${x.id}`,`${escape(x.name)} <span class="num">${price(x.modeledFaab)}</span>`,`quote-player-${x.id}`)).join('')}</div>${unpriced.length?`<p class="missing-note">Six unpriced: ${unpriced.map(x=>escape(x.name)).join(', ')}. ${local('roster/unpriced','Inspect their quote status','missing-quotes')}.</p>`:''}${local('roster',`Open your ${p.players.length}-player squad →`,'open-roster',persona==='neural'?'primary':'text-action')}<p class="source-line">Current quotes · 30 Oct, 08:10 UTC. Modeled FAAB is not a cash balance. No comparable league value rank or recorded trend is supplied.</p>`);
}
function matchContent(m,suffix='main') {
  return `<p class="match-title">Week 3 · Current synthetic sample points</p>${[m.home,m.away].map(id=>{const t=team(id);const score=id===m.home?m.homePoints:m.awayPoints;return `<div class="scoreline"><div>${local(`team/${id}`,escape(t.name),`match-team-${id}-${suffix}`,'team-name')}<small>${escape(t.manager)} · ${record(t)} current season record</small></div>${score==null?'<span class="missing-score">Score unavailable</span>':`<span class="num">${number(score)}</span>`}</div>`}).join('')}`;
}
function matchBranch() {
  const m=p.matchup, own=m.home===p.teamId?m.homePoints:m.awayPoints,opp=m.home===p.teamId?m.awayPoints:m.homePoints;
  const comment=own==null||opp==null?'An unavailable score is not zero. No leader or tie is inferred.':`Your current sample ${own>opp?'lead':own<opp?'deficit':'margin'}: ${number(Math.abs(own-opp))} points. This matchup is still in progress.`;
  return branch('matchup','Open your<br>matchup','The opponent is set. Keep the current score in view.',`${matchContent(m)}<p class="match-comment">${comment}</p>${p.savedAi.status==='ready'?`<p class="model-line">Saved 26 Oct: ${local('model','56% Reaves / 44% Ware','saved-model')}. Synthetic model estimate, not calibrated odds. Confidence 0.35 is a separate model field.</p>`:'<p class="model-line">No saved model estimate is supplied for this matchup.</p>'}${local('matchup','Inspect this matchup →','inspect-matchup','text-action')}`,'match');
}
function gamesList(matches,suffix) {
  return `<ul class="games">${matches.map(m=>`<li><div class="game-teams">${teamLink(m.home,`-${suffix}`)} <span aria-hidden="true">/</span> ${teamLink(m.away,`-${suffix}`)}</div><p class="game-score">${points(m.homePoints)} <span aria-hidden="true">·</span> ${points(m.awayPoints)}${m.state==='partly_unavailable'?' · No leader inferred':' · In progress'}</p></li>`).join('')}</ul>`;
}
function tools() {
  return `<div class="tool-visit"><a href="https://goathoopers.com/arcade" aria-label="Arcade on GOAT, leaves this prototype"><img src="/public/arcade/free-throw-preview.jpg" width="320" height="200" loading="lazy" alt="Preview of GOAT's free-throw basketball game"></a><p>${exit('/arcade','Arcade')}<br>Find the free-throw practice game on the existing site. This image is a preview.</p></div><p class="history-note">Thinking about your next move? ${exit('/stocks','Stocks')} lets you inspect the market; ${exit('/trade-analyzer','Trade Analyzer')} is the existing trade tool.</p>`;
}
function leagueBranch() {
  return branch('league','Stay with<br>the league','Four more games are part of your week. Keep the whole league within reach.',`${gamesList(f.matchups.filter(m=>m.id!==p.matchup.id),'league')}${tools()}`);
}
function guestBranches() {
  return branch('fixtures','Follow the<br>five fixtures','Current sample scores, with every team named. No private team is selected.',gamesList(f.matchups,'guest'))+branch('clubs','Meet<br>the league','Ten clubs and the people behind them. Current records below are synthetic 2026 data.',`<ul class="club-list">${f.standings.map(t=>`<li>${teamLink(t.id,'-club')}<p>${escape(t.manager)}<br>No. ${t.rank} · ${record(t)} · ${number(t.pointsFor)} points for</p></li>`).join('')}</ul>`,'squad')+branch('explore','Explore<br>GOAT','The game continues beyond this page.',`${tools()}<p class="history-note"><strong>From the 2025 archive.</strong> Josh Diddy’s Roster beat papichooter 326–251.5 in the historical final. ${exit('/history','History')} keeps that season separate from this sample.</p>${exit('/news','News')} · ${exit('/intel','Intel')}`,'league');
}
home.innerHTML=intro()+(guest?guestBranches():persona==='neural'?squadBranch()+playerBranch()+matchBranch()+leagueBranch():playerBranch()+squadBranch()+matchBranch()+leagueBranch());

function detailShell(title,body) {
  return `<article class="detail"><a class="back" id="back-home" href="${lastHomeState?.hash || '#home'}">← Back to ${guest?'league home':escape(p.team.name)+' home'}</a><p class="eyebrow">Local fixture inspection · Synthetic demo</p><h1 tabindex="-1" id="detail-title">${title}</h1>${body}<p class="source-line">Local sample facts only. No source refresh, submission or account action occurs here.</p></article>`;
}
function rosterPage(unpricedOnly=false) {
  if(guest) return detailShell('No private roster selected','<p>Use the public club directory or sign in on the actual GOAT site for your own team.</p>');
  const table = rows=>`<table><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col">Modeled FAAB</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${local(`player/${x.id}`,escape(x.name),`roster-player-${x.id}`)}</td><td>${escape(x.position)}</td><td class="num">${price(x.modeledFaab)}</td></tr>`).join('')}</tbody></table>`;
  return detailShell(`${escape(p.team.name)} · ${unpricedOnly?'unpriced players':'your squad'}`,`<p>${p.players.length} sample roster players. ${p.valuation.priced} priced. Current ${p.valuation.complete?'modeled FAAB value':'modeled FAAB subtotal'}: <strong class="num">${price(p.valuation.modeledFaabSubtotal)}</strong>.</p><p>Checked 30 October 2026, 08:10 UTC. Modeled FAAB is not a cash balance. No league value rank is asserted.</p>${unpriced.length?`<h2>Unpriced players (${unpriced.length})</h2><p>No quote is supplied. These players are included in the roster count, with no numeric price substituted.</p>${table(unpriced)}`:''}${!unpricedOnly?`<h2>Priced players (${priced.length})</h2>${table(priced)}`:local('roster','Open the full squad →','view-full-roster','text-action')}<p class="source-line">${escape(p.history.reason)}</p>`);
}
function playerPage(id) {
  const x=!guest&&p.players.find(x=>x.id===id);
  if(!x) return detailShell('Player detail is not supplied','<p>This persona has no supplied private player facts for that link. Return to the homepage for the available sample.</p>');
  return detailShell(escape(x.name),`<p>${escape(x.position)} · On ${escape(p.team.name)} in this synthetic roster.</p><dl><dt>Current quote</dt><dd><span class="num">${price(x.modeledFaab)}</span>${x.modeledFaab==null?' — no numeric quote supplied':' modeled FAAB'}</dd><dt>Quote check</dt><dd>30 October 2026, 08:10 UTC</dd><dt>Completed Week 2</dt><dd>${x.completedWeekPoints==null?'Evidence not supplied':`<span class="num">${number(x.completedWeekPoints)}</span> synthetic points`}</dd><dt>Evidence period</dt><dd>19–25 October 2026; ends before 26 October</dd><dt>Participation</dt><dd>${x.participation==='verified_demo'?'Verified in this synthetic sample':'Not supplied; no participation or performance is inferred'}</dd></dl><p class="source-line">No game-by-game receipt, played-game count, current NBA team or availability designation is supplied. Previous-week points are independent of the current quote and current matchup.</p><p class="actual-exit">${exit(`/player/${x.id}`,'Player profile')} · ${local('roster','Back to your squad','player-to-roster')}</p>`);
}
function teamPage(id) {
  const t=team(id), standing=f.standings.find(t=>t.id===id),m=f.matchups.find(m=>m.home===id||m.away===id);
  if(!t) return detailShell('Club not found','<p>This team is not part of the supplied sample.</p>');
  return detailShell(escape(t.name),`<p>Managed by ${escape(t.manager)}.</p><dl><dt>2026 sample rank</dt><dd class="num">${standing.rank} of 10</dd><dt>Current record</dt><dd class="num">${record(t)}</dd><dt>Points for</dt><dd class="num">${number(t.pointsFor)} synthetic season points</dd><dt>2025 history</dt><dd>${record(t.previousSeason)}, finish ${t.previousSeason.finish}${t.previousSeason.ownerNote?`<br><strong>${escape(t.previousSeason.ownerNote)}</strong>`:''}</dd></dl><h2>Current Week 3 matchup</h2>${matchContent(m,'detail')}${!guest&&p.teamId===id?`<p>${local('roster','Inspect your full squad →','team-to-roster','text-action')}</p>`:'<p class="source-line">Roster detail is not supplied in this public demo.</p>'}<p class="actual-exit">${exit(`/teams/${id}`,'Team profile')}</p>`);
}
function modelFacts() {
  return `<p>Saved 26 October 2026, 08:00 UTC. Synthetic saved model estimate; not calibrated odds.</p><dl><dt>Returned choice</dt><dd>Reaves Dropper</dd><dt>Probabilities</dt><dd>Reaves Dropper <span class="num">56%</span><br>Ware the Hoes At? <span class="num">44%</span></dd><dt>Confidence</dt><dd><span class="num">0.35</span> — separate from the returned probabilities</dd></dl><p class="source-line">No model inputs, rationale or calibrated prediction accuracy are supplied. This inspection does not generate a new decision.</p>`;
}
function makeDetail(hash) {
  const route=hash.replace(/^#inspect\//,'').split('/');
  if(route[0]==='player') return playerPage(route[1]);
  if(route[0]==='team') return teamPage(route[1]);
  if(route[0]==='roster') return rosterPage(route[1]==='unpriced');
  if(route[0]==='evidence'&&!guest) return detailShell('Your supplied player evidence',`<p>Synthetic completed Week 2 · 19–25 October 2026. ${evidence.length} of ${p.players.length} roster players have supplied evidence. Select a player to inspect the exact facts.</p>${peopleList(evidence,'detail')}<p class="source-line">No zero or poor-performance verdict is inferred for other roster players. No individual game logs or played-game counts are supplied.</p>`);
  if(route[0]==='matchup'&&!guest) return detailShell(`Your Week 3 matchup`,`${matchContent(p.matchup,'detail')}<p class="source-line">Current synthetic sample scores, not a final result. ${p.matchup.homePoints==null||p.matchup.awayPoints==null?'The recorded zero and unavailable score have different meanings; no leader or tie is inferred.':''}</p><h2>Saved model context</h2>${p.savedAi.status==='ready'?modelFacts():'<p>No saved estimate is supplied. Nothing is generated by opening this view.</p>'}`);
  if(route[0]==='model'&&!guest&&p.savedAi.status==='ready') return detailShell('Saved matchup estimate',modelFacts());
  return detailShell('This inspection is not available','<p>The requested detail is not supplied for this demo persona. Return home for the available teams, games and local actions.</p>');
}
document.addEventListener('click', event=>{
  const anchor=event.target.closest('a[href^="#"]');
  if(!anchor||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
  if(anchor.hash.startsWith('#inspect/')||location.hash.startsWith('#inspect/')) {
    if(!anchor.id) anchor.id=`return-${Math.random().toString(36).slice(2,8)}`;
    const returnState={scroll:scrollY,focus:anchor.id};
    routes.set(location.hash||'#home',returnState);
    if(!location.hash.startsWith('#inspect/')) lastHomeState={...returnState,hash:location.hash||'#home'};
    pendingHash=anchor.hash;
  }
});
function showRoute(initial=false) {
  const hash=location.hash||'#home',isDetail=hash.startsWith('#inspect/'),wasDetail=!detail.hidden;
  home.hidden=isDetail;detail.hidden=!isDetail;
  if(isDetail) detail.innerHTML=makeDetail(hash);
  const saved=routes.get(hash),isFresh=pendingHash===hash;
  requestAnimationFrame(()=>{
    if(saved&&(!isFresh||(wasDetail&&!isDetail))){window.scrollTo(0,saved.scroll);document.getElementById(saved.focus)?.focus({preventScroll:true});}
    else if(isDetail){window.scrollTo(0,0);document.querySelector('#detail-title')?.focus({preventScroll:true});}
    else if(wasDetail&&hash==='#home'){const homeState=routes.get('#home');window.scrollTo(0,homeState?.scroll||0);document.getElementById(homeState?.focus||'home-title')?.focus({preventScroll:true});}
    else if(!initial&&hash!=='#home'){if(hash==='#sources')document.querySelector('#sources').open=true;document.getElementById(hash.slice(1))?.scrollIntoView();}
    else if(!initial){window.scrollTo(0,0);}
    pendingHash=null;
  });
}
window.addEventListener('hashchange',()=>showRoute());showRoute(true);
await document.fonts.ready;
document.documentElement.dataset.personalStudyReady='20';
