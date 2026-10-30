import { fixture as f } from '../fixture.js';

const app = document.querySelector('#app');
const announce = document.querySelector('#announcement');
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n = value => value == null ? 'Unavailable' : new Intl.NumberFormat('en-US', {maximumFractionDigits:2}).format(value);
const faab = value => value == null ? 'Unpriced' : new Intl.NumberFormat('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const record = team => `${team.wins}–${team.losses}`;
const team = id => f.teams.find(t => t.id === id);
const standing = id => f.standings.find(t => t.id === id);
const date = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
const time = iso => new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'});
const initials = name => name.split(/\s+/).map(s=>s[0]).slice(0,2).join('');
const known = value => typeof value === 'number' && Number.isFinite(value);
const signed = value => value > 0 ? `+${n(value)}` : n(value);
let state;
let renderVersion = 0;

function readState() {
  const q = new URLSearchParams(location.search);
  const persona = ['reaves','neural','guest'].includes(q.get('persona')) ? q.get('persona') : 'reaves';
  const member = f.personas[persona].kind === 'member';
  const p = f.personas[persona];
  const subjects = member ? p.players : f.teams;
  const defaults = persona === 'reaves' ? ['1511','1444'] : persona === 'neural' ? ['1380','1433'] : ['1','3'];
  let left = subjects.find(x=>x.id===q.get('left'))?.id ?? defaults[0];
  let right = subjects.find(x=>x.id===q.get('right'))?.id ?? defaults[1];
  if (left === right) right = subjects.find(x=>x.id!==left).id;
  let view = q.get('view') || 'home';
  if (!['home','player','players','samples','matchup','pairings','league','team'].includes(view)) view='home';
  if (!member && ['players','samples','player'].includes(view)) view='league';
  return {persona,member,p,subjects,left,right,view,id:q.get('id'),stage:q.get('stage')};
}
function url(view='home',values={}) {
  const q = new URLSearchParams();
  q.set('persona',state.persona);
  q.set('left',state.left);q.set('right',state.right);
  if (state.stage) q.set('stage',state.stage);
  if (view !== 'home') q.set('view',view);
  Object.entries(values).forEach(([k,v])=>v==null?q.delete(k):q.set(k,String(v)));
  return `${location.pathname}?${q}`;
}
function local(label,view='home',values={},classes='text-link',id='') {
  return `<a data-local href="${e(url(view,values))}" class="${classes}"${id?` id="${id}"`:''}>${label}</a>`;
}
function external(label,path,classes='text-link',id='') {
  return `<a href="https://goathoopers.com${e(path)}" class="external ${classes}"${id?` id="${id}"`:''}>${label}<small>On GOAT · leaves prototype</small></a>`;
}
function sourceDetails() {
  return `<details class="source-note" id="sources"><summary>About this synthetic sample</summary><p>${e(f.notice)} All current scores, standings, changes, prices and model outputs were constructed for this design demonstration. They are not reported league events. Snapshot: ${date(f.asOf)}, ${time(f.asOf)} UTC.</p><p>${e(f.provenance.identitiesAndPlayerReferences)} ${e(f.provenance.history)}</p><p>Completed Week 2 means October 19–25, 2026. Only the supplied players have counted-game sample points. A missing point is not zero, and these samples are not the entire team's score. FAAB is modeled waiver-currency value, not cash or an actual transaction. No comparable league value rank or recorded team-value series is supplied.</p><p>The labelled persona control changes only this local demo. Actual membership is resolved on the existing GOAT site. No account, market, AI, live API, storage or mutation service is connected here.</p></details>`;
}
function header() {
  const links = state.member ? [['Home','home'],['Players','players'],['Matchup','matchup'],['League','league']] : [['Home','home'],['Teams','league'],['Week 3','pairings']];
  const current = state.view === 'player'||state.view==='samples' ? 'players' : state.view==='team'?'league':state.view;
  return `<header class="masthead" id="top"><div class="wrap head-inner">${local(`<img src="${f.assets.logo}" alt="GOAT Hoopers" width="205" height="46">`,'home',{},'logo','brand-home')}<nav aria-label="Primary">${links.map(([label,v])=>`<a data-local href="${e(url(v))}"${v===current?' aria-current="page"':''}>${label}</a>`).join('')}${!state.member?'<a href="https://goathoopers.com/arcade">Arcade on GOAT</a>':''}</nav><a class="account-link" href="https://goathoopers.com/login" id="signin">Sign in on GOAT<span>Leaves prototype</span></a></div></header><div class="utility"><div class="wrap utility-inner"><div class="demo-label">Synthetic demo <a class="source-link" href="#sources" data-source>About this sample</a></div><div class="demo-control"><label for="persona">Demo persona</label><select id="persona"><option value="reaves"${state.persona==='reaves'?' selected':''}>Reaves Dropper</option><option value="neural"${state.persona==='neural'?' selected':''}>NeuralNets</option><option value="guest"${state.persona==='guest'?' selected':''}>Guest / public league</option></select></div></div></div>`;
}
function footer() {
  const groups = [
    ['This demo',[["Home",'home'],[state.member?'Your players':'All teams',state.member?'players':'league'],['Week 3 pairings','pairings'],['League','league']]],
    ['League life',[['News','/news'],['Teams','/teams'],['Transactions','/transactions'],['The Table','/table'],['History','/history'],['Weekly archive','/weekly']]],
    ['Manager tools',[['Stocks','/stocks'],['Intel','/intel'],['AI Decides','/ai-decides'],['Trade Analyzer','/trade-analyzer'],['Draft','/draft']]],
    ['Play & account',[['Arcade','/arcade'],['My Team','/team'],['Sign in','/login']]]
  ];
  return `<footer class="site-footer"><div class="wrap"><div class="footer-top"><img class="footer-logo" src="${f.assets.logoDark}" alt="GOAT Hoopers" width="190" height="44"><p>Know the people. Inspect the numbers.<br>A ten-team fantasy basketball league.</p></div><div class="footer-groups">${groups.map(([title,links],i)=>`<section><h2>${title}</h2><ul>${links.map(([label,v])=>`<li>${i===0?local(e(label),v,{},''): `<a href="https://goathoopers.com${v}">${label} <small>· on GOAT, leaves prototype</small></a>`}</li>`).join('')}</ul></section>`).join('')}</div>${sourceDetails()}<div class="footer-bottom"><span>2026 season · sample checked ${date(f.asOf)}, ${time(f.asOf)} UTC</span><a href="#top">Back to top</a></div></div></footer>`;
}
function matchupScore(m,id) {return id===m.home?m.homePoints:m.awayPoints;}
function contextBand() {
  if (!state.member) return `<section class="context" aria-label="Public league context"><div><p class="eyebrow">2026 season · Week 3</p><h2>Ten teams. Plenty to compare.</h2><p>Meet the people and follow this week's five pairings.</p></div><div class="week-context"><p>You're browsing the public league sample. Your actual team lives on GOAT.</p>${external('Sign in for your team','/login','text-link','guest-account')}</div></section>`;
  const {p} = state;
  const own = matchupScore(p.matchup,p.teamId), other=matchupScore(p.matchup,p.opponent.id);
  return `<section class="context" aria-label="Your team this week"><div><p class="eyebrow">Your team · 2026 Week 3</p><h2>${e(p.team.name)}</h2><p>${e(p.team.manager)} · <strong class="num">${record(p.team)}</strong> · Standing <strong class="num">${p.standing.rank} of 10</strong></p></div><div class="week-context"><p><strong>This week: ${e(p.opponent.name)}</strong> <span class="num">(${record(p.opponent)})</span></p><p class="small">Current sample score: <span class="score-inline">${own==null?'Score unavailable':n(own)}</span> / <span class="score-inline">${n(other)}</span>${own==null?'. No leader can be determined.':'. In progress in this demo.'}</p>${local('Open matchup','matchup',{},'text-link','open-matchup')}</div></section>`;
}
function options(selected,other) {
  return state.subjects.map(x=>`<option value="${x.id}"${x.id===selected?' selected':''}${x.id===other?' disabled':''}>${e(x.name)}</option>`).join('');
}
function identity(subject,side) {
  const member=state.member;
  const img = member&&subject.portrait?`<img src="${subject.portrait}" alt="" width="140" height="125">`:`<span class="initials${member?'':' team-initials'}" aria-hidden="true">${e(initials(subject.name))}</span>`;
  return `<div class="subject ${side}"><label for="${side}-select">${member?'Player':'Team'} ${side==='left'?'A':'B'}</label><select id="${side}-select" aria-label="${side==='left'?'Left':'Right'} ${member?'player':'team'}">${options(subject.id,side==='left'?state.right:state.left)}</select><div class="subject-identity">${img}<div><h2 id="${side}-name">${e(subject.name)}</h2><p>${member?e(subject.position):e(subject.manager)}</p>${local(`Inspect ${member?e(subject.name.split(' ')[0]):'team'}`,member?'player':'team',{id:subject.id},'text-link',`inspect-${side}`)}</div></div></div>`;
}
function valueCell(value,side,unit,label,unavailable=false) {
  const labelText={points:state.member?'Completed Week 2 sample':'Season points for',quote:'Modeled quote',record:'Current record',standing:'Standing',position:'Position'}[label];
  const subjectName=state.subjects.find(x=>x.id===state[side]).name;
  return `<div class="compare-value ${side}" role="group" aria-label="${e(subjectName)}: ${e(labelText)}"><span class="sr-only">${e(labelText)}: </span><strong class="${unavailable?'unavailable':''}" id="${side}-${label==='points'?'points':label==='quote'?'quote':label==='record'?'record':label==='standing'?'standing':'position'}">${e(value)}</strong>${unit?`<small>${e(unit)}</small>`:''}</div>`;
}
function comparison() {
  const left=state.subjects.find(x=>x.id===state.left),right=state.subjects.find(x=>x.id===state.right);
  let rows,notes;
  if(state.member) {
    rows = [
      [left.completedWeekPoints,right.completedWeekPoints,'Week 2 sample','points',v=>n(v),'pts'],
      [left.modeledFaab,right.modeledFaab,'Modeled quote','quote',v=>faab(v),'FAAB'],
      [left.position,right.position,'Position','position',v=>v,'']
    ];
    const pts=known(left.completedWeekPoints)&&known(right.completedWeekPoints)?`${signed(left.completedWeekPoints-right.completedWeekPoints)} sample points`:'sample-point difference unavailable';
    const quotes=known(left.modeledFaab)&&known(right.modeledFaab)?`${signed(Math.round((left.modeledFaab-right.modeledFaab)*100)/100)} FAAB`:'quote difference unavailable';
    notes=`<p><strong>Left minus right:</strong> <span id="differences">${pts} · ${quotes}</span>. A comparison of supplied facts, not a lineup recommendation.</p><details><summary>Period, quote basis & sample limits</summary><p>${e(state.p.playerEvidence.periodLabel)}: October 19–25, 2026. ${state.p.playerEvidence.verifiedPlayers} of ${state.p.playerEvidence.rosterPlayers} roster players have points in this sample. No points for the others are inferred. Modeled FAAB quotes checked ${date(state.p.valuation.checkedAt)}, ${time(state.p.valuation.checkedAt)} UTC; these are not cash balances or actual transactions. Missing quantities cannot produce a difference.</p></details>`;
  } else {
    rows=[
      [record(left),record(right),'Current record','record',v=>v,'W–L'],
      [standing(left.id).rank,standing(right.id).rank,'Standing','standing',v=>n(v),'of 10'],
      [left.pointsFor,right.pointsFor,'Points for','points',v=>n(v),'season pts']
    ];
    notes=`<p><strong>Current synthetic season:</strong> records, standings and points-for are separate facts. They are not a new combined rating.</p><p>All quantities are constructed for this demo · checked ${date(f.asOf)}, ${time(f.asOf)} UTC.</p>`;
  }
  return `<section class="comparison-section" aria-labelledby="comparison-title"><div class="section-intro"><div><p class="eyebrow">Side by side</p><h1 id="comparison-title">${state.member?'Compare your squad.':'Compare two league teams.'}</h1></div><p>${state.member?'Two players, the same questions. Put the sample points beside the modeled quote.':'See where the teams stand. Start here, then open a team or a Week 3 pairing.'}</p></div><div class="comparison" aria-label="${state.member?'Player':'Team'} comparison">${identity(left,'left')}<div class="swap-cell"><button id="swap" type="button">Swap sides</button></div>${identity(right,'right')}${rows.map(([a,b,title,label,fmt,unit])=>`${valueCell(fmt(a),'left',unit,label,a==null)}<div class="axis">${title}</div>${valueCell(fmt(b),'right',unit,label,b==null)}`).join('')}<div class="comparison-notes">${notes}</div></div></section>`;
}
function suggestions() {
  const pairs=state.persona==='reaves'?[['2133','2308','Anthony Edwards / Alperen Şengün','Inspect the current quotes. Week 2 sample points are unavailable.'],['1444','1830','Damian Lillard / Derrick White','Two of the five supplied completed-week samples.']]:state.persona==='neural'?[['2179','1350','LaMelo Ball / Rudy Gobert','Compare quotes; only Rudy has supplied Week 2 points.'],['1380','1350','Giannis Antetokounmpo / Rudy Gobert','Two of the three supplied completed-week samples.']]:[['7','8','papichooter / NeuralNets','Compare current league position before opening their pairing.'],['5','6','Josh Diddy’s Roster / Huff n’ Puff','Two current 1–1 teams in this synthetic season.']];
  return `<section class="suggestions" aria-labelledby="suggestion-title"><div class="section-intro"><h2 id="suggestion-title">Choose another comparison</h2>${local(state.member?'Browse all players':'Explore all 10 teams',state.member?'players':'league',{},'text-link','browse-players')}</div><div class="suggestion-list">${pairs.map(([a,b,title,body],i)=>local(`<div><strong>${e(title)}</strong><span>${e(body)}</span></div><span class="tag">Compare pair</span>`,'home',{left:a,right:b},'suggestion',`suggestion-${i+1}`)).join('')}</div><p class="small" style="margin:12px 0 0">Suggested subjects for inspection${state.member?', not a starting lineup':''}. Select any other pair above.</p></section>`;
}
function pairingsList(full=false) {
  return `<div class="pairings">${f.matchups.map(m=>`<article class="pairing"><h3>${e(team(m.home).name)} <span class="muted">vs</span> ${e(team(m.away).name)}</h3><p class="pairing-score num">${n(m.homePoints)} / ${m.awayPoints==null?'Score unavailable':n(m.awayPoints)}</p><p class="small">${m.homePoints==null||m.awayPoints==null?'One score is missing. No leader is inferred.':'Current synthetic score · not a final result'}</p>${local('Open pairing','matchup',{id:m.id},'text-link',`pair-${m.id}`)}</article>`).join('')}</div>`;
}
function weekSection() {
  if(!state.member) return `<section class="week-section"><div class="wrap"><div class="section-intro"><div><p class="eyebrow">2026 Week 3</p><h2>This week's pairings</h2></div>${local('Meet all ten teams','league',{},'text-link','meet-teams')}</div>${pairingsList()}</div></section>`;
  const {p}=state;
  const sampleLabel=`Read the ${p.playerEvidence.verifiedPlayers===5?'five':'three'}-player sample`;
  return `<section class="week-section"><div class="wrap week-grid"><div><p class="eyebrow">Your weekly context</p><h2>${state.persona==='reaves'?'A closer look at your players.':'Your squad, beyond one comparison.'}</h2><article class="note"><time datetime="2026-10-26">Week 2<br>Oct 19–25</time><div><h3>${p.playerEvidence.verifiedPlayers} supplied player samples</h3><p>${state.persona==='reaves'?'Damian Lillard, Joel Embiid, Tobias Harris, Myles Turner and Derrick White have counted-game points in this demo.':'Giannis Antetokounmpo, Kevin Durant and Rudy Gobert have counted-game points in this demo.'} Read them together without turning a small sample into a team total.</p>${local(sampleLabel,'samples',{},'text-link','read-samples')}</div></article><article class="note"><time datetime="${p.valuation.checkedAt}">${time(p.valuation.checkedAt)}<br>UTC</time><div><h3>${state.persona==='reaves'?'All 24 roster quotes are supplied.':'Explore your 22-player squad.'}</h3><p>${p.valuation.complete?`Modeled roster value ${faab(p.valuation.modeledFaabSubtotal)} FAAB · ${p.valuation.priced}/${p.valuation.roster} quoted.`:`Modeled subtotal ${faab(p.valuation.modeledFaabSubtotal)} FAAB · ${p.valuation.priced}/${p.valuation.roster} quoted. Six players remain unpriced.`} No league value rank is available.</p>${local('Open your roster','players',{},'text-link','open-roster')}</div></article></div><aside class="opponent" aria-labelledby="opponent-title"><p class="eyebrow">Your Week 3 opponent</p><h3 id="opponent-title">${e(p.opponent.name)}</h3><p>Managed by ${e(p.opponent.manager)}. Get to know the team across the matchup.</p><dl><div><dt>Current record</dt><dd class="num">${record(p.opponent)}</dd></div><div><dt>Standing</dt><dd class="num">${standing(p.opponent.id).rank} of 10</dd></div><div><dt>Season points for</dt><dd class="num">${n(p.opponent.pointsFor)}</dd></div></dl><div class="actions">${local(`Meet ${e(p.opponent.name)}`,'team',{id:p.opponent.id},'button quiet','meet-opponent')}${local('Matchup details','matchup',{},'text-link','matchup-details')}</div><p class="small" style="margin-top:18px">${state.persona==='neural'?'Your current score is unavailable. papichooter has a recorded sample zero; no leader is determined.':'Your 184.5 / 171 sample score remains in progress. The saved preview is separate from that score.'}</p></aside></div></section>`;
}
function discovery() {
  return `<div class="wrap"><section class="league-discovery"><div><p class="eyebrow">There are ten sides to this league</p><h2>${state.member?'Look beyond your matchup.':'Get to know the league.'}</h2><p>${state.member?`Your team is ${state.p.standing.rank} of 10 in this synthetic table. Browse the other teams, their records and the five Week 3 pairings.`:'Team identities, current records and qualified 2025 history are all open to explore.'}</p></div><div class="actions">${local('Explore the league','league',{},'button quiet','explore-league')}${local('All five pairings','pairings',{},'text-link','all-pairings')}</div></section><section class="onward" aria-label="Continue on GOAT"><div><p class="eyebrow">Take your next step</p><h2>Keep the context. Go deeper.</h2><p>The full GOAT site has the market and manager tools. These links leave this local design demo.</p><div class="tool-links">${external('Stocks','/stocks')}${external('Trade Analyzer','/trade-analyzer')}${external('Intel','/intel')}</div></div><div class="arcade"><img src="${f.assets.game}" alt="Preview of GOAT's free-throw basketball game" width="190" height="119"><div><h2>A few shots between decisions.</h2><p>Free-throw practice is on the existing GOAT site.</p>${external('Open Arcade','/arcade')}</div></div></section></div>`;
}
function home() {return `<main id="main" tabindex="-1"><div class="wrap">${contextBand()}${comparison()}${suggestions()}</div>${weekSection()}${discovery()}</main>`;}
function historyBlock(t) {
  const h=t.previousSeason;
  return `<details class="historical"><summary>2025 historical context${h.ownerNote?' · under previous manager':''}</summary><p><strong>${record(h)} · finished ${h.finish} of 10 in ${h.season}.</strong> ${e(h.ownerNote||'Retained project historical reference; separate from the current synthetic 2026 season.')}</p></details>`;
}
function detailShell(title,body,lead='',kicker='Local inspection') {
  return `<main id="main" tabindex="-1" class="wrap detail-page">${local(history.state?.depth>0?'Back to previous view':'Back to comparison','home',{},'back','back-to-comparison')}<p class="eyebrow">${kicker}</p><h1 tabindex="-1" id="view-title">${e(title)}</h1>${lead?`<p class="detail-lead">${lead}</p>`:''}${body}</main>`;
}
function playerDetail() {
  const player=state.p.players.find(x=>x.id===state.id);
  if(!player) return detailShell('Player not in this sample',`<div class="detail-surface"><p>Choose a player from the supplied ${e(state.p.team.name)} roster.</p>${local('Open roster','players',{},'button')}</div>`);
  return detailShell(player.name,`<section class="detail-surface"><div class="player-heading"><div><p class="eyebrow">${e(state.p.team.name)} · ${e(player.position)}</p><dl class="player-facts"><div><dt>Completed Week 2 sample</dt><dd>${player.completedWeekPoints==null?'Unavailable':`${n(player.completedWeekPoints)} points`}</dd></div><div><dt>Current modeled quote</dt><dd>${player.modeledFaab==null?'Unpriced':`${faab(player.modeledFaab)} FAAB`}</dd></div></dl></div>${player.portrait?`<img src="${player.portrait}" alt="" width="200" height="160">`:''}</div><p>${player.completedWeekPoints==null?'No completed-week point sample is supplied for this player. This is not a zero, a DNP or an availability judgment.':`The supplied counted-game sample is ${n(player.completedWeekPoints)} points for synthetic completed Week 2, October 19–25, 2026. Participation is explicitly marked verified in the design fixture; it is not a live verification.`}</p><p>${player.modeledFaab==null?'No modeled quote is supplied. It is not priced at zero.':`Modeled waiver-currency quote checked ${date(state.p.valuation.checkedAt)}, ${time(state.p.valuation.checkedAt)} UTC. This is not a cash balance or actual trade price.`}</p><p class="small">Player ID ${e(player.id)} · ${state.p.playerEvidence.verifiedPlayers}/${state.p.playerEvidence.rosterPlayers} roster players have points in this sample. No history, injury designation or new ranking is inferred.</p><div class="actions">${local('Read the player sample','samples',{},'button')}${local('Browse your roster','players',{},'text-link')}${external('Player on GOAT',`/player/${player.id}`)}</div></section>`,`${e(state.p.team.name)} player · ${e(player.position)}`,'Your supplied player');
}
function samplesDetail() {
  const p=state.p,rows=p.players.filter(x=>x.completedWeekPoints!=null);
  return detailShell('The completed Week 2 sample',`<section class="detail-surface"><h2>${rows.length} players, one labelled period.</h2><p>October 19–25, 2026 · ${rows.length} of ${p.players.length} roster players. These individual counted-game samples are not your full team score, a lineup recommendation or a current injury/availability check.</p><table class="data-table" id="sample-table"><caption>${e(p.team.name)} · synthetic completed Week 2</caption><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col" class="numeric">Sample points</th><th scope="col">Inspect</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${e(x.name)}</strong></td><td>${e(x.position)}</td><td class="numeric">${n(x.completedWeekPoints)}</td><td>${local('Player detail','player',{id:x.id},'text-link',`sample-${x.id}`)}</td></tr>`).join('')}</tbody></table><p class="small" style="margin-top:22px">Other players have no point sample supplied. No zero or DNP is inferred. Current modeled quotes are a different quantity and do not explain these points.</p></section>`,`${e(p.team.name)} · points supplied for ${rows.length} roster players.`,'Sample evidence');
}
function rosterDetail() {
  const p=state.p;
  return detailShell(`${p.team.name}: your players`,`<section class="detail-surface"><h2>${p.players.length} supplied roster references</h2><p>${p.valuation.complete?'Modeled roster value':'Modeled subtotal'} <strong>${faab(p.valuation.modeledFaabSubtotal)} FAAB</strong> · ${p.valuation.priced}/${p.valuation.roster} quoted. ${p.valuation.complete?'All supplied roster quotes are present.':'Partial coverage; this is not a complete team total.'} No league value rank is available.</p><table class="data-table" id="roster-table"><caption>Current synthetic quote, checked ${date(p.valuation.checkedAt)}, ${time(p.valuation.checkedAt)} UTC · membership order</caption><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col" class="numeric">Modeled FAAB</th><th scope="col">Inspect</th></tr></thead><tbody>${p.players.map(x=>`<tr data-player-id="${x.id}"><td><strong>${e(x.name)}</strong></td><td>${e(x.position)}</td><td class="numeric">${faab(x.modeledFaab)}</td><td>${local('Player detail','player',{id:x.id},'text-link',`roster-${x.id}`)}</td></tr>`).join('')}</tbody></table><p class="small" style="margin-top:22px">${e(p.valuation.rankUnavailableReason)} ${e(p.history.reason)}</p></section>`,`${p.players.length} players · inspect a quote or a completed-week sample. No roster edits occur here.`,'Your squad');
}
function matchupDetail() {
  const m=f.matchups.find(x=>x.id===state.id) || (state.member?state.p.matchup:f.matchups[0]);
  const a=team(m.home),b=team(m.away);
  const saved=m.id==='m1'?f.personas.reaves.savedAi:null;
  return detailShell(`${a.name} vs ${b.name}`,`<section class="detail-surface"><div class="detail-score">${[[a,m.homePoints],[b,m.awayPoints]].map(([t,pts])=>`<div><h2>${e(t.name)}</h2><p>${e(t.manager)} · record <b>${record(t)}</b> · standing ${standing(t.id).rank} of 10</p><strong class="num${pts==null?' unavailable':''}" data-score-team="${t.id}">${pts==null?'Score unavailable':n(pts)}</strong>${local('Meet the team','team',{id:t.id},'text-link',`match-team-${t.id}`)}</div>`).join('')}</div><div class="result-note"><p>${known(m.homePoints)&&known(m.awayPoints)?`Current sample difference: ${n(Math.abs(m.homePoints-m.awayPoints))} points. These scores are in progress in the synthetic scenario, not a final result.`:'One score has not been supplied. A recorded zero stays zero; the missing value does not establish a tie or a leader.'}</p><p class="small">Synthetic 2026 Week 3 · checked ${date(f.asOf)}, ${time(f.asOf)} UTC. This page does not refresh a provider.</p></div></section><section class="detail-surface" id="saved-estimate"><h2>${saved?'The saved model preview':'Saved model preview unavailable'}</h2>${saved?`<p>${e(saved.label)}. The estimate is separate from the current score and from its confidence.</p><div class="saved-grid">${saved.probabilities.map(x=>`<p>${e(team(x.teamId).name)}<strong>${n(x.probability*100)}%</strong></p>`).join('')}</div><p><strong>Returned choice:</strong> ${e(team(saved.returnedChoice).name)}. <strong>Confidence:</strong> ${n(saved.confidence)} (separate model field).</p><p class="small">Saved ${date(saved.generatedAt)}, ${time(saved.generatedAt)} UTC. This synthetic fixture supplies no further model/prompt/input revision metadata. No new estimate is generated.</p>`:'<p>No saved estimate is supplied for this pairing. No probabilities, model choice or confidence are inferred, and no generation is connected.</p>'}</section>`, 'Current pairing · synthetic 2026 Week 3','Matchup detail');
}
function leagueDetail() {
  return detailShell('Meet all ten teams',`<section class="detail-surface"><h2>The current synthetic table</h2><p>Supplied 2026 standings, separate from historical 2025 results. No playoff odds or projected movement is inferred.</p><table class="data-table" id="league-table"><caption>2026 Week 3 · synthetic standings</caption><thead><tr><th scope="col">Place</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col" class="numeric">Points for</th></tr></thead><tbody>${f.standings.map(t=>`<tr${state.member&&t.id===state.p.teamId?' class="current-team"':''}><td class="num">${t.rank}</td><td>${local(e(t.name),'team',{id:t.id},'text-link',`team-${t.id}`)}<small>${e(t.manager)}${state.member&&t.id===state.p.teamId?' · your demo team':''}</small></td><td class="num">${record(t)}</td><td class="numeric">${n(t.pointsFor)}</td></tr>`).join('')}</tbody></table><div class="actions">${local('All five pairings','pairings',{},'button')}${external('The Table','/table')}</div></section>`, 'Ten identities, their current records and one shared season.','League discovery');
}
function teamDetail() {
  const t=team(state.id)||team(state.member?state.p.teamId:'1'),s=standing(t.id);
  const own=state.member&&state.p.teamId===t.id;
  return detailShell(t.name,`<section class="detail-surface"><p class="eyebrow">Managed by ${e(t.manager)}</p><dl class="player-facts"><div><dt>Current synthetic 2026 record</dt><dd>${record(t)}</dd></div><div><dt>Current standing</dt><dd>${s.rank} of 10</dd></div><div><dt>Season points for</dt><dd>${n(t.pointsFor)}</dd></div></dl><p>${own?'This is your selected demo team. Its supplied roster is available for local inspection.':'This public profile carries team facts. An opponent roster is not supplied in this view; no player assignments are invented.'}</p><div class="actions">${own?local('Open your roster','players',{},'button'):''}${local('View the league','league',{},'text-link')}${external('Public team profile',`/teams/${t.id}`)}</div>${historyBlock(t)}</section>`, 'Current team identity, current season facts and separately qualified history.','Public team profile');
}
function pairingsDetail() {return detailShell('Week 3, around the league',`<section class="detail-surface">${pairingsList(true)}</section>`,'All five current synthetic pairings. Open one for its actual known score state.','Public matchups');}
function content() {
  switch(state.view) {
    case 'player':return playerDetail();case 'players':return rosterDetail();case 'samples':return samplesDetail();case 'matchup':return matchupDetail();case 'league':return leagueDetail();case 'team':return teamDetail();case 'pairings':return pairingsDetail();default:return home();
  }
}
async function ready(version) {
  await document.fonts.ready;
  await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
  if(version === renderVersion) document.documentElement.dataset.personalStudyReady='04';
}
function render() {
  const version=++renderVersion;
  delete document.documentElement.dataset.personalStudyReady;
  state=readState();
  document.documentElement.dataset.persona=state.persona;
  document.documentElement.dataset.stage=state.stage||'color';
  document.title=`GOAT Hoopers — ${state.view==='home'?(state.member?'Compare your squad':'Compare the league'):'Local '+state.view}`;
  app.innerHTML=header()+content()+footer();
  ready(version);
}
function saveDeparture() {
  history.replaceState({...history.state,y:scrollY,focus:document.activeElement?.id||null},'',location.href);
}
function navigate(href,{focus=null,preserve=false}={}) {
  const oldY=scrollY;
  saveDeparture();
  history.pushState({study04:true,depth:(history.state?.depth||0)+1,y:preserve?oldY:0,focus},'',href);
  render();
  requestAnimationFrame(()=>{
    scrollTo(0,preserve?oldY:0);
    const target=focus?document.getElementById(focus):document.getElementById('view-title');
    target?.focus({preventScroll:true});
  });
}
document.addEventListener('click',event=>{
  const source=event.target.closest('[data-source]');
  if(source){event.preventDefault();const details=document.getElementById('sources');details.open=true;details.scrollIntoView();details.querySelector('summary').focus({preventScroll:true});return;}
  const swap=event.target.closest('#swap');
  if(swap){navigate(url('home',{left:state.right,right:state.left}),{focus:'swap',preserve:true});announce.textContent='Comparison sides swapped.';return;}
  const link=event.target.closest('a[data-local]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(link.id==='back-to-comparison'&&history.state?.depth>0){history.back();return;}
  const target=new URL(link.href);
  const targetView=target.searchParams.get('view')||'home';
  const isComparison=state.view==='home'&&targetView==='home'&&link.classList.contains('suggestion');
  navigate(link.href,{preserve:isComparison,focus:isComparison?'left-select':null});
});
document.addEventListener('change',event=>{
  if(event.target.id==='persona') {
    const q=new URLSearchParams({persona:event.target.value});if(state.stage)q.set('stage',state.stage);
    navigate(`${location.pathname}?${q}`,{focus:'persona'});return;
  }
  if(['left-select','right-select'].includes(event.target.id)){
    const side=event.target.id==='left-select'?'left':'right';
    navigate(url('home',{[side]:event.target.value}),{focus:event.target.id,preserve:true});
    announce.textContent=`Comparing ${state.subjects.find(x=>x.id===state.left).name} and ${state.subjects.find(x=>x.id===state.right).name}.`;
  }
});
addEventListener('popstate',()=>{
  render();requestAnimationFrame(()=>{scrollTo(0,history.state?.y||0);if(history.state?.focus)document.getElementById(history.state.focus)?.focus({preventScroll:true});});
});
history.scrollRestoration='manual';
history.replaceState({study04:true,depth:0,y:0,...history.state},'',location.href);
render();
