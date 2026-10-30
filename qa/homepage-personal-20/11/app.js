import { fixture as f } from '../fixture.js';

const params = new URLSearchParams(location.search);
const persona = ['reaves','neural','guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const member = persona === 'guest' ? null : f.personas[persona];
document.documentElement.dataset.persona = persona;
if (params.get('stage') === 'structure') document.documentElement.dataset.stage = 'structure';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, fixed = false) => n === null || n === undefined ? 'Unavailable' : new Intl.NumberFormat('en-US',{minimumFractionDigits:fixed?2:0,maximumFractionDigits:2}).format(n);
const team = id => f.teams.find(t => t.id === id);
const record = t => `${t.wins}–${t.losses}`;
const currentSite = (path,label,cls='site-link') => `<a class="${cls}" href="https://goathoopers.com${path}">${esc(label)} <span class="exit">· Current site</span></a>`;
const portrait = p => p.portrait ? `<img class="portrait" src="${esc(p.portrait)}" alt="" width="50" height="56" loading="lazy">` : `<span class="initials" aria-hidden="true">${esc(p.name.split(' ').map(s=>s[0]).slice(0,2).join(''))}</span>`;
const datePeriod = 'October 19–25, 2026';
const scoreText = value => value === null ? '<span class="missing-score">Unavailable</span>' : `<span class="num">${fmt(value)}</span>`;
const scoreRows = m => `<div class="score-team"><span class="team-name">${esc(team(m.home).name)}</span><span class="score num ${m.homePoints===null?'unknown':''}">${fmt(m.homePoints)}</span></div><div class="score-team"><span class="team-name">${esc(team(m.away).name)}</span><span class="score num ${m.awayPoints===null?'unknown':''}">${fmt(m.awayPoints)}</span></div>`;

function centralGame(){
  if(!member) return `<section class="game-center guest-center" aria-labelledby="center-title"><p class="eyebrow">The 2026 league</p><h2 id="center-title">Ten clubs. Your way into GOAT.</h2><div class="league-numbers"><div><strong class="num">10</strong><span>Teams</span></div><div><strong class="num">6</strong><span>Playoff places</span></div></div><p>Meet the teams around the league, then check all five Week 3 games below.</p><a class="action light" href="#games">Check the league games</a></section>`;
  const m=member.matchup;
  const caption = m.homePoints!==null && m.awayPoints!==null ? `Reaves Dropper is ahead by ${fmt(m.homePoints-m.awayPoints)} points in this sample. The game is in progress.` : 'NeuralNets has no returned score. papichooter’s recorded zero does not establish a leader.';
  return `<section class="game-center" aria-labelledby="center-title"><h2 id="center-title">Your Week 3 · Current demo score</h2>${scoreRows(m)}<p class="game-caption">${caption}</p><button class="action light" data-inspect="matchup" data-id="${m.id}" id="primary-matchup">Inspect your matchup</button></section>`;
}

function circuit(){
  return `<section class="circuit-zone" aria-labelledby="home-title"><div class="wrap"><div class="home-title"><div><p class="eyebrow">${member?'Your place in the league':'Find your place in the league'}</p><h1 id="home-title" tabindex="-1">${member?esc(member.team.name):'GOAT Hoopers'}</h1></div><div class="week-label">Week 3</div></div><div class="circuit">${centralGame()}<ol class="circuit-list" aria-label="League order after two completed demo weeks">${f.standings.map(t=>`<li class="club-node ${member?.teamId===t.id?'is-you':''} ${member?.opponent.id===t.id?'is-opponent':''}" data-rank="${t.rank}"><span class="rank num" aria-label="Rank ${t.rank}">${t.rank}</span><div><button class="club-name" data-inspect="team" data-id="${t.id}" aria-label="Inspect ${esc(t.name)}">${esc(t.name)}</button><p class="club-meta"><span class="num">${record(t)}</span> record · <span class="num">${fmt(t.pointsFor)}</span> PF</p>${member?.teamId===t.id?'<p class="club-label">Your team</p>':member?.opponent.id===t.id?'<p class="club-label">Your opponent</p>':''}</div></li>`).join('')}</ol></div><p class="circuit-caption">Ranks follow the supplied synthetic standings; PF means points for across completed weeks. The circuit shows league order, not a measured distance between teams. Select any club for its season context.</p></div></section>`;
}

