import { fixture } from '../fixture.js';

const app = document.querySelector('#app');
const teams = new Map(fixture.teams.map(team => [team.id, team]));
const $ = text => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const format = value => new Intl.NumberFormat('en-US', {maximumFractionDigits:2}).format(value);
const money = value => new Intl.NumberFormat('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}).format(value);
const asset = path => path;
let persona, personal, currentView, renderVersion = 0;

function local(view = 'home', id = '', hash = '') {
  const url = new URL(location.href);
  url.searchParams.set('persona', persona);
  url.searchParams.delete('view'); url.searchParams.delete('id');
  if (view !== 'home') { url.searchParams.set('view', view); if (id) url.searchParams.set('id', id); }
  url.hash = hash;
  return `${url.pathname}${url.search}${url.hash}`;
}
function link(view, id, text, attrs = '') {
  return `<a data-local href="${$(local(view, id))}" ${attrs}>${text}</a>`;
}
function exit(path, text, attrs = '') {
  return `<a href="https://goathoopers.com${$(path)}" ${attrs} aria-label="${$(text)} — leaves prototype for current GOAT site">${$(text)}</a>`;
}
function record(team) { return `${team.wins}–${team.losses}`; }
function rankFor(id) { return fixture.standings.find(team => team.id === id); }
function rankWord(rank) { return ({1:'first',2:'second',3:'third',4:'fourth',5:'fifth',6:'sixth',7:'seventh',8:'eighth',9:'ninth',10:'tenth'})[rank]; }
function pairingFor(id) { return fixture.matchups.find(pair => pair.home === id || pair.away === id); }
function selectedPlayer(id) { return personal?.kind === 'member' ? personal.players.find(player => player.id === id) : null; }
function title(text) { document.title = `${text} — GOAT Hoopers synthetic demo`; }

function header() {
  return `<header class="wrap"><div class="masthead">
    ${link('home', '', `<img src="${asset(fixture.assets.logo)}" alt="GOAT Hoopers" width="200" height="57">`, 'class="brand" aria-label="GOAT Hoopers demo home"')}
    <nav class="main-nav" aria-label="Main navigation">
      ${link('home', '', 'Home', currentView === 'home' ? 'aria-current="page"' : '')}
      ${personal.kind === 'member' ? link('team', personal.teamId, 'My team', currentView === 'team' ? 'aria-current="page"' : '') : exit('/login','Sign in on GOAT')}
      <a data-local href="${$(local('home','','league'))}">The league</a>
      <a data-local href="${$(local('home','','explore'))}">Explore GOAT</a>
    </nav></div>
    <div class="utility"><div class="demo-info"><span class="demo-label">Synthetic demo</span><span>30 Oct 2026 · 08:30 UTC</span><a href="#sources">About the sources</a></div>
    <div class="persona-control"><label for="persona">Demo persona</label><select id="persona" name="persona"><option value="reaves" ${persona==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${persona==='guest'?'selected':''}>Guest</option></select></div></div></header>`;
}

function footer() {
  const groups = [
    ['League', ['/teams','/transactions','/draft','/intel','/table']],
    ['Tools', ['/stocks','/ai-decides','/trade-analyzer']],
    ['Read & play', ['/news','/history','/weekly','/arcade']],
    ['Account', ['/','/team','/login']]
  ];
  return `<footer class="site-footer"><div class="wrap"><div class="footer-intro"><div><img class="footer-logo" src="${asset(fixture.assets.logoDark)}" alt="GOAT Hoopers" width="160" height="46"><h2>Stay close to your league.</h2></div><p>Current GOAT site<br><strong>These links leave the prototype.</strong><br>Find the full tools, stories and your real account on GOAT.</p></div>
  <div class="footer-groups">${groups.map(([name,paths])=>`<section class="footer-group"><h3>${name}</h3><ul>${paths.map(path=>`<li>${exit(path,fixture.destinations.find(item=>item.href===path)?.label ?? path)}</li>`).join('')}</ul></section>`).join('')}</div>
  <details class="sources" id="sources"><summary>About this synthetic demo & its sources</summary><div class="source-content"><p>${$(fixture.notice)}</p><p>${$(fixture.league.source)}</p><ul><li>${$(fixture.provenance.identitiesAndPlayerReferences)}</li><li>${$(fixture.provenance.history)}</li><li>Current scores are in-progress sample values, not final results. An unavailable score is never zero.</li><li>Completed player samples are from synthetic Week 2, October 19–25. They are separate from the current Week 3 matchup.</li><li>Modeled FAAB quotes are valuation units, not money held. Missing prices stay unpriced, and no league value rank is available.</li><li>There is no recorded value history or Lineup Power snapshot in this fixture. No trend line, lineup change, submitted trade, new model call or account action is simulated.</li><li>The saved Reaves estimate was constructed for this demo. Probability and confidence are distinct; it is not calibrated betting information.</li></ul><p>Scenario as of October 30, 2026, 08:30 UTC. All local inspection uses the supplied fixture; no live account, league or market connection.</p></div></details>
  <p class="footer-end">GOAT Hoopers · 2026 season · Independent homepage concept 05</p></div></footer>`;
}

function identity() {
  if (personal.kind !== 'member') return `<section class="identity"><div class="identity-copy"><p class="eyebrow">2026 season · Week 3</p><h1 id="page-heading" tabindex="-1">The league, in good company.</h1><p>Ten clubs. The games, the people, and a place to start.</p></div><div class="identity-actions">${exit('/login','Sign in on GOAT','class="button"')}<span class="meta">Leaves this prototype</span></div></section>`;
  return `<section class="identity"><div class="identity-copy"><p class="eyebrow">Your league home · ${$(personal.team.manager)}</p><h1 id="page-heading" tabindex="-1">${$(personal.team.name)}</h1><p class="season-line"><span>${record(personal.team)} · ${rankWord(personal.standing.rank)} in the current table</span>${link('matchup', personal.matchup.id, `Week 3 against ${$(personal.opponent.name)}`, 'id="context-matchup"')}</p></div><div class="identity-actions">${link('team',personal.teamId,'Open my team','class="button secondary" id="open-my-team"')}<span class="meta">${personal.players.length} players in this demo roster</span></div></section>`;
}

function playerReadings() {
  const players = personal.players.filter(player=>player.participation === 'verified_demo' && Number.isFinite(player.completedWeekPoints)).sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints);
  return `<section class="players ${players.length===3?'three':''}" aria-labelledby="player-heading" id="players"><h2 id="player-heading">Last week on<br>your roster.</h2><p class="section-intro">Completed Week 2 · October 19–25, 2026.<br>${players.length} of ${personal.players.length} players in the supplied synthetic sample.</p><ol class="player-readings">${players.map((player,index)=>`<li class="player-reading"><div class="player-with-photo">${player.portrait ? `<img class="row-photo" src="${asset(player.portrait)}" alt="" width="72" height="48">` : ''}<div>${link('player',player.id,$(player.name),`class="player-name" id="${index===0?'action-player':`player-${player.id}`}" aria-label="Open ${$(player.name)} — completed Week 2 sample"`)}<span class="row-position">${$(player.position)}</span></div></div><p class="points num">${format(player.completedWeekPoints)}<span class="unit">points</span></p></li>`).join('')}</ol><div class="bottom-link">${link('team',personal.teamId,`See all ${personal.players.length} players`,'class="quiet-link" id="all-players"')}</div></section>`;
}

