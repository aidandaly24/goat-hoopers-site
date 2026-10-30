import { fixture as f } from '../fixture.js';

const app = document.querySelector('#app');
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const n = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
const money = value => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const asset = path => e(path);
const team = id => f.teams.find(t => t.id === id);
const record = t => `${t.wins}–${t.losses}`;
const date = value => new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'UTC', hour12:false }).format(new Date(value)) + ' UTC';
let route;
let renderVersion = 0;
const readRoute = () => {
  const q = new URLSearchParams(location.search);
  const persona = ['reaves','neural','guest'].includes(q.get('persona')) ? q.get('persona') : 'reaves';
  return { persona, view:q.get('view') || 'home', player:q.get('player'), team:q.get('team'), matchup:q.get('matchup'), stage:q.get('stage') };
};
function href(view = 'home', params = {}) {
  const q = new URLSearchParams({persona:route.persona});
  if (route.stage === 'structure') q.set('stage','structure');
  if (view !== 'home') q.set('view',view);
  for (const [key,value] of Object.entries(params)) if (value != null) q.set(key,value);
  return `?${q}`;
}
function local(label, view, params = {}, id = '', cls = '', extra = '') {
  return `<a data-local href="${e(href(view,params))}"${id ? ` id="${e(id)}"` : ''}${cls ? ` class="${e(cls)}"` : ''} ${extra}>${label}</a>`;
}
function exit(label, path, cls = '', extra = '') {
  return `<a href="https://goathoopers.com${e(path)}" target="_blank" rel="noopener noreferrer" class="external ${e(cls)}" aria-label="${e(label)} — existing GOAT site, opens a new tab" ${extra}>${e(label)} <span class="glyph" aria-hidden="true">↗</span></a>`;
}
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const back = () => `<a data-return href="${e(href())}" class="back-link">← Back to ${route.persona === 'guest' ? 'league' : 'your'} home</a>`;
function source() {
  return `<details class="source-detail"><summary>About this synthetic snapshot</summary><p>${e(f.notice)}</p><p>${e(f.league.source)} Supplied as of ${date(f.asOf)}. This prototype does not track your last visit.</p><p>${e(f.provenance.identitiesAndPlayerReferences)} ${e(f.provenance.history)}</p><p>Missing scores, evidence and prices remain unavailable. There is no recorded value series, complete league value rank or Lineup Power snapshot here. Local details use this same fixture; they do not contact an account or generate a decision.</p></details>`;
}
function header() {
  const home = route.view === 'home';
  return `<header class="site-header" id="top"><a data-local class="logo-link" href="${e(href())}" aria-label="GOAT Hoopers home"><img class="logo" src="${asset(f.assets.logo)}" alt="GOAT Hoopers" width="155" height="38"></a><nav class="primary-nav" aria-label="Main navigation">${local('Home','home',{},'nav-home','',home ? 'aria-current="page"' : '')}<a data-home-anchor="team-stream" href="${e(href())}#team-stream">${route.persona === 'guest' ? 'Teams' : 'Team'}</a><a data-home-anchor="notes-stream" href="${e(href())}#notes-stream">${route.persona === 'guest' ? 'People' : 'Player notes'}</a><a data-home-anchor="league-stream" href="${e(href())}#league-stream">League</a>${exit('Stocks','/stocks')}${exit('News','/news')}${exit('Arcade','/arcade')}</nav><div class="demo-controls"><span class="demo-tag">Synthetic demo</span><label for="persona">Demo persona<select id="persona" name="persona"><option value="reaves" ${route.persona==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${route.persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${route.persona==='guest'?'selected':''}>Guest</option></select></label></div></header><div class="page-meta"><span>2026 season <span aria-hidden="true">/</span> Week ${f.league.week} <span aria-hidden="true">/</span> ${home ? 'The club' : 'Local '+e(route.view)+' detail'}</span><span>Supplied <time class="num" datetime="${e(f.asOf)}">${date(f.asOf)}</time> · <a href="#site-sources">Sources & demo notes ↓</a></span></div>`;
}
function footer() {
  const groups = [['League',['/teams','/transactions','/draft','/intel','/table']],['Players & decisions',['/stocks','/ai-decides','/trade-analyzer']],['Club',['/news','/history','/weekly','/arcade']],['Account',['/team','/login']]];
  return `<footer class="site-footer" id="site-sources"><div class="footer-top"><div class="footer-brand"><img class="logo" src="${asset(f.assets.logo)}" alt="GOAT Hoopers" width="155" height="38"><p>Ten teams. Our people.<br>A place to keep up.</p><p class="control">Synthetic design preview.</p></div>${groups.map(([label,paths])=>`<nav class="footer-group" aria-label="${e(label)}"><h2>${e(label)}</h2>${paths.map(path=>exit(f.destinations.find(x=>x.href===path).label,path)).join('')}</nav>`).join('')}</div><div class="footer-bottom"><p>Links marked with an arrow leave this prototype for the existing GOAT site in a new tab. Local team, player and game details stay here. ${e(f.notice)}</p><a href="#top">Back to top ↑</a></div>${source()}</footer>`;
}
function score(value, compact = false) {
  return value == null ? `<span class="score-unavailable">Score unavailable</span>` : `<span class="num">${n(value)}</span>`;
}
function gameRow(m) {
  const a = team(m.home), b = team(m.away);
  return local(`<span class="game-row"><span class="game-name">${e(a.name)}</span>${score(m.homePoints,true)}</span><span class="game-row"><span class="game-name">${e(b.name)}</span>${score(m.awayPoints,true)}</span>`,'matchup',{matchup:m.id},`game-${m.id}`,'game-link',`aria-label="Inspect ${e(a.name)} versus ${e(b.name)}"`);
}
function positions(member) {
  const rows = [...f.standings.slice(0,3)];
  if (member && !rows.some(t=>t.id===member.teamId)) rows.push(member.standing);
  return `<section class="league-position"><h3>League position</h3><p class="game-state">Current synthetic standings</p><ol>${rows.map(t=>`<li class="position-row ${member?.teamId===t.id?'is-you':''}"><span class="num">${t.rank}</span>${local(e(t.name),'team',{team:t.id},`position-${t.id}`,'',member?.teamId===t.id?'aria-label="'+e(t.name)+', your team"':'')}<span class="num">${record(t)}</span></li>`).join('')}</ol>${local('Open the full league table →','league',{},'full-league','reading-link')}</section>`;
}
function quote(p) {
  const v = p.valuation;
  return `<section class="quote-summary"><p class="small-label">${v.complete ? 'Modeled roster quote' : 'Partial modeled subtotal'}</p><span class="num">${money(v.modeledFaabSubtotal)}</span><p class="coverage">modeled FAAB · ${v.priced}/${v.roster} players priced</p><p class="fine">${v.complete?'Every player in this sample has a quote.':'Six players are unpriced; this is not a complete team total.'} Modeled value is not a cash balance.</p><p class="exit-note">Checked ${date(v.checkedAt)}. No league value rank supplied.</p></section>`;
}
function memberHome(p) {
  const player = p.players.find(x=>x.id === (route.persona === 'reaves' ? '1511' : '1380'));
  const evidence = p.players.filter(x=>x.completedWeekPoints != null);
  const m = p.matchup;
  return `<main id="main" tabindex="-1" class="streams"><section class="stream stream-team" id="team-stream" aria-labelledby="page-title"><div class="section-label"><span class="eyebrow">Your team</span></div><p class="manager">Managed by ${e(p.team.manager)}</p><h1 class="team-title" id="page-title" tabindex="-1">${e(p.team.name)}</h1><div class="team-record"><div><span class="num">${record(p.team)}</span><span class="small-label">Current record</span></div><div><span class="num">#${p.standing.rank}</span><span class="small-label">League standing</span></div><div><span class="num">${p.players.length}</span><span class="small-label">Players</span></div></div><section class="focus-block" aria-labelledby="focus-name"><div class="focus-tag"><p class="eyebrow">A player to inspect</p><p class="control">Editorial focus · ${e(player.position)}</p></div><figure class="portrait-field"><img src="${asset(player.portrait)}" width="300" height="201" alt="${e(player.name)}"><figcaption>One person.<br>The supplied<br>evidence.</figcaption></figure><h2 class="focus-name" id="focus-name">${e(player.name)}</h2><div class="focus-stat"><span class="num">${n(player.completedWeekPoints)}</span><p>supplied points<br>Synthetic completed Week 2</p></div>${local(`Inspect ${e(player.name)} ${arrow}`,'player',{player:player.id},'first-action','action primary')}</section><section class="team-more">${local(`Open all ${p.players.length} players ${arrow}`,'team',{team:p.teamId},'second-action','action')}${quote(p)}</section><div class="next-stops"><h3>Keep looking.</h3>${exit('Explore player quotes','/stocks')}${exit('Open Trade Analyzer','/trade-analyzer')}<p class="exit-note">These open the existing GOAT site.</p></div></section><section class="stream stream-notes" id="notes-stream" aria-labelledby="notes-title"><div class="section-label"><span class="eyebrow">Player notes</span></div><h2 id="notes-title">What the sample says.</h2><p class="notes-intro" style="margin-top:18px">${evidence.length} of your ${p.players.length} players have supplied completed-week points to look through.</p><p class="period">Synthetic completed Week 2<br>19–25 October 2026</p><ul>${evidence.map(x=>`<li class="player-note">${local(`<span class="player-name">${e(x.name)} <span class="glyph" aria-hidden="true">↗</span></span><span class="num">${n(x.completedWeekPoints)}</span>`,'player',{player:x.id},`note-${x.id}`,'',`aria-label="Inspect ${e(x.name)}, ${n(x.completedWeekPoints)} supplied points"`)}<p>${e(x.position)} · supplied sample points</p></li>`).join('')}</ul><p class="sample-note">A partial evidence sample, not the whole roster's production. These points belong to completed Week 2, not this week's score.</p>${route.persona==='neural'?`<section class="current-context"><h3>A different starting point.</h3><p>NeuralNets is ${record(p.team)}. This week's opponent, ${e(p.opponent.name)}, is ${record(p.opponent)}. Start with the people and evidence here; the Week 3 score remains unavailable.</p></section>`:''}<section class="notes-block"><h3>Latest source notes</h3>${p.changes.map(c=>`<article class="change"><time datetime="${e(c.at)}">${date(c.at)}</time><h4>${e(c.headline)}</h4><p>${e(c.body)}</p></article>`).join('')}</section>${source()}</section><aside class="stream stream-league" id="league-stream" aria-labelledby="league-title"><div class="section-label"><span class="eyebrow">Around your game</span></div><section class="current-game"><p class="small-label">Week ${f.league.week} opponent</p><h2 class="opponent-title" id="league-title">${e(p.opponent.name)}</h2><div class="record-pair"><div><strong>${e(p.team.name)}</strong><span class="num">${record(p.team)}</span></div><div><strong>${e(p.opponent.name)}</strong><span class="num">${record(p.opponent)}</span></div></div><div class="current-score"><div class="score-line"><span>${e(team(m.home).name)}</span>${score(m.homePoints)}</div><div class="score-line"><span>${e(team(m.away).name)}</span>${score(m.awayPoints)}</div></div><p class="game-state">${m.state==='partly_unavailable'?'Partly unavailable · no leader inferred':'Synthetic in progress'}</p>${local(`Inspect this matchup ${arrow}`,'matchup',{matchup:m.id},'third-action','action')}${p.savedAi.status==='ready'?local('Saved model context →','matchup',{matchup:m.id},'saved-model-link','model-link'):'<p class="model-link">No saved model estimate supplied.</p>'}</section><section class="other-games"><h3>The other games</h3>${f.matchups.filter(x=>x.id!==m.id).map(gameRow).join('')}</section><figure class="league-photo"><img src="${asset(f.assets.court)}" width="1440" height="810" alt="The GOAT Hoopers illustrated arena" loading="lazy"><figcaption>The home court. The rest of the league.</figcaption></figure>${positions(p)}</aside></main>`;
}
function guestHome() {
  return `<main id="main" tabindex="-1" class="streams"><section class="stream stream-team" id="team-stream" aria-labelledby="page-title"><div class="section-label"><span class="eyebrow">Welcome to the club</span></div><h1 id="page-title" class="guest-title" tabindex="-1">GOAT Hoopers.</h1><p class="guest-lede">Ten teams, familiar faces.<br>Come see the league this week.</p><div class="team-record"><div><span class="num">${f.league.teams}</span><span class="small-label">Teams</span></div><div><span class="num">${f.league.week}</span><span class="small-label">Current week</span></div><div><span class="num">${f.league.season}</span><span class="small-label">Season</span></div></div><figure class="guest-court"><img src="${asset(f.assets.court)}" width="1440" height="810" alt="The GOAT Hoopers illustrated arena"><figcaption>The league's home court.</figcaption></figure><p class="prose">Public games and people are right here. Sign in on the existing GOAT site for your actual team.</p><div style="margin-top:24px">${exit('Sign in on GOAT','/login','action primary','id="third-action"')}</div><p class="exit-note">Leaves this prototype; opens the existing site.</p><div class="team-more"><h2>Start with the people.</h2><p>Meet all ten managers, then follow a team into this week's game.</p>${local(`Open the league directory ${arrow}`,'league',{},'guest-directory','action')}</div><div class="next-stops"><h3>Elsewhere in the club</h3>${exit('Read the league news','/news')}${exit('Step into the Arcade','/arcade')}<p class="exit-note">These open the existing GOAT site.</p></div></section><section class="stream stream-notes" id="notes-stream" aria-labelledby="notes-title"><div class="section-label"><span class="eyebrow">Meet the league</span></div><h2 id="notes-title">Names you'll get to know.</h2><p class="public-intro">The ten teams and the people behind them. Open a team for its current record and previous-season context.</p><ul class="guest-team-list">${f.teams.map((t,i)=>`<li class="guest-team">${local(`${e(t.name)} <span class="glyph" aria-hidden="true">↗</span>`,'team',{team:t.id},i===0?'second-action':`guest-team-${t.id}`)}<p>${e(t.manager)} · <span class="num">${record(t)}</span> this season</p></li>`).join('')}</ul>${source()}</section><aside class="stream stream-league" id="league-stream" aria-labelledby="league-title"><div class="section-label"><span class="eyebrow">Around the league</span></div><h2 id="league-title">This week's games</h2><p class="game-state">Week ${f.league.week} · synthetic in progress</p><div class="other-games" style="margin-top:22px">${f.matchups.map((m,i)=>i===0?gameRow(m).replace(`id="game-${m.id}"`,'id="first-action"'):gameRow(m)).join('')}</div><div style="margin-top:35px">${positions(null)}</div></aside></main>`;
}
function detailShell(title, lede, body, cls = '') {
  return `<main id="main" tabindex="-1" class="detail-view ${cls}"><div class="detail-top">${back()}<span class="eyebrow">Synthetic local detail</span></div><h1 id="page-title" tabindex="-1">${e(title)}</h1>${lede?`<p class="detail-lede">${lede}</p>`:''}${body}</main>`;
}
function historyBlock(t) {
  const h = t.previousSeason;
  return `<section class="team-history"><h2>${e(h.season)} season context</h2><p><span class="num">${h.wins}–${h.losses}</span> record · finish <span class="num">#${h.finish}</span>. ${h.ownerNote ? `<strong>${e(h.ownerNote)}</strong>` : ''}</p></section>`;
}
function playerDetail(p) {
  const x = p?.players?.find(x=>x.id===route.player);
  if (!x) return unavailable();
  return detailShell(x.name, `${e(x.position)} · ${e(p.team.name)}`, `<div class="detail-layout"><section>${x.portrait?`<figure class="detail-portrait"><img src="${asset(x.portrait)}" width="300" height="201" alt="${e(x.name)}"></figure>`:'<p class="prose">Player reference from the synthetic team roster.</p>'}<dl class="detail-facts"><div><dt>Completed Week 2 points</dt><dd class="${x.completedWeekPoints==null?'words':'num'}">${x.completedWeekPoints==null?'Evidence unavailable':n(x.completedWeekPoints)}</dd></div><div><dt>Modeled FAAB quote</dt><dd class="${x.modeledFaab==null?'words':'num'}">${x.modeledFaab==null?'Unpriced':money(x.modeledFaab)}</dd></div></dl></section><section><h2>The supplied evidence</h2><p class="prose">${e(p.playerEvidence.periodLabel)} · 19–25 October 2026.</p><p>${x.completedWeekPoints==null?'No completed-week point evidence was supplied for this player. Unavailable does not mean zero or a DNP.':'This is the player’s supplied completed-week sample. It is separate from the current Week 3 team score.'}</p><p>No individual game log or scoring-component breakdown is included in this fixture.</p><div class="detail-description"><p>Quote checked ${date(p.valuation.checkedAt)}. Modeled FAAB is a pricing unit, not a cash balance.</p><p>${p.valuation.priced}/${p.valuation.roster} roster players are priced. ${p.valuation.complete?'This roster has full quote coverage.':'The roster subtotal has partial coverage and is not a complete team value.'}</p></div><div class="detail-actions">${local('Open all your players →','team',{team:p.teamId},'detail-team')}${exit('Player on GOAT',`/player/${x.id}`)}</div><p class="exit-note">Opens the existing GOAT site in a new tab.</p></section></div>${source()}`);
}
function teamDetail(p) {
  const id = route.team || p?.teamId;
  const t = team(id);
  if (!t) return unavailable();
  const own = p?.kind==='member' && p.teamId===id;
  const standing = f.standings.find(x=>x.id===id);
  const m = f.matchups.find(x=>x.home===id || x.away===id);
  const overview = `<dl class="detail-facts"><div><dt>Current record</dt><dd class="num">${record(t)}</dd></div><div><dt>Current league standing</dt><dd class="num">#${standing.rank}</dd></div><div><dt>Current points for</dt><dd class="num">${n(t.pointsFor)}</dd></div><div><dt>Manager</dt><dd class="words">${e(t.manager)}</dd></div></dl>${historyBlock(t)}<div class="detail-actions">${local('Inspect this week’s game →','matchup',{matchup:m.id},'team-game')}${exit('Team on GOAT',`/teams/${t.id}`)}</div><p class="exit-note">Opens the existing GOAT site in a new tab.</p>`;
  const roster = own ? `<section class="detail-quote">${quote(p)}<p class="prose" style="margin-top:22px">${p.playerEvidence.verifiedPlayers} of ${p.players.length} players have supplied completed-Week-2 points. No recorded team-value series is included.</p></section><form class="search-form" role="search" id="roster-search"><label for="player-search">Find a player in this roster<input id="player-search" type="search" name="player-name" autocomplete="off" placeholder="Player name"></label><button type="reset">Clear</button></form><p class="search-result" id="search-result" role="status">${p.players.length} of ${p.players.length} players</p><table class="data-table" id="roster-table"><caption>Your complete synthetic roster. Points refer to completed Week 2; quotes use modeled FAAB.</caption><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col">Week 2 points</th><th scope="col">Modeled FAAB</th><th scope="col">Evidence</th></tr></thead><tbody>${p.players.map(x=>`<tr data-player-name="${e(x.name.toLocaleLowerCase())}"><td>${e(x.name)}</td><td>${e(x.position)}</td><td>${x.completedWeekPoints==null?'Unavailable':`<span class="num">${n(x.completedWeekPoints)}</span>`}</td><td>${x.modeledFaab==null?'Unpriced':`<span class="num">${money(x.modeledFaab)}</span>`}</td><td>${local('Inspect →','player',{player:x.id},`roster-${x.id}`,'',`aria-label="Inspect ${e(x.name)}"`)}</td></tr>`).join('')}</tbody></table>` : '<p class="detail-description">This public summary shows team identity, current league context and qualified previous-season history. No private roster is shown in this view.</p>';
  return detailShell(t.name,`Managed by ${e(t.manager)}${own?' · Your synthetic team':''}`, overview+roster+source());
}
function matchupDetail(p) {
  const m = f.matchups.find(x=>x.id===route.matchup);
  if (!m) return unavailable();
  const a = team(m.home), b = team(m.away);
  const ai = p?.kind==='member' && p.matchup.id===m.id ? p.savedAi : null;
  return detailShell('The Week '+f.league.week+' pairing', `${e(a.name)} / ${e(b.name)}`, `<div class="detail-layout">${[[a,m.homePoints],[b,m.awayPoints]].map(([t,points])=>`<section class="match-team"><h2 class="big-team-name">${e(t.name)}</h2><p class="control">Manager: ${e(t.manager)} · current record <span class="num">${record(t)}</span></p><p class="detail-score ${points==null?'words':''}">${points==null?'Score unavailable':n(points)}</p>${local('Open team summary →','team',{team:t.id},`match-team-${t.id}`,'control')}</section>`).join('')}</div><p class="detail-description">${m.state==='partly_unavailable'?'One score is unavailable. The recorded zero is retained; the missing score is not zero. No leader or tie is inferred.':'Synthetic in progress. These supplied team scores are distinct from the completed-Week-2 player sample.'} Supplied ${date(f.asOf)}.</p><section class="model-detail"><h2>Saved model context</h2>${ai?.status==='ready'?`<p>${e(ai.label)}.</p><p class="model-meta">Saved ${date(ai.generatedAt)} · returned choice: ${e(team(ai.returnedChoice).name)}.</p><div class="model-result">${ai.probabilities.map(x=>`<p>${e(team(x.teamId).name)}<span class="num">${Math.round(x.probability*100)}%</span></p>`).join('')}</div><p class="model-meta">Separate model confidence: <span class="num">${ai.confidence}</span>. This is not a confidence interval or calibrated betting probability.</p>`:`<p>${ai?'No saved model estimate is supplied for your pairing.':'No saved model estimate is included in this public pairing view.'}</p>`}</section>${source()}`,'match-detail');
}
function leagueDetail() {
  return detailShell('The whole league',`2026 Week ${f.league.week} · current synthetic standings and manager directory`, `<p class="detail-description">These ranks are the supplied current standings, not modeled roster-value ranks. No previous-visit comparison is available.</p><table class="data-table" style="margin-top:28px"><caption>Current supplied league table</caption><thead><tr><th scope="col">Team / manager</th><th scope="col">Rank</th><th scope="col">Record</th><th scope="col">Points for</th></tr></thead><tbody>${f.standings.map(t=>`<tr><td>${local(e(t.name),'team',{team:t.id},`table-team-${t.id}`)}<small>${e(t.manager)}</small></td><td><span class="num">${t.rank}</span></td><td><span class="num">${record(t)}</span></td><td><span class="num">${n(t.pointsFor)}</span></td></tr>`).join('')}</tbody></table>${source()}`);
}
function unavailable() { return detailShell('This detail is not supplied','Choose a local team, game or player from the home page.','<p class="detail-description">This view does not infer a player, team or account from an unknown query.</p>'); }
async function render({focus=false,restore=null}={}) {
  const version = ++renderVersion;
  route = readRoute();
  document.documentElement.dataset.persona = route.persona;
  document.documentElement.dataset.stage = route.stage==='structure'?'structure':'color';
  delete document.documentElement.dataset.personalStudyReady;
  const p = route.persona==='guest'?null:f.personas[route.persona];
  const body = route.view==='home'?(p?memberHome(p):guestHome()):route.view==='player'?playerDetail(p):route.view==='team'?teamDetail(p):route.view==='matchup'?matchupDetail(p):route.view==='league'?leagueDetail():unavailable();
  document.title = `GOAT Hoopers — ${route.view==='home'?(p?p.team.name:'The club'):'Local '+route.view}`;
  app.innerHTML = header()+body+footer();
  if (focus) {document.getElementById('page-title')?.focus({preventScroll:true});window.scrollTo(0,0);}
  if (restore) await new Promise(resolve=>requestAnimationFrame(()=>{document.getElementById(restore.focusId)?.focus({preventScroll:true});window.scrollTo(0,restore.scrollY||0);resolve();}));
  const search = document.querySelector('#player-search');
  if (search) {
    const filter = () => {let count=0;const q=search.value.trim().toLocaleLowerCase();document.querySelectorAll('[data-player-name]').forEach(row=>{row.hidden=!row.dataset.playerName.includes(q);if(!row.hidden)count++;});document.querySelector('#search-result').textContent=`${count} of ${p.players.length} players`;};
    search.addEventListener('input',filter);
    document.querySelector('#roster-search').addEventListener('submit',ev=>ev.preventDefault());
    document.querySelector('#roster-search').addEventListener('reset',()=>requestAnimationFrame(()=>{filter();search.focus();}));
  }
  await document.fonts.ready;
  await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
  if (version===renderVersion) document.documentElement.dataset.personalStudyReady='07';
}
history.scrollRestoration='manual';
if (!history.state?.study07) history.replaceState({study07:true,depth:0,scrollY:0},'',location.href);
function navigate(url, origin, {resetDepth=false}={}) {
  const current = history.state || {study07:true,depth:0};
  history.replaceState({...current,scrollY:window.scrollY,focusId:origin?.id || null},'',location.href);
  const isHome = !(new URL(url,location.href).searchParams.get('view'));
  history.pushState({study07:true,depth:resetDepth||isHome?0:(current.depth||0)+1,scrollY:0},'',url);
  render({focus:true});
}
document.addEventListener('click',ev=>{
  const a=ev.target.closest('a');
  if(!a || ev.button!==0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  if(a.hasAttribute('data-return')) {ev.preventDefault();if(history.state?.depth>0)history.go(-history.state.depth);else navigate(a.href,a);return;}
  if(a.hasAttribute('data-home-anchor')) {ev.preventDefault();const id=a.dataset.homeAnchor;if(route.view==='home'){document.getElementById(id)?.scrollIntoView();document.getElementById(id)?.setAttribute('tabindex','-1');document.getElementById(id)?.focus({preventScroll:true});}else{navigate(a.href,a);requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView());}return;}
  if(a.hasAttribute('data-local')) {ev.preventDefault();navigate(a.href,a);}
});
document.addEventListener('change',ev=>{if(ev.target.id==='persona'){const q=new URLSearchParams({persona:ev.target.value});if(route.stage==='structure')q.set('stage','structure');navigate('?'+q,ev.target,{resetDepth:true});}});
window.addEventListener('popstate',()=>render({restore:history.state||{scrollY:0}}));
new ResizeObserver(()=>{
  const large = parseFloat(getComputedStyle(document.documentElement).fontSize) >= 24;
  if ((document.documentElement.dataset.largeText==='true')!==large) document.documentElement.dataset.largeText=String(large);
}).observe(app);
render();
