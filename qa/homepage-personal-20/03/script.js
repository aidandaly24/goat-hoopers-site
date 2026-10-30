import { fixture } from '../fixture.js';

const root = document.documentElement;
const main = document.querySelector('#main');
const initial = new URLSearchParams(location.search);
const personaKey = Object.hasOwn(fixture.personas, initial.get('persona')) ? initial.get('persona') : 'reaves';
const person = fixture.personas[personaKey];
const member = person.kind === 'member';
root.dataset.persona = personaKey;
if (initial.get('stage') === 'structure') root.dataset.stage = 'structure';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
const money = value => new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const team = id => fixture.teams.find(t=>t.id===id);
const ordinal = n => `${n}${n%100>10&&n%100<14?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th')}`;
const firsts = name => name.split(' ').map(n=>n[0]).slice(0,2).join('');
const ownPlayer = id => member ? person.players.find(p=>p.id===id) : null;
const defaultMatch = () => member ? person.matchup : fixture.matchups[0];
function urlFor(view='home', extra={}) {
  const query = new URLSearchParams();
  query.set('persona',personaKey);
  if(root.dataset.stage==='structure') query.set('stage','structure');
  if(view!=='home') query.set('view',view);
  for(const [key,value] of Object.entries(extra)) if(value!==undefined&&value!==null) query.set(key,value);
  return `?${query.toString()}`;
}
function local(text,view,extra={},id='',className='text-link') {
  return `<a data-local${id?` id="${esc(id)}"`:''} href="${esc(urlFor(view,extra))}" class="${className}">${esc(text)}</a>`;
}
function external(text,href,className='text-link') {
  return `<a href="https://goathoopers.com${href}" class="${className}">${esc(text)}</a>`;
}
function labelExits(container) {
  container.querySelectorAll('a[href^="https://goathoopers.com"]').forEach(link=>{
    if(link.querySelector('.exit-icon'))return;
    link.setAttribute('aria-label',`${link.textContent.trim()} — current GOAT site; leaves prototype`);
    link.insertAdjacentHTML('beforeend','<svg class="exit-icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 10 10 2M3 2h7v7"/></svg>');
  });
}
function portrait(player,className='',large=false) {
  return player.portrait ? `<img class="${className}" src="${esc(player.portrait)}" alt="${large?`Approved portrait of ${esc(player.name)}`:''}" width="300" height="201">` : `<span class="profile-initials" aria-label="No portrait supplied">${esc(firsts(player.name))}</span>`;
}
function scoreText(value, ribbon=false) {
  return value===null ? `<span class="${ribbon?'ribbon-pending':'unavailable'}">Score unavailable</span>` : num(value);
}
function scoreFor(m,id) { return m.home===id?m.homePoints:m.awayPoints; }
function heading(title,eyebrow,description='',action='') {
  return `<div class="destination-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1 tabindex="-1">${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:''}</div>${action}</div>`;
}
function backLink(fallback='home',text='Back to the edition') {
  return `<a data-back href="${esc(urlFor(fallback))}" class="back-link">← ${esc(text)}</a>`;
}
function pairingRibbon() {
  if(!member)return `<section class="match-ribbon" aria-label="This week's public edition"><div class="ribbon-inner"><p class="ribbon-week">Week 03<br>2026 season</p><div class="ribbon-pair"><span class="ribbon-team">Ten teams. Five pairings.</span><span class="ribbon-vs">A public look at the synthetic week.</span></div>${local('Explore this week →','league',{},'ribbon-week','ribbon-link')}</div></section>`;
  return `<section class="match-ribbon" aria-label="Your current matchup"><div class="ribbon-inner"><p class="ribbon-week">Your matchup<br>Week 03</p><div class="ribbon-pair"><span class="ribbon-team">${esc(person.team.name)}</span><span class="ribbon-score">${scoreText(scoreFor(person.matchup,person.teamId),true)}</span><span class="ribbon-vs">vs</span><span class="ribbon-team">${esc(person.opponent.name)}</span><span class="ribbon-score">${scoreText(scoreFor(person.matchup,person.opponent.id),true)}</span></div>${local('Open your matchup →','matchup',{matchup:person.matchup.id},'ribbon-matchup','ribbon-link')}</div></section>`;
}
function editionHeading() {
  return `<div class="wrap edition-heading"><div><p class="eyebrow">Courtside / Your weekly point of view</p><h1 tabindex="-1">${member?`${esc(person.team.name)}’s edition.`:'A league worth keeping up with.'}</h1><p class="byline">${member?`For ${esc(person.team.manager)} · 2026 season · ${person.team.wins}–${person.team.losses} record`:'The public GOAT Hoopers edition · 10 teams · 2026 season'}</p></div><p class="edition-date">Friday, 30 October 2026<br>Week 03 · Synthetic edition</p></div>`;
}
function leadFeature() {
  const p=ownPlayer(personaKey==='reaves'?'1511':'1380');
  return `<article class="lead-feature" aria-labelledby="lead-title"><div class="feature-heading"><div><p class="eyebrow">The names on your roster</p><h2 id="lead-title">${personaKey==='reaves'?'Embiid & Şengün: your frontcourt.':'Giannis & LaMelo: two names in your week.'}</h2></div></div><figure><div class="feature-visual"><div class="portrait-stage"><span class="position-label">${esc(p.position)}<br>${personaKey==='reaves'?'Joel Embiid':'Giannis Antetokounmpo'}</span>${portrait(p,'',true)}</div><div class="court-inset"><img src="${fixture.assets.court}" alt="GOAT Hoopers' illustrated home court and crowd" width="1440" height="810"></div></div><figcaption class="image-caption"><span>${esc(p.name)} · ${esc(person.team.name)}</span><span>Roster portrait / GOAT court artwork</span></figcaption></figure><div class="feature-body"><div><p>${personaKey==='reaves'?'Your 2–0 start meets Ware the Hoes At? this week. Joel Embiid and Alperen Şengün are two centers on your 24-player roster, and a useful place to begin a closer look at the team you own.':'At 0–2, NeuralNets faces a 2–0 papichooter side. Giannis Antetokounmpo at power forward and LaMelo Ball at point guard give this edition two different positions to begin exploring your 22-player roster.'}</p><p>${personaKey==='reaves'?'The sample has 38 counted Week 2 points for Embiid, alongside a current modeled quote of $137.50 FAAB. Those figures describe different periods; the player profile puts both in context.':'Giannis has 45 counted points in the completed Week 2 sample, alongside a modeled quote of $135.50 FAAB. Open his profile, then follow the rest of your roster on its own page.'}</p>${local(`Open ${personaKey==='reaves'?'Embiid':'Giannis'}’s player profile →`,'player',{player:p.id},'lead-player')}</div><aside class="feature-note" aria-label="Selected player facts"><div><p class="eyebrow">${esc(p.name)}</p><p class="feature-value data">${num(p.completedWeekPoints)}</p><p class="small">Counted points<br>Synthetic completed Week 2</p></div><hr class="story-rule"><div><p class="feature-value data">$${money(p.modeledFaab)}</p><p class="small">Modeled FAAB quote<br>October 30 · not a cash balance</p></div></aside></div></article>`;
}
function supportFeature() {
  const p=ownPlayer(personaKey==='reaves'?'2308':'2179');
  return `<article class="support-story" aria-labelledby="support-title"><div><p class="eyebrow">Another part of your team</p><h3 id="support-title">${personaKey==='reaves'?'Alperen Şengün, alongside Embiid.':'LaMelo Ball, from the backcourt.'}</h3><p>${personaKey==='reaves'?'Şengün is another center in your roster, with a modeled quote of $108.25 FAAB. His profile sits one step from Embiid’s, so you can move between two of your frontcourt names.':'LaMelo is a point guard on your roster, with a modeled quote of $77.75 FAAB. His profile gives you a different position to explore after Giannis.'}</p><p class="sample-status">Completed Week 2 sample: not supplied.</p>${local(`Open ${personaKey==='reaves'?'Şengün':'LaMelo'}’s profile →`,'player',{player:p.id},'support-player')}</div><figure><div class="support-portrait">${portrait(p,'',true)}</div><figcaption class="support-caption">${esc(p.name)} · ${esc(p.position)}<br>Owned by ${esc(person.team.name)}</figcaption></figure></article>`;
}
function savedModel() {
  if(!member||person.savedAi.status!=='ready')return `<p class="small">No saved model estimate is supplied for this pairing. No pick or probabilities are inferred.</p>`;
  return `<details class="model-details"><summary>A saved view of this pairing</summary><div class="model-probabilities"><span>Reaves 56%</span><span>Ware 44%</span></div><p>Returned choice: Reaves Dropper. Confidence: <span class="data">0.35</span>, separate from the two probabilities.</p><p>Synthetic saved model estimate; not calibrated odds. Generated October 26 at 08:00 UTC. No fresh model run is performed.</p></details>`;
}
function nextStops() {
  const steps=member?[
    ['Open your matchup',`Week 3 · ${person.opponent.name}`,'matchup',{matchup:person.matchup.id}],
    ['Browse your roster',`${person.players.length} owned players, one place`,'roster',{}],
    ['Follow the league',`${ordinal(person.standing.rank)} in the synthetic table`,'league',{}]
  ]:[['Browse the teams','Ten franchises, their managers & history','league',{}],['Follow this week','All five public pairings','matchup',{matchup:'m1'}]];
  return `<section class="next-index" aria-labelledby="next-title"><p class="eyebrow">Keep your week moving</p><h2 id="next-title">Your next stop</h2><ol class="next-stops">${steps.map(([name,note,view,extra],i)=>`<li><a data-local id="next-${i+1}" href="${esc(urlFor(view,extra))}"><span class="step">0${i+1}</span><span><strong>${esc(name)}</strong><small>${esc(note)}</small></span><span class="go" aria-hidden="true">→</span></a></li>`).join('')}${!member?`<li><a href="https://goathoopers.com/login"><span class="step">03</span><span><strong>Find your own team</strong><small>Sign in on the current GOAT site</small></span><span class="go" aria-hidden="true">→</span></a></li>`:''}</ol></section>`;
}
function personalRail() {
  const v=person.valuation;
  return `<aside class="reading-rail" aria-label="Your next actions and season context">${nextStops()}<section class="rail-column"><p class="eyebrow">The season column</p><h3>${personaKey==='reaves'?'Two wins. This week, Ware.':'Papichooter is next.'}</h3><p>${personaKey==='reaves'?'Reaves Dropper leads the table after two completed weeks. Your current 184.5–171 pairing is in progress: a 13.5-point lead in this synthetic snapshot, not a final result.':'Papichooter is third at 2–0; NeuralNets is tenth at 0–2. Your next pairing is the point of focus. Papichooter’s recorded zero and your unavailable score cannot establish a leader.'}</p><dl class="season-facts"><div><dt>Your record</dt><dd>${person.team.wins}–${person.team.losses}</dd></div><div><dt>League position</dt><dd>${ordinal(person.standing.rank)} <span class="small">/ 10</span></dd></div></dl>${savedModel()}</section><section class="quote-summary" aria-labelledby="quote-title"><p class="eyebrow" id="quote-title">${v.complete?'Your roster, priced':'Your available roster quotes'}</p><p class="quote-value data">$${money(v.modeledFaabSubtotal)}</p><p>${v.complete?'Modeled FAAB · 24 of 24 players quoted. Your complete roster total is available.':'Modeled FAAB · 16 of 22 players quoted. This is a partial subtotal; six players are unpriced.'}</p><p style="margin-top:.5rem">Not a cash balance. No league value rank is established.</p>${local('Browse the roster & quotes →','roster',{},'rail-roster')}</section></aside>`;
}
function pairingsList(prefix='pair') {
  return `<ul class="pairings-list">${fixture.matchups.map(m=>`<li><a data-local id="${prefix}-${m.id}" href="${esc(urlFor('matchup',{matchup:m.id}))}"><span class="pair-names"><span>${esc(team(m.home).name)}</span><span>${esc(team(m.away).name)}</span></span><span class="pair-scores"><span>${m.homePoints===null?'Unavailable':num(m.homePoints)}</span><span class="${m.awayPoints===null?'unknown':''}">${m.awayPoints===null?'Score unavailable':num(m.awayPoints)}</span></span></a></li>`).join('')}</ul>`;
}
function leagueNotebook() {
  const slice=fixture.standings.slice(0,3);
  if(member&&!slice.some(t=>t.id===person.teamId))slice.push(person.standing);
  return `<section class="league-notebook" id="league-notebook" aria-labelledby="league-notebook-title"><div class="wrap"><div class="section-intro"><div><p class="eyebrow">The league notebook</p><h2 id="league-notebook-title">The week beyond your own team.</h2></div>${local('Open the full league page →','league',{},'notebook-full-league')}</div><div class="league-notebook-grid"><section aria-labelledby="slice-title"><h3 class="notebook-heading" id="slice-title">The front of the table${member&&person.standing.rank>3?' & your place':''}</h3><ol class="standing-slice">${slice.map(t=>`<li class="${member&&t.id===person.teamId?'viewer-row':''}"><span class="place">${String(t.rank).padStart(2,'0')}</span><span>${local(t.name,'team',{team:t.id},`slice-${t.id}`,'')}${member&&t.id===person.teamId?'<span class="you">Your team</span>':''}</span><span class="standing-record">${t.wins}–${t.losses}</span></li>`).join('')}</ol><p class="slice-note">${member&&person.standing.rank>3?'Selected positions, not consecutive rows. ':''}Synthetic standings after two completed weeks. Six playoff places; playoffs begin in Week 20.</p></section>${member?`<section aria-labelledby="pairings-title"><h3 class="notebook-heading" id="pairings-title">Week 3 · all five pairings</h3>${pairingsList('notebook-pair')}</section>`:`<section aria-labelledby="public-season-title"><h3 class="notebook-heading" id="public-season-title">The shape of the season</h3><p class="serif">Ten teams are working toward six playoff places, with the postseason beginning in Week 20. The current synthetic table describes two completed weeks, not a playoff forecast.</p><p class="slice-note">Stories, older editions and actual league transactions live on the current GOAT site.</p><div class="profile-links">${external('Read the weekly archive','/weekly')}${external('Browse league news','/news')}</div></section>`}</div><div class="notebook-tail"><p>Scores are an in-progress synthetic snapshot. Missing is never zero.</p>${local('Meet the ten teams →','league',{},'notebook-teams')}</div></div></section>`;
}
function editionEnd() {
  return `<section class="wrap edition-end" aria-label="More from GOAT"><article><p class="eyebrow">A little league memory</p><h2>The title has a history.</h2><p>In the retained 2025 final reference, Josh Diddy’s Roster beat papichooter <span class="data">326–251.5</span>. The current season is its own story.</p>${external('Read the league history','/history')}</article><article><p class="eyebrow">When you want the whole picture</p><h2>Your team has more than two names.</h2><p>${person.players.length} players belong to ${esc(person.team.name)} in this demo. Open the roster for each quote, position and available completed-week sample.</p>${local('Go to your full roster →','roster',{},'end-roster')}</article></section>`;
}
function guestHome() {
  return `${pairingRibbon()}${editionHeading()}<div class="wrap edition-grid"><div><article class="lead-feature public-cover" aria-labelledby="lead-title"><div class="feature-heading"><div><p class="eyebrow">From the league’s history / 2025 final</p><h2 id="lead-title">The title belonged to Josh Diddy’s Roster.</h2></div></div><figure><div class="feature-visual"><div class="court-inset"><img src="${fixture.assets.court}" alt="The illustrated GOAT Hoopers court and crowd" width="1440" height="810"></div></div><figcaption class="image-caption"><span>GOAT Hoopers home court artwork</span><span>Illustration, not a photo of the 2025 final</span></figcaption></figure><div class="feature-body"><div><p>Ten teams share this league. The retained 2025 final reference ends with Josh Diddy’s Roster over papichooter, 326–251.5. Now, the synthetic 2026 edition has a new week to follow.</p><p>Read the current pairings, meet the managers, or open the league page to see all ten teams in one place. Sign in on the real GOAT site for your actual team.</p>${local('Meet the league →','league',{},'guest-meet')}</div><aside class="feature-note"><p class="eyebrow">2025 final</p><p class="feature-value data">326</p><p class="small">Josh Diddy’s Roster</p><hr class="story-rule"><p class="feature-value data">251.5</p><p class="small">papichooter</p></aside></div></article></div><aside class="reading-rail" aria-label="Public pairings and account entry"><section class="guest-pairings"><p class="eyebrow">The current synthetic week</p><h2>Five pairings to follow</h2>${pairingsList('guest-pair')}<p class="slice-note">No live score connection. Open any pair for its context.</p></section><section class="guest-entry"><p class="eyebrow">Your team has its own edition</p><h3>Make it personal on GOAT.</h3><p>This public view doesn’t identify you or claim a private roster.</p>${external('Sign in on GOAT','/login','button')}<p class="small" style="margin-top:.6rem">Current site · leaves prototype</p></section></aside></div>${leagueNotebook()}<section class="wrap directory" aria-labelledby="directory-title"><p class="eyebrow">The people in the league</p><h2 id="directory-title">Meet the ten-team field.</h2>${directoryList()}</section>`;
}
function directoryList() {
  return `<div class="directory-list">${fixture.teams.map(t=>`<details class="directory-item"><summary>${esc(t.name)}<small>${esc(t.manager)}${t.previousSeason.finish===1?' · 2025 champion':''}</small></summary><p>2026 demo record: ${t.wins}–${t.losses}. Season points: ${num(t.pointsFor)}.</p><p>Historical 2025: ${t.previousSeason.wins}–${t.previousSeason.losses}, ${ordinal(t.previousSeason.finish)} finish. ${esc(t.previousSeason.ownerNote||'')}</p>${local('Open this team’s local profile →','team',{team:t.id},`directory-${t.id}`)}</details>`).join('')}</div>`;
}
function homePage() {
  return member?`${pairingRibbon()}${editionHeading()}<div class="wrap edition-grid"><div>${leadFeature()}${supportFeature()}</div>${personalRail()}</div>${leagueNotebook()}${editionEnd()}`:guestHome();
}
function rosterPage() {
  const v=person.valuation;
  return `<div class="wrap destination">${backLink()}${heading(`${person.team.name}: the full roster.`,'Your local team page',`${person.players.length} owned players, with position, modeled quote and whatever counted Week 2 evidence is supplied. Open a name for its player profile.`)}<dl class="summary-facts"><div><dt>${v.complete?'Complete modeled roster total':'Available modeled subtotal'}</dt><dd class="data">$${money(v.modeledFaabSubtotal)} <small>FAAB</small></dd></div><div><dt>Quote coverage</dt><dd>${v.priced}<small> / ${v.roster} players</small></dd></div><div><dt>Season record</dt><dd>${person.team.wins}–${person.team.losses}</dd></div></dl><p class="summary-note">${v.complete?'Your own roster is fully quoted.':'Six players remain unpriced. This partial subtotal is not a complete team total.'} Modeled FAAB is not cash. No league value rank is established because complete comparable quotes for every team are not supplied.</p><div class="roster-tools"><label for="roster-search">Find a player <input id="roster-search" type="search" autocomplete="off" placeholder="Search your roster"></label><p id="roster-count" aria-live="polite">${person.players.length} players shown</p></div><table class="roster-table"><caption>Quotes: October 30, 08:10 UTC · Counted points: synthetic completed Week 2, October 19–25</caption><thead><tr><th scope="col">Owned player</th><th scope="col">Position</th><th scope="col">Modeled FAAB</th><th scope="col">Week 2 points</th></tr></thead><tbody>${person.players.map(p=>`<tr data-roster-name="${esc(p.name.toLowerCase())}"><td><a data-local id="roster-player-${p.id}" class="roster-player" href="${esc(urlFor('player',{player:p.id}))}"><span class="thumb" aria-hidden="true">${p.portrait?portrait(p):esc(firsts(p.name))}</span><span><span class="roster-player-name">${esc(p.name)}</span><small class="view-link">Open player profile</small></span></a></td><td><span class="position">${esc(p.position)}</span></td><td class="data ${p.modeledFaab===null?'unavailable':''}">${p.modeledFaab===null?'Unpriced':`$${money(p.modeledFaab)}`}</td><td class="data ${p.completedWeekPoints===null?'unavailable':''}">${p.completedWeekPoints===null?'No counted sample':num(p.completedWeekPoints)}</td></tr>`).join('')}</tbody></table><p id="empty-search" class="empty-search" hidden>No player in this demo roster matches. Try a shorter name.</p><details class="roster-limits"><summary>Understand the quote and sample limits</summary><p>Missing quotes and counted-week points stay unknown. They are never zero and do not imply injury, availability or a DNP. A quote is a model value, not a cash balance. No recorded team-value history is supplied, so no trend is inferred. Lineup Power has no producer snapshot and is unavailable.</p></details></div>`;
}
function leaguePage() {
  return `<div class="wrap destination">${backLink()}${heading('Ten teams. One table.','The local league page','The complete synthetic 2026 standings after two completed weeks. Open a team to read its current record and qualified historical context.')}<div class="league-page-layout"><div><table class="standings-table"><caption>Synthetic standings · Week 3 edition</caption><thead><tr><th scope="col">Pos.</th><th scope="col">Team</th><th scope="col">W–L</th><th scope="col">Points for</th></tr></thead><tbody>${fixture.standings.map(t=>`<tr class="${member&&t.id===person.teamId?'viewer-row':''}"><td>${String(t.rank).padStart(2,'0')}</td><td>${local(t.name,'team',{team:t.id},`table-team-${t.id}`,'team-link')}${member&&t.id===person.teamId?'<span class="you">Your team</span>':''}</td><td class="data">${t.wins}–${t.losses}</td><td class="data">${num(t.pointsFor)}</td></tr>`).join('')}</tbody></table></div><aside class="league-page-aside"><p class="eyebrow">The road ahead</p><h2>Six playoff places.<br>A long season to play.</h2><p>The ten-team field is playing toward six playoff places, beginning in Week 20. These standings describe the demo today; they are not a playoff projection.</p><h3 class="notebook-heading">Week 3 pairings</h3>${pairingsList('league-pair')}</aside></div><section class="directory" aria-labelledby="directory-title"><p class="eyebrow">The franchise directory</p><h2 id="directory-title">A name, a manager, a history.</h2>${directoryList()}</section></div>`;
}
function matchupPage(m) {
  const a=team(m.home),b=team(m.away);
  const selectedOwn=member&&[m.home,m.away].includes(person.teamId);
  const complete=m.homePoints!==null&&m.awayPoints!==null;
  const lead=complete?Math.abs(m.homePoints-m.awayPoints):null;
  const leading=complete?team(m.homePoints>=m.awayPoints?m.home:m.away):null;
  return `<div class="wrap destination">${backLink()}${heading(`${a.name} vs ${b.name}`,'Week 3 / Local matchup page','Follow the current pairing, compare the two season records and keep the score period separate from last week’s player sample.',selectedOwn?local('Browse your players →','roster',{},'matchup-roster','button secondary'):'')}<div class="matchup-page-grid"><div><section class="comparison-board" aria-labelledby="score-title"><p class="eyebrow" id="score-title">Synthetic in-progress score</p><div class="compare-teams">${[[a,m.homePoints],[b,m.awayPoints]].map(([t,s])=>`<div class="compare-team"><h2>${esc(t.name)}</h2><p class="large-score ${s===null?'is-missing':''}">${s===null?'Score unavailable':num(s)}</p><p class="small">${t.wins}–${t.losses} season record</p></div>`).join('')}</div><p class="status-note">${complete?(lead===0?'The supplied scores are tied.':`${esc(leading.name)} leads by ${num(lead)} in this sample.`)+' This is not a final result.':'No leader can be determined. Papichooter has a recorded zero; NeuralNets has no returned score. Missing is not zero.'}</p></section><section class="comparison-notes"><h2>The season behind this pairing.</h2><p>${esc(a.name)} is ${a.wins}–${a.losses} with ${num(a.pointsFor)} season points. ${esc(b.name)} is ${b.wins}–${b.losses} with ${num(b.pointsFor)} season points. These are season quantities, not the current matchup score.</p><p class="small">Score snapshot: October 30, 2026 at 08:30 UTC. Constructed for this demo; no live clock or external scoring request.</p><div class="profile-links">${local(`Scout ${a.name} →`,'team',{team:a.id},'matchup-team-home')}${local(`Scout ${b.name} →`,'team',{team:b.id},'matchup-team-away')}</div></section></div><aside class="matchup-aside"><p class="eyebrow">${selectedOwn?'Your part of the pairing':'Public pairing context'}</p><h2>${selectedOwn?'Start with your own players.':'Two franchises to explore.'}</h2>${selectedOwn?`<p>Your completed Week 2 sample has counted points for ${person.playerEvidence.verifiedPlayers} of ${person.players.length} roster players. Open a player to read the sample beside its modeled quote.</p><ul class="evidence-list">${person.players.filter(p=>p.completedWeekPoints!==null).map(p=>`<li>${local(p.name,'player',{player:p.id},`match-player-${p.id}`,'')}<span>${num(p.completedWeekPoints)}</span></li>`).join('')}</ul>${savedModel()}`:'<p>This public view includes team records and pairing scores. It does not identify you or expose a private team roster.</p>'}</aside></div></div>`;
}
function playerPage(p) {
  const other=person.players.find(t=>t.id!==p.id&&t.portrait);
  return `<div class="wrap destination">${backLink('roster','Back to where you were reading')}${heading(p.name,`${person.team.name} / Owned player`,`${p.position} · A local profile using the supplied roster, quote and completed-week sample.`)}<div class="profile-layout"><figure><div class="profile-art">${portrait(p,'',true)}</div><figcaption class="image-caption"><span>${esc(p.name)} · ${esc(p.position)}</span><span>${p.portrait?'Approved roster portrait':'No portrait supplied'}</span></figcaption></figure><section class="profile-copy"><p class="eyebrow">Part of your ${person.players.length}-player team</p><h2>Put the player in context.</h2><p>${esc(p.name)} belongs to ${esc(person.team.name)} in this demo roster. Your team is ${person.team.wins}–${person.team.losses}, paired with ${esc(person.opponent.name)} in Week 3.</p><dl class="profile-facts"><div><dt>Modeled FAAB quote</dt><dd class="data ${p.modeledFaab===null?'unavailable':''}">${p.modeledFaab===null?'Quote unavailable':`$${money(p.modeledFaab)}`}</dd></div><div><dt>Counted Week 2 points</dt><dd class="data ${p.completedWeekPoints===null?'unavailable':''}">${p.completedWeekPoints===null?'No counted sample':num(p.completedWeekPoints)}</dd></div></dl><p>${p.completedWeekPoints===null?'No counted completed-week points are supplied for this player. That does not mean zero points, a DNP or unavailable status.':'The counted points belong only to the synthetic completed Week 2 sample, October 19–25. They are not the player’s contribution to the current Week 3 matchup.'}</p><p class="small">${p.modeledFaab===null?'This missing quote is excluded from the available roster subtotal.':'Quote checked October 30 at 08:10 UTC. Modeled FAAB is a model value, not cash.'} Current NBA team, injury and availability labels are not supplied.</p><div class="profile-links">${local('Your full roster →','roster',{},'profile-roster','button secondary')}${local(`Read ${other.name} next →`,'player',{player:other.id},'profile-next')}</div><div class="profile-links">${external('Player on the current GOAT site',`/player/${p.id}`)}</div></section></div></div>`;
}
function teamPage(t) {
  const standing=fixture.standings.find(s=>s.id===t.id);
  const m=fixture.matchups.find(m=>m.home===t.id||m.away===t.id);
  const opponent=team(m.home===t.id?m.away:m.home);
  return `<div class="wrap destination">${backLink('league','Back to the league reading')}${heading(t.name,'Public team profile',`Managed by ${t.manager}. Current record and scores are synthetic; the 2025 record is a retained historical reference.`)}<dl class="summary-facts"><div><dt>2026 demo record</dt><dd>${t.wins}–${t.losses}</dd></div><div><dt>League position</dt><dd>${ordinal(standing.rank)} <small>/ 10</small></dd></div><div><dt>2026 points for</dt><dd class="data">${num(t.pointsFor)}</dd></div></dl><div class="team-story"><section><p class="eyebrow">Their current week</p><h2>${esc(opponent.name)} is the Week 3 opponent.</h2><p>${esc(t.name)} is ${ordinal(standing.rank)} in the synthetic table after two completed weeks. The pairing page keeps this week’s score separate from that season record.</p><p>${m.state==='partly_unavailable'?'This pairing has partial score coverage: papichooter has a known zero and NeuralNets has no returned score. No leader is inferred.':'Both matchup scores are present in this sample. They remain in progress, not a final result.'}</p><div class="profile-links">${local('Open the Week 3 pairing →','matchup',{matchup:m.id},'team-pair','button secondary')}${member&&t.id===person.teamId?local('Browse your roster →','roster',{},'team-roster'):''}</div></section><aside class="team-history"><p class="eyebrow">Historical 2025 reference</p><h2>${t.previousSeason.wins}–${t.previousSeason.losses}. ${ordinal(t.previousSeason.finish)} finish.</h2><p>${esc(t.previousSeason.ownerNote||`The 2025 season reference belongs to ${t.name}.`)}${t.previousSeason.finish===1?' The retained league reference lists this team as the 2025 champion.':''}</p><p class="small">Historical context is separate from the synthetic current season. No private opponent roster is supplied on this public team page.</p>${external('Open the current public team profile',`/teams/${t.id}`)}</aside></div></div>`;
}
let renderVersion=0;
function render() {
  const version=++renderVersion;
  delete root.dataset.personalStudyReady;
  const q=new URLSearchParams(location.search);
  let view=q.get('view')||'home';
  if(!['home','roster','league','matchup','player','team'].includes(view))view='home';
  if(!member&&['roster','player'].includes(view))view='league';
  if(view==='player'&&!ownPlayer(q.get('player')))view='roster';
  if(view==='team'&&!team(q.get('team')))view='league';
  root.dataset.view=view;
  const m=fixture.matchups.find(m=>m.id===q.get('matchup'))||defaultMatch();
  main.innerHTML=view==='home'?homePage():view==='roster'?rosterPage():view==='league'?leaguePage():view==='matchup'?matchupPage(m):view==='player'?playerPage(ownPlayer(q.get('player'))):teamPage(team(q.get('team')));
  document.querySelectorAll('[data-nav]').forEach(link=>{
    const section=link.dataset.nav;
    link.href=urlFor(section,section==='matchup'?{matchup:defaultMatch().id}:{});
    link.removeAttribute('aria-current');
    if(link.closest('.primary-nav')&&(view===section||(section==='roster'&&view==='player')||(section==='league'&&view==='team')))link.setAttribute('aria-current','page');
  });
  const rosterNav=document.querySelector('#nav-roster');rosterNav.hidden=!member;
  document.querySelector('#nav-home').textContent=member?'Your edition':'League edition';
  labelExits(document);
  if(view==='roster'){const input=document.querySelector('#roster-search');input.value=q.get('find')||'';applyRosterFilter(input.value);}
  document.title=`${main.querySelector('h1').textContent} · GOAT Hoopers`;
  Promise.all([document.fonts.ready,...[...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});}))]).then(()=>{if(version===renderVersion)root.dataset.personalStudyReady='03';});
}
history.replaceState({...history.state,goat03:true,level:0},'',location.href);
function navigate(href,sourceId='') {
  history.replaceState({...history.state,scrollY:scrollY,focusId:sourceId},'',location.href);
  const level=(history.state?.level||0)+1;
  history.pushState({goat03:true,level},'',href);
  render();window.scrollTo(0,0);main.querySelector('h1').focus({preventScroll:true});
}
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const back=event.target.closest('a[data-back]');
  if(back){event.preventDefault();if(history.state?.goat03&&history.state.level>0)history.back();else navigate(back.href);return;}
  const link=event.target.closest('a[data-local]');
  if(link){event.preventDefault();navigate(link.href,link.id);}
});
window.addEventListener('popstate',()=>{
  const state=history.state;render();
  requestAnimationFrame(()=>{window.scrollTo(0,state?.scrollY||0);const target=state?.focusId?document.getElementById(state.focusId):main.querySelector('h1');target?.focus({preventScroll:true});});
});
function applyRosterFilter(value) {
  const term=value.toLocaleLowerCase().trim();let count=0;
  document.querySelectorAll('[data-roster-name]').forEach(row=>{row.hidden=!row.dataset.rosterName.includes(term);if(!row.hidden)count++;});
  document.querySelector('#roster-count').textContent=`${count} of ${person.players.length} players shown`;
  document.querySelector('#empty-search').hidden=count>0;
}
document.addEventListener('input',event=>{
  if(event.target.id!=='roster-search')return;
  const url=new URL(location.href);
  if(event.target.value)url.searchParams.set('find',event.target.value);else url.searchParams.delete('find');
  history.replaceState(history.state,'',url.href);
  applyRosterFilter(event.target.value);
});
const selector=document.querySelector('#persona');selector.value=personaKey;
selector.addEventListener('change',event=>{const q=new URLSearchParams();q.set('persona',event.target.value);if(root.dataset.stage==='structure')q.set('stage','structure');location.assign(`?${q}`);});
const sources=document.querySelector('#sources');
document.querySelector('#source-trigger').addEventListener('click',()=>sources.showModal());
document.querySelector('#source-close').addEventListener('click',()=>sources.close());
sources.addEventListener('close',()=>document.querySelector('#source-trigger').focus({preventScroll:true}));
sources.addEventListener('click',event=>{if(event.target!==sources)return;const r=sources.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sources.close();});
render();