function neighborhood() {
  const rank = personal.standing.rank;
  const rows = rank === 1 ? fixture.standings.slice(0,3) : [personal.standing,...fixture.standings.slice(Math.max(0,rank-3),rank-1).reverse()];
  return `<section class="neighborhood" id="league" tabindex="-1" aria-labelledby="place-heading"><div><p class="eyebrow">The competition</p><h2 id="place-heading">Your place: ${rankWord(rank)}.</h2></div><ol class="standing-list">${rows.map((team,index)=>`<li class="standing-spot ${index===0?'current':''}"><span class="rank num">${team.rank.toString().padStart(2,'0')}</span><div>${link('team',team.id,$(team.name),`id="nearby-${team.id}"`)}<p class="club-info">${$(team.manager)}<br>${record(team)} · ${format(team.pointsFor)} points for${index===0?' · Your team':''}</p></div></li>`).join('')}</ol><div><p class="meta">Current synthetic standings. Record and points for describe this season, not a forecast.</p><div class="standing-links">${link('standings','','Open full standings','class="quiet-link" id="action-standings"')}</div></div></section>`;
}

function publicTop() {
  return `<section class="players meet-leaders" aria-labelledby="leaders-heading"><h2 id="leaders-heading">The clubs<br>out in front.</h2><p class="section-intro">The current top three, after two synthetic weeks. Meet the managers and see the whole table.</p><ol>${fixture.standings.slice(0,3).map((team,index)=>`<li class="leader-reading"><span class="num rank">${team.rank.toString().padStart(2,'0')}</span><div>${link('team',team.id,$(team.name),`class="club-name" id="${index===0?'action-team':`leader-${team.id}`}"`)}<p class="meta">${$(team.manager)} · ${format(team.pointsFor)} points for</p></div><span class="num record">${record(team)}</span></li>`).join('')}</ol><div class="bottom-link">${link('standings','','Open all standings','class="quiet-link" id="action-standings"')}</div></section><section class="neighborhood league-format" id="league" tabindex="-1" aria-labelledby="format-heading"><p class="eyebrow">GOAT Hoopers · 2026</p><h2 id="format-heading">A little league.<br>A lot of people.</h2><div class="format-facts"><p><span class="num">10</span>clubs in the league</p><p><span class="num">6</span>playoff places</p><p><span class="num">20</span>first playoff week</p></div><p>Follow the current matchups, get to know a club, or head to GOAT for your actual team.</p><p class="meta">Format facts do not imply a club's playoff chance. This entire current scenario is synthetic.</p></section>`;
}

