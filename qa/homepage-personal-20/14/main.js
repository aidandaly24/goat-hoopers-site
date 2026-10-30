import { fixture } from '../fixture.js';

const params = new URLSearchParams(location.search);
const personaKey = ['reaves', 'neural', 'guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const person = fixture.personas[personaKey];
const member = person.kind === 'member';
const teams = new Map(fixture.teams.map(team => [team.id, team]));
const site = document.querySelector('#site');
const dialog = document.querySelector('#reading-note');
const noteContent = document.querySelector('#note-content');
document.documentElement.dataset.persona = personaKey;
if (params.get('stage') === 'structure') document.documentElement.dataset.stage = 'structure';

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number = value => value === null ? 'Unavailable' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
const cash = value => value === null ? 'Unpriced' : `$${Number(value).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`;
const n = value => `<span class="num">${esc(number(value))}</span>`;
const note = (key, label, className = 'note-link') => `<button type="button" class="${className}" data-note="${esc(key)}">${label}</button>`;
const external = (path, label, className = '') => `<a class="${className}" href="https://goathoopers.com${path}" aria-label="${esc(label)} — leave prototype for current GOAT site">${esc(label)}</a>`;
const teamLink = id => note(`team:${id}`,esc(teams.get(id).name));
const score = (pair, id) => pair.home === id ? pair.homePoints : pair.awayPoints;
const matchupFor = id => fixture.matchups.find(pair => [pair.home,pair.away].includes(id));
const dataPeriod = 'Synthetic completed Week 2 · October 19–25, 2026';
const quoteTime = 'October 30, 2026 at 08:10 UTC';
const qualifiedHistory = team => `${team.previousSeason.season}: ${team.previousSeason.wins}–${team.previousSeason.losses}, finish ${team.previousSeason.finish} of 10.${team.previousSeason.ownerNote ? ` ${team.previousSeason.ownerNote}` : ''}`;

function header() {
  return `<header class="wrap" id="top"><div class="masthead">
    <a class="brand" href="?persona=${personaKey}" aria-label="GOAT Hoopers prototype home"><img src="${fixture.assets.logo}" width="1092" height="198" alt="GOAT Hoopers"></a>
    <nav aria-label="Main navigation"><a class="current" href="?persona=${personaKey}" aria-current="page">Home</a><div class="header-links"><span class="exit-label">Current GOAT site</span><div class="exit-group">${external('/news','News')}${external('/stocks','Stocks')}${external('/arcade','Arcade')}${external(member?'/team':'/login',member?'My Team':'Sign in')}</div></div></nav>
    </div><nav class="chapter-nav" aria-label="On this homepage"><a href="#main">The brief</a><a href="#context">League context</a><a href="#players">Reading notes</a><a href="#club">Club history</a><a href="#sources">Sources</a></nav>
    <div class="demo-bar"><div class="demo-ident"><span class="demo-tag">Synthetic demo</span><span>October 30, 2026 · Week 3</span><a href="#sources">About the numbers</a></div><label class="persona">Demo persona <select id="persona-select"><option value="reaves" ${personaKey==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${personaKey==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${personaKey==='guest'?'selected':''}>Guest</option></select></label></div></header>`;
}

function opening() {
  if (!member) return `<section class="opening"><div class="wrap"><p class="eyebrow">2026 season / The public league brief</p><h1>Ten teams. One league.</h1><p class="lead">Three teams have opened ${n(2)}–${n(0)}. ${teamLink('1')} leads the current order on ${n(615.5)} points for, ahead of ${teamLink('3')} and ${teamLink('7')}.</p><p class="sublead">Follow the names, read the context and get to know GOAT Hoopers. Six of the ten teams will have a playoff place; this is an early-season sample, not a prediction.</p>${note('team:1','Read the leading team’s note','primary')}<div class="opening-facts"><p><span class="fact-label">Week 3 sample</span>Five pairings · four complete score pairs · one partly unavailable</p><p><span class="fact-label">Your team on the current site</span>${external('/login','Sign in on GOAT')} <span>— leaves this prototype</span></p></div></div></section>`;
  const neural = personaKey === 'neural';
  const first = neural ? person.players.find(p=>p.id==='1380') : person.players.find(p=>p.id==='1444');
  const pair = person.matchup;
  const lead = neural
    ? `Two weeks in, the record is ${n(0)}–${n(2)}. There is still a useful week to read: ${note(`player:${first.id}`,esc(first.name))} has ${n(first.completedWeekPoints)} counted points in the supplied Week 2 sample.`
    : `First of ten, with a ${n(2)}–${n(0)} start. Behind the team line, ${note(`player:${first.id}`,esc(first.name))} has ${n(first.completedWeekPoints)} counted points in the supplied Week 2 sample.`;
  const sub = neural ? `Your opponent is ${teamLink('7')}. Their recorded zero and your unavailable score mean this sample cannot tell us who leads. Your player notes and league context remain ready to read.` : `This week, you face ${teamLink('2')}: a ${n(1)}–${n(1)} opponent. The current Week 3 sample has your team ${n(13.5)} points ahead; the result is not final.`;
  return `<section class="opening"><div class="wrap"><p class="eyebrow">2026 / Week 3 / ${esc(person.team.manager)}’s team brief</p><h1>${esc(person.team.name)}</h1><p class="lead">${lead}</p><p class="sublead">${sub}</p>${note(`player:${first.id}`,neural?'Read Giannis’ week':'Read Damian’s week','primary')}<div class="opening-facts"><p><span class="fact-label">Your current pairing · synthetic score sample</span>${esc(person.team.name)} ${n(score(pair,person.teamId))} &nbsp; / &nbsp; ${esc(person.opponent.name)} ${n(score(pair,person.opponent.id))}</p><p><span class="fact-label">Modeled FAAB · not a cash balance</span>${note('quotes',`${cash(person.valuation.modeledFaabSubtotal)} ${neural?'subtotal':'roster value'}`)} · ${person.valuation.priced} of ${person.valuation.roster} priced</p></div></div></section>`;
}

function leagueParagraph() {
  if (!member) return `<p class="opening-line">The undefeated group is separated by points for: ${teamLink('1')} has ${n(615.5)}, ${teamLink('3')} ${n(576)}, and ${teamLink('7')} ${n(560.25)}. These are the supplied current standings, not a modeled power ranking.</p><p>The middle of the order includes four teams at ${n(1)}–${n(1)}. ${teamLink('2')} sits fourth with ${n(548.75)} points for; ${teamLink('5')} follows with ${n(536.5)}. Names open a public team note so you can follow the league without losing this page.</p>`;
  if (personaKey==='neural') return `<p class="opening-line">NeuralNets sits tenth on ${n(412.25)} points for. Two other teams share the ${n(0)}–${n(2)} record: ${teamLink('9')} has ${n(457.5)}, while ${teamLink('10')} has ${n(437.75)}.</p><p>That is league position, not a verdict on an individual player. Your Week 3 opponent, ${teamLink('7')}, is third at ${n(2)}–${n(0)} with ${n(560.25)} points for. Open either name to read the team, season and pairing together.</p>`;
  return `<p class="opening-line">A ${n(2)}–${n(0)} start puts Reaves Dropper alongside two other unbeaten teams. Your ${n(615.5)} points for place you ahead of ${teamLink('3')} at ${n(576)} and ${teamLink('7')} at ${n(560.25)}.</p><p>${teamLink('2')}, your Week 3 opponent, is fourth at ${n(1)}–${n(1)} with ${n(548.75)} points for. The table describes the supplied season so far; it does not turn a current score into a completed result.</p>`;
}

function ownGameParagraph() {
  if (!member) return `<p>In the current Week 3 sample, ${teamLink('1')} has ${n(184.5)} against ${teamLink('2')}’s ${n(171)}. Elsewhere, ${teamLink('5')} has ${n(131)} against ${teamLink('6')}’s ${n(126.5)}. These four values are known; they are not final results.</p><p>One pairing needs a different reading: ${teamLink('7')} has a recorded ${n(0)}, while ${teamLink('8')} has no returned score. That does not establish a tie or a leader. ${note('matchup:m4','Read that score state')}.</p>`;
  const p=person.matchup;
  const game = personaKey==='neural'
    ? `<p>Your own pairing is ${teamLink('7')} against NeuralNets. papichooter’s ${n(0)} is a supplied value; your <strong>Unavailable</strong> score is a gap. No margin, leader or tie can be inferred. ${note(`matchup:${p.id}`,'Read the matchup note')}.</p><p>No saved model estimate is supplied for this pairing. That absence does not prevent inspecting the team and player facts already here.</p>`
    : `<p>The current sample reads Reaves Dropper ${n(184.5)}, ${teamLink('2')} ${n(171)}. A separate saved synthetic model estimate assigns Reaves ${n(56)}% and the opponent ${n(44)}%. It was saved October 26 at 08:00 UTC; it is <strong>not calibrated odds</strong>. ${note('model','Read what the saved estimate contains')}.</p>`;
  return game;
}

function playerParagraphs() {
  if (!member) return `<section id="players"><h2>A name is a way into the league.</h2><p>Start with a team, then read its manager, current pairing and previous season in one place. ${teamLink('8')} has a particular historical qualification: its 2025 record belongs to the previous manager as QBs Gremlins.</p><p>This guest brief uses public team, standings and pairing fields. Your owned-player evidence and team quote are personal contexts; ${external('/login','sign in on the current GOAT site')} for your actual team. No account is connected to this prototype.</p><p>${note('standings','Read the complete ten-team order')} · ${note('slate','Read all five Week 3 pairings')}</p></section>`;
  const verified=person.players.filter(p=>p.participation==='verified_demo' && p.completedWeekPoints!==null);
  const examples=[...person.players].filter(p=>p.modeledFaab!==null).sort((a,b)=>b.modeledFaab-a.modeledFaab).slice(0,2);
  const missing=person.players.filter(p=>p.modeledFaab===null);
  return `<section id="players"><aside class="marginal"><strong>A note on evidence</strong><p>Completed-week points and modeled quotes answer different questions. A player without supplied weekly evidence is not assigned zero.</p>${note('evidence','Read the period and coverage')}</aside><h2>The players behind the team line.</h2><p class="with-margin">The supplied completed-week breakdown covers ${n(verified.length)} of ${n(person.players.length)} current roster players. Here is the entire available cohort, with each name opening its own reading:</p><p class="period">${dataPeriod} · evidence for ${verified.length} players</p><ul class="inline-evidence">${verified.map(p=>`<li>${note(`player:${p.id}`,`${esc(p.name)} ${n(p.completedWeekPoints)}`)}</li>`).join('')}</ul><p>The market provides a different context. ${examples.map(p=>`${note(`player:${p.id}`,esc(p.name))} is quoted at <span class="num">${cash(p.modeledFaab)}</span>`).join('; ')}. Your ${personaKey==='neural'?'modeled subtotal':'complete modeled roster value'} is <span class="num">${cash(person.valuation.modeledFaabSubtotal)}</span>, with ${n(person.valuation.priced)} of ${n(person.valuation.roster)} players priced.</p>${missing.length?`<p>The six unpriced names are ${missing.map(p=>esc(p.name)).join(', ')}. Their missing quotes remain unknown; this subtotal is not a complete team value.</p>`:''}<p>${note('quotes','Inspect all roster quotes')} to see every player and the coverage behind that figure. No league value rank is supplied. There is no recorded valuation series in this demo, so a trend is not inferred.</p><div class="changes"><h3>Two updates in this sample</h3>${person.changes.map(change=>`<p><time datetime="${change.at}">${change.at.slice(11,16)} UTC</time>${note(change.target==='valuation'?'quotes':change.target==='matchup'?`matchup:${person.matchup.id}`:'evidence',esc(change.headline))}.</p>`).join('')}</div></section>`;
}

function club() {
  const winner=teams.get(fixture.historicalFinal.winner),runner=teams.get(fixture.historicalFinal.runnerUp);
  return `<section class="club" id="club"><h2>The season has a memory.</h2><p>The retained 2025 final has ${teamLink(winner.id)} over ${teamLink(runner.id)}, ${n(fixture.historicalFinal.winnerPoints)} to ${n(fixture.historicalFinal.runnerUpPoints)}. It is a previous-season reference, kept separate from the current synthetic Week 3 sample.</p>${member?`<p>${esc(person.team.name)}’s retained franchise line reads ${esc(qualifiedHistory(person.team))} ${note(`team:${person.teamId}`,'Read the team context')}.</p>`:''}<figure class="game-figure"><a href="https://goathoopers.com/arcade" aria-label="Arcade practice — leave prototype for current GOAT site"><img src="${fixture.assets.game}" width="960" height="540" alt="A view of the GOAT free-throw practice court" loading="lazy"></a><figcaption>Free-throw practice on the current GOAT site. This image opens Arcade and leaves the prototype.</figcaption></figure><p class="play-paragraph">And there is room for a game between the numbers. ${external('/arcade','Open Arcade on the current site')} for the practice court. Or keep reading: ${external('/news','News')}, ${external('/history','History')} and the ${external('/weekly','Weekly archive')} are ordinary paths back into the league.</p><p class="play-paragraph">The local notes here stay local. They do not save a lineup, send a trade, generate a model estimate or connect an account.</p></section>`;
}

function footer() {
  const groups=[['League',['/teams','/transactions','/draft','/intel','/table']],['Reading and tools',['/news','/stocks','/history','/ai-decides','/trade-analyzer','/weekly','/arcade']],['Your account',['/team','/login']]];
  return `<section class="sources" id="sources"><div class="wrap"><h2>The numbers are synthetic. The distinctions matter.</h2><p>All current scores, standings, changes, quotes and model outputs were constructed for this design demo. They are not reported league events. Identities and player references come from the authorized project fixture, not a fresh production roster verification.</p><p>2025 records and the final are retained historical project references. NeuralNets’ 2025 line belongs to the previous manager as QBs Gremlins. Modeled FAAB is not a cash balance; saved estimates are not calibrated odds. Unknown values stay unknown.</p><p>No live league, account, AI, database or market service is connected. <a href="../fixture.json">Read the data-only fixture</a>. All links labelled “Current GOAT site” leave this local prototype.</p></div></section><footer><div class="wrap"><div class="footer-inner"><div><p class="footer-brand">GOAT Hoopers</p><p class="footer-copy">A place for the team, the league and the story between the numbers. Synthetic homepage study 14.</p></div><nav class="footer-routes" aria-label="Current GOAT site destinations">${groups.map(([label,paths])=>`<div><p>${label} · current GOAT site</p><ul>${paths.map(path=>`<li>${external(path,fixture.destinations.find(d=>d.href===path).label)}</li>`).join('')}</ul></div>`).join('')}</nav></div><div class="footer-bottom"><span>Local prototype · No account connection</span><span><a href="?persona=${personaKey}">Home</a> &nbsp; / &nbsp; <a href="#top">Back to top</a> &nbsp; / &nbsp; <a href="#sources">Sources</a></span></div></div></footer>`;
}

site.innerHTML = `${header()}<main id="main">${opening()}<article class="reading" aria-label="Your connected league brief"><section id="context"><aside class="marginal"><strong>Where the order comes from</strong><p>2026 standings in the synthetic fixture. Six playoff places. No qualification odds are inferred.</p>${note('standings','Read the ten-team order')}</aside><h2>${member?'A place in the league.':'Meet the early-season order.'}</h2><div class="with-margin">${leagueParagraph()}</div>${ownGameParagraph()}<p class="quiet-link">${note('slate','Read all five Week 3 pairings')} &nbsp; / &nbsp; ${note('standings','Read the full league order')}</p></section>${playerParagraphs()}${club()}</article></main>${footer()}`;

function playerNote(id) {
  const player=member && person.players.find(p=>p.id===id);
  if (!player) return null;
  const known=player.completedWeekPoints!==null && player.participation==='verified_demo';
  return `<h2 id="note-title" tabindex="-1">${esc(player.name)}</h2><p class="period">${esc(person.team.name)} · ${esc(player.position)} · Synthetic roster reference</p><dl class="note-facts"><div><dt>Completed Week 2 points</dt><dd>${known?number(player.completedWeekPoints):'Evidence unavailable'}</dd></div><div><dt>Modeled FAAB quote</dt><dd>${cash(player.modeledFaab)}</dd></div></dl><p>${known?'This player has counted-game evidence in the supplied synthetic completed-week sample.':'No completed-week participation and points evidence is supplied for this player. Missing evidence is not zero, DNP or poor performance.'}</p><p class="period">${dataPeriod}. The source period ends before October 26. No games-played count or injury status is supplied.</p><p>The quote is a modeled value, separate from observed weekly points. ${player.modeledFaab===null?'This player is unpriced.':'It is not a cash balance or a transaction price.'} Your roster coverage is ${person.valuation.priced} of ${person.valuation.roster} priced.</p><p class="period">Quote sample checked ${quoteTime}.</p>${external(`/player/${player.id}`,'Open player profile on the current GOAT site','dialog-exit')}`;
}

function teamNote(id) {
  const team=teams.get(id); if(!team)return null;
  const standing=fixture.standings.find(t=>t.id===id),pair=matchupFor(id),opponentId=pair.home===id?pair.away:pair.home;
  return `<h2 id="note-title" tabindex="-1">${esc(team.name)}</h2><p class="period">Public team note · Manager ${esc(team.manager)}</p><dl class="note-facts"><div><dt>2026 standing / record</dt><dd>${standing.rank} of 10 / ${team.wins}–${team.losses}</dd></div><div><dt>2026 points for</dt><dd>${number(team.pointsFor)}</dd></div></dl><p>Week 3 opponent: ${esc(teams.get(opponentId).name)}. The score sample is ${number(score(pair,id))} for ${esc(team.name)} and ${number(score(pair,opponentId))} for the opponent. ${pair.state==='partly_unavailable'?'A missing score does not establish a leader or a tie.':'This sample is in progress, not a final result.'}</p><h3>Previous season, separately</h3><p>${esc(qualifiedHistory(team))}</p><p class="period">All current quantities are synthetic. This note contains public team fields, not an unsupplied roster.</p>${external(`/teams/${id}`,'Open team profile on the current GOAT site','dialog-exit')}`;
}

function modelBody() {
  if(!member)return '';
  if(person.savedAi.status!=='ready')return '<p>No saved model estimate is supplied for this pairing. No probabilities, confidence or prediction are inferred.</p>';
  return `<p>${esc(person.savedAi.label)}.</p><dl class="note-facts">${person.savedAi.probabilities.map(p=>`<div><dt>${esc(teams.get(p.teamId).name)}</dt><dd>${number(p.probability*100)}%</dd></div>`).join('')}</dl><p>Returned choice: ${esc(teams.get(person.savedAi.returnedChoice).name)}. Model confidence is ${number(person.savedAi.confidence)} on its supplied 0–1 scale, separate from the probability split.</p><p class="period">Saved October 26, 2026 at 08:00 UTC. No model identity, prompt version or input snapshot is included. Nothing is generated when opening this note.</p>`;
}

function matchupNote(id) {
  const pair=fixture.matchups.find(p=>p.id===id);if(!pair)return null;
  const home=teams.get(pair.home),away=teams.get(pair.away);
  return `<h2 id="note-title" tabindex="-1">${esc(home.name)} / ${esc(away.name)}</h2><p class="period">Week 3 · Synthetic current score sample</p><dl class="note-facts"><div><dt>${esc(home.name)} · ${home.wins}–${home.losses}</dt><dd>${number(pair.homePoints)}</dd></div><div><dt>${esc(away.name)} · ${away.wins}–${away.losses}</dt><dd>${number(pair.awayPoints)}</dd></div></dl><p>${pair.state==='partly_unavailable'?'papichooter has a recorded zero. NeuralNets has no returned score. Unknown is not zero; no leader, margin or tie is inferred.':'Both sample scores are known. They describe an in-progress synthetic pairing, not a final result.'}</p>${member&&[pair.home,pair.away].includes(person.teamId)?`<h3>Saved estimate context</h3>${modelBody()}`:''}`;
}

function quoteRows(query='') {
  const list=person.players.filter(player=>player.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const rows=list.length?`<ul class="detail-list">${list.map(player=>`<li><span>${esc(player.name)}<small>${esc(player.position)}</small></span><span class="num">${cash(player.modeledFaab)}</span></li>`).join('')}</ul>`:'<p class="no-results">No roster names match. Clear the search to read all quotes.</p>';
  return {rows,count:`${list.length} of ${person.players.length} roster players shown`};
}

function renderNote(key) {
  const [kind,id]=key.split(':');
  if(kind==='player')return playerNote(id);
  if(kind==='team')return teamNote(id);
  if(kind==='matchup')return matchupNote(id);
  if(key==='model' && member)return `<h2 id="note-title" tabindex="-1">The saved estimate</h2>${modelBody()}${external('/ai-decides','AI Decides on the current GOAT site','dialog-exit')}`;
  if(key==='evidence' && member)return `<h2 id="note-title" tabindex="-1">Read the period before the points.</h2><p>${dataPeriod}. The source window starts October 19 and ends before October 26.</p><p>${person.playerEvidence.verifiedPlayers} of ${person.players.length} roster players have supplied counted-game evidence. The remaining players have unavailable participation and points evidence, not proven zero or DNP results.</p><ul class="detail-list">${person.players.filter(p=>p.participation==='verified_demo').map(p=>`<li><span>${esc(p.name)}</span><span class="num">${number(p.completedWeekPoints)} points</span></li>`).join('')}</ul><p class="period">No games-played count, injury status, live schedule or future projection is supplied.</p>`;
  if(key==='quotes' && member){const result=quoteRows();return `<h2 id="note-title" tabindex="-1">Every quote, with its coverage.</h2><p><span class="num">${cash(person.valuation.modeledFaabSubtotal)}</span> modeled ${person.valuation.complete?'roster value':'subtotal'} · ${person.valuation.priced} of ${person.valuation.roster} priced. ${person.valuation.complete?'All roster quotes are supplied.':'Six unpriced players remain unknown; this is not a complete total.'}</p><p class="period">Checked ${quoteTime}. Modeled FAAB is not cash. No league value rank or recorded valuation trend is supplied.</p><div class="search-row"><label for="quote-search">Find a roster player<input id="quote-search" type="search" autocomplete="off" placeholder="Player name"></label><button type="button" id="clear-search">Clear</button></div><p id="quote-count" aria-live="polite">${result.count}</p><div id="quote-results">${result.rows}</div>`;}
  if(key==='standings')return `<h2 id="note-title" tabindex="-1">The complete league order</h2><p class="period">2026 · Synthetic current standings · Six playoff places</p><ol class="detail-list">${fixture.standings.map(t=>`<li><span>${t.rank}. ${esc(t.name)}${member&&t.id===person.teamId?' · Your team':''}<small>${esc(t.manager)} · ${t.wins}–${t.losses}</small></span><span class="num">${number(t.pointsFor)} points for</span></li>`).join('')}</ol><p>Standing order and points for are separate from modeled FAAB. No value rank or playoff probability is inferred.</p>${external('/table','The Table on the current GOAT site','dialog-exit')}`;
  if(key==='slate')return `<h2 id="note-title" tabindex="-1">Five Week 3 pairings</h2><p class="period">Synthetic score sample · Not final results</p><ul class="detail-list">${fixture.matchups.map(p=>`<li><span>${esc(teams.get(p.home).name)}<small>${esc(teams.get(p.away).name)}${member&&[p.home,p.away].includes(person.teamId)?' · Your pairing':''}</small></span><span class="num">${number(p.homePoints)} / ${number(p.awayPoints)}</span></li>`).join('')}</ul><p>papichooter’s zero is recorded; NeuralNets’ unavailable score is not zero. No leader is inferred in that pairing.</p>`;
  return null;
}

let origin=null;
let originY=0;
let activeKey=null;
function openNote(key,push=true,trigger=null) {
  const html=renderNote(key);if(!html)return;
  if(!dialog.open){origin=trigger||document.activeElement;originY=window.scrollY;}
  activeKey=key;
  noteContent.innerHTML=html;
  if(push){const url=new URL(location.href);url.hash=`note/${key}`;history.pushState({goat14Note:true,key},'',url);}
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=0;
  document.querySelector('#note-title').focus({preventScroll:true});
}
function finishClose() {
  if(!dialog.open)return;
  dialog.close();activeKey=null;
  if(origin?.isConnected)origin.focus({preventScroll:true});
  window.scrollTo({top:originY,behavior:'instant'});
}
function closeNote(){
  if(history.state?.goat14Note){history.back();}
  else{const url=new URL(location.href);url.hash='';history.replaceState(null,'',url);finishClose();}
}
function syncNote(){
  const key=decodeURIComponent(location.hash.slice(1));
  if(key.startsWith('note/'))openNote(key.slice(5),false);
  else finishClose();
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-note]');if(button)openNote(button.dataset.note,true,button);});
document.querySelector('#close-note').addEventListener('click',closeNote);
dialog.addEventListener('cancel',event=>{event.preventDefault();closeNote();});
dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeNote();}});
window.addEventListener('popstate',syncNote);
window.addEventListener('hashchange',syncNote);
document.addEventListener('input',event=>{if(event.target.id==='quote-search'){const result=quoteRows(event.target.value);document.querySelector('#quote-results').innerHTML=result.rows;document.querySelector('#quote-count').textContent=result.count;}});
document.addEventListener('click',event=>{if(event.target.id==='clear-search'){const input=document.querySelector('#quote-search');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}});
document.querySelector('#persona-select').addEventListener('change',event=>{const url=new URL(location.href);url.searchParams.set('persona',event.target.value);url.hash='';location.href=url;});
document.title=member?`${person.team.name} — GOAT linked brief`:'The league brief — GOAT Hoopers';
syncNote();
await document.fonts.ready;
document.documentElement.dataset.personalStudyReady='14';
