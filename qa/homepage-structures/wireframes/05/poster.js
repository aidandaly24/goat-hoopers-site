import {inventory,data,mode,aiState,esc,money} from '../../data.js';

// A text composition: every view is an address within the same flowing document.
const home=data.home;
const member=mode==='member'&&data.personal.kind==='member'?data.personal.summary:null;
const teams=home.hub.teams;
const byId=new Map(teams.map(t=>[t.id,t]));
const pair=member?.matchup??home.directory[0].currentMatchup;
const edition=home.edition;
const record=t=>`${t.wins}–${t.losses}${t.ties?`–${t.ties}`:''}`;
const teamName=id=>byId.get(String(id))?.name??String(id);
const link=(href,label,cls='')=>`<a ${cls?`class="${esc(cls)}"`:''} href="${esc(href)}">${esc(label)}</a>`;
const teamLink=t=>link(`/teams/${t.id}`,t.name);
const playerLink=(id,name)=>link(`/player/${id}`,name);
const points=n=>n==null?'Pending':Number(n).toFixed(1);
const date=v=>new Date(v).toLocaleString('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})+' UTC';
const source=s=>`${link(s.url,s.label)} · checked ${esc(s.checkedAt)}`;
const states=[{id:'default',label:'The current pair'},{id:'picks',label:'Five saved model sentences'},...(member?[{id:'roster',label:'Your value and player form'}]:[]),{id:'people',label:'Ten league faces'},{id:'league',label:'The searchable name field'},{id:'edition',label:'Dated editorial poster'},{id:'archive',label:'Two archive editions'},{id:'tools',label:'League destinations'}];
const indexLinks=[['week','01','This week'],['picks','02','Saved picks'],...(member?[['roster','03','Your team']]:[]),['people','04','People'],['league','05','Names'],['edition','06','Read'],['archive','07','Archive'],['tools','08','Go']];
const pairRows=[...new Map(home.directory.map(t=>[t.currentMatchup.home.id,t.currentMatchup])).values()];
const pairFor=ids=>pairRows.find(p=>ids.includes(p.home.id)&&ids.includes(p.away.id));

function modelLines(){
  if(!data.weekly)return `<p class="empty">Saved AI slate unavailable. No returned choice or probability is supplied for this state.</p><p>${link('/ai-decides','Open AI Decides')}</p>`;
  return data.weekly.matchups.map(row=>{
    const r=row.result,p=pairFor(row.teamIds);
    return `<article class="ai-line" data-model-row="${esc(row.matchupId)}">
      <h3 class="pair-names">${row.teamIds.map(id=>teamLink(byId.get(id))).join(' / ')}</h3>
      <p class="pair-score">Week ${p.week}: ${esc(points(p.homePoints))} / ${esc(points(p.awayPoints))} · incomplete · both teams ${record(p.home)} and ${record(p.away)}</p>
      <p class="returned">Returned choice: ${link(`/teams/${r.choice}`,teamName(r.choice))} <strong>${Math.round(r.probabilities.find(p=>p.choice===r.choice).probability*100)}%</strong></p>
      <p class="probabilities">${r.probabilities.map(p=>`${esc(teamName(p.choice))} ${Math.round(p.probability*100)}%`).join(' / ')}.<br>Independent confidence ${Math.round(r.confidence*100)}%. ${esc(r.probabilityLabel)}.</p>
      <details class="provenance"><summary>Read the saved model receipt for ${esc(teamName(r.choice))}</summary><div><dl>
        <dt>Status / saved timestamp</dt><dd>${esc(data.weekly.status)} · ${esc(date(data.weekly.generatedAt))} · season ${esc(data.weekly.season)}, Week ${data.weekly.week}</dd>
        <dt>Returned choice</dt><dd>${esc(teamName(r.choice))}; retained exactly as returned, independently of the larger probability.</dd>
        <dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd>
        <dt>Input snapshot / baseline</dt><dd>${r.snapshot?esc(JSON.stringify(r.snapshot)):'No input snapshot supplied'}; ${row.baseline?esc(JSON.stringify(row.baseline)):'no baseline supplied'}.</dd>
        <dt>Input evidence</dt><dd>${row.evidence.map(esc).join(' ')||'None supplied.'}</dd>
        <dt>Returned evidence</dt><dd>${r.evidence.map(esc).join(' ')||'No returned evidence supplied.'}</dd>
      </dl>${link('/ai-decides','Inspect AI Decides')}</div></details>
    </article>`;
  }).join('');
}
function personal(){
  if(!member)return '';
  const v=member.valuation,g=member.playerGuide;
  return `<section id="roster" class="own" aria-labelledby="own-title"><p class="section-label">03 / Your team · synthetic member edition</p>
    <h2 id="own-title" class="own-heading">${esc(member.team.name)}.</h2>
    <p class="team-annotation">${esc(member.team.managerName)} · ${member.coverage.roster} players · standing ${member.standing.rank} / ${teams.length} · ${record(member.team)} current record.</p>
    <div class="actions">${link('/team','My team')}${link('/teams/1#team-roster','Open team roster')}${link('/stocks#player-board','Stocks')}</div>
    <p class="valuation">${money(v.total)}</p>
    <div class="value-context"><p>Current modeled FAAB ${v.complete?'total':'subtotal'} · ${v.priced} priced / ${v.unpriced} unpriced / ${member.coverage.roster} roster players. Pricing basis: ${esc(member.market.pricingBasis)}. Model computation: ${esc(date(member.market.updatedAt))}.</p><p>League value rank unavailable: full pricing coverage for all ten compared rosters is not supplied.</p></div>
    <p class="value-leaders">Highest modeled values: ${member.players.map(p=>`${playerLink(p.id,p.name)} <b>${money(p.value)}</b> <small>${esc(p.position)} · Up ${p.changePct}%</small>`).join(' / ')}.</p>
    <details id="all-values" class="value-fold"><summary>Unfold all ${member.rosterValues.length} player values</summary><p class="value-flow">${member.rosterValues.map(p=>`<span class="value-item">${playerLink(p.id,p.name)} <small>${esc(p.position)} ${money(p.value)}</small></span>`).join('')}</p></details>
    <p class="history-note">${esc(inventory.missing.history)} ${link('/history','History')}. ${esc(inventory.missing.power)}</p>
    <div class="guide"><h3 class="guide-title">On form. Different from value.</h3><p class="guide-period">${esc(g.watch.label)} · season ${g.season}, in-season through current Week ${g.currentWeek}.</p>
      <ul class="watch-flow">${g.watch.rows.map(p=>`<li>${playerLink(p.id,p.name)} <b>${p.value}</b> <small>EMA fantasy PPG / ${p.games} observed games · ${esc(p.note)}</small></li>`).join('')}</ul>
      <p class="guide-period">${esc(g.watch.message)}</p>
      <div class="recap"><h3>Your best / the rough week</h3><p class="guide-period">Completed source period: ${esc(g.period)}. Synthetic recorded fixture; these are not current official awards.</p>
        <p><b>Your best:</b> ${g.best.map(p=>`${playerLink(p.id,p.name)} ${p.value} points / ${p.games} GP`).join(' · ')}.</p>
        <p><b>The rough week:</b> ${g.rough.map(p=>`${playerLink(p.id,p.name)} ${p.value} points / ${p.games} GP`).join(' · ')}.</p>
        <p class="guide-period">3 shown in each selection / ${g.eligiblePlayed} eligible. ${esc(g.coverage)} ${esc(g.recapMessage)}</p>
      </div>
    </div>
    <div class="team-wire"><h3>From your wire.</h3><ul>${member.news.map(n=>`<li>${link(n.url,n.headline)}<br><small>${esc(n.outlet.name)} · ${esc(date(n.publishedAt))} · synthetic news</small></li>`).join('')}${member.moves.map(m=>`<li>${esc(m.summary)}<br><small>Week ${m.week} · ${esc(m.type)} · ${esc(date(m.createdAt))}. No player add/drop legs supplied.</small></li>`).join('')}</ul>${link('/transactions','All transactions')}</div>
  </section>`;
}
function faceFlow(){return data.faces.map(f=>`<span class="face">${playerLink(f.player.id,f.player.name)} <small>${esc(f.player.position)} · modeled ${money(f.player.value)} for ${teamLink(f.team)}${f.champion?' · 2025 champion':''} <button data-open-team="${esc(f.team.id)}" aria-label="Find ${esc(f.team.name)} in the team index">Find roster</button></small></span>`).join('');}
function teamFlow(entries,query=''){
  return entries.map(d=>{
    const t=d.identity,m=d.currentMatchup,opponent=m.home.id===t.id?m.away:m.home,previous=d.previousSeason;
    const matchedPlayers=query?d.players.filter(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`.toLocaleLowerCase().includes(query)):[];
    return `<details id="team-${esc(t.id)}" class="team-line" data-team-id="${esc(t.id)}" ${matchedPlayers.length?'open':''}><summary>${esc(t.name)} <span class="count">${d.players.length} roster names · unfold</span></summary>
      <p>${esc(t.managerName)} · current ${record(d.currentRecord)} · Week ${m.week} versus ${teamLink(opponent)} · ${esc(points(m.homePoints))} / ${esc(points(m.awayPoints))} ${esc(m.home.name)} / ${esc(m.away.name)} · incomplete.</p>
      <div class="team-detail">${link(`/teams/${t.id}`,'Team profile')} / ${link(`/teams/${t.id}#team-roster`,'Roster destination')}
        <p class="team-previous">${previous.season}: ${previous.wins}–${previous.losses}, finish ${previous.finish}. ${esc(previous.ownerNote??'')}</p>
        ${matchedPlayers.length?`<p>Player matches: ${matchedPlayers.map(p=>playerLink(p.id,p.fullName)).join(' / ')}.</p>`:''}
        <p class="roster-text">${d.players.map(p=>`<span>${playerLink(p.id,p.fullName)} <small>${esc(p.position)} / ${esc(p.nbaTeam)}</small></span>`).join('')}</p>
        <p>No latest move supplied in this directory record. ${link('/transactions','Transaction log')}.</p>
      </div></details>`;
  }).join('');
}
function spotlights(){return edition.playerSpotlights.map(s=>`<article class="spotlight"><p class="eyebrow">${esc(s.periodLabel)} · ${esc(s.role)} · editorial opinion</p><p class="player-name">${playerLink(s.playerId,s.name)} / ${esc(s.position)} / ${link(`/teams/${s.teamId}`,teamName(s.teamId))}</p><h3>${esc(s.headline)}</h3><p class="opinion">${esc(s.opinion)}</p><p class="stat-flow">${s.stats.map(v=>`<strong>${esc(v.value)}</strong> <small>${esc(v.label)}</small>`).join(' / ')}</p><p>${esc(s.statPeriod)}</p><details class="source-detail"><summary>Why this player / source and period</summary><p>${esc(s.selectionReason)}</p><p>${source(s.source)}</p></details></article>`).join('');}
function archives(){return data.archive.map(a=>`<article class="archive-entry"><p class="eyebrow">${esc(a.dateLabel)} · ${esc(a.status)} sample · ${esc(a.id)}</p><h3>${link(`/weekly/${a.id}`,a.title)}</h3><p>${esc(a.game.title)} ${esc(a.game.context)}</p><p>${esc(a.game.note)} · ${esc(a.game.state)}${a.game.scores?` · ${a.game.scores.map(points).join(' / ')} recorded final`:''}. ${a.publishedAt?`Published ${esc(a.publishedAt)}`:'Not published.'}</p><details><summary>Read archive context and references</summary><div class="source-detail"><p>${esc(a.game.selectionReason)}</p><p>Edition period: ${esc(a.startsAt)} to ${esc(a.endsAt)} (end exclusive). Teams: ${a.game.teamIds.map(id=>link(`/teams/${id}`,teamName(id))).join(' / ')}.</p>${a.happenings.map(h=>`<p>${esc(h.dateLabel)} · ${link(h.href,h.title)}. ${esc(h.text)}</p>`).join('')}<ul>${a.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul>${a.playerSpotlights.length?`<p>The three full player stories in this edition are reproduced in the dated editorial text above.</p>`:''}${link(`/weekly/${a.id}`,'Open dated archive route')}</div></details></article>`).join('');}

document.querySelector('#poster').innerHTML=`
  <header class="mast"><a class="brand" href="#week" aria-label="GOAT Hoopers Home">GOAT <span>HOOPERS</span></a><nav aria-label="Primary">${link('#week','Home')}${link('/intel','News','desktop-extra')}${link('/stocks#player-board','Stocks')}${member?link('/team','My team'):link('/teams','Teams')}${link('?view='+ (mode==='member'?'public':'member'),mode==='member'?'Public edition':'Member edition','edition-switch desktop-extra')}</nav></header>
  <details class="field-index" open><summary>Text index / ${indexLinks.length} regions</summary><nav class="index" aria-label="Poster text index">${indexLinks.map(([id,n,label])=>`<a href="#${id}" data-region="${id}"><span>${n}</span>${label}</a>`).join('')}</nav></details>
  <p class="fixture">STUDY 05 / Synthetic fixture · 12 Nov 2026 · not live data.</p>
  <main class="field">
    <section id="week" class="week" aria-labelledby="week-title"><div class="week-meta"><p class="eyebrow">${member?'Your':'League'} Week ${pair.week} / ${esc(home.hub.season.seasonYear)} / ${esc(home.hub.season.leagueName)}</p><p class="eyebrow">${member?'Member edition':'Public edition'} · ${teams.length} teams</p></div>
      <h1 id="week-title" class="primary-name">${teamLink(pair.home)}</h1><p class="team-annotation">${esc(pair.home.managerName)} / ${record(pair.home)} current record${member?` / ${link('/team','My team')}`:` / ${link('#league','Find a team')}`}</p>
      <div class="score-line"><span class="score">${esc(points(pair.homePoints))}</span><span class="score-label">${pair.homePoints==null?'Score pending':'Known score'}<br>not a final result</span><span class="versus">/</span><span class="pending">${esc(points(pair.awayPoints))}</span></div>
      <p class="opponent-name">${teamLink(pair.away)}</p><p class="opponent-annotation">${esc(pair.away.managerName)} / ${record(pair.away)} current record / away score pending</p>
      <div class="week-caption"><p>This pair is incomplete. A known zero stays zero; missing points stay Pending. The saved model has a returned choice worth reading closely.</p><div class="actions">${link('#picks','Read the saved pick')}${member?link('/team','My team'):link('#league','Find a team')}${link('#edition','Read the dated edition')}</div></div>
    </section>
    <section id="picks" class="signals" aria-labelledby="picks-title"><p class="section-label">02 / Five saved sentences · synthetic model examples</p><div class="signal-intro"><h2 id="picks-title" class="text-title">The model said<br>what it said.</h2><p class="ai-status">${aiState==='stale'?'STALE saved slate · retained for inspection, not a fresh forecast.':!data.weekly?'Saved slate unavailable.':'Saved Week 3 slate · 10 Nov 2026.'}</p><p class="section-note">A returned choice is not the highest displayed probability. Probability and independent confidence are different fields. No model runs when this page opens.</p></div><div class="ai-lines">${modelLines()}</div><p>${link('/ai-decides','Open AI Decides')}</p></section>
    ${personal()}
    <section id="people" class="faces" aria-labelledby="people-title"><p class="section-label">04 / The league, through ten players</p><h2 id="people-title" class="text-title">Names worth<br>knowing.</h2><p class="faces-intro">One player per current team, supplied as that team’s highest modeled value. These synthetic FAAB values describe the model, not a completed trade or a performance ranking.</p><p class="face-flow">${faceFlow()}</p></section>
    <section id="league" class="league" aria-labelledby="league-title"><p class="section-label">05 / Ten teams · 228 unique roster references</p><div class="league-intro"><h2 id="league-title" class="text-title">Find a name.</h2>${link('/teams','Full teams destination')}</div><div class="search-controls"><label>Team, manager, player, position or NBA team<input id="name-search" type="search" placeholder="Try Embiid or NeuralNets" autocomplete="off"></label><label>Order the text<select id="team-sort"><option value="rank">Current standing</option><option value="az">Team A–Z</option><option value="roster">Roster size</option></select></label></div><p class="result-count" id="result-count" aria-live="polite">10 teams / 228 roster names. Unfold a team to read its complete roster.</p><div id="team-index">${teamFlow(home.directory)}</div>
      <h3 class="standing-label">The current order / synthetic standings</h3><p class="standings-flow">${home.hub.standings.map(s=>`<span class="standing-entry"><b>${s.rank}.</b> ${teamLink(s.team)} <small>${s.wins} W / ${s.losses} L${s.ties?` / ${s.ties} T`:''} / ${(s.pointsFor/100).toFixed(2)} PF${member&&s.team.id===member.team.id?' / your team':''}</small></span>`).join('')}</p>
      <p class="section-note">PF is fantasy points for, supplied in hundredths and divided by 100. Current records are synthetic; previous-season records appear only inside each team with season and manager attribution.</p>
    </section>
    <section id="edition" class="edition" aria-labelledby="edition-title"><p class="section-label">06 / ${esc(edition.dateLabel)} · ${esc(edition.status)} sample edition · not current Week 3</p><h2 id="edition-title" class="edition-heading">${esc(edition.title)}.</h2><div class="editorial-game"><h3>${esc(edition.game.title)}</h3><p>${esc(edition.game.note)} · Week ${edition.game.leagueWeek} · ${esc(edition.game.state)} · scores not supplied.</p><p>${esc(edition.game.context)}</p><details class="source-detail"><summary>Editorial selection and dated context</summary><p>${esc(edition.game.selectionReason)}</p><p>This October draft is a dated editorial sample, not an official current-week report. The fixture’s edition team-id metadata conflicts with its game prose; the supplied prose is preserved here, and the archive below carries the consistent original pairing. No current matchup is inferred from this draft.</p><p>Period: ${esc(edition.startsAt)} to ${esc(edition.endsAt)}, end exclusive. Not published.</p>${link(`/weekly/${edition.id}`,'Open edition route')}</details></div>
      ${spotlights()}
      <div class="wire"><h3>Around the league / dated October wire</h3><ul>${edition.happenings.map(h=>`<li><small>${esc(h.dateLabel)}</small> ${link(h.href,h.title)}. ${esc(h.text)}</li>`).join('')}</ul><p>Separately, in the synthetic current transaction fixture:</p><ul>${home.hub.transactions.map(m=>`<li>${esc(m.summary)} <small>Week ${m.week} / ${esc(date(m.createdAt))} / ${esc(m.type)} / no add/drop player legs supplied</small></li>`).join('')}</ul>${link('/transactions','Read all transactions')}</div>
      <details class="sources"><summary>Read the edition’s ${edition.sources.length} dated sources</summary><ul>${edition.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul></details>
    </section>
    <section id="archive" class="archive" aria-labelledby="archive-title"><p class="section-label">07 / The dates stay attached</p><h2 id="archive-title" class="text-title">Earlier words.<br>Recorded context.</h2>${archives()}${link('/weekly','Browse weekly archive')}</section>
    <section id="tools" class="tools" aria-labelledby="tools-title"><p class="section-label">08 / Where do you want to go?</p><h2 id="tools-title" class="text-title">Keep playing.</h2><p class="tool-flow">${link('/stocks#player-board','Stocks')} <span>/</span> ${link('/trade-analyzer','Trade analyzer')} <span>/</span> ${link('/arcade/free-throw','Play Free Throw')} <span>/</span> ${link('/arcade','Arcade')} <span>/</span> ${link('/ai-decides','AI Decides')} <span>/</span> ${link('/intel','News')} <span>/</span> ${link('/teams','Teams')} <span>/</span> ${link('/transactions','Transactions')} <span>/</span> ${link('/history','History')}.</p><p class="tool-note">${esc(inventory.missing.history)} ${esc(inventory.missing.power)} Historical sources and the 2025 final in the dated archive are distinct from an unconnected current history or power producer.</p></section>
    <footer class="footer"><p>GOAT HOOPERS / 05 / The typographic field. ${esc(inventory.warning)}</p><p>Local fixture checked ${esc(date(home.checkedAt))}. Approved identities and dated editorial retained; this is a structural review artifact. Profile and tool links point to actual GOAT routes and leave this local wireframe.</p><div class="inline-links">${link('?view=member','Member fixture')}${link('?view=public','Public fixture')}${link(`?view=${mode}&ai=ready#picks`,'Ready AI')}${link(`?view=${mode}&ai=stale#picks`,'Stale AI')}${link(`?view=${mode}&ai=missing#picks`,'Missing AI')}</div>${link('#week','Back to the beginning','back-index')}</footer>
  </main>`;

function setRegion(id){document.querySelectorAll('[data-region]').forEach(a=>{if(a.dataset.region===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});document.body.dataset.studyState=id==='week'?'default':id;}
function activate(id){
  const region=id==='default'?'week':id;
  const target=document.getElementById(region);
  if(!target)return false;
  if(id==='roster')document.getElementById('all-values').open=true;
  if(id==='league'){
    document.getElementById('name-search').value='';
    document.getElementById('team-sort').value='rank';
    filterTeams();
    document.getElementById('team-1').open=true;
  }
  if(id==='picks')document.querySelector('#picks .provenance')?.setAttribute('open','');
  if(id==='archive')document.querySelector('#archive details')?.setAttribute('open','');
  setRegion(region);
  if(id==='default')window.scrollTo({top:0,behavior:'instant'});
  else target.scrollIntoView({behavior:'instant',block:'start'});
  return true;
}
function filterTeams(){
  const query=document.getElementById('name-search').value.trim().toLocaleLowerCase();
  const sort=document.getElementById('team-sort').value;
  const matches=home.directory.filter(d=>`${d.identity.name} ${d.identity.managerName} ${d.players.map(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`).join(' ')}`.toLocaleLowerCase().includes(query));
  matches.sort((a,b)=>sort==='az'?a.identity.name.localeCompare(b.identity.name):sort==='roster'?b.players.length-a.players.length:home.hub.standings.find(s=>s.team.id===a.identity.id).rank-home.hub.standings.find(s=>s.team.id===b.identity.id).rank);
  document.getElementById('team-index').innerHTML=matches.length?teamFlow(matches,query):'<p class="empty">No names found. Try a team, manager, player, position or NBA abbreviation.</p>';
  document.getElementById('result-count').textContent=`${matches.length} ${matches.length===1?'team':'teams'} / ${matches.reduce((n,d)=>n+d.players.length,0)} roster names${query?' · matching “'+query+'”':''}. Unfold a team to read its complete roster.`;
}
document.getElementById('name-search').addEventListener('input',filterTeams);
document.getElementById('team-sort').addEventListener('change',filterTeams);
document.querySelectorAll('[data-open-team]').forEach(b=>b.addEventListener('click',()=>{
  document.getElementById('name-search').value='';filterTeams();
  const t=document.getElementById('team-'+b.dataset.openTeam);t.open=true;setRegion('league');location.hash=t.id;t.scrollIntoView({behavior:'instant',block:'start'});t.querySelector('summary').focus({preventScroll:true});
}));
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
  const id=a.getAttribute('href').slice(1);if(document.getElementById(id))setRegion(id);
}));
window.goatStudy={states,activate};
document.body.dataset.studyReady='05';
const narrowIndex=matchMedia('(max-width:40rem)');
const adaptIndex=()=>{document.querySelector('.field-index').open=!narrowIndex.matches;};
narrowIndex.addEventListener('change',adaptIndex);adaptIndex();
function readHash(){const id=location.hash.slice(1)||'week';const target=document.getElementById(id);if(id.startsWith('team-')&&target){target.open=true;setRegion('league');}else setRegion(id);return target;}
window.addEventListener('hashchange',readHash);readHash();
if(location.hash)requestAnimationFrame(()=>readHash()?.scrollIntoView({behavior:'instant',block:'start'}));