function scores(pair) {
  return `<div class="score-pair"><div class="score-team"><span class="name">${$(teams.get(pair.home).name)}</span><span class="score ${pair.homePoints===null?'missing':'num'}">${pair.homePoints===null?'Score unavailable':format(pair.homePoints)}</span></div><span class="versus">vs</span><div class="score-team"><span class="name">${$(teams.get(pair.away).name)}</span><span class="score ${pair.awayPoints===null?'missing':'num'}">${pair.awayPoints===null?'Score unavailable':format(pair.awayPoints)}</span></div></div>`;
}
function matchBand(pair) {
  const missing = pair.homePoints === null || pair.awayPoints === null;
  return `<section class="match-band" aria-labelledby="match-heading"><div class="match-label"><p class="eyebrow">Week 3</p><h2 id="match-heading">${personal.kind==='member'?'Your current game.':'Start with this game.'}</h2></div>${scores(pair)}<div class="match-action">${link('matchup',pair.id,'Open matchup','class="button" id="action-matchup"')}<p class="meta">${missing?'Partly unavailable':'Synthetic in progress'}</p></div>${missing?'<p class="score-note">Papichooter has a recorded zero. NeuralNets has no returned score; no leader can be inferred.</p>':'<p class="score-note">Current synthetic scores · not final results.</p>'}</section>`;
}
function otherGames(featuredId) {
  return `<section class="other-games" aria-labelledby="games-heading"><h2 id="games-heading">Elsewhere in Week 3.</h2><p class="intro">Four more pairings. Open a game to meet the teams and read its current context.</p><ul>${fixture.matchups.filter(pair=>pair.id!==featuredId).map(pair=>`<li class="other-game"><div class="teams"><span>${$(teams.get(pair.home).name)}</span><span>${$(teams.get(pair.away).name)}</span></div><div class="other-scores num">${pair.homePoints===null?'<span class="unavailable">Unavailable</span>':format(pair.homePoints)}<br>${pair.awayPoints===null?'<span class="unavailable">Unavailable</span>':format(pair.awayPoints)}</div>${link('matchup',pair.id,'Open this matchup',`id="game-${pair.id}" aria-label="Open ${$(teams.get(pair.home).name)} against ${$(teams.get(pair.away).name)}"`)}${pair.awayPoints===null?'<p class="meta">Recorded zero for papichooter; NeuralNets score unavailable.</p>':''}</li>`).join('')}</ul></section>`;
}
function explore() {
  return `<section class="explore" id="explore" tabindex="-1" aria-labelledby="explore-heading"><h2 id="explore-heading">Take it further.</h2><p>Your next stop in GOAT. These links open the current site and leave this prototype.</p><a class="destination" href="https://goathoopers.com/stocks" aria-label="Open Stocks — leaves prototype"><strong>Get a feel for the market.</strong><p>Explore modeled player quotes in Stocks.</p><span class="exit-note">Stocks · leaves prototype</span></a><a class="destination" href="https://goathoopers.com/arcade" aria-label="Open Arcade — leaves prototype"><img class="game-image" src="${asset(fixture.assets.game)}" alt="Preview of the GOAT free-throw practice court" loading="lazy" width="600" height="222"><strong>A few shots between games.</strong><p>Head to Arcade for the practice court.</p><span class="exit-note">Arcade · leaves prototype</span></a></section>`;
}
function remainingClubs() {
  return `<section class="clubs" id="explore" tabindex="-1" aria-labelledby="clubs-heading"><h2 id="clubs-heading">Meet the rest.</h2><p class="section-intro">Seven more managers in the mix. Open a public club summary, or find league tools below.</p><ul>${fixture.standings.slice(3).map(team=>`<li>${link('team',team.id,`<span class="club-number num">${team.rank.toString().padStart(2,'0')}</span><span class="club-name">${$(team.name)}<span class="manager">${$(team.manager)}</span></span>`,'class="club-link"')}</li>`).join('')}</ul></section>`;
}
function home() {
  title(personal.kind==='member'?personal.team.name:'Your league');
  const pair = personal.kind === 'member' ? personal.matchup : fixture.matchups[0];
  return `<main id="content" class="wrap" data-view="home">${identity()}<div class="top-grid">${personal.kind==='member'?playerReadings()+neighborhood():publicTop()}</div>${matchBand(pair)}<div class="lower-grid">${personal.kind==='member'?explore():remainingClubs()}${otherGames(pair.id)}</div></main>`;
}