function evidenceRows(){
  return `<ul class="evidence-list" aria-label="Completed Week 2 player evidence">${member.players.filter(p=>p.participation==='verified_demo' && p.completedWeekPoints!==null).sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints).map(p=>`<li class="evidence-row">${portrait(p)}<div><button class="player-name" data-inspect="player" data-id="${p.id}" aria-label="Inspect ${esc(p.name)} player evidence">${esc(p.name)}</button><p class="player-detail">${esc(p.position)} · Counted evidence in this demo</p></div><div class="points num">${fmt(p.completedWeekPoints)}<small>Week 2 pts</small></div></li>`).join('')}</ul>`;
}

function allQuotes(){
  return `<details class="all-quotes" id="all-quotes"><summary>Inspect all ${member.players.length} roster quotes</summary><p class="period-note">Modeled FAAB quote, checked October 30 at 08:10 UTC. Unpriced means no quote is supplied; it does not mean zero.</p><ul class="quote-list">${member.players.map(p=>`<li><button data-inspect="player" data-id="${p.id}">${esc(p.name)}</button><span class="${p.modeledFaab===null?'unpriced':'num'}">${p.modeledFaab===null?'Unpriced':fmt(p.modeledFaab,true)}</span></li>`).join('')}</ul></details>`;
}

function quoteLeaders(){
  return `<ul class="quote-leaders" aria-label="Highest supplied modeled quotes">${member.players.filter(p=>p.modeledFaab!==null).sort((a,b)=>b.modeledFaab-a.modeledFaab).slice(0,3).map(p=>`<li><button data-inspect="player" data-id="${p.id}">${esc(p.name)}</button><span class="num">${fmt(p.modeledFaab,true)}</span></li>`).join('')}</ul>`;
}

function sampleUpdates(){
  return `<div class="sample-updates" aria-label="Latest updates in this sample">${member.changes.map(c=>`<article><time datetime="${c.at}">OCT 30 · ${c.at.slice(11,16)} UTC</time><h3>${esc(c.headline)}</h3><p>${esc(c.body)}</p><a class="control" href="${c.target==='matchup'?'#games':c.target==='valuation'?'#all-quotes':'#evidence'}">${c.target==='matchup'?'Check the games':c.target==='valuation'?'Inspect the roster quotes':'See the counted performances'}</a></article>`).join('')}</div>`;
}

function memberRoster(){
  if(!member) return '';
  const ev=member.playerEvidence;
  const coverage=`${ev.verifiedPlayers} of ${ev.rosterPlayers} roster players have supplied completed-week evidence. The rest are unavailable, not poor performances.`;
  const period=`Synthetic completed Week 2 · ${datePeriod}. These points belong to the completed period, not the current matchup.`;
  if(persona==='reaves') return `<section class="roster-zone" id="players" aria-labelledby="roster-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">On your roster</p><h2 id="roster-title">Last week, five counted performances.</h2><p class="period-note">${period}</p></div><p>${coverage}</p></div><div class="roster-layout"><div id="evidence">${evidenceRows()}</div><aside class="roster-note" aria-labelledby="quote-title"><p class="eyebrow">The modeled roster quote</p><h3 id="quote-title" class="value-number num">${fmt(member.valuation.modeledFaabSubtotal,true)}</h3><p class="value-label">Modeled FAAB · All 24 players priced</p>${quoteLeaders()}<p>These are the three highest supplied quotes. Modeled value is not your cash balance; no comparable league value rank is available.</p>${currentSite('/stocks','Open Stocks')}</aside></div>${allQuotes()}${sampleUpdates()}</div></section>`;
  const missing=member.players.filter(p=>p.modeledFaab===null);
  return `<section class="roster-zone" id="players" aria-labelledby="roster-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">On your roster</p><h2 id="roster-title">A roster with more still to show.</h2></div><p>Known quotes and counted performances give you a useful look at NeuralNets. Six player prices are still outside this sample.</p></div><div class="coverage-layout"><div class="coverage-main"><h3>16 of 22 players priced</h3><p class="value-number num">${fmt(member.valuation.modeledFaabSubtotal,true)}</p><p class="value-label">Modeled FAAB subtotal · Partial coverage</p><p class="period-note">This is not a complete team value or a cash balance. No league value rank is available.</p>${currentSite('/stocks','Open Stocks')}</div><div class="missing-names"><h3>The six unpriced players</h3><ul>${missing.map(p=>`<li><button class="player-name" data-inspect="player" data-id="${p.id}">${esc(p.name)}</button></li>`).join('')}</ul><p>No quote is supplied for these players. Their values are not zero.</p></div></div><div class="neural-evidence" id="evidence"><h3>Three counted performances from Week 2</h3><p class="period-note">${period} ${coverage}</p>${evidenceRows()}</div>${allQuotes()}${sampleUpdates()}</div></section>`;
}

