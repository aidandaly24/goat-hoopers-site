import {fixture as f} from '../fixture.js';

const params = new URLSearchParams(location.search);
const persona = ['reaves','neural','guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const member = f.personas[persona];
const signedIn = member.kind === 'member';
document.documentElement.dataset.persona = persona;
document.documentElement.dataset.stage = params.get('stage') === 'structure' ? 'structure' : 'finished';
const e = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const n = value => value === null || value === undefined ? 'Unavailable' : new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
const price = value => new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const team = id => f.teams.find(x => x.id === id);
const standing = id => f.standings.find(x => x.id === id);
const record = t => `${t.wins}–${t.losses}`;
const exit = (href,label,extra='') => `<a class="exit ${extra}" href="https://goathoopers.com${href}">${e(label)}<small>GOAT site</small></a>`;
const inspect = (kind,label,extra='') => `<button type="button" class="inspect ${extra}" data-inspect="${e(kind)}">${e(label)}</button>`;
const sourceTime = '<time datetime="2026-10-30T08:30:00Z">30 Oct 2026 · 08:30 UTC</time>';
const prior = t => `<span class="prior-record">${e(t.previousSeason.season)}: ${t.previousSeason.wins}–${t.previousSeason.losses} · finished ${t.previousSeason.finish}${t.previousSeason.ownerNote ? `<br><strong class="owner-note">${e(t.previousSeason.ownerNote)}</strong>` : ''}</span>`;
const portrait = p => p.portrait ? `<img class="portrait" src="${e(p.portrait)}" alt="" width="42" height="46" loading="lazy">` : `<span class="portrait initials" aria-hidden="true">${e(p.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`;
const evidenceRows = players => `<ul class="evidence-list">${players.filter(p=>p.completedWeekPoints !== null).sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints).map(p=>`<li>
  ${portrait(p)}<div class="player-name"><strong>${e(p.name)}</strong><span>${e(p.position)} · completed Week 2</span></div>
  <div class="receipt-points"><strong class="num">${n(p.completedWeekPoints)}</strong><span>points</span></div>${inspect(`player:${p.id}`,'Read receipt','quiet')}
</li>`).join('')}</ul>`;
const quoteAnchors = () => `<ul class="quote-anchors">${[...member.players].filter(p=>p.modeledFaab !== null).sort((a,b)=>b.modeledFaab-a.modeledFaab).slice(0,3).map(p=>`<li><span>${e(p.name)}</span><span class="num">${price(p.modeledFaab)} <small>FAAB</small></span></li>`).join('')}</ul>`;
const evidenceIntro = () => `<p class="period"><strong>${member.playerEvidence.verifiedPlayers} of ${member.playerEvidence.rosterPlayers} roster players.</strong> Synthetic completed Week 2, 19–25 October 2026. These are supplied counted-game points for a limited sample, not a full team recap.</p>`;
const fixtureRow = pair => {
  const home = team(pair.home), away = team(pair.away);
  const own = signedIn && [pair.home,pair.away].includes(member.teamId);
  return `<li class="fixture ${own?'your-fixture':''}" data-matchup="${pair.id}">
    <div class="fixture-side">${inspect(`team:${home.id}`,home.name,'team-link')}<span class="fixture-record"><span class="num">${record(home)}</span> · rank ${standing(home.id).rank}</span><strong class="fixture-score num">${pair.homePoints === null ? '<span class="unavailable">Unavailable</span>' : `${n(pair.homePoints)}<small>points</small>`}</strong></div>
    <span class="versus">vs</span>
    <div class="fixture-side">${inspect(`team:${away.id}`,away.name,'team-link')}<span class="fixture-record"><span class="num">${record(away)}</span> · rank ${standing(away.id).rank}</span><strong class="fixture-score num">${pair.awayPoints === null ? '<span class="unavailable">Unavailable</span>' : `${n(pair.awayPoints)}<small>points</small>`}</strong></div>
    <p class="fixture-state">${own?'<strong>Your game</strong> · ':''}${pair.awayPoints === null || pair.homePoints === null ? 'One score unavailable; no leader inferred.' : 'Synthetic current score · in progress'}</p>
  </li>`;
};
const league = (guest=false) => `<section id="league" class="section league-section" aria-labelledby="league-title" data-testid="league-games">
  <div class="section-heading"><div><span class="eyebrow">${guest?'The current week':'The rest of the league'}</span><h2 id="league-title">Five games. Ten teams.</h2></div><span class="section-note">Week 3 / 2026 demo</span></div>
  <p class="league-explainer">Records and ranks below belong to the synthetic 2026 standings. Current points are unfinished scores, separate from season points for.</p>
  <ol class="fixtures">${f.matchups.map(fixtureRow).join('')}</ol>
</section>`;
const quoteWork = () => `<section class="quote-work" id="quotes" aria-labelledby="quote-title" data-testid="quote-summary">
  <div class="quote-summary"><span class="eyebrow">Current modeled quote</span><h3 id="quote-title">${member.valuation.complete?'Your roster, fully quoted.':'A quote with limits.'}</h3><p class="quote-number num">${price(member.valuation.modeledFaabSubtotal)} <span>FAAB${member.valuation.complete?'':' subtotal'}</span></p><p><strong>${member.valuation.priced}/${member.valuation.roster} players priced.</strong> ${member.valuation.complete?'The full sample roster is covered.':'Six players remain unpriced; this is not a complete team total.'}</p></div>
  <div class="quote-detail"><p class="mini-label">Highest supplied quotes</p>${quoteAnchors()}${inspect('quotes',`Inspect ${member.valuation.roster} quotes`)}<p class="small">Modeled FAAB is not a cash balance. Calculated 30 Oct, 08:10 UTC. No league value rank is supplied.</p></div>
</section>`;
const gameRibbon = () => `<section class="game-ribbon" aria-label="Your current matchup" data-testid="current-matchup">
  <div><span class="mini-label">Your Week 3 · synthetic current game</span><p><strong>${e(member.team.name)}</strong><span class="ribbon-score num">${n(member.teamId===member.matchup.home?member.matchup.homePoints:member.matchup.awayPoints)}</span><span class="ribbon-versus">vs</span><strong>${e(member.opponent.name)}</strong><span class="ribbon-score num">${n(member.teamId===member.matchup.home?member.matchup.awayPoints:member.matchup.homePoints)}</span></p><span class="ribbon-state">${persona==='neural'?'papichooter has a recorded zero; your missing score is not zero.':'In progress. This is a current score, not a completed result.'}</span></div>
  ${inspect('matchup','Inspect matchup')}
</section>`;
const modelNote = () => persona==='reaves' ? `<details class="model-note"><summary>Saved model context: Reaves 56% / Ware 44%</summary><p>Synthetic saved model estimate, not calibrated odds. Generated 26 Oct 2026, 08:00 UTC. Returned choice: Reaves Dropper. Confidence: <span class="num">0.35</span>, separate from the probability split. No model is being run.</p></details>` : `<p class="model-note missing-model">No saved model estimate is supplied for this pairing.</p>`;
const memberWork = () => `<section id="work" class="section work-section" aria-labelledby="work-title" data-testid="member-work">
  <div class="section-heading"><div><span class="eyebrow">Your work</span><h2 id="work-title">${persona==='reaves'?'Five receipts to read.':'Know this week’s opponent.'}</h2></div><span class="section-note">${persona==='reaves'?'New evidence · 08:20 UTC':'Your pairing · Week 3'}</span></div>
  ${persona==='neural'?`<article class="opponent-entry" aria-labelledby="opponent-title"><div><span class="mini-label">You face</span><h3 id="opponent-title">${e(member.opponent.name)}</h3><p><span class="num">${record(member.opponent)}</span> in the ${f.league.season} demo · rank ${standing(member.opponent.id).rank} · <span class="num">${n(member.opponent.pointsFor)}</span> season points for.</p><p class="opponent-memory"><strong>2025 runner-up.</strong> The franchise finished ${member.opponent.previousSeason.wins}–${member.opponent.previousSeason.losses} and reached the retained final. This is previous-season context, not a prediction.</p></div>${inspect(`team:${member.opponent.id}`,'Inspect opponent record')}</article><h3 class="subheading">Start with your own evidence.</h3>`:''}
  ${evidenceIntro()}${evidenceRows(member.players)}
  <p class="work-footnote">Player receipts describe a completed week. Prices describe a current model quote. Neither replaces the current matchup score.</p>
  ${quoteWork()}
</section>`;
const recordEntry = () => `<section id="record" class="section record-entry" aria-labelledby="record-title" data-testid="franchise-record">
  <div class="section-heading"><div><span class="eyebrow">Team record</span><h2 id="record-title">The franchise, across seasons.</h2></div>${inspect(`team:${member.teamId}`,'Inspect your team','quiet')}</div>
  <p>The current team is <strong>${e(member.team.name)}</strong>, managed by ${e(member.team.manager)}. Keep each season attached to its own record.</p>
  <div class="current-season"><h3>2026 <span>Synthetic season to date</span></h3><dl><div><dt>League position</dt><dd class="num">${member.standing.rank}<small>of 10</small></dd></div><div><dt>Record</dt><dd class="num">${record(member.team)}</dd></div><div><dt>Points for</dt><dd class="num">${n(member.team.pointsFor)}</dd></div></dl></div>
  <div class="previous-season"><h3>2025</h3><div><p><strong>${member.team.previousSeason.wins}–${member.team.previousSeason.losses}; finished ${member.team.previousSeason.finish}${member.team.previousSeason.finish===4?'th':member.team.previousSeason.finish===10?'th':''}.</strong> Retained project franchise record.</p>${member.team.previousSeason.ownerNote?`<p class="ownership">${e(member.team.previousSeason.ownerNote)} This record is not attributed to the current manager.</p>`:'<p>Previous-season placement is context; it does not establish a current streak, forecast or head-to-head record.</p>'}</div></div>
  <p class="record-limit">No recorded team-value series is included in this demo. This record entry makes no valuation trend claim.</p>
</section>`;
const guestRecords = () => `<section id="record" class="section guest-records" aria-labelledby="record-title"><div class="section-heading"><div><span class="eyebrow">Team record</span><h2 id="record-title">Know the franchises.</h2></div><span class="section-note">2025 / retained reference</span></div><p>These are previous-season finishes, not the current table. Open a team to read its present and past records together.</p><ul class="franchise-index">${[...f.teams].sort((a,b)=>a.previousSeason.finish-b.previousSeason.finish).map(t=>`<li><span class="finish num">${t.previousSeason.finish}</span><div>${inspect(`team:${t.id}`,t.name,'team-link')}<span>2025 · ${t.previousSeason.wins}–${t.previousSeason.losses}${t.previousSeason.ownerNote?`<strong class="owner-note">${e(t.previousSeason.ownerNote)}</strong>`:''}</span></div></li>`).join('')}</ul></section>`;
const sourceSection = () => `<section id="sources" class="section source-section" aria-labelledby="sources-title"><div class="section-heading"><div><span class="eyebrow">Sources & next stops</span><h2 id="sources-title">A little memory. Clear limits.</h2></div></div>
  <p class="historical-final"><strong>From the 2025 final:</strong> ${e(team(f.historicalFinal.winner).name)} <span class="num">${n(f.historicalFinal.winnerPoints)}</span>, ${e(team(f.historicalFinal.runnerUp).name)} <span class="num">${n(f.historicalFinal.runnerUpPoints)}</span>. This retained project reference is separate from the synthetic Week 3 scores.</p>
  <details class="source-disclosure" data-testid="source-explanation"><summary>About these sources and the synthetic demo</summary><p>All current scores, standings, quote amounts, model outputs and change notices were constructed for this design demo. They are not reported league events. The sample is fixed at ${sourceTime}.</p><p>Names and player references come from the authorized project checkout, not a fresh production roster verification. Previous-season objects and the 2025 final were retained as historical project references. NeuralNets’ 2025 record was under the previous manager as QBs Gremlins.</p><p>There is no live league, account, AI, market or backend connection. No lineup saves, trade submissions, notifications, historical valuation series or Lineup Power producer are included. Local inspection reads this same supplied fixture.</p></details>
  <div class="onward"><article><h3>Look at an individual quote.</h3><p>The existing Stocks page is the next stop for player pricing.</p>${exit('/stocks','Open Stocks')}</article><article><h3>Take a comparison further.</h3><p>The real Trade Analyzer lives on the current GOAT site.</p>${exit('/trade-analyzer','Open Trade Analyzer')}</article><article><h3>Stay for a few shots.</h3><p>The existing Arcade has the free-throw game.</p>${exit('/arcade','Open Arcade')}</article></div>
</section>`;
const navRoutes = ['/news','/teams','/transactions','/draft','/intel','/table','/ai-decides','/trade-analyzer','/history','/weekly'];
const labelFor = href => f.destinations.find(d=>d.href===href)?.label || href;
const footerGroups = [ ['League',['/','/teams','/transactions','/draft','/table']], ['Read & research',['/news','/stocks','/intel','/ai-decides','/trade-analyzer']], ['Keep exploring',['/history','/weekly','/arcade']], ['Your account',['/team','/login']] ];
const header = `<header class="masthead" id="top"><div class="mast-inner"><a class="brand" href="?persona=${persona}" aria-label="GOAT Hoopers home"><img src="${f.assets.logoDark}" width="224" height="54" alt="GOAT Hoopers"></a><nav class="top-nav" aria-label="Primary"><a href="?persona=${persona}" aria-current="page">Home</a>${exit('/stocks','Stocks')}${exit('/arcade','Arcade')}</nav><div class="demo-controls"><span class="demo-badge">Synthetic demo</span><label for="demo-persona">Demo persona</label><select id="demo-persona" data-testid="persona-select"><option value="reaves" ${persona==='reaves'?'selected':''}>Reaves</option><option value="neural" ${persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${persona==='guest'?'selected':''}>Guest</option></select></div></div></header>`;
const sidebar = `<aside class="site-index"><p class="index-season">Season companion<br><span>2026 / Week 3</span></p><nav class="page-index" aria-label="On this page"><span class="mini-label">On this page</span><a href="#${signedIn?'work':'league'}">${signedIn?'Your work':'League games'}</a><a href="#record">Team record</a><a href="#${signedIn?'league':'sources'}">${signedIn?'League games':'Sources & tools'}</a>${signedIn?'<a href="#sources">Sources & tools</a>':''}</nav><details class="more-nav"><summary>More on GOAT</summary><p>These links leave the prototype.</p><nav aria-label="Existing GOAT destinations">${navRoutes.map(h=>exit(h,labelFor(h))).join('')}</nav></details><div class="index-account">${exit(signedIn?'/team':'/login',signedIn?'Open real My Team':'Sign in on GOAT')}</div><p class="index-source">Fixed demo sample<br>${sourceTime}<br><a href="#sources">Read the source notes</a></p></aside>`;
const guestIntro = `<section id="work" class="guest-intro"><h2>A league worth knowing.</h2><p>Browse the current synthetic fixtures, then get to know the franchises behind them. Sign in on the existing GOAT site for your actual team.</p><dl class="league-structure"><div><dt>Teams</dt><dd class="num">${f.league.teams}</dd></div><div><dt>Playoff places</dt><dd class="num">${f.league.playoffTeams}</dd></div><div><dt>Playoffs begin</dt><dd>Week <span class="num">${f.league.playoffWeekStart}</span></dd></div></dl>${exit('/login','Sign in on GOAT site')}</section>`;
const footer = `<footer class="footer"><div class="footer-intro"><img src="${f.assets.logoDark}" alt="GOAT Hoopers" width="184" height="44"><p>2026 season companion.<br>Synthetic current data. Qualified league memory.</p><a href="#top">Back to top</a></div><div class="footer-links"><p>Continue on GOAT — leaves this prototype</p><div class="footer-groups">${footerGroups.map(([title,links])=>`<nav aria-label="${e(title)}"><h2>${e(title)}</h2>${links.map(h=>`<a href="https://goathoopers.com${h}">${e(labelFor(h))}</a>`).join('')}</nav>`).join('')}</div></div></footer>`;

document.querySelector('#app').innerHTML = `${header}<div class="site-shell">${sidebar}<main id="main" tabindex="-1"><div class="page-title"><div><p class="breadcrumb">GOAT Hoopers / Home</p><h1>${signedIn?e(member.team.name):'Your league companion.'}</h1></div><p class="page-owner">${signedIn?`${e(member.team.manager)}<span>Demo member view</span>`:'Public league view<span>No private team selected</span>'}</p></div>${signedIn?`${gameRibbon()}${modelNote()}${memberWork()}${recordEntry()}${league()}`:`${guestIntro}${league(true)}${guestRecords()}`}${sourceSection()}</main></div>${footer}`;

document.querySelector('#demo-persona').addEventListener('change',event=>{
 const next = new URL(location.href); next.searchParams.set('persona',event.target.value); next.hash=''; location.assign(next);
});

const dialog = document.querySelector('#inspection');
const dialogBody = document.querySelector('#inspection-body');
let returnFocus = null;
const allPlayers = () => signedIn ? member.players : [];
function teamDetails(id) {
 const t = team(id); if(!t) return unavailableDetails();
 const pair = f.matchups.find(p=>p.home===id || p.away===id);
 const opponent = team(pair.home===id?pair.away:pair.home);
 const isOwn = signedIn && id===member.teamId;
 return `<h2 id="inspection-title" tabindex="-1">${e(t.name)}</h2><p class="detail-kicker">Public franchise record · local demo</p><p>Current manager identity: <strong>${e(t.manager)}</strong>.</p><dl class="detail-facts"><div><dt>2026 demo record</dt><dd>${record(t)}</dd></div><div><dt>2026 position</dt><dd>${standing(id).rank} of 10</dd></div><div><dt>Season points for</dt><dd>${n(t.pointsFor)}</dd></div></dl><h3>Current Week 3 pairing</h3><p>Against ${e(opponent.name)}. Current score: <strong>${n(pair.home===id?pair.homePoints:pair.awayPoints)}${(pair.home===id?pair.homePoints:pair.awayPoints)!==null?' points':''}</strong>. Opponent: <strong>${n(pair.home===id?pair.awayPoints:pair.homePoints)}${(pair.home===id?pair.awayPoints:pair.homePoints)!==null?' points':''}</strong>.</p><h3>${t.previousSeason.season} franchise record</h3><p>${prior(t)}</p>${t.previousSeason.ownerNote?'<p>This previous result is not attributed to the current manager.</p>':'<p>This previous-season record does not establish a current streak or a head-to-head history.</p>'}${isOwn?`<h3>Your supplied roster references</h3><p>${member.players.length} players; ${member.valuation.priced} current modeled quotes supplied. No lineup editing.</p><ul class="roster-names">${member.players.map(p=>`<li>${e(p.name)} <span>${e(p.position)}</span></li>`).join('')}</ul>`:''}${exit(`/teams/${id}`,'Open full public team profile')}`;
}
function playerDetails(id) {
 const p=allPlayers().find(x=>x.id===id); if(!p) return unavailableDetails();
 return `<h2 id="inspection-title" tabindex="-1">${e(p.name)}</h2><p class="detail-kicker">Owned-player receipt · synthetic sample</p><p>${e(p.position)} · ${e(member.team.name)}</p><div class="player-receipt"><span>Completed Week 2</span><strong class="num">${n(p.completedWeekPoints)}${p.completedWeekPoints!==null?' points':''}</strong><p>19–25 October 2026 (end boundary: 26 October, exclusive).</p></div><p>${p.participation==='verified_demo'?'A counted-game points receipt is included in this synthetic fixture.':'No completed-week participation receipt is included for this player. Missing evidence is not zero or poor form.'}</p><p>This is one of ${member.playerEvidence.verifiedPlayers} supplied player receipts in a ${member.playerEvidence.rosterPlayers}-player roster. No game-by-game statistics or complete-team recap is supplied.</p><h3>Separate current modeled quote</h3><p>${p.modeledFaab===null?'Unpriced':`${price(p.modeledFaab)} modeled FAAB`}. Quote calculation: 30 October, 08:10 UTC. A quote is not completed-week performance or cash.</p>${exit(`/player/${id}`,'Open full player profile')}`;
}
function quotesDetails() {
 if(!signedIn) return unavailableDetails();
 return `<h2 id="inspection-title" tabindex="-1">${e(member.team.name)} quotes</h2><p class="detail-kicker">Current modeled FAAB · synthetic</p><p><strong>${price(member.valuation.modeledFaabSubtotal)} FAAB ${member.valuation.complete?'total':'subtotal'}</strong>; ${member.valuation.priced}/${member.valuation.roster} players priced. ${member.valuation.complete?'Every supplied roster player has a quote.':'This is incomplete and cannot be compared as a complete team total.'}</p><p>No comparable league value rank or recorded team-value series is supplied. Quotes were calculated 30 October, 08:10 UTC.</p><div class="quote-filter"><label for="quote-search">Find a roster player</label><input id="quote-search" type="search" placeholder="Player name" autocomplete="off"><label class="unpriced-filter"><input type="checkbox" id="unpriced-only"> Show only unpriced players</label></div><p id="quote-result-count" role="status" aria-live="polite"></p><ul class="quote-roster" id="quote-roster">${member.players.map(p=>`<li data-player-name="${e(p.name.toLowerCase())}" data-unpriced="${p.modeledFaab===null}"><span>${e(p.name)}<small>${e(p.position)}</small></span><strong class="num">${p.modeledFaab===null?'Unpriced':`${price(p.modeledFaab)} <small>FAAB</small>`}</strong></li>`).join('')}</ul>`;
}
function matchupDetails() {
 if(!signedIn) return unavailableDetails();
 const pair = member.matchup;
 return `<h2 id="inspection-title" tabindex="-1">Your Week 3 matchup</h2><p class="detail-kicker">Fixed synthetic sample · ${sourceTime}</p><dl class="detail-facts"><div><dt>${e(team(pair.home).name)}</dt><dd>${n(pair.homePoints)}${pair.homePoints!==null?' points':''}</dd></div><div><dt>${e(team(pair.away).name)}</dt><dd>${n(pair.awayPoints)}${pair.awayPoints!==null?' points':''}</dd></div></dl><p>${pair.state==='partly_unavailable'?'papichooter has a recorded zero. NeuralNets has no score returned in this sample. No leader or deficit is inferred.':'These current points are in progress, not verified completed results.'}</p><h3>Saved model context</h3>${member.savedAi.status==='ready'?`<p>${e(member.savedAi.label)}.</p><ul>${member.savedAi.probabilities.map(row=>`<li>${e(team(row.teamId).name)}: <span class="num">${Math.round(row.probability*100)}%</span></li>`).join('')}</ul><p>Returned model choice: ${e(team(member.savedAi.returnedChoice).name)}. Confidence: <span class="num">${member.savedAi.confidence}</span>, a separate field from the probability split.</p><p>Saved 26 October 2026, 08:00 UTC. No model request occurs here.</p>`:'<p>No saved model estimate is supplied. No estimate or confidence is invented.</p>'}`;
}
function unavailableDetails() {return '<h2 id="inspection-title" tabindex="-1">Detail unavailable</h2><p>This item is not included in the current demo view. Close to return to the homepage.</p>';}
function filterQuotes(){
 const search=document.querySelector('#quote-search'); if(!search)return;
 const query=search.value.trim().toLowerCase(), only=document.querySelector('#unpriced-only').checked;
 let count=0; document.querySelectorAll('#quote-roster li').forEach(row=>{const show=row.dataset.playerName.includes(query)&&(!only||row.dataset.unpriced==='true'); row.hidden=!show;if(show)count++;});
 document.querySelector('#quote-result-count').textContent=`${count} of ${member.players.length} players shown`;
}
function syncInspection(){
 const match=location.hash.match(/^#inspect=(.+)$/);
 if(!match){if(dialog.open)dialog.close(); if(returnFocus?.isConnected){returnFocus.focus();returnFocus=null;}return;}
 let kind;try{kind=decodeURIComponent(match[1]);}catch{kind='unknown';}
 const [type,id]=kind.split(':');
 dialogBody.innerHTML=type==='team'?teamDetails(id):type==='player'?playerDetails(id):type==='quotes'?quotesDetails():type==='matchup'?matchupDetails():unavailableDetails();
 if(!dialog.open)dialog.showModal();
 document.querySelector('#inspection-title').focus();
 if(type==='quotes'){filterQuotes();document.querySelector('#quote-search')?.addEventListener('input',filterQuotes);document.querySelector('#unpriced-only')?.addEventListener('change',filterQuotes);}
}
function requestClose(){
 if(history.state?.study17Inspection){history.back();}else{history.replaceState(null,'',location.pathname+location.search);syncInspection();}
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-inspect]');
 if(trigger){returnFocus=trigger;history.pushState({study17Inspection:true},'',`${location.pathname}${location.search}#inspect=${encodeURIComponent(trigger.dataset.inspect)}`);syncInspection();}
 if(event.target.closest('[data-close-inspection]'))requestClose();
 const anchor=event.target.closest('a[href^="#"]');
 if(anchor){const target=document.getElementById(anchor.getAttribute('href').slice(1));if(target){target.setAttribute('tabindex','-1');requestAnimationFrame(()=>target.focus({preventScroll:true}));}}
});
dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
window.addEventListener('popstate',syncInspection);
window.addEventListener('hashchange',syncInspection);
syncInspection();
await document.fonts.ready;
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
document.documentElement.dataset.personalStudyReady='17';