function detailIntro(heading, subtitle, eyebrow='Local demo inspection') {
  return `<a data-local class="back-link" id="back-home" href="${$(local())}">Back to ${personal.kind==='member'?'your homepage':'league home'}</a><div class="detail-intro"><p class="eyebrow">${eyebrow}</p><h1 id="page-heading" tabindex="-1">${$(heading)}</h1><p>${subtitle}</p></div>`;
}
function teamView(id) {
  const team = teams.get(id); if (!team) return unknownView();
  title(team.name);
  const standing = rankFor(id), pair = pairingFor(id), own = personal.kind==='member' && personal.teamId===id;
  const opponent = teams.get(pair.home===id?pair.away:pair.home);
  const previous = team.previousSeason;
  return `<main id="content" class="wrap detail" data-view="team" data-team-id="${$(id)}">${detailIntro(team.name,`${$(team.manager)} · ${record(team)} · ${rankWord(standing.rank)} in the current synthetic standings`,'The club')}<div class="detail-grid"><section class="prose"><h2>Week 3 against ${$(opponent.name)}.</h2><p>${$(team.name)} has ${format(team.pointsFor)} points for in the current synthetic season. Its current opponent is ${$(opponent.name)}, ${record(opponent)} and ${rankWord(rankFor(opponent.id).rank)} in the table.</p><div>${link('matchup',pair.id,'Open the current matchup','class="button" id="team-matchup"')}</div><h2>In good company.</h2><p>Get a wider look at the league and the managers around this club.</p><div>${link('standings','','Open full standings','class="quiet-link"')}</div></section><section class="detail-panel"><h2>Previous season</h2><p class="num shape-number">${previous.season}</p><p>${previous.wins}–${previous.losses} · finish ${previous.finish}</p>${previous.ownerNote?`<p class="history-note"><strong>${$(previous.ownerNote)}</strong> This historical record is not attributed to the current manager.</p>`:''}<p class="history-note">Retained project historical reference, separate from the synthetic current season.</p></section></div>
  ${own?rosterView():`<section class="detail-section prose"><h2>Roster context</h2><p>A full public roster is not supplied for this local club view. No players are inferred from a team name or a past result.</p>${exit(`/teams/${id}`,'Open the team on GOAT','class="quiet-link"')}<p class="meta">Leaves this prototype.</p></section>`}</main>`;
}
function rosterView() {
  const v = personal.valuation;
  return `<section class="detail-section" aria-labelledby="roster-heading"><h2 id="roster-heading">Your ${personal.players.length} players.</h2><p>${v.complete?'Current modeled roster value':'Current modeled roster subtotal'}: <strong class="num">${money(v.modeledFaabSubtotal)}</strong> FAAB · ${v.priced}/${v.roster} quotes. ${v.complete?'Every sample roster player has a quote.':'Unpriced players are not zero and prevent a complete total.'}</p><p class="meta">Quote check: October 30, 08:10 UTC. Modeled FAAB is a valuation unit, not an account balance.</p><details class="source-box"><summary>Why no league value rank or trend?</summary><p>${$(v.rankUnavailableReason)}</p><p>${$(personal.history.reason)}</p></details><table class="roster-table" id="roster-table"><caption class="meta">Synthetic current quotes and separate completed Week 2 samples · October 19–25</caption><thead><tr><th scope="col">Player</th><th scope="col">Modeled FAAB</th><th scope="col">Week 2 sample points</th></tr></thead><tbody>${personal.players.map(player=>`<tr><td>${link('player',player.id,$(player.name))}<br>${$(player.position)}</td><td class="${player.modeledFaab===null?'':'num'}">${player.modeledFaab===null?'Unpriced':money(player.modeledFaab)}</td><td class="${player.completedWeekPoints===null?'':'num'}">${player.completedWeekPoints===null?'Evidence unavailable':format(player.completedWeekPoints)}</td></tr>`).join('')}</tbody></table></section>`;
}
function playerView(id) {
  const player = selectedPlayer(id); if (!player) return unknownView('Player context is not available in this demo persona.');
  title(player.name);
  return `<main id="content" class="wrap detail" data-view="player" data-player-id="${$(id)}">${detailIntro(player.name,`${$(player.position)} · On ${$(personal.team.name)} in this synthetic fixture`,'A closer look')}<div class="detail-grid"><section class="prose">${player.portrait?`<img class="detail-photo" src="${asset(player.portrait)}" alt="${$(player.name)}" width="300" height="200">`:''}<h2>Completed Week 2.</h2><p>October 19–25, 2026 · synthetic counted-player sample.</p><p class="num shape-number" id="player-points">${player.completedWeekPoints===null?'Evidence unavailable':`${format(player.completedWeekPoints)} points`}</p><p>${player.completedWeekPoints===null?'This fixture has no completed-week evidence for this player. No zero, DNP or poor performance is inferred.':'This is a supplied completed-week player total. It is separate from the current Week 3 matchup and does not establish whole-roster performance.'}</p><p class="meta">${personal.playerEvidence.verifiedPlayers} of ${personal.playerEvidence.rosterPlayers} roster players have counted evidence in this sample. No per-game breakdown, games-played count or injury designation is supplied.</p></section><section class="detail-panel"><h2>Current modeled quote</h2><p class="num shape-number" id="player-quote">${player.modeledFaab===null?'Unpriced':money(player.modeledFaab)}</p><p>${player.modeledFaab===null?'No usable quote is supplied for this player. Unpriced does not mean zero.':'Modeled FAAB valuation units, not money held or a transaction price.'}</p><p class="meta">Roster quote coverage: ${personal.valuation.priced}/${personal.valuation.roster}. Checked October 30, 08:10 UTC.</p><p class="meta">No league value rank is supplied. Current quote and completed-week points are different measures.</p>${exit(`/player/${id}`,'Open player on GOAT','class="quiet-link"')}<p class="meta">Leaves this prototype.</p></section></div><section class="detail-section prose"><h2>Keep the team in view.</h2><p>See every player in your supplied roster, or return to this week's opponent.</p><div class="detail-links">${link('team',personal.teamId,'Open my team','class="button secondary"')}${link('matchup',personal.matchup.id,'Open Week 3 matchup','class="button secondary"')}</div></section></main>`;
}
function matchupView(id) {
  const pair = fixture.matchups.find(item=>item.id===id); if(!pair)return unknownView();
  const a = teams.get(pair.home), b=teams.get(pair.away), missing=pair.homePoints===null||pair.awayPoints===null;
  const own=personal.kind==='member' && personal.matchup.id===pair.id;
  title(`${a.name} vs ${b.name}`);
  return `<main id="content" class="wrap detail" data-view="matchup" data-matchup-id="${$(id)}">${detailIntro(`${a.name} vs ${b.name}`,'Week 3 · Current synthetic matchup, not a final result','The current game')}<div class="detail-grid"><section class="detail-score"><h2>${missing?'Partly unavailable.':'In progress, in this demo.'}</h2>${scores(pair)}<p id="matchup-state">${missing?'Papichooter has a recorded zero. NeuralNets has no returned score. A leader or margin cannot be determined.':`The current difference is ${format(Math.abs(pair.homePoints-pair.awayPoints))} points. These are synthetic in-progress figures, not verified completed results.`}</p><p class="meta">Scenario as of October 30, 2026, 08:30 UTC. No live score request or automatic refresh.</p></section><section class="detail-panel"><h2>The clubs</h2><ul class="plain-list">${[a,b].map(team=>`<li>${link('team',team.id,$(team.name))}<p>${$(team.manager)}<br>${record(team)} · ${rankWord(rankFor(team.id).rank)} in current standings<br>${format(team.pointsFor)} points for</p></li>`).join('')}</ul>${link('standings','','Open full standings','class="quiet-link"')}</section></div>${own?modelView():`<section class="detail-section prose"><h2>Model context</h2><p>No matching public saved model estimate is supplied for this local matchup view. No probabilities are invented.</p></section>`}</main>`;
}
function modelView() {
  const model=personal.savedAi;
  if(model.status!=='ready')return `<section class="detail-section prose" id="saved-model"><h2>Saved model context</h2><p>No saved estimate is available for NeuralNets in this fixture. No probability or model choice is inferred.</p></section>`;
  return `<section class="detail-section" id="saved-model"><h2>A saved view of the pairing.</h2><p>Synthetic saved estimate · October 26, 2026, 08:00 UTC. Not calibrated odds or a fresh reaction to the score.</p><div class="model-split">${model.probabilities.map(row=>`<p><span class="num">${Math.round(row.probability*100)}%</span>${$(teams.get(row.teamId).name)}</p>`).join('')}</div><details class="source-box"><summary>Model source and confidence</summary><p>${$(model.label)}</p><p>Returned choice: ${$(teams.get(model.returnedChoice).name)}. Confidence: ${model.confidence}. Confidence is separate from the saved win probabilities.</p><p>This design fixture supplies the result, timestamp, choice, probabilities and confidence. It supplies no model identifier, prompt or input snapshot; those fields are not invented. No generation is performed.</p></details></section>`;
}
function standingsView() {
  title('Current standings');
  return `<main id="content" class="wrap detail" data-view="standings">${detailIntro('All ten, in the mix.','Current synthetic standings · 2026 season · after two completed demo weeks','The league table')}<table class="standings-table" id="full-standings"><caption class="meta">Current rank, record and points for. No earlier-rank change or playoff odds are inferred.</caption><thead><tr><th scope="col">Rank</th><th scope="col">Club / manager</th><th scope="col">Record</th><th scope="col">Points for</th></tr></thead><tbody>${fixture.standings.map(team=>`<tr ${personal.kind==='member'&&team.id===personal.teamId?'aria-current="true"':''}><td class="num">${team.rank}</td><td>${link('team',team.id,$(team.name))}<br>${$(team.manager)}${personal.kind==='member'&&team.id===personal.teamId?'<br><strong>Your team</strong>':''}</td><td class="num">${record(team)}</td><td class="num">${format(team.pointsFor)}</td></tr>`).join('')}</tbody></table><section class="detail-section prose"><h2>The format</h2><p>Ten clubs compete for six playoff places. Playoffs begin in Week 20. These are format facts, not estimates of any team's chance.</p></section></main>`;
}
function unknownView(message='That local fixture item is unavailable.') {
  title('Local view unavailable');
  return `<main id="content" class="wrap detail error-view" data-view="unavailable">${detailIntro('A little context is missing.',$(message))}<p>No team, player or score has been guessed. Return to the homepage or use the labeled demo selector.</p></main>`;
}