function games(){
 return `<section class="games-zone" id="games" aria-labelledby="games-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Around GOAT</p><h2 id="games-title">Five games. One league.</h2></div><p>Week 3 current demo scores. Games with two known values are in progress. An unavailable value does not mean zero.</p></div><ul class="games-list">${f.matchups.map(m=>`<li class="game-row" data-matchup="${m.id}"><div>${member && [m.home,m.away].includes(member.teamId)?'<p class="your-game">Your matchup</p>':''}<div class="game-pair"><div class="game-team"><span>${esc(team(m.home).name)}</span>${scoreText(m.homePoints)}</div><div class="game-team"><span>${esc(team(m.away).name)}</span>${scoreText(m.awayPoints)}</div></div></div><button data-inspect="matchup" data-id="${m.id}" aria-label="Inspect ${esc(team(m.home).name)} versus ${esc(team(m.away).name)}">Inspect game</button></li>`).join('')}</ul></div></section>`;
}

function leagueContext(){
 const clubs=member?[member.team,member.opponent]:[team('1'),team('8')];
 const final=f.historicalFinal;
 return `<section class="wrap league-context" aria-labelledby="league-context-title"><div><p class="eyebrow">A ten-team season</p><h2 id="league-context-title">The league keeps its own history.</h2><p>${f.league.teams} teams are playing the ${f.league.season} season. ${f.league.playoffTeams} playoff places are available, with playoffs starting in Week ${f.league.playoffWeekStart}. Current demo records above cover two completed weeks.</p><p class="period-note">Previous seasons are context, not current results. A previous manager's record is always identified alongside the team history.</p>${currentSite('/history','Browse league History')}</div><div class="history-lines">${clubs.map(t=>`<p><strong>${esc(t.name)}, ${t.previousSeason.season}</strong><br><span class="num">${record(t.previousSeason)}</span> regular-season record · Finish ${t.previousSeason.finish}.${t.previousSeason.ownerNote?` ${esc(t.previousSeason.ownerNote)}`:''}</p>`).join('')}<p><strong>The recorded ${final.season} final</strong><br>${esc(team(final.winner).name)} <span class="num">${fmt(final.winnerPoints)}</span>, ${esc(team(final.runnerUp).name)} <span class="num">${fmt(final.runnerUpPoints)}</span>.</p></div></section>`;
}

function explore(){
 const groups=[{title:'Follow the league',paths:['/','/news','/teams','/table','/transactions','/weekly','/history']},{title:'Make a decision',paths:['/stocks','/intel','/ai-decides','/trade-analyzer','/draft','/team','/login']}];
 return `<section class="explore-zone" id="explore" aria-labelledby="explore-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Keep going</p><h2 id="explore-title">There is more to GOAT.</h2></div><p>Continue on the current GOAT site. Every link in this section leaves the synthetic prototype.</p></div><div class="explore-layout">${groups.map(g=>`<nav class="route-group" aria-label="${g.title}"><h3>${g.title}</h3><ul>${g.paths.map(path=>`<li>${currentSite(path,f.destinations.find(d=>d.href===path).label,'')}</li>`).join('')}</ul></nav>`).join('')}<div class="arcade-link"><img src="${esc(f.assets.game)}" alt="GOAT's existing free-throw game preview" width="640" height="360" loading="eager"><div>${currentSite('/arcade','Take it to the Arcade','')}<p>Visit the existing game site for a free-throw session. This homepage does not start a game or claim rewards.</p></div></div></div></div></section>`;
}

