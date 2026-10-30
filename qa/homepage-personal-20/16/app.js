import { fixture as data } from '../fixture.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const num = value => value === null || value === undefined ? 'Not returned' : new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
const cash = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(value);
const team = id => data.teams.find(item => item.id === id);
const standing = id => data.standings.find(item => item.id === id);
const record = item => `${item.wins}–${item.losses}`;
const params = new URLSearchParams(location.search);
const persona = ['reaves','neural','guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const person = data.personas[persona];
const member = person.kind === 'member';
const ownId = member ? person.teamId : null;
const fixedId = member ? person.opponent.id : data.historicalFinal.winner;
const adjacentId = member ? (persona === 'reaves' ? '3' : '10') : data.historicalFinal.runnerUp;
let kept = new Set([adjacentId]);
let lastTrigger = null;
const dialog = document.querySelector('#inspector');
const dialogContent = document.querySelector('#inspect-content');
document.documentElement.dataset.persona = persona;
if (params.get('stage') === 'structure') document.documentElement.dataset.stage = 'structure';

function external(path,label,className='') {
  return `<a class="${className}" href="https://goathoopers.com${e(path)}">${e(label)} <span class="external-label">GOAT site</span></a>`;
}
function pairing(id) {
  const match = data.matchups.find(item => item.home === id || item.away === id);
  return {match,other:team(match.home === id ? match.away : match.home),points:match.home === id ? match.homePoints : match.awayPoints,otherPoints:match.home === id ? match.awayPoints : match.homePoints};
}
function keepButton(id,where='grid') {
  const active = kept.has(id);
  if (id === ownId) return '';
  if (id === fixedId) return '<span class="small muted ui">Starting club · stays in view</span>';
  return `<button type="button" data-action="keep" data-team="${id}" data-testid="${where}-keep-${id}" aria-pressed="${active}">${active ? 'Remove from view' : 'Keep in view'}</button>`;
}
function clubStats(id) {
  const item = team(id), row = standing(id);
  return `<dl class="club-stats"><div><dt>Current record</dt><dd>${record(item)}</dd></div><div><dt>League order</dt><dd>#${row.rank}</dd></div><div><dt>Season points for</dt><dd>${num(item.pointsFor)}</dd></div></dl>`;
}
function publicGame(id) {
  const {other,points,otherPoints} = pairing(id);
  return `<div class="club-game"><p class="label">Week 3 · Current demo scores</p><p>${e(team(id).name)} vs ${e(other.name)}</p><p class="mini-score">${points === null ? '<span class="small">Not returned</span>' : num(points)} <span class="score-separator">/</span> ${otherPoints === null ? '<span class="small">Not returned</span>' : num(otherPoints)}</p>${points === null || otherPoints === null ? '<p class="small muted">One score is missing. No leader is inferred.</p>' : ''}</div>`;
}
function historyLine(id) {
  const previous = team(id).previousSeason;
  return `In ${previous.season}: ${record(previous)}, finished ${previous.finish}${previous.finish === 1 ? 'st' : previous.finish === 2 ? 'nd' : previous.finish === 3 ? 'rd' : 'th'}.${previous.ownerNote ? ` ${e(previous.ownerNote)}` : ''}`;
}
function publicClub(id,role,index=0) {
  const item = team(id);
  const isAdjacent = id === adjacentId;
  const reason = role === 'opponent'
    ? (member ? 'Your current opponent' : '2025 finalist · winner')
    : isAdjacent ? (member ? 'Next to you in league order' : '2025 finalist · runner-up') : 'Kept in view this visit';
  const subtitle = role === 'opponent' && member
    ? `<p class="public-note">${e(item.manager)} is managing the club across from you this week. Its season points and previous finish give you a little more context.</p><div class="club-game"><p class="label">Previous season</p><p>${historyLine(id)}</p></div>`
    : publicGame(id);
  return `<article class="club ${role}" id="club-${id}" aria-labelledby="club-name-${id}" data-testid="club-${id}"><div class="club-head"><div><p class="label">${reason}</p><p class="manager">${e(item.manager)}</p><h2 id="club-name-${id}">${e(item.name)}</h2></div>${isAdjacent && member ? `<span class="club-tag">${persona === 'reaves' ? 'Immediately below #1' : 'Immediately above #10'}</span>` : ''}</div>${clubStats(id)}${subtitle}<div class="club-actions"><button type="button" data-action="team" data-team="${id}" data-testid="inspect-team-${id}">Inspect club</button>${keepButton(id)}</div></article>`;
}
function ownClub() {
  if (!member) return `<section class="own-club guest-intro" aria-labelledby="own-club-name"><div><p class="label">Public league home</p><h2 id="own-club-name">Get to know the company.</h2></div><p>Ten clubs. Ten managers. Start with last season’s finalists, then keep any club close for this visit.</p><dl class="league-format"><div><dt>Clubs in the league</dt><dd>10</dd></div><div><dt>Playoff places</dt><dd>6</dd></div><div><dt>Playoffs start, week</dt><dd>20</dd></div></dl><p class="historical-label">The 2025 final: ${e(team(data.historicalFinal.winner).name)} ${num(data.historicalFinal.winnerPoints)} / ${e(team(data.historicalFinal.runnerUp).name)} ${num(data.historicalFinal.runnerUpPoints)}. The club panels below show today’s synthetic scenario.</p><div class="own-actions">${external('/login','Sign in for your actual club','external-inline')}<button type="button" data-action="choose" data-testid="guest-choose">Choose another club</button></div></section>`;
  const {points,otherPoints} = pairing(ownId);
  const anchor = person.players.find(player => player.portrait && player.completedWeekPoints !== null);
  return `<section class="own-club" aria-labelledby="own-club-name" data-testid="own-club"><div class="own-heading"><div><p class="label">Your club · ${e(person.team.manager)}</p><h2 id="own-club-name">${e(person.team.name)}</h2><p class="identity-note">2026 season · ${num(person.team.pointsFor)} points for</p></div><p class="own-record"><span class="record-big">${record(person.team)}</span>#${person.standing.rank} in league order</p></div><div class="match-summary"><div><h3>Week 3 against ${e(person.opponent.name)}</h3><p class="small muted">Current synthetic scores · not a final result</p></div><div class="score" data-testid="own-score"><span class="${points === null ? 'unknown-score' : ''}">${num(points)}</span><span class="score-separator">/</span><span>${num(otherPoints)}</span></div></div><div class="player-fact"><img class="player-portrait" src="${e(anchor.portrait)}" alt="" width="50" height="58"><p><strong>${e(anchor.name)}</strong> · ${anchor.position}<br>${num(anchor.completedWeekPoints)} counted-game points in the supplied Week 2 sample.<br><span class="muted">${person.playerEvidence.verifiedPlayers} of ${person.playerEvidence.rosterPlayers} roster players have evidence.</span></p><button class="quiet" type="button" data-action="player" data-player="${anchor.id}" data-testid="inspect-anchor">Inspect player</button></div><div class="own-actions"><button class="primary" type="button" data-action="team" data-team="${ownId}" data-testid="inspect-own">Inspect your club</button><button type="button" data-action="roster" data-testid="open-roster">Roster quotes</button></div></section>`;
}
function visitControls() {
  const optional = [...kept].filter(id => id !== fixedId);
  const items = [{id:fixedId,fixed:true},...optional.map(id => ({id,fixed:false}))];
  const options = data.teams.filter(item => item.id !== ownId && item.id !== fixedId && !kept.has(item.id));
  return `<aside class="visit-controls" id="visit-controls" aria-labelledby="visit-title"><h2 id="visit-title">In view this visit</h2><p>${member ? 'Your club and this week’s opponent stay close. Choose who else you want to check on.' : 'Last season’s finalists are a starting point. Make this small view your own.'}</p><ul class="in-view-list">${items.map(({id,fixed})=>`<li><div><a href="#club-${id}">${e(team(id).name)}</a><small>${e(team(id).manager)}${fixed ? member ? ' · current opponent' : ' · 2025 winner' : ''}</small></div>${fixed ? '<span class="small muted">Starting club</span>' : `<button class="quiet" type="button" data-action="keep" data-team="${id}" data-testid="visit-remove-${id}">Remove</button>`}</li>`).join('')}</ul><form class="choose-form" id="choose-form"><label for="team-choice">Add a club to this view</label><select id="team-choice" name="club" data-testid="team-choice"><option value="">Choose a manager and club</option>${options.map(item=>`<option value="${item.id}">${e(item.manager)} · ${e(item.name)}</option>`).join('')}</select><div class="choose-actions"><button class="primary" type="submit" data-testid="add-club" ${options.length ? '' : 'disabled'}>Add club</button>${kept.size ? '<button class="quiet" type="button" data-action="clear" data-testid="clear-clubs">Clear choices</button>' : ''}</div></form><p class="small muted">Only while this page is open. No follow, notification or account is saved.</p></aside>`;
}
function renderMain(focusKey) {
  const optional = [...kept].filter(id => id !== fixedId && id !== ownId);
  document.querySelector('#main').innerHTML = `<div class="frame"><div class="page-intro"><div><p class="label">2026 · Week 3 · League home</p><h1 id="home-title" tabindex="-1">Your clubs, in view.</h1></div><p>${member ? 'A familiar place for your own club, your opponent, and the people you choose to keep close.' : 'A public look at GOAT Hoopers. Pick a club, inspect the context, stay a little longer.'}</p></div><div class="club-grid" id="club-grid" aria-label="Clubs in your current view">${ownClub()}${visitControls()}${publicClub(fixedId,'opponent')}${optional.map((id,index)=>publicClub(id,index === 0 ? 'neighbor':'extra',index)).join('')}${optional.length ? '' : '<section class="empty-club"><h2>Room for another club.</h2><p>Choose a manager to bring their current contest into view.</p><button type="button" data-action="choose" data-testid="empty-choose">Choose a club</button></section>'}</div></div>`;
  if (focusKey && !dialog.open) document.querySelector(`[data-testid="${focusKey}"]`)?.focus({preventScroll:true});
}
function renderChrome() {
  document.querySelector('#site-header').innerHTML = `<div class="masthead"><div class="frame"><a class="brand" href="?persona=${persona}${params.get('stage') === 'structure' ? '&stage=structure' : ''}" aria-label="GOAT Hoopers prototype home"><img src="${data.assets.logo}" alt="GOAT Hoopers" width="200" height="55"></a><nav class="nav" aria-label="Main navigation"><a href="#main" aria-current="page">Home</a><a href="#club-grid">In view</a><a href="#visit-controls">Choose clubs</a><a href="#explore">Explore GOAT</a></nav>${external(member ? '/team':'/login',member ? 'My Team':'Sign in','account')}</div></div><div class="frame utility"><div class="utility-left"><a href="?persona=${persona}&inspect=source" class="demo" data-action="source" data-testid="open-source">Synthetic demo</a><span>As of <time datetime="${data.asOf}">30 Oct 2026 · 08:30 UTC</time></span></div><div class="persona-control"><label for="persona">Demo persona</label><select id="persona" data-testid="persona">${['reaves','neural','guest'].map(value=>`<option value="${value}" ${value === persona?'selected':''}>${value === 'reaves'?'Reaves Dropper':value === 'neural'?'NeuralNets':'Guest'}</option>`).join('')}</select></div></div>`;
  const groups = [ ['League',['/news','/teams','/transactions','/table','/intel']], ['Team tools',['/stocks','/team','/ai-decides','/trade-analyzer','/draft']], ['More GOAT',['/arcade','/history','/weekly','/','/login']] ];
  document.querySelector('#explore').innerHTML = `<div class="foot"><div class="frame"><div class="foot-top"><div><h2>There’s more to the league.</h2><p>Explore the GOAT site. These links leave this prototype for existing pages; this demo does not establish their live behavior.</p></div><button type="button" data-action="source" data-testid="footer-source">About this synthetic demo</button></div><div class="footer-groups">${groups.map(([label,paths])=>`<section><h3>${label}</h3><ul>${paths.map(path=>`<li>${external(path,data.destinations.find(item=>item.href === path).label)}</li>`).join('')}</ul></section>`).join('')}<section><h3>Take a shot.</h3>${external('/arcade/free-throw','Free throw · GOAT site','arcade-link').replace('Free throw · GOAT site',`<img src="${data.assets.game}" alt="Free throw practice game preview" width="100" height="65"><span>Free throw practice<br><span class="small muted">Open the existing game</span></span>`)}</section></div><div class="footer-bottom"><span>GOAT Hoopers · Synthetic 2026 home study</span><span>No live league, account, AI or backend connection.</span><a href="#main">Back to top</a></div></div></div>`;
}
function dialogTitle(eyebrow,title) {
  return `<p class="label">${eyebrow}</p><h2 id="inspect-title" tabindex="-1">${e(title)}</h2>`;
}
function dialogClub(id) {
  const item = team(id), isOwn = member && id === ownId;
  if (!item) return '';
  const {other,points,otherPoints} = pairing(id);
  return `${dialogTitle(isOwn?'Your club':'Public club',item.name)}<p class="manager">Managed by ${e(item.manager)}</p>${clubStats(id)}<section class="dialog-section"><h3>Current Week 3 contest</h3><p class="ui">${e(item.name)} <strong class="num">${num(points)}</strong> / ${e(other.name)} <strong class="num">${num(otherPoints)}</strong></p><p class="own-note">Current synthetic scores, not a completed result.${points === null || otherPoints === null ? ' One score is missing; no leader is inferred.' : ''}</p></section>${isOwn ? `<section class="dialog-section"><h3>Your roster, a little closer</h3><p><strong class="num">${cash(person.valuation.modeledFaabSubtotal)}</strong> ${person.valuation.complete ? 'modeled FAAB':'priced subtotal'} · <strong class="num">${person.valuation.priced}/${person.valuation.roster}</strong> players priced.</p><p class="own-note">${person.valuation.complete ? 'Complete coverage of this sample roster.' : 'Six player quotes are missing. This is not a complete team total.'} Modeled value is not a cash balance. No league value rank is supplied.</p><div class="dialog-actions"><button class="primary" type="button" data-action="roster" data-testid="dialog-roster">Inspect roster quotes</button></div><h3>Supplied completed Week 2 evidence</h3><p class="small">19–25 October 2026 · ${person.playerEvidence.verifiedPlayers} of ${person.playerEvidence.rosterPlayers} players covered. No game count is supplied.</p>${evidenceTable()}${aiDisclosure()}</section>` : '<p class="own-note">Public club context only. No opponent roster is supplied in this demo.</p>'}<section class="dialog-section"><h3>${item.previousSeason.season} season reference</h3><p>${historyLine(id)}</p></section><div class="dialog-actions">${external(`/teams/${id}`,'Full public team profile','external-inline')}${!isOwn ? keepButton(id,'dialog') : ''}</div><p class="small muted">All current quantities are synthetic. ${data.league.source}</p>`;
}
function evidenceTable() {
  return `<table class="data-table"><thead><tr><th scope="col">Player</th><th scope="col" class="numeric">Counted points</th><th scope="col"><span class="sr-only">Inspection</span></th></tr></thead><tbody>${person.players.filter(item=>item.completedWeekPoints !== null).map(item=>`<tr><td>${e(item.name)} <span class="muted small">${item.position}</span></td><td class="num">${num(item.completedWeekPoints)}</td><td><button type="button" data-action="player" data-player="${item.id}" data-testid="evidence-${item.id}">Inspect</button></td></tr>`).join('')}</tbody></table>`;
}
function aiDisclosure() {
  const ai = person.savedAi;
  if (ai.status !== 'ready') return '<p class="own-note">No saved model estimate is supplied for this pairing.</p>';
  return `<details><summary>Saved synthetic model estimate</summary><p>${e(ai.label)}.</p><p class="ui">${ai.probabilities.map(item=>`${e(team(item.teamId).name)}: <strong class="num">${num(item.probability*100)}%</strong>`).join(' / ')}</p><p>Returned choice: ${e(team(ai.returnedChoice).name)}. Independent confidence: ${num(ai.confidence*100)}%.</p><p>Generated 26 October 2026, 08:00 UTC. No generation, refresh or live model call occurs here.</p></details>`;
}
function dialogRoster() {
  if (!member) return `${dialogTitle('Public demo','No private roster selected')}<p>Guest has public club context only.</p>`;
  return `${dialogTitle('Your club · Local roster quotes',person.team.name)}<button class="quiet" type="button" data-action="parent" data-parent="team:${ownId}" data-testid="back-to-club">Back to club</button><p class="dialog-lead"><strong class="num">${cash(person.valuation.modeledFaabSubtotal)}</strong> ${person.valuation.complete?'modeled FAAB':'priced subtotal'} · <strong class="num">${person.valuation.priced}/${person.valuation.roster}</strong> priced.</p><p class="notice">${person.valuation.complete?'Every roster player has a supplied quote.':'Six quotes are missing. Unpriced players are not zero; the subtotal is not a complete team total.'} This is a modeled value, not a cash balance. No league value rank is asserted.</p><p class="own-note">Checked 30 October 2026, 08:10 UTC. No recorded team-value series is supplied, so there is no history line.</p><table class="data-table" data-testid="roster-table"><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col" class="numeric">Modeled FAAB</th><th scope="col"><span class="sr-only">Inspection</span></th></tr></thead><tbody>${person.players.map(item=>`<tr><td>${e(item.name)}</td><td>${item.position}</td><td class="num ${item.modeledFaab === null?'unpriced':''}">${item.modeledFaab === null?'Unpriced':cash(item.modeledFaab)}</td><td><button type="button" data-action="player" data-player="${item.id}" data-testid="roster-player-${item.id}">Inspect</button></td></tr>`).join('')}</tbody></table><p class="own-note">Synthetic quotes. No current price factors or historical chart are supplied.</p>`;
}
function dialogPlayer(id) {
  const item = member ? person.players.find(player=>player.id === id) : null;
  if (!item) return `${dialogTitle('Public demo','Player detail not supplied')}<p>No private member roster is selected.</p>`;
  return `${dialogTitle('Your roster · Player inspection',item.name)}<p class="manager">${item.position} · ${e(person.team.name)}</p><button class="quiet" type="button" data-action="parent" data-parent="roster" data-testid="back-to-roster">Back to roster</button><dl class="detail-stats"><div><dt>Modeled FAAB quote</dt><dd class="${item.modeledFaab === null?'unpriced':''}">${item.modeledFaab === null?'Unpriced':cash(item.modeledFaab)}</dd></div><div><dt>Completed Week 2 counted-game points</dt><dd>${item.completedWeekPoints === null?'Not supplied':num(item.completedWeekPoints)}</dd></div></dl><p class="notice">${item.completedWeekPoints === null?'No counted-game evidence is supplied for this player. This does not establish zero, DNP or poor performance.':'Synthetic completed Week 2, 19–25 October 2026. Participation is verified within this demo sample; no game-count breakdown is supplied.'}</p><section class="dialog-section"><h3>What this tells you</h3><p>Modeled FAAB and counted-game points are different measures. This sample provides no injury, current availability, game log, price factors or value history.</p></section><div class="dialog-actions">${external(`/player/${id}`,'Full player profile','external-inline')}</div>`;
}
function dialogSources() {
  return `${dialogTitle('Source explanation','A synthetic league visit')}<div class="source-text"><p>${e(data.notice)}</p><p><strong>Current scenario.</strong> All current quantities, scores, standings, prices, changes and model outputs were constructed for this design demo. As of 30 October 2026, 08:30 UTC. None are reported league events.</p><p><strong>People and players.</strong> Identities and player references come from the authorized project checkout, not a fresh production roster verification. Current NBA team labels are intentionally omitted. A demo persona is not a membership or permission check.</p><p><strong>History.</strong> Only qualified previous-season references and the 2025 final are retained. NeuralNets’ 2025 record belongs to the previous manager as QBs Gremlins.</p><p><strong>Your choices.</strong> Keep in view changes only this open page. It does not save a follow, friendship, notification or account setting.</p><p><strong>Limits.</strong> No lineup saves, submitted trades, login, AI generation, live market/API calls, storage or mutations occur. No recorded team-value series or Lineup Power producer is supplied. Unknown is not zero, partial quotes are subtotals and model probabilities are not calibrated odds.</p><p>Links labelled GOAT site leave the prototype. Local inspection does not establish production behavior.</p></div>`;
}
function parseView() {
  const raw = new URLSearchParams(location.search).get('inspect');
  if (!raw) return null;
  if (raw === 'source' || raw === 'roster') return {kind:raw,key:raw};
  const [kind,id] = raw.split(':');
  if (kind === 'team' && team(id)) return {kind,id,key:raw};
  if (kind === 'player' && member && person.players.some(item=>item.id === id)) return {kind,id,key:raw};
  return null;
}
function showView(view) {
  if (!view) {
    if (dialog.open) dialog.close();
    const target = lastTrigger ? document.querySelector(`[data-testid="${lastTrigger}"]`) : null;
    (target || document.querySelector('#home-title')).focus({preventScroll:true});
    return;
  }
  const content = view.kind === 'team' ? dialogClub(view.id) : view.kind === 'roster' ? dialogRoster() : view.kind === 'player' ? dialogPlayer(view.id) : dialogSources();
  dialogContent.innerHTML = content;
  if (!dialog.open) dialog.showModal();
  dialogContent.querySelector('#inspect-title').focus({preventScroll:true});
  dialog.scrollTop = 0;
}
function openView(key,trigger,{replace=false}={}) {
  const oldView = parseView();
  if (!dialog.open && trigger) lastTrigger = trigger.dataset.testid || null;
  const url = new URL(location.href);
  url.searchParams.set('persona',persona);
  url.searchParams.set('inspect',key);
  const oldState = history.state?.g16 ? history.state : null;
  const depth = replace ? oldState?.depth || 0 : (oldState?.depth || 0)+1;
  const state = {g16:true,depth,parent:oldView?.key || null};
  history[replace?'replaceState':'pushState'](state,'',url);
  showView(parseView());
}
function closeView() {
  const depth = history.state?.g16 ? history.state.depth : 0;
  if (depth > 0) history.go(-depth);
  else { const url = new URL(location.href);url.searchParams.delete('inspect');history.replaceState({g16:true,depth:0},'',url);showView(null); }
}
function announce(message) { document.querySelector('#status').textContent = message; }
function changeKept(id,trigger) {
  const active = kept.has(id);
  if (active) kept.delete(id); else kept.add(id);
  const oldFocus = trigger?.dataset.testid;
  const fallback = active ? 'team-choice' : oldFocus;
  renderMain(fallback);
  if (dialog.open) {
    const button = dialog.querySelector(`[data-testid="dialog-keep-${id}"]`);
    if (button) {button.textContent = active?'Keep in view':'Remove from view';button.setAttribute('aria-pressed',String(!active));}
  }
  announce(`${team(id).name} ${active?'removed from':'added to'} this visit’s view.`);
}

renderChrome();
renderMain();
if (!history.state?.g16) history.replaceState({g16:true,depth:0},'',location.href);
if (parseView()) showView(parseView());
window.addEventListener('popstate',()=>showView(parseView()));
dialog.addEventListener('cancel',event=>{event.preventDefault();closeView();});
document.addEventListener('click',event=>{
  const target = event.target.closest('[data-action]');
  if (!target) return;
  event.preventDefault();
  const {action} = target.dataset;
  if (action === 'team') openView(`team:${target.dataset.team}`,target);
  if (action === 'roster') openView('roster',target);
  if (action === 'player') openView(`player:${target.dataset.player}`,target);
  if (action === 'source') openView('source',target);
  if (action === 'close') closeView();
  if (action === 'parent') {
    if (history.state?.g16 && history.state.parent === target.dataset.parent) history.back();
    else openView(target.dataset.parent,target,{replace:true});
  }
  if (action === 'keep') changeKept(target.dataset.team,target);
  if (action === 'clear') {kept.clear();renderMain('team-choice');announce('Optional club choices cleared for this visit.');}
  if (action === 'choose') document.querySelector('#team-choice').focus();
});
document.addEventListener('submit',event=>{
  if (event.target.id !== 'choose-form') return;
  event.preventDefault();
  const select = document.querySelector('#team-choice');
  if (!select.value) {select.focus();announce('Choose a manager and club first.');return;}
  const id = select.value;
  kept.add(id);
  renderMain(`inspect-team-${id}`);
  announce(`${team(id).name} added to this visit’s view.`);
});
document.addEventListener('change',event=>{
  if (event.target.id !== 'persona') return;
  const url = new URL(location.href);url.searchParams.set('persona',event.target.value);url.searchParams.delete('inspect');url.hash='';location.assign(url);
});
document.fonts.ready.then(()=>{document.documentElement.dataset.personalStudyReady='16';});
