import { fixture } from '../fixture.js';

const app = document.querySelector('#app');
const allowed = ['reaves','neural','guest'];
let persona = 'reaves';
let person;
let currentQuery = '';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold = value => String(value).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
const money = value => value == null ? 'Unpriced' : '$' + value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const number = value => value == null ? 'Unavailable' : value.toLocaleString('en-US',{maximumFractionDigits:2});
const record = team => `${team.wins}–${team.losses}`;
const team = id => fixture.teams.find(item => item.id === id);
const standing = id => fixture.standings.find(item => item.id === id);
const member = () => person.kind === 'member';
const time = iso => new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) + ' UTC';

function local(view = '', id = '', hash = '') {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('persona', persona);
  if (document.documentElement.dataset.stage === 'structure') url.searchParams.set('stage','structure');
  if (view) url.searchParams.set('view', view);
  if (id) url.searchParams.set('id', id);
  url.hash = hash;
  return url.pathname + url.search + url.hash;
}
function link(view,id,label,key,cls='') {
  return `<a href="${local(view,id)}" data-local id="${key}" class="${cls}">${label}</a>`;
}
function exit(path,label,cls='') {
  return `<a href="https://goathoopers.com${path}" class="out ${cls}">${label}${label.includes('on GOAT')?'':'<span class="exit-label">GOAT site</span>'}</a>`;
}
function face(player) {
  return player.portrait ? `<img class="portrait" src="${escape(player.portrait)}" alt="" width="100" height="108">` : `<span class="portrait initials" aria-hidden="true">${escape(player.name.split(' ').slice(0,2).map(word=>word[0]).join(''))}</span>`;
}
function header() {
  return `<header class="header"><div class="shell header-main">
    <a href="${local()}" data-local class="logo" aria-label="GOAT Hoopers home"><img src="${fixture.assets.logo}" alt="GOAT Hoopers" width="180" height="66"></a>
    <nav class="primary" aria-label="Primary"><a href="${local()}" data-local ${!new URLSearchParams(location.search).get('view')?'aria-current="page"':''}>Home</a><a href="${local('','','finder')}" data-home-anchor>Find ${member()?'a player':'a club'}</a><a href="${local('','','league')}" data-home-anchor>League</a>${exit('/stocks','Stocks')}${exit('/news','News')}${exit('/arcade','Arcade')}</nav>
    <div class="account">${exit('/login','Sign in on GOAT')}</div>
  </div></header>
  <div class="shell demo-line"><div class="demo-copy"><span class="demo-badge">Synthetic demo</span><a href="#sources">About these sources</a><span>Oct 30, 2026 · 08:30 UTC</span></div><div class="persona-form"><label for="demo-persona">Demo persona</label><select id="demo-persona" data-testid="persona-select"><option value="reaves" ${persona==='reaves'?'selected':''}>Reaves Dropper</option><option value="neural" ${persona==='neural'?'selected':''}>NeuralNets</option><option value="guest" ${persona==='guest'?'selected':''}>Guest</option></select></div></div>`;
}
function sources() {
  return `<details class="sources" id="sources" data-testid="sources"><summary>About the synthetic data</summary><p>${escape(fixture.notice)} All current scores, standings, prices, changes and model outputs were constructed for this design scenario. They are not real league events.</p><p>Identities and player references come from the authorized project checkout, not a fresh production roster verification. Only supplied counted-game evidence is shown. Unknown points and unpriced players never become zero.</p><p>Modeled FAAB is a model quote, not cash or a trade result. A partial quote remains a subtotal; no league value rank or historical value line is supplied. Saved model estimates are not calibrated odds. Previous-season facts retain their season and any previous-manager qualification.</p><p>The persona selector changes synthetic demo state only. Real membership is resolved on the current GOAT site by its server. Local inspection does not sign in, generate AI, submit a trade or change a roster. As of <time datetime="${fixture.asOf}">October 30, 2026, 08:30 UTC</time>.</p></details>`;
}
function footer() {
  const groups = [['League',[['/teams','Teams'],['/table','The Table'],['/transactions','Transactions'],['/draft','Draft']]],['Analysis',[['/stocks','Stocks'],['/intel','Intel'],['/ai-decides','AI Decides'],['/trade-analyzer','Trade Analyzer']]],['Club',[['/news','News'],['/history','History'],['/weekly','Weekly archive'],['/arcade','Arcade']]],['Account',[['/team','My Team'],['/login','Sign in']]]];
  return `<footer class="footer"><div class="shell"><div class="footer-top"><div class="footer-brand"><a href="${local()}" data-local aria-label="GOAT Hoopers home"><img src="${fixture.assets.logo}" alt="GOAT Hoopers" width="150" height="55"></a><p>2026 season · Week 3<br>All links in this directory open the current GOAT site.</p></div>${groups.map(([name,links])=>`<nav aria-label="${name}, opens the GOAT site"><h2>${name}</h2>${links.map(([path,label])=>`<a href="https://goathoopers.com${path}">${label}</a>`).join('')}</nav>`).join('')}</div><div class="footer-bottom">${sources()}<p>A fan-made league hub.<br>Not affiliated with the NBA or Sleeper.<br>Independent desktop concept 18.</p></div></div></footer>`;
}
function searchForm() {
  const scope = member()?`your ${person.players.length} roster players`:'the ten public clubs';
  return `<form class="search" id="finder-form" data-testid="finder-form"><label for="finder-input">Find in ${scope}</label><div class="search-controls"><input type="search" id="finder-input" data-testid="finder-input" name="query" autocomplete="off" placeholder="${member()?'Try a player’s name':'Try a club or manager'}" value="${escape(currentQuery)}"><button type="submit" class="action" data-testid="finder-submit">Find</button></div></form>`;
}
function gameBand(match, guest=false) {
  const own = guest ? team(match.home) : person.team;
  const opponent = guest ? team(match.away) : person.opponent;
  const ownScore = match.home === own.id ? match.homePoints : match.awayPoints;
  const otherScore = match.home === opponent.id ? match.homePoints : match.awayPoints;
  return `<div class="game-band" data-testid="current-game"><div class="game-team"><strong>${escape(own.name)}</strong><span>${guest?'Featured public pairing':'Your Week 3 matchup'} · ${record(own)}</span>${ownScore==null?'<span>Your score unavailable</span>':''}</div><div class="game-score num">${ownScore==null?'Unknown':number(ownScore)}</div><div class="game-away"><span class="game-score num">${number(otherScore)}</span><div class="game-team"><strong>${escape(opponent.name)}</strong><span>${record(opponent)} · ${otherScore===0?'0 recorded points':'Current demo score'}</span></div></div>${link('matchup',match.id,'Inspect matchup','matchup-inspect','game-link')}</div>`;
}
function workbench() {
  if (!member()) {
    const club=team('1');
    return `<section class="workbench" id="finder" aria-labelledby="finder-title"><div class="finder-top"><div><h2 id="finder-title">Meet the competition.</h2><p>Ten clubs. Five pairings. A public look inside GOAT.</p></div>${searchForm()}</div><div id="search-results" class="search-results" data-testid="finder-results" aria-live="polite" hidden></div><div class="quicklook"><div class="player-identity"><span class="portrait initials" aria-hidden="true">RD</span><div><p class="eyebrow">Featured public club</p><h3 class="player-name">${club.name}</h3><p class="player-meta">Managed by ${club.manager}</p>${link('club',club.id,'Inspect this club','primary-inspect','text-button')}</div></div><dl class="metrics"><div class="metric"><dt>2026 record</dt><dd><span class="metric-value num">${record(club)}</span><small>Standing 1 of 10<br>Constructed demo table</small></dd></div><div class="metric"><dt>2026 points for</dt><dd><span class="metric-value num">${number(club.pointsFor)}</span><small>Synthetic season points<br>Not this week's score</small></dd></div></dl></div>${gameBand(fixture.matchups[0],true)}<div class="workbench-note">Browse public club facts here. ${exit('/login','Sign in on GOAT')} for your actual team.</div></section>`;
  }
  const player=person.players.find(p=>p.id===(persona==='reaves'?'1511':'1380'));
  return `<section class="workbench" id="finder" aria-labelledby="finder-title"><div class="finder-top"><div><h2 id="finder-title">A closer look at your players.</h2><p>Counted-game evidence and modeled prices, kept in perspective.</p></div>${searchForm()}</div><div id="search-results" class="search-results" data-testid="finder-results" aria-live="polite" hidden></div><div class="quicklook"><div class="player-identity">${face(player)}<div><p class="eyebrow">On your roster · ${player.position}</p><h3 class="player-name">${escape(player.name)}</h3><p class="player-meta">Two distinct views of the same player</p>${link('player',player.id,`Inspect ${escape(player.name)}`,'primary-inspect','text-button')}</div></div><dl class="metrics"><div class="metric"><dt>Counted points</dt><dd><span class="metric-value num">${number(player.completedWeekPoints)}</span><small>Synthetic completed Week 2<br>Oct 19–25, 2026</small></dd></div><div class="metric"><dt>Modeled FAAB quote</dt><dd><span class="metric-value num">${money(player.modeledFaab)}</span><small>Calculated Oct 30 · 08:10 UTC<br>Model value, not a cash balance</small></dd></div></dl></div>${gameBand(person.matchup)}<div class="workbench-note">${person.savedAi.status==='ready'?`${link('matchup',person.matchup.id,'Saved synthetic model estimate available','model-inspect')} · Not calibrated odds.`:'No saved model estimate is supplied for this pairing.'}</div></section>`;
}
function evidenceSection() {
  if (!member()) return `<section class="section guest-context" aria-labelledby="public-heading"><div class="section-heading"><h2 id="public-heading">A league worth knowing.</h2><p>Public facts, with their context</p></div><p class="section-intro">GOAT Hoopers is a ten-team league. Six teams make the playoffs, beginning in Week 20. The field and pairings below are a synthetic Week 3 scenario; they are not live league results.</p><h3>The 2025 final</h3><p><strong>Josh Diddy's Roster</strong> scored <span class="num">326</span> against <strong>papichooter</strong> on <span class="num">251.5</span>. This retained project reference belongs to the 2025 season. ${exit('/history','Explore league history')}</p></section>`;
  const players=person.players.filter(p=>p.participation==='verified_demo'&&p.completedWeekPoints!=null).sort((a,b)=>b.completedWeekPoints-a.completedWeekPoints);
  const value=person.valuation;
  return `<section class="section" aria-labelledby="counted-title" id="evidence"><div class="section-heading"><h2 id="counted-title">${players.length===5?'Five':'Three'} player results.</h2><p>Synthetic completed Week 2 · Oct 19–25, 2026</p></div><p class="section-intro">${players.length} of ${person.players.length} roster players have a supplied completed-week result in this sample. No result is supplied for the remaining players; they are not scored as zero.</p><ul class="evidence-list">${players.map(p=>`<li>${link('player',p.id,`<span class="evidence-value num">${number(p.completedWeekPoints)} <small>points</small></span><span class="evidence-name">${escape(p.name)}</span><span class="position">${p.position} · inspect evidence</span>`,`evidence-${p.id}`)}</li>`).join('')}</ul><div class="roster-context"><div><p><strong class="num">${money(value.modeledFaabSubtotal)} modeled FAAB${value.complete?'':' subtotal'}</strong><br>${value.priced} of ${value.roster} players priced${value.complete?' · complete roster coverage':' · incomplete'}. ${link('quotes','','Inspect '+value.roster+' roster quotes','quotes-inspect')}</p><p class="note">Calculated Oct 30 at 08:10 UTC. Model value is not cash. No comparable league value rank or recorded team-value history is supplied.</p></div><div class="change">${person.changes.map(c=>`<p><time datetime="${c.at}">${time(c.at)}</time><br>${escape(c.headline)}.</p>`).join('')}</div></div></section>`;
}
function leagueSection() {
  const matches=member()?fixture.matchups.filter(m=>m.id!==person.matchup.id):fixture.matchups;
  return `<section class="league-zone" id="league" aria-labelledby="league-title"><div class="section-heading"><h2 id="league-title">${member()?'The rest of Week 3.':'The Week 3 field.'}</h2><p>2026 · Synthetic current scores</p></div><p class="section-intro">${member()?'Your game is above. Here is the rest of the league.':'All five pairings, with the missing score kept visible.'}</p><ul class="pairings">${matches.map(m=>`<li class="pairing"><div class="pair-names">${link('matchup',m.id,`<span>${escape(team(m.home).name)}<br>${escape(team(m.away).name)}</span>`,`pair-${m.id}`)}${m.homePoints==null||m.awayPoints==null?'<small>Incomplete score coverage</small>':''}</div><div class="pair-score num"><span>${number(m.homePoints)}</span><span>${number(m.awayPoints)}</span></div></li>`).join('')}</ul><h3 class="clubs-title">Ten clubs. Room for six in the playoffs.</h3><ul class="clubs">${fixture.standings.map(t=>`<li>${link('club',t.id,`<span class="club-rank num">${t.rank} of 10</span><span class="club-name">${escape(t.name)}</span><small class="num">${record(t)} · 2026 record</small>${member()&&t.id===person.teamId?'<span class="you-label">Your team</span>':''}`,`club-${t.id}`,'club-link')}</li>`).join('')}</ul></section>`;
}
function nextSection() {
  return `<section class="next" aria-label="Explore GOAT"><div><h2>Keep your next move informed.</h2><p>Inspect modeled values in ${exit('/stocks','Stocks')}, then open the ${exit('/trade-analyzer','Trade Analyzer')} to explore a real-site comparison. More league context lives in ${exit('/intel','Intel')} and ${exit('/ai-decides','AI Decides')}. These destinations leave the prototype.</p></div><div class="arcade-link"><img src="${fixture.assets.game}" alt="The existing GOAT free-throw game preview" width="122" height="80" loading="lazy"><div><h2>Take a few shots.</h2><p>${exit('/arcade','Visit the Arcade')} for the existing games. Play happens on GOAT.</p></div></div></section>`;
}
function home() {
  const own=member()?person.team:null;
  return `<main id="content" class="shell" tabindex="-1" data-testid="home"><div class="intro"><div><h1>${own?escape(own.name):'Your way into GOAT.'}</h1><p>${own?`Managed by ${escape(own.manager)} · Your players, your game.`:'Browse the public league. Sign in on GOAT for your actual team.'}</p></div><div class="season-tag">${own?`<span class="record num">${record(own)}</span>Standing ${person.standing.rank} of 10`:'2026 season<br>Week 3 · Ten clubs'}</div></div>${workbench()}${evidenceSection()}${leagueSection()}${nextSection()}</main>`;
}
function detailHead(title) {return `<main id="content" class="shell detail" tabindex="-1" data-testid="detail"><a class="back" id="back-home" data-back href="${local()}">Back to home</a><div class="detail-body"><h1 id="detail-title" tabindex="-1">${title}</h1>`;}
function invalid() {return `${detailHead('This detail is unavailable.')}<div class="error"><p>This identifier is not included for this demo persona. Return home to inspect the supplied players, public clubs or matchups.</p><a href="${local()}" data-local class="action">Go home</a></div></div></main>`;}
function playerDetail(id) {
  const player=member()?person.players.find(p=>p.id===id):null;
  if(!player)return invalid();
  return `${detailHead(escape(player.name))}<div class="detail-heading">${face(player)}<p>${player.position} · On ${escape(person.team.name)}<br>Supplied identity and player reference</p></div><div class="detail-summary"><section><h2>Counted-game evidence</h2><p class="large num">${player.completedWeekPoints==null?'Unavailable':number(player.completedWeekPoints)+' points'}</p><p>Synthetic completed Week 2<br>October 19–25, 2026</p><p class="note">${player.completedWeekPoints==null?'No counted-game evidence is supplied for this player. This is not zero points, a DNP or a poor-form classification.':'Verified within this synthetic sample. This counted figure is not a season average, forecast or full-roster total.'}</p></section><section><h2>Current modeled FAAB quote</h2><p class="large num">${money(player.modeledFaab)}</p><p>Calculated October 30, 2026 · 08:10 UTC</p><p class="note">${player.modeledFaab==null?'No modeled quote is supplied. The player is omitted from the subtotal, not priced at zero.':'A model value, not a cash balance, actual transaction or performance score.'}</p></section></div><div class="detail-info"><p>These are two different measures with different periods. A price does not establish form, and a supplied player result does not establish future performance.</p><p>${person.playerEvidence.verifiedPlayers} of ${person.playerEvidence.rosterPlayers} roster players have counted-game evidence. ${person.valuation.priced} of ${person.valuation.roster} have modeled quotes.</p></div>${exit('/player/'+id,'Open player on GOAT','detail-out')}</div></main>`;
}
function modelEstimate() {
  const saved=person.savedAi;
  return `<section class="model" aria-labelledby="model-title"><h2 id="model-title">Saved synthetic model estimate</h2><div class="model-bars">${saved.probabilities.map(p=>`<p>${escape(team(p.teamId).name)}<strong class="num">${Math.round(p.probability*100)}%</strong></p>`).join('')}</div><p><strong>Confidence: <span class="num">${Math.round(saved.confidence*100)}%</span></strong> · Separate from the probabilities above.</p><p>Saved October 26, 2026 at 08:00 UTC for this synthetic pairing. These are not calibrated odds, a live forecast or a guaranteed result. No model is generated here.</p></section>`;
}
function matchupDetail(id) {
  const match=fixture.matchups.find(m=>m.id===id);
  if(!match)return invalid();
  const h=team(match.home),a=team(match.away);
  return `${detailHead('Week 3 matchup')}<div class="detail-summary">${[[h,match.homePoints],[a,match.awayPoints]].map(([t,score])=>`<section><h2>${escape(t.name)}</h2><p class="large num">${score==null?'Score unavailable':number(score)+' points'}</p><p>2026 record: <span class="num">${record(t)}</span><br>Standing ${standing(t.id).rank} of 10</p></section>`).join('')}</div><div class="detail-info"><p><strong>Current demo score · October 30, 2026, 08:30 UTC.</strong></p><p>${match.homePoints==null||match.awayPoints==null?'One score has not been supplied. papichooter has a recorded zero; NeuralNets has an unknown value. No tie, leader, margin or result is inferred.':'Both current score values are supplied in the synthetic scenario. They are not a final result or verified real league score.'}</p></div>${member()&&person.matchup.id===id&&person.savedAi.status==='ready'?modelEstimate():`<p class="detail-info">No saved model estimate is supplied in this ${member()?'pairing context':'public guest view'}.</p>`}${exit('/teams/'+h.id,'Open '+escape(h.name)+' on GOAT','detail-out')}<br>${exit('/teams/'+a.id,'Open '+escape(a.name)+' on GOAT','detail-out')}</div></main>`;
}
function clubDetail(id) {
  const club=team(id);if(!club)return invalid();
  const old=club.previousSeason;
  return `${detailHead(escape(club.name))}<div class="detail-summary"><section><h2>2026 public club context</h2><p class="large num">${record(club)}</p><p>Managed by ${escape(club.manager)}<br>Standing ${standing(id).rank} of 10 · ${number(club.pointsFor)} points for</p><p class="note">Current quantities are constructed for this demo.</p></section><section><h2>${old.season} historical reference</h2><p class="large num">${old.wins}–${old.losses}</p><p>Finished ${old.finish} of 10.${old.ownerNote?`<br><strong>${escape(old.ownerNote)}</strong>`:''}</p><p class="note">A previous-season record, not this week's result.</p></section></div><div class="detail-info"><p>This public profile uses only the supplied club facts. It does not claim a private account or supply a full roster for this club.</p></div>${exit('/teams/'+id,'Open public team profile on GOAT','detail-out')}</div></main>`;
}
function quotesDetail() {
  if(!member())return invalid();const value=person.valuation;
  return `${detailHead('Your roster quotes')}<div class="detail-summary"><section><h2>Modeled FAAB${value.complete?'':' subtotal'}</h2><p class="large num">${money(value.modeledFaabSubtotal)}</p><p>${value.priced} of ${value.roster} players priced${value.complete?' · complete coverage':' · incomplete'}</p></section><section><h2>Quote context</h2><p>Calculated October 30, 2026 · 08:10 UTC</p><p class="note">Model value, not cash. No comparable league value rank is supplied. No recorded team-value series is included, so no trend is inferred.</p></section></div><div class="quote-controls"><div><label for="quote-search">Find a roster player</label><input type="search" id="quote-search" data-testid="quote-search"></div><div><label for="quote-coverage">Quote coverage</label><select id="quote-coverage" data-testid="quote-filter"><option value="all">All players</option><option value="priced">Priced only</option><option value="unpriced">Unpriced only</option></select></div></div><p class="count" id="quote-count" aria-live="polite"></p><ul class="quote-list" id="quote-list" data-testid="quote-list"></ul><p class="detail-info">Unpriced players contribute no known amount to this subtotal. Their missing quotes are not zeros. The price order puts unpriced entries first, then available modeled values from high to low.</p>${exit('/stocks','Open Stocks on GOAT','detail-out')}</div></main>`;
}
function updateQuotes() {
  const query=fold(document.querySelector('#quote-search').value);const coverage=document.querySelector('#quote-coverage').value;
  const players=person.players.filter(p=>fold(p.name).includes(query)&&(coverage==='all'||(coverage==='priced'?p.modeledFaab!=null:p.modeledFaab==null))).sort((a,b)=>(a.modeledFaab==null&&b.modeledFaab==null?0:a.modeledFaab==null?-1:b.modeledFaab==null?1:b.modeledFaab-a.modeledFaab)||a.name.localeCompare(b.name));
  document.querySelector('#quote-count').textContent=`${players.length} of ${person.players.length} players shown`;
  document.querySelector('#quote-list').innerHTML=players.map(p=>`<li><div>${link('player',p.id,escape(p.name),'quote-player-'+p.id)}<small>${p.position}</small></div><span class="quote-value num">${money(p.modeledFaab)}</span></li>`).join('') || '<li>No players match this search and coverage filter.</li>';
}
function showResults(query) {
  currentQuery=query.trim();const box=document.querySelector('#search-results');
  if(!box)return;
  box.hidden=false;
  if(!currentQuery){box.innerHTML='<p>Enter part of a name to find a supplied '+(member()?'roster player':'public club')+'. Your homepage remains below.</p>';return;}
  const q=fold(currentQuery);const matches=(member()?person.players:fixture.teams).filter(item=>fold(item.name+' '+(item.manager||'')).includes(q));
  box.innerHTML=`<p>${matches.length} ${matches.length===1?'match':'matches'} for “${escape(currentQuery)}” in ${member()?'your demo roster':'the public clubs'}.</p><ul class="result-list">${matches.map(item=>`<li>${link(member()?'player':'club',item.id,`<span>${escape(item.name)}</span><small>${member()?item.position:record(item)}</small>`,'result-'+item.id)}</li>`).join('')}</ul><button type="button" class="reset" id="finder-reset">Clear search</button>`;
}
function render({focus=false}={}) {
  const params=new URLSearchParams(location.search);persona=allowed.includes(params.get('persona'))?params.get('persona'):'reaves';person=fixture.personas[persona];
  document.documentElement.dataset.persona=persona;
  document.documentElement.dataset.stage=params.get('stage')==='structure'?'structure':'normal';
  const view=params.get('view');const id=params.get('id');
  currentQuery=history.state?.finderQuery||'';
  let body=view==='player'?playerDetail(id):view==='matchup'?matchupDetail(id):view==='quotes'?quotesDetail():view==='club'?clubDetail(id):view?invalid():home();
  app.innerHTML=header()+body+footer();
  if(!view&&currentQuery)showResults(currentQuery);
  if(view==='quotes'&&member())updateQuotes();
  document.title=`GOAT Hoopers — ${view?'Inspect':member()?person.team.name:'Public league'} · Synthetic demo`;
  if(focus)requestAnimationFrame(()=>{window.scrollTo(0,0);document.querySelector('#detail-title,#content')?.focus({preventScroll:true});});
}
function navigate(href, trigger) {
  history.replaceState({...history.state,scrollY:window.scrollY,focusId:trigger?.id||'',finderQuery:currentQuery},'',location.href);
  history.pushState({fromLocal:true},'',href);
  render({focus:true});
}
document.addEventListener('click',event=>{
  const anchor=event.target.closest('a');
  if(anchor&&(anchor.hasAttribute('data-local')||anchor.hasAttribute('data-home-anchor')||anchor.hasAttribute('data-back'))){
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();
    if(anchor.hasAttribute('data-back')&&history.state?.fromLocal){history.back();return;}
    if(anchor.hasAttribute('data-home-anchor')){
      const hash=new URL(anchor.href).hash;
      if(!new URLSearchParams(location.search).has('view')){document.querySelector(hash)?.scrollIntoView();document.querySelector(hash+' h2')?.focus?.();return;}
      navigate(anchor.href,anchor);requestAnimationFrame(()=>document.querySelector(hash)?.scrollIntoView());return;
    }
    navigate(anchor.href,anchor);
  }
  if(event.target.closest('#finder-reset')){currentQuery='';document.querySelector('#finder-input').value='';document.querySelector('#search-results').hidden=true;history.replaceState({...history.state,finderQuery:''},'',location.href);document.querySelector('#finder-input').focus();}
});
document.addEventListener('submit',event=>{
  if(event.target.id==='finder-form'){event.preventDefault();showResults(document.querySelector('#finder-input').value);history.replaceState({...history.state,finderQuery:currentQuery},'',location.href);}
});
document.addEventListener('change',event=>{
  if(event.target.id==='demo-persona'){persona=event.target.value;currentQuery='';history.pushState({},'',local());render({focus:true});}
  if(event.target.id==='quote-coverage')updateQuotes();
});
document.addEventListener('input',event=>{if(event.target.id==='quote-search')updateQuotes();});
window.addEventListener('popstate',()=>{render();requestAnimationFrame(()=>{window.scrollTo(0,history.state?.scrollY||0);const target=document.getElementById(history.state?.focusId||'');target?.focus({preventScroll:true});});});
render();
await document.fonts.ready;
document.documentElement.dataset.personalStudyReady='18';