document.querySelector('#app').innerHTML=`<header class="masthead"><div class="wrap"><a class="brand" href="#home" aria-label="GOAT Hoopers home"><img src="${esc(f.assets.logo)}" alt="GOAT Hoopers" width="1000" height="365"></a><nav class="main-nav" aria-label="Homepage navigation"><a href="#home" aria-current="page">Home</a>${member?'<a href="#players">Your roster</a>':''}<a href="#games">League games</a><a href="#explore">Explore GOAT</a></nav>${currentSite('/login','Sign in','account-link')}<div class="demo-tools"><div class="wrap"><div class="sample-note"><strong>Synthetic demo</strong><span>October 30, 2026 · 08:30 UTC</span><a href="#demo-sources">About the sample</a></div><div class="persona-field"><label for="persona">Demo persona</label><select id="persona"><option value="reaves" ${persona==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${persona==='guest'?'selected':''}>Guest</option></select></div></div></div></div></header><main id="home" tabindex="-1">${circuit()}${memberRoster()}${games()}${leagueContext()}${explore()}</main><footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="brand" href="#home" aria-label="GOAT Hoopers, back to top"><img src="${esc(f.assets.logo)}" alt="GOAT Hoopers" width="1000" height="365" loading="eager"></a><a href="#home">Back to top</a></div><details class="source-details" id="demo-sources"><summary>About this synthetic demo and its sources</summary><p>${esc(f.notice)} All current standings, scores, changes, prices and model outputs were constructed for design purposes. They are not reported league events. The fixed sample was checked October 30, 2026 at 08:30 UTC.</p><p>Team identities and player references come from the authorized project fixture, not a new production roster verification. Previous-season results and the 2025 final are historical project references. NeuralNets' 2025 result is explicitly the previous manager's record as QBs Gremlins.</p><p>Completed Week 2 evidence covers October 19–25, 2026 and only the players labelled in the sample. Unknown scores, absent player evidence and unpriced players are never converted to zero. Model probabilities and confidence are distinct. No recorded team-value history or Lineup Power snapshot is supplied, so no history line or power ranking is inferred.</p><p>The selector only changes a synthetic demonstration. Real membership is resolved server-side by the existing GOAT site. No live API, account, AI, market, storage or mutation calls occur here. Links labelled Current site leave this prototype.</p></details><p class="footer-note">Independent homepage study 11 · Desktop concept · Synthetic data, real league identity.</p></div></footer>`;

document.querySelector('#persona').addEventListener('change',event=>{
  const next=new URL(location.href);next.searchParams.set('persona',event.target.value);next.hash='';location.assign(next);
});
document.querySelectorAll('a[href="#all-quotes"],a[href="#demo-sources"]').forEach(link=>link.addEventListener('click',()=>{const target=document.querySelector(link.getAttribute('href'));if(target instanceof HTMLDetailsElement)target.open=true;}));
const dialog=document.querySelector('#inspector');
let lastTrigger=null, ownsInspectorEntry=false;
const entryHTML=(label,value,number=false)=>`<div><dt>${label}</dt><dd${number?' class="num"':''}>${value}</dd></div>`;

function matchupContent(m){
 const own=member && m.id===member.matchup.id;
 const ai=own?member.savedAi:null;
 const model=own && ai.status==='ready' ? `<section class="model-context" aria-labelledby="model-title"><h3 id="model-title">Saved synthetic model estimate</h3><ul>${ai.probabilities.map(p=>`<li><span>${esc(team(p.teamId).name)}</span><span class="num">${fmt(p.probability*100)}%</span></li>`).join('')}</ul><p>Returned choice: ${esc(team(ai.returnedChoice).name)}. Confidence: <span class="num">${fmt(ai.confidence)}</span> (separate from the probabilities).</p><p>Saved October 26, 2026 at 08:00 UTC. Synthetic saved model estimate; not calibrated odds. This is not updated by the current score.</p>${currentSite('/ai-decides','Visit AI Decides')}</section>` : own ? '<p class="no-model">No saved model estimate is supplied for this matchup. No probability is inferred.</p>' : '';
 return `<p class="eyebrow">Week 3 · Current demo score</p><h2 id="inspector-title">${esc(team(m.home).name)} vs ${esc(team(m.away).name)}</h2><div class="dialog-scores">${scoreRows(m)}</div><p>${m.homePoints===null||m.awayPoints===null?'A score is unavailable. papichooter’s recorded zero is a known value; NeuralNets’ missing score is not zero. No leader can be determined.':'Both scores are known in this synthetic in-progress sample. These are current scores, not a completed result.'}</p><p>Fixed sample: October 30, 2026, 08:30 UTC. All current quantities were constructed for this design demo.</p>${model}`;
}