async function ready(version) {
  await document.fonts.ready;
  await Promise.all([...document.images].filter(img=>!img.loading||img.loading!=='lazy').map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
  if(version===renderVersion)document.documentElement.dataset.personalStudyReady='05';
}
function render() {
  const url = new URL(location.href);
  persona = ['reaves','neural','guest'].includes(url.searchParams.get('persona'))?url.searchParams.get('persona'):'reaves';
  personal=fixture.personas[persona]; currentView=url.searchParams.get('view')||'home';
  document.documentElement.dataset.persona=persona;
  document.documentElement.dataset.stage=url.searchParams.get('stage')==='structure'?'structure':'finished';
  delete document.documentElement.dataset.personalStudyReady;
  const id = url.searchParams.get('id');
  const view=currentView==='home'?home():currentView==='team'?teamView(id):currentView==='player'?playerView(id):currentView==='matchup'?matchupView(id):currentView==='standings'?standingsView():unknownView();
  app.innerHTML=header()+view+footer();
  ready(++renderVersion);
}
function saveEntry(trigger) {
  const state = {...history.state, scroll:window.scrollY, focusId:trigger?.id||null};
  history.replaceState(state,'',location.href);
}
function focusRendered(restore=false) {
  requestAnimationFrame(()=>{
    const state=history.state;
    const hash=location.hash.slice(1);
    const focusTarget=restore&&state?.focusId?document.getElementById(state.focusId):hash?document.getElementById(hash):document.getElementById('page-heading');
    focusTarget?.focus({preventScroll:true});
    if(restore)window.scrollTo(0,state?.scroll||0);
    else if(hash)document.getElementById(hash)?.scrollIntoView();
    else window.scrollTo(0,0);
  });
}
document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[data-local]');
  if(!anchor||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(anchor.href);
  if(url.origin!==location.origin)return;
  event.preventDefault();saveEntry(anchor);history.pushState({},'',url);render();focusRendered();
});
document.addEventListener('change',event=>{
  if(event.target.id!=='persona')return;
  saveEntry(event.target);
  const url=new URL(location.href);url.searchParams.set('persona',event.target.value);url.searchParams.delete('view');url.searchParams.delete('id');url.hash='';
  history.pushState({},'',url);render();focusRendered();
});
window.addEventListener('popstate',()=>{render();focusRendered(true);});
render();
if(new URL(location.href).searchParams.get('view'))focusRendered();
