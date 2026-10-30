import { fixture as f } from '../fixture.js';

const app = document.querySelector('#app');
const snapshots = new Map();
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : 'Unavailable';
const money = value => Number.isFinite(value) ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Unpriced';
const team = id => f.teams.find(row => row.id === id);
const standing = id => f.standings.find(row => row.id === id);
const initials = name => name.split(/\s+/).map(part => part[0]).slice(0, 2).join('');
let state;

function readState() {
  const q = new URLSearchParams(location.search);
  const persona = ['reaves','neural','guest'].includes(q.get('persona')) ? q.get('persona') : 'reaves';
  return { persona, person: f.personas[persona], view: q.get('view') || 'home', id: q.get('id'), stage: q.get('stage') === 'structure' ? 'structure' : 'design' };
}
function href(view = 'home', id = null, hash = '') {
  const q = new URLSearchParams({ persona: state.persona });
  if (view !== 'home') q.set('view', view);
  if (id) q.set('id', id);
  if (state.stage === 'structure') q.set('stage', 'structure');
  return `${location.pathname}?${q}${hash}`;
}
function local(label, view, id, attrs = '') {
  return `<a href="${esc(href(view, id))}" data-local ${attrs}>${label}</a>`;
}
function exit(label, path, attrs = '') {
  return `<a href="https://goathoopers.com${esc(path)}" ${attrs}>${esc(label)}</a>`;
}
function portrait(player, extra = '') {
  return player.portrait ? `<img class="portrait ${extra}" src="${esc(player.portrait)}" alt="" width="48" height="48">` : `<span class="portrait initials ${extra}" aria-hidden="true">${esc(initials(player.name))}</span>`;
}
function header() {
  const member = state.person.kind === 'member';
  return `<header class="masthead"><div class="wrap header-inner">
    ${local(`<img src="${f.assets.logoDark}" width="338" height="72" alt="GOAT Hoopers home">`,'home',null,'class="brand" id="brand-home"')}
    <nav class="main-nav" aria-label="Main">${local('Home','home',null,`id="nav-home" ${state.view === 'home' ? 'aria-current="page"' : ''}`)}${local(member ? 'My club sheet' : 'The clubs',member ? 'team' : 'directory',null,'id="nav-team"')}<a href="${esc(href('home',null,'#games'))}" data-local id="nav-games">The games</a><a href="${esc(href('home',null,'#explore'))}" data-local id="nav-explore">Explore</a></nav>
    ${exit('Sign in on GOAT','/login','class="account-link" aria-label="Sign in on GOAT, leaves prototype"').replace('</a>','<small>Leaves prototype</small></a>')}
  </div></header>
  <div class="utility"><div class="wrap utility-inner"><span class="synthetic">Synthetic demo</span><span>30 Oct 2026 · 08:30 UTC</span>${local('Source notes','sources',null,'id="nav-sources"')}<label class="persona-control" for="demo-persona">Demo persona<select id="demo-persona" aria-label="Demo persona">${[['reaves','Reaves Dropper'],['neural','NeuralNets'],['guest','Guest']].map(([id,name])=>`<option value="${id}" ${state.persona===id?'selected':''}>${name}</option>`).join('')}</select></label></div></div>`;
}
function baseline() {
  return `<section class="baseline" aria-labelledby="baseline-title"><div class="baseline-heading"><h1 id="baseline-title">Ten clubs. One court.</h1><span class="meta">2026 season · Week 3 · Current synthetic standings</span></div><ol class="clubs">${f.standings.map(row=>`<li class="${row.id === state.person.teamId ? 'own' : ''}">${local(`<span class="club-rank">${String(row.rank).padStart(2,'0')}</span><span><span class="club-name">${esc(row.name)}</span><span class="club-meta"><span class="num">${row.wins}–${row.losses}</span> · ${row.id === state.person.teamId ? '<span class="you">Your club</span>' : `${number(row.pointsFor)} season pts`}</span></span>`,'club',row.id,`class="club-link" id="club-${row.id}" aria-label="Inspect ${esc(row.name)}, rank ${row.rank}, ${row.wins} wins ${row.losses} losses"`)}</li>`).join('')}</ol></section>`;
}
function scoreMarkup(match, ownId = null) {
  const ids = ownId ? [ownId, match.home === ownId ? match.away : match.home] : [match.home, match.away];
  const points = id => id === match.home ? match.homePoints : match.awayPoints;
  return `<div class="score-panel"><p class="eyebrow">Week 3 · Current synthetic score</p><div class="score-pair">${ids.map(id=>`<div><span class="score-label">${esc(team(id).name)}</span><strong class="score-value ${points(id)===null?'unknown':''}" data-score-team="${id}">${points(id)===null?'Score unavailable':number(points(id))}</strong></div>`).join('')}</div><span class="score-caption">${match.homePoints===null||match.awayPoints===null?'One score is missing. No leader is inferred.':'In progress in this synthetic sample. Not a final result.'}</span></div>`;
}
function gameItem(match, prefix = 'game') {
  return `<li class="game-item">${local(`${[match.home,match.away].map(id=>{const p=id===match.home?match.homePoints:match.awayPoints;return `<span class="game-team"><span>${esc(team(id).name)}</span>${p===null?'<span class="missing">Score unavailable</span>':`<span class="num">${number(p)}</span>`}</span>`;}).join('')}<span class="game-status">${match.state==='partly_unavailable'?'Partly unavailable · inspect pairing':'Synthetic current score · inspect pairing'}</span>`,'matchup',match.id,`class="game-link" id="${prefix}-${match.id}"`)}</li>`;
}
function samples() {
  const p = state.person;
  const rows = p.players.filter(player=>player.participation==='verified_demo' && player.completedWeekPoints!==null);
  return `<section id="samples" aria-labelledby="sample-title"><h2 id="sample-title">${rows.length===5?'Five':'Three'} with a counted week.</h2><p class="section-intro">Synthetic completed Week 2 · 19–25 October.<br>${rows.length} of ${p.players.length} roster players included in this sample.</p><ul class="sample-list">${rows.map(player=>`<li class="sample-row">${portrait(player)}${local(`${esc(player.name)}<span class="meta">${esc(player.position)} · Inspect sample</span>`,'player',player.id,`class="sample-person" id="sample-${player.id}" data-evidence="${player.id}"`)}<span class="sample-points num">${number(player.completedWeekPoints)}<small>counted pts</small></span></li>`).join('')}</ul><p class="sample-foot meta">These completed-week samples are separate from the current score above. Other roster players have no counted-week evidence in this fixture.</p></section>`;
}
function arena() {
  return `<figure class="arena-band"><img src="${f.assets.court}" alt="" width="1440" height="810"><figcaption>GOAT arena illustration</figcaption></figure>`;
}
function memberCourt() {
  const p=state.person, t=p.team, opp=p.opponent, v=p.valuation;
  const samplePlayer=p.players.find(player=>player.portrait && player.participation==='verified_demo') || p.players.find(player=>player.participation==='verified_demo');
  return `<section class="court-field" aria-label="Your club and the league court"><div class="court-upper">
    <section class="club-summary"><p class="eyebrow">Your club · Week 3</p><h2>${esc(t.name)}</h2><p class="manager">Managed by ${esc(t.manager)}</p><div class="record-line"><span class="num">${t.wins}–${t.losses}</span><span class="meta">${number(t.pointsFor)} season points</span></div><div class="quote-preview"><p><span class="num">${money(v.modeledFaabSubtotal)}</span> modeled FAAB${v.complete?'':' subtotal'}</p><span class="meta">${v.priced} of ${v.roster} players priced · No league value rank</span></div></section>
    ${scoreMarkup(p.matchup,p.teamId)}
    <section class="club-summary opponent"><p class="eyebrow">Your opponent</p><h2>${esc(opp.name)}</h2><p class="manager">Managed by ${esc(opp.manager)}</p><div class="record-line"><span class="num">${opp.wins}–${opp.losses}</span><span class="meta">${number(opp.pointsFor)} season points</span></div><div class="quote-preview"><p>Standing ${standing(opp.id).rank} of 10</p><span class="meta">Current synthetic season · Inspect the pairing for context</span></div></section>
    </div><nav class="center-line" aria-label="Your first three actions">${local('Inspect this matchup','matchup',p.matchup.id,'class="action primary" id="act-matchup" data-action="matchup"')}${local(`Open ${p.players.length}-player club sheet`,'team',null,'class="action" id="act-team" data-action="team"')}${local(`Inspect ${esc(samplePlayer.name)}`,'player',samplePlayer.id,'class="action" id="act-player" data-action="player"')}</nav>
    <div class="court-lower">${samples()}<section id="games" aria-labelledby="games-title"><h2 id="games-title">Elsewhere on court.</h2><p class="section-intro">The other four Week 3 pairings. Every score here belongs to the synthetic demo.</p><ul class="games">${f.matchups.filter(match=>match.id!==p.matchup.id).map(match=>gameItem(match)).join('')}</ul></section></div>${arena()}</section>`;
}
function guestCourt() {
  const final=f.historicalFinal;
  return `<section class="court-field" aria-label="The public league court"><div class="guest-upper"><div><p class="eyebrow">The public court · Week 3</p><h2>Everyone has a game.</h2><p>Browse the five pairings, meet the managers and get to know the clubs. This is the public view; no team has been assigned to you.</p></div><dl class="league-facts"><div><dt>Clubs in the league</dt><dd>10</dd></div><div><dt>Playoff places</dt><dd>6</dd></div><div><dt>Playoffs start in Week</dt><dd>20</dd></div></dl></div>
    <nav class="center-line" aria-label="Your first three actions">${local('Inspect the Reaves pairing','matchup','m1','class="action primary" id="act-matchup" data-action="matchup"')}${local('Meet Reaves Dropper','club','1','class="action" id="act-club" data-action="club"')}${local('Open all ten clubs','directory',null,'class="action" id="act-directory" data-action="directory"')}</nav>
    <div class="court-lower"><section id="games" aria-labelledby="games-title"><h2 id="games-title">All five pairings.</h2><p class="section-intro">Week 3 · Current synthetic scores. An unavailable score remains different from a recorded zero.</p><ul class="games">${f.matchups.map(match=>gameItem(match)).join('')}</ul></section><section class="guest-notes" aria-labelledby="public-title"><h2 id="public-title">Know the people behind the names.</h2><p>The ten clubs above open local summaries: managers, current records, assigned opponents and clearly dated previous-season context.</p><p>On the current GOAT site, signing in resolves your actual team and brings your club sheet and player context together.</p>${exit('Sign in on GOAT · leaves prototype','/login','class="action"')}<div class="history-note"><span class="meta">A project historical reference · 2025 final</span><h3>${esc(team(final.winner).name)}</h3><p><span class="num">${number(final.winnerPoints)}–${number(final.runnerUpPoints)}</span> against ${esc(team(final.runnerUp).name)}.</p>${exit('Browse History on GOAT · leaves prototype','/history','class="meta"')}</div></section></div>${arena()}</section>`;
}
function explore() {
  return `<section class="explore" id="explore" aria-label="Explore GOAT"><div class="wrap explore-inner"><div class="play-entry"><img src="${f.assets.game}" width="640" height="400" alt="Preview of GOAT free-throw practice"><div><h2>A few shots after the game.</h2><p>Step into the existing free-throw practice game.</p>${exit('Play free throw on GOAT','/arcade/free-throw')}<p class="exit-note">Leaves this prototype for the current GOAT site.</p></div></div><div><h2>Before your next move.</h2><p>Explore player pricing and the league's existing research tools.</p><div class="link-list">${exit('Stocks on GOAT','/stocks')}${exit('League Intel on GOAT','/intel')}${exit('Trade Analyzer on GOAT','/trade-analyzer')}</div><p class="exit-note">These links leave the prototype.</p></div><div><h2>Other weeks.</h2><p>Keep the present separate from the league's past.</p><div class="link-list">${exit('Weekly archive on GOAT','/weekly')}${exit('History on GOAT','/history')}</div><p class="exit-note">These links leave the prototype.</p></div></div></section>`;
}
function footer() {
  const groups=[['Competition',[['Teams','/teams'],['The Table','/table'],['Transactions','/transactions'],['Draft','/draft']]],['Research',[['News','/news'],['Stocks','/stocks'],['Intel','/intel'],['AI Decides','/ai-decides'],['Trade Analyzer','/trade-analyzer']]],['Other weeks and play',[['History','/history'],['Weekly archive','/weekly'],['Arcade','/arcade']]],['Account',[['My Team','/team'],['Sign in','/login']]]];
  return `<footer class="site-footer"><div class="wrap"><div class="footer-head"><img src="${f.assets.logo}" width="338" height="72" alt="GOAT Hoopers"><p>On the current GOAT site · Links below leave this prototype</p></div><div class="footer-grid">${groups.map(([name,links])=>`<section class="footer-group"><h2>${name}</h2><ul>${links.map(([label,path])=>`<li>${exit(label,path)}</li>`).join('')}</ul></section>`).join('')}</div><div class="footer-bottom"><p><strong>Synthetic demo.</strong> Current standings, scores, player samples and model outputs were constructed for this design. Identities come from authorized project references. No live account or backend is connected. Historical context is explicitly dated.</p>${local('Source notes','sources',null,'id="footer-sources"')}${local('Back to home','home',null,'id="footer-home"')}</div></div></footer>`;
}
function detail(title, contents) {
  const previous = history.state?.courtFrom;
  const backLabel = previous && new URL(previous).searchParams.has('view') ? 'Back to previous view' : 'Back to home';
  return `<main class="wrap detail-page" id="content"><a class="back-link" href="${esc(href())}" data-local data-return id="detail-back">${backLabel}</a><article class="detail-sheet"><p class="eyebrow">GOAT court index · Local inspection</p><h1 tabindex="-1" data-detail-heading>${title}</h1>${contents}</article></main>`;
}
function matchupDetail() {
  const match=f.matchups.find(row=>row.id===state.id);
  if(!match)return notFound();
  const a=team(match.home),b=team(match.away),p=state.person;
  let ai='';
  if(p.kind==='member' && p.matchup.id===match.id){
    ai=p.savedAi.status==='ready'?`<h2>Saved model context</h2><p>Synthetic saved estimate, not calibrated odds. Returned choice: <strong>${esc(team(p.savedAi.returnedChoice).name)}</strong>.</p>${p.savedAi.probabilities.map(row=>`<div class="probability"><span>${esc(team(row.teamId).name)}</span><span class="num">${number(row.probability*100)}%</span><div class="track" aria-hidden="true"><span style="width:${row.probability*100}%"></span></div></div>`).join('')}<dl class="fact-sheet"><div><dt>Independent confidence</dt><dd class="num">${p.savedAi.confidence}</dd></div><div><dt>Saved at</dt><dd>26 October 2026 · 08:00 UTC</dd></div></dl>`:'<h2>Saved model context</h2><p>No saved model estimate is included for this pairing in the sample. No probabilities are inferred.</p>';
  }
  return detail(`${esc(a.name)} vs ${esc(b.name)}`,`${scoreMarkup(match)}${match.homePoints===null||match.awayPoints===null?'<p class="notice">papichooter has a recorded zero in the sample. NeuralNets has no returned score. Missing is not zero, and no leader or tie can be established.</p>':''}<div class="detail-grid">${[a,b].map(t=>`<section><h2>${esc(t.name)}</h2><dl class="fact-sheet"><div><dt>Manager</dt><dd>${esc(t.manager)}</dd></div><div><dt>Current record</dt><dd class="num">${t.wins}–${t.losses}</dd></div><div><dt>Season points</dt><dd class="num">${number(t.pointsFor)}</dd></div><div><dt>Current standing</dt><dd>${standing(t.id).rank} of 10</dd></div></dl>${local('Inspect club summary','club',t.id,`class="back-link" id="match-club-${t.id}"`)}</section>`).join('')}</div>${ai}<h2>What this score means</h2><p>These are synthetic current Week 3 values, not a verified final result. Completed Week 2 player samples are separate data. The fixture provides no live clock, opponent lineup or game-by-game scoring receipt.</p>`);
}
function teamDetail() {
  const p=state.person;
  if(p.kind!=='member')return directoryDetail();
  const v=p.valuation;
  return detail(`${esc(p.team.name)} · Club sheet`,`<p>${p.players.length} roster references in the synthetic sample. Inspect a player to keep their current modeled quote separate from completed-week evidence.</p><dl class="fact-sheet"><div><dt>${v.complete?'Modeled roster quote':'Modeled FAAB subtotal'}</dt><dd class="num">${money(v.modeledFaabSubtotal)} FAAB</dd></div><div><dt>Quote coverage</dt><dd>${v.priced} of ${v.roster} players priced</dd></div><div><dt>Quote checked</dt><dd>30 October 2026 · 08:10 UTC</dd></div><div><dt>League value rank</dt><dd>Unavailable</dd></div></dl><p class="notice">${esc(v.rankUnavailableReason)} ${v.complete?'':'Six unpriced players are not included in the subtotal. '}Modeled FAAB is a pricing unit, not a cash balance.</p><form class="search" role="search" id="roster-search-form"><label for="roster-search">Find a roster player</label><input type="search" id="roster-search" autocomplete="off" placeholder="Player name"><button type="button" id="clear-search">Clear</button><span class="meta" id="roster-count" aria-live="polite">${p.players.length} players shown</span></form><table class="roster-table"><caption class="meta" style="text-align:left;padding-bottom:.8rem">Current modeled quotes · Completed Week 2 evidence is a separate column</caption><thead><tr><th scope="col">Player</th><th scope="col">Modeled FAAB</th><th scope="col">Completed Week 2</th><th scope="col">Detail</th></tr></thead><tbody>${p.players.map(player=>`<tr data-roster-name="${esc(player.name.toLowerCase())}"><td>${esc(player.name)}<small>${esc(player.position)}</small></td><td class="${player.modeledFaab===null?'':'num'}">${money(player.modeledFaab)}</td><td>${player.completedWeekPoints===null?'Not included in sample':`<span class="num">${number(player.completedWeekPoints)}</span> counted points`}</td><td>${local('Inspect','player',player.id,`id="roster-${player.id}" aria-label="Inspect ${esc(player.name)}"`)}</td></tr>`).join('')}</tbody></table><p class="meta" style="margin-top:1rem">No recorded team-value history is included. No trend line is inferred.</p>`);
}
function playerDetail() {
  const p=state.person;
  const player=p.kind==='member'?p.players.find(row=>row.id===state.id):null;
  if(!player)return notFound();
  return detail(esc(player.name),`<div class="player-detail-head">${portrait(player)}<p>${esc(player.position)} · ${esc(p.team.name)}<br><span class="meta">Project player reference ${esc(player.id)}</span></p></div><h2>Keep the two periods separate.</h2><dl class="fact-sheet"><div><dt>Current modeled quote</dt><dd class="${player.modeledFaab===null?'':'num'}">${money(player.modeledFaab)}${player.modeledFaab===null?'':' FAAB'}</dd></div><div><dt>Synthetic completed Week 2</dt><dd>${player.completedWeekPoints===null?'Not included in sample':`<span class="num">${number(player.completedWeekPoints)}</span> counted points`}</dd></div><div><dt>Evidence period</dt><dd>19–25 October 2026</dd></div><div><dt>Quote checked</dt><dd>30 October 2026 · 08:10 UTC</dd></div></dl><p class="notice">${player.completedWeekPoints===null?'No counted-week evidence is included for this player. This is not a DNP or a zero.':'This is one of the fixture’s explicitly synthetic counted-week samples. It is not the current Week 3 score.'} ${player.modeledFaab===null?'A missing quote is not a zero-valued player.':'The modeled quote is a pricing estimate, not cash or a transaction.'}</p><p>No per-game receipt, injury report, availability, factor breakdown or lineup recommendation is provided by this fixture.</p><div class="detail-actions">${local('Back to club sheet','team',null,'class="action" id="player-team"')}${exit('Player profile on GOAT · leaves prototype',`/player/${player.id}`,'class="action"')}</div>`);
}
function clubDetail() {
  const t=team(state.id);
  if(!t)return notFound();
  const m=f.matchups.find(row=>[row.home,row.away].includes(t.id)),prev=t.previousSeason;
  return detail(esc(t.name),`<p>Managed by ${esc(t.manager)}. Public club summary in this synthetic league scenario.</p><dl class="fact-sheet"><div><dt>Current record</dt><dd class="num">${t.wins}–${t.losses}</dd></div><div><dt>Current standing</dt><dd>${standing(t.id).rank} of 10</dd></div><div><dt>Season points</dt><dd class="num">${number(t.pointsFor)}</dd></div><div><dt>Assigned Week 3 opponent</dt><dd>${esc(team(m.home===t.id?m.away:m.home).name)}</dd></div></dl><h2>${prev.season} season reference</h2><p><span class="num">${prev.wins}–${prev.losses}</span> · Finished ${prev.finish} of 10. ${prev.ownerNote?esc(prev.ownerNote):''}</p><p class="meta">Historical project reference; separate from the constructed 2026 quantities.</p><div class="detail-actions">${local('Inspect current pairing','matchup',m.id,'class="action" id="club-matchup"')}${local('All ten clubs','directory',null,'class="action" id="club-directory"')}${exit('Full public profile on GOAT · leaves prototype',`/teams/${t.id}`,'class="action"')}</div>`);
}
function directoryDetail() {
  return detail('The ten clubs.',`<p>Current synthetic standings, managers and season points. Select a club for its pairing and clearly dated historical context.</p><ol class="directory-list">${f.standings.map(t=>`<li>${local(`${t.rank}. ${esc(t.name)}`,'club',t.id,`id="directory-${t.id}"`)}<p>${esc(t.manager)} · <span class="num">${t.wins}–${t.losses}</span><br><span class="num">${number(t.pointsFor)}</span> season points</p></li>`).join('')}</ol>`);
}
function sourcesDetail() {
  return detail('What this demo contains.',`<p>This is an independently authored homepage study, using the shared synthetic design fixture dated 30 October 2026 at 08:30 UTC.</p><ul class="source-list"><li>All current standings, scores, player evidence quantities, quotes, changes and model outputs were constructed for design. They are not reported league events.</li><li>Team identities and player references come from the authorized project checkout. They are not a fresh production roster verification. Current NBA team labels are intentionally omitted.</li><li>Completed Week 2 samples cover 19–25 October. They are separate from the current Week 3 score and do not include per-game receipts or injury evidence.</li><li>2025 season references retain their period. NeuralNets' 2025 record was under the previous manager as QBs Gremlins.</li><li>Both league value ranks are unavailable: this fixture does not supply complete comparable quotes for every club. Missing quotes and scores remain different from zero.</li><li>Demo persona selection is local demonstration state. Real GOAT membership is server-resolved; this prototype does not authenticate, generate estimates, update a roster, save trades or call a backend.</li><li>Links labelled GOAT, and the grouped destination footer, leave this prototype for the current site. Local inspections use only this fixture.</li></ul>`);
}
function notFound(){return detail('Not included in this view.','<p>The requested detail is not supplied for this demo persona. Return home to inspect the available fixture data.</p>');}
function render(options={}) {
  state=readState();
  document.documentElement.dataset.persona=state.persona;
  document.documentElement.dataset.stage=state.stage;
  delete document.documentElement.dataset.personalStudyReady;
  const views={matchup:matchupDetail,team:teamDetail,player:playerDetail,club:clubDetail,directory:directoryDetail,sources:sourcesDetail};
  const content=state.view==='home'?`<main class="wrap home" id="content">${baseline()}${state.person.kind==='member'?memberCourt():guestCourt()}</main>${explore()}`:(views[state.view]||notFound)();
  app.innerHTML=header()+content+footer();
  document.title=`${state.person.kind==='member'?state.person.team.name:'The league'} · GOAT court index`;
  bindSearch();
  Promise.resolve(document.fonts?.ready).then(()=>{
    document.documentElement.dataset.personalStudyReady='06';
    if(options.restore){
      const saved=snapshots.get(location.href);
      if(saved){document.getElementById(saved.triggerId)?.focus({preventScroll:true});window.scrollTo(0,saved.scrollY);return;}
    }
    if(location.hash){const target=document.querySelector(location.hash);target?.scrollIntoView();target?.querySelector('h2')?.setAttribute('tabindex','-1');target?.querySelector('h2')?.focus({preventScroll:true});}
    else if(options.focus){window.scrollTo(0,0);document.querySelector('[data-detail-heading]')?.focus({preventScroll:true});}
  });
}
function bindSearch(){
  const input=document.querySelector('#roster-search');
  if(!input)return;
  const update=()=>{let count=0;document.querySelectorAll('[data-roster-name]').forEach(row=>{row.hidden=!row.dataset.rosterName.includes(input.value.trim().toLowerCase());if(!row.hidden)count++;});document.querySelector('#roster-count').textContent=`${count} player${count===1?'':'s'} shown`;};
  input.addEventListener('input',update);
  document.querySelector('#roster-search-form').addEventListener('submit',event=>event.preventDefault());
  document.querySelector('#clear-search').addEventListener('click',()=>{input.value='';update();input.focus();});
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-local]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(link.hasAttribute('data-return')&&history.state?.courtFrom){history.back();return;}
  if(!link.id)link.id=`origin-${Math.random().toString(36).slice(2)}`;
  snapshots.set(location.href,{scrollY:window.scrollY,triggerId:link.id});
  const previous=location.href;
  history.pushState({courtFrom:previous},'',link.href);
  render({focus:true});
});
document.addEventListener('change',event=>{
  if(event.target.id!=='demo-persona')return;
  const q=new URLSearchParams({persona:event.target.value});
  if(state.stage==='structure')q.set('stage','structure');
  history.pushState({},'',`${location.pathname}?${q}`);
  render({focus:true});
});
window.addEventListener('popstate',()=>render({restore:true}));
render();