function teamContent(t){
 const standing=f.standings.find(s=>s.id===t.id),m=f.matchups.find(m=>[m.home,m.away].includes(t.id)),op=team(m.home===t.id?m.away:m.home),previous=t.previousSeason;
 return `<p class="eyebrow">Public club context</p><h2 id="inspector-title">${esc(t.name)}</h2><p>Managed by ${esc(t.manager)}.</p><dl>${entryHTML('2026 demo standing',`${standing.rank} of 10`,true)}${entryHTML('Completed-week record',record(t),true)}${entryHTML('Completed-week points for',fmt(t.pointsFor),true)}${entryHTML('Current Week 3 opponent',esc(op.name))}</dl><p><strong>Current game</strong></p><div class="dialog-scores">${scoreRows(m)}</div><p><strong>${previous.season} context:</strong> ${record(previous)} regular-season record, finish ${previous.finish}. ${previous.ownerNote?esc(previous.ownerNote):''}</p><p>Current standings and scores are synthetic. Previous-season context is a project historical reference.</p>${currentSite(`/teams/${t.id}`,'Open public team profile')}`;
}

function playerContent(p){
 return `<p class="eyebrow">${esc(member.team.name)} · Player inspection</p><h2 id="inspector-title">${esc(p.name)}</h2><dl>${entryHTML('Position',esc(p.position))}${entryHTML('Modeled FAAB quote',p.modeledFaab===null?'Unpriced':fmt(p.modeledFaab,true),p.modeledFaab!==null)}${entryHTML('Completed Week 2 points',p.completedWeekPoints===null?'Unavailable':fmt(p.completedWeekPoints),p.completedWeekPoints!==null)}${entryHTML('Evidence period',datePeriod)}</dl><p>${p.completedWeekPoints!==null?'This player has counted-game evidence in the synthetic completed Week 2 sample.':'No completed-week evidence is supplied for this player. This is not a zero, DNP or poor-performance label.'}</p><p>${p.modeledFaab===null?'No modeled quote is supplied. Unpriced does not mean zero.':'The modeled quote was checked October 30, 2026 at 08:10 UTC. Modeled FAAB is not a cash balance.'}</p><p>Current scores, quotes and completed-week points describe different periods and measures. The demo supplies no per-game breakdown or recorded player-value history.</p>${currentSite(`/player/${p.id}`,'Open player profile')}`;
}

function inspectorFromHash(){
 const match=location.hash.match(/^#inspect=(team|matchup|player):([\w-]+)$/);
 return match ? {kind:match[1],id:match[2]} : null;
}
function syncInspector(){
 const state=inspectorFromHash();
 if(!state){if(dialog.open)dialog.close();return;}
 let content='';
 if(state.kind==='team'){const t=team(state.id);if(t)content=teamContent(t);}
 if(state.kind==='matchup'){const m=f.matchups.find(m=>m.id===state.id);if(m)content=matchupContent(m);}
 if(state.kind==='player'&&member){const p=member.players.find(p=>p.id===state.id);if(p)content=playerContent(p);}
 if(!content){if(dialog.open)dialog.close();return;}
 document.querySelector('#inspector-content').innerHTML=content;
 if(!dialog.open)dialog.showModal();
 document.querySelector('#close-inspector').focus();
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-inspect]');if(!trigger)return;
 lastTrigger=trigger;ownsInspectorEntry=true;
 history.pushState(null,'',`#inspect=${trigger.dataset.inspect}:${trigger.dataset.id}`);syncInspector();
});
function closeInspector(){
 if(ownsInspectorEntry&&inspectorFromHash()){history.back();}
 else{history.replaceState(null,'',location.pathname+location.search);if(dialog.open)dialog.close();}
 ownsInspectorEntry=false;
}
document.querySelector('#close-inspector').addEventListener('click',closeInspector);
dialog.addEventListener('cancel',event=>{event.preventDefault();closeInspector();});
dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
dialog.addEventListener('close',()=>{if(lastTrigger?.isConnected)lastTrigger.focus();else document.querySelector('#home-title').focus();});
window.addEventListener('popstate',syncInspector);
window.addEventListener('hashchange',syncInspector);
syncInspector();
await document.fonts.ready;
await Promise.all([...document.images].filter(img => img.loading !== 'lazy').map(img => img.decode().catch(() => {})));
requestAnimationFrame(()=>{document.documentElement.dataset.personalStudyReady='11';});
