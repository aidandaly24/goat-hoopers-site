import {inventory, data, mode, aiState, esc, money} from '../../data.js';

// Whole home in document flow. Filters apply only to the franchise register.
const $ = selector => document.querySelector(selector);
const teams = data.home.directory;
const personal = mode === 'member' ? data.personal.summary : null;
const byId = new Map(teams.map(t => [t.identity.id, t]));
const faces = new Map(data.faces.map(f => [f.team.id, f]));
const standings = new Map(data.home.hub.standings.map(s => [s.team.id, s]));
const pairs = [...new Map(teams.filter(t => t.currentMatchup).map(t => [t.currentMatchup.home.id, t.currentMatchup])).values()];
const opened = new Map();
let query = '', order = 'rank';
const num = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamName = id => byId.get(String(id))?.identity.name ?? String(id);
const teamLink = team => `<a href="/teams/${esc(team.id)}">${esc(team.name)}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const date = value => value == null ? 'Not supplied' : new Date(value).toISOString().replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC');
const localHref = value => String(value).replace(/^https:\/\/goathoopers\.com/,'');
const td = (label, html, cls='') => `<td data-label="${esc(label)}" class="${cls}"><div class="cell-value">${html}</div></td>`;
const action = (key, kind, label) => `<button type="button" data-toggle="${key}" data-kind="${kind}" aria-expanded="${opened.get(key)===kind}" ${opened.get(key)===kind?`aria-controls="detail-${key}"`:""}>${label}</button>`;
const foldout = (key, title, content, kind) => `<tr class="subrow" id="detail-${key}"><td colspan="8"><div class="foldout"><div class="foldout-top"><h3>${title}</h3><button type="button" data-close="${key}" data-kind="${kind}">Close</button></div>${content}</div></td></tr>`;
const has = value => !query || JSON.stringify(value).toLocaleLowerCase().includes(query);
const heading = (id,title,description) => `<div class="section-heading"><h2 id="${id}-heading">${title}</h2><p>${description}</p></div>`;
const savedPick = m => data.weekly?.matchups.find(p => p.teamIds.includes(m.home.id));
const aiLabel = aiState === 'missing' ? 'Unavailable' : aiState === 'stale' ? 'Stale saved pick' : 'Saved fixture pick';
function rosterTable(team) {
  const values = personal?.team.id === team.identity.id ? new Map(personal.rosterValues.map(p=>[p.id,p.value])) : null;
  const previous = team.previousSeason;
  const prior = previous ? `${previous.season}: ${previous.wins}–${previous.losses}, finish ${previous.finish}. ${previous.ownerNote ?? ''}` : 'Previous-season record not supplied.';
  return `<p class="readable">${team.players.length} current player references. ${esc(prior)}</p>
  ${values ? `<p>Modeled FAAB values · ${esc(personal.market.pricingBasis)} basis · computed ${date(personal.market.updatedAt)}. ${personal.valuation.priced} priced / ${personal.valuation.unpriced} unpriced.</p>` : '<p class="quiet">Prices are not supplied for this complete roster in this public sheet; no team total is inferred from the league face.</p>'}
  <table class="mini-table" aria-label="${esc(team.identity.name)} full roster"><thead><tr><th>Player / profile</th><th>Position</th><th>NBA team</th>${values?'<th>Modeled FAAB</th>':''}</tr></thead><tbody>${team.players.map(p=>`<tr>${td('Player',playerLink(p.id,p.fullName))}${td('Position',esc(p.position??'Not supplied'))}${td('NBA team',esc(p.nbaTeam??'Not supplied'))}${values?td('Modeled FAAB',money(values.get(p.id)),'numeric'):''}</tr>`).join('')}</tbody></table>
  <div class="inline-links"><a href="/teams/${esc(team.identity.id)}#team-roster">Open team roster</a><a href="/stocks#player-board">Compare on Stocks</a>${personal?.team.id===team.identity.id?'<a href="/team">My team</a>':''}</div>`;
}
function personalBrief() {
  const v=personal.valuation;
  return `<div class="readable"><p><strong>${money(v.total)} modeled FAAB ${v.complete?'total':'subtotal'}</strong> · ${v.priced}/${personal.coverage.roster} priced · ${v.unpriced} unpriced · standing #${personal.standing.rank}. ${personal.coverage.roster} players.</p><p class="quiet">${esc(personal.market.pricingBasis)} pricing basis. Computed ${date(personal.market.updatedAt)}; fixture check ${date(personal.checkedAt)}. ${v.rank ? `Modeled value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied?' (tied)':''}.` : ''}</p></div>
  <table class="mini-table" aria-label="Your three highest modeled values"><thead><tr><th>Top three / profile</th><th>Position</th><th>Modeled FAAB</th><th>Supplied change</th></tr></thead><tbody>${personal.players.map(p=>`<tr>${td('Player',playerLink(p.id,p.name))}${td('Position',esc(p.position))}${td('Modeled FAAB',money(p.value))}${td('Change',p.changePct==null?'Unavailable':`${p.changePct>0?'Up':'Down'} ${Math.abs(p.changePct)}%`)}</tr>`).join('')}</tbody></table>
  <p class="quiet readable">${esc(inventory.missing.history)} Current modeled value is separate from recorded history.</p>
  <div class="inline-links"><a href="/team">My team</a><a href="/teams/1#team-roster">Full team roster</a><a href="/stocks#player-board">Stocks</a><a href="#member">Read my evidence</a></div>`;
}
function aiProvenance(pick) {
  const result=pick?.result;
  if(!result) return '<p class="readable">Saved AI unavailable. No choice, probability or confidence is inferred. Current matchup scores remain separate.</p>';
  return `<p class="readable">${esc(result.probabilityLabel)}. The saved returned choice is preserved even when the other probability is higher. Confidence is a separate field.</p><dl class="provenance"><dt>Result state</dt><dd>${aiState==='stale'?'Stale saved result · not a fresh pick':'Saved ready fixture result'}</dd><dt>Returned choice</dt><dd>${esc(teamName(result.choice))}</dd><dt>Probabilities as returned</dt><dd>${result.probabilities.map(p=>`${esc(teamName(p.choice))}: ${Math.round(p.probability*100)}%`).join(' / ')}</dd><dt>Independent confidence</dt><dd>${Math.round(result.confidence*100)}%</dd><dt>Saved at</dt><dd>${date(data.weekly?.generatedAt)}</dd><dt>Model / prompt version</dt><dd>${esc(result.model)} / ${esc(result.promptVersion)}</dd><dt>Input snapshot</dt><dd>${result.snapshot?esc(JSON.stringify(result.snapshot)):'Not supplied (null)'}; slate snapshot ${data.weekly?.snapshot?esc(JSON.stringify(data.weekly.snapshot)):'not supplied (null)'}.</dd><dt>Matchup evidence</dt><dd>${pick.evidence?.length?pick.evidence.map(esc).join('; '):'No matchup evidence supplied.'}</dd><dt>Result evidence / baseline</dt><dd>${result.evidence?.length?result.evidence.map(esc).join('; '):'No result-level evidence supplied.'} Baseline ${pick.baseline?esc(JSON.stringify(pick.baseline)):'not supplied (null)'}.</dd><dt>Input identity</dt><dd>League ${esc(data.weekly?.leagueId)} · season ${esc(data.weekly?.season)} · Week ${data.weekly?.week} · team IDs ${pick.teamIds.map(esc).join(' / ')} · matchup ${esc(pick.matchupId)}.</dd></dl><div class="inline-links"><a href="/ai-decides">Open AI Decides</a></div>`;
}

function opening() {
  const season=data.home.hub.season, m=pairs[0], r=savedPick(m)?.result;
  const champion=teams.find(t=>faces.get(t.identity.id)?.champion);
  const prior=champion.previousSeason;
  return `<div class="opening-account">
    <div class="season-account"><h2>GOAT Hoopers · league home</h2><p>${season.seasonYear} in-season fixture · ${season.totalTeams} franchises · ${teams.reduce((n,t)=>n+t.players.length,0)} roster references. ${season.playoffTeams} playoff places; playoffs begin Week ${season.playoffWeekStart}.</p>
    <p class="quiet">Current Week 3 is incomplete. Sample checked ${date(data.home.checkedAt)}.</p>
    <p><strong>2025 champion:</strong> ${teamLink(champion.identity)} · ${esc(champion.identity.managerName)} · ${record(prior)}. <a href="/history">Read league history</a></p></div>
    <div class="featured-account"><h2>${personal?'Your Week 3 account':'Week 3 · first pairing'}</h2>
    <div class="opening-pair">${[m.home,m.away].map((t,i)=>`<div><span>${teamLink(t)}</span><strong>${num(i?m.awayPoints:m.homePoints)}</strong><small>${esc(t.managerName)} · ${record(t)}</small></div>`).join('')}</div>
    <p class="quiet">Incomplete · 0.0 is known; Pending is unknown. No winner is declared.</p>
    <p><strong>${aiLabel}:</strong> ${r?`${esc(teamName(r.choice))} · ${Math.round(r.probabilities.find(p=>p.choice===r.choice).probability*100)}% returned probability · ${Math.round(r.confidence*100)}% independent confidence.`:'No choice, probability or confidence supplied.'}</p>
    <p class="quiet">${r?`Saved ${date(data.weekly.generatedAt)}. Model probabilities are not calibrated sports odds.`:'Current scores remain available without saved AI.'}</p>
    ${personal?`<p class="opening-value"><strong>${money(personal.valuation.total)}</strong> modeled FAAB · ${personal.valuation.priced}/${personal.coverage.roster} priced · ${personal.valuation.unpriced} unpriced · value rank ${personal.valuation.rank.rank}/${personal.valuation.rank.teams}.</p><div class="inline-links"><a href="/team">My team</a><a href="#member">Form & value detail</a></div>`:`<p class="public-note">Public edition · Browse all league records. <a href="/login">Sign in for your team account</a></p>`}</div>
  </div>`;
}

function matchupSheet() {
  return heading('matchups','Week 3 · running scores',`All five current pairs · incomplete synthetic scores. ${aiLabel}. ${data.weekly?`Saved ${date(data.weekly.generatedAt)}.`:'No saved model result is available.'}`)+
  `<table class="ledger match-ledger" aria-label="Current matchups and saved AI choices"><colgroup><col class="teams-col"><col class="score-col"><col class="pick-col"><col class="prob-col"><col class="inspect-col"></colgroup><thead><tr><th>Teams / managers / record</th><th>Scores</th><th>Returned choice</th><th>Returned probabilities</th><th>Receipt</th></tr></thead><tbody>${pairs.map(m=>{
    const pick=savedPick(m),r=pick?.result,key=`pair-${m.home.id}`;
    return `<tr class="record-row">${td('Teams',[m.home,m.away].map(t=>`<div class="match-team"><div><strong>${teamLink(t)}</strong><span class="cell-secondary">${esc(t.managerName)}</span></div><span class="numeric">${record(t)}</span></div>`).join('')+(personal&&[m.home.id,m.away.id].includes(personal.team.id)?'<span class="you">Your pairing</span>':''),'team-name')}${td('Scores',`<strong class="cell-main numeric">${num(m.homePoints)} / ${num(m.awayPoints)}</strong><span class="cell-secondary">In team order<br>Incomplete</span>`)}${td('Choice',r?`<strong>${esc(teamName(r.choice))}</strong><span class="cell-secondary">${aiLabel}<br>${Math.round(r.confidence*100)}% confidence</span>`:'Unavailable')}${td('Probability',r?r.probabilities.map(p=>`<div class="probability-line"><span>${esc(teamName(p.choice))}</span><strong>${Math.round(p.probability*100)}%</strong></div><div class="bar" aria-hidden="true"><span style="width:${p.probability*100}%"></span></div>`).join(''):'Unavailable')}${td('Inspect',action(key,'source','Source'),'actions-cell')}</tr>${opened.has(key)?foldout(key,'Saved model receipt',aiProvenance(pick),'source'):''}`;
  }).join('')}</tbody></table><p class="section-note">Returned choice and independent confidence are different fields. The first saved choice is preserved at 35%, even though the other team has 65%. <a href="/ai-decides">Open AI Decides</a></p>`;
}

function formRecords(rows,label) {
  return `<table class="mini-table"><thead><tr><th>Player</th><th>${label}</th><th>GP</th><th>Source note</th></tr></thead><tbody>${rows.map(p=>`<tr>${td('Player',playerLink(p.id,p.name))}${td(label,esc(p.value))}${td('GP',esc(p.games))}${td('Source note',esc(p.note))}</tr>`).join('')}</tbody></table>`;
}
function memberAccount() {
  if(!personal)return '';
  const g=personal.playerGuide;
  return heading('member',`${esc(personal.team.name)} · member account`,'Modeled value, observed form and completed-week points keep separate bases and periods.')+
  `<div class="member-columns"><div><h3>Current modeled value</h3><p><strong class="account-total">${money(personal.valuation.total)}</strong> modeled FAAB total</p><p>Standing #${personal.standing.rank} · ${record(personal.team)} · ${personal.coverage.roster} players · ${personal.valuation.priced} priced / ${personal.valuation.unpriced} unpriced.</p><p class="quiet">${esc(personal.market.pricingBasis)} basis · computed ${date(personal.market.updatedAt)} · modeled value rank ${personal.valuation.rank.rank} of ${personal.valuation.rank.teams}.</p><table class="mini-table value-leaders"><thead><tr><th>Top three values</th><th>FAAB</th><th>Change</th></tr></thead><tbody>${personal.players.map(p=>`<tr>${td('Player',playerLink(p.id,p.name)+`<span class="cell-secondary">${esc(p.position)}</span>`)}${td('Modeled FAAB',money(p.value))}${td('Change',p.changePct==null?'Unavailable':`${p.changePct>0?'+':''}${p.changePct}%`)}</tr>`).join('')}</tbody></table><div class="inline-links"><a href="/team">My team</a><a href="/teams/${personal.team.id}#team-roster">Full roster</a><a href="/stocks#player-board">Stocks</a></div></div>
  <div><h3>Players to watch · observed form</h3><p>${esc(g.watch.label)}.</p>${formRecords(g.watch.rows,'EMA fantasy PPG')}<p class="quiet readable">${esc(g.watch.message)} Availability unknown is not an injury designation.</p></div></div>
  <p class="recap-coverage quiet">Completed source week: ${esc(g.period)}. ${esc(g.coverage)}</p>
  <details class="attached-record" id="recap-record"><summary>Completed Week 2 · ${g.eligiblePlayed} verified players · best & rough</summary><div class="disclosure-content"><p><strong>Synthetic completed-week fixture.</strong> ${esc(inventory.missing.recap)}</p><p>${esc(g.period)}</p><p class="readable">${esc(g.recapMessage)} ${esc(g.coverage)}</p><div class="detail-pair"><div><h3>Your best</h3>${formRecords(g.best,'Fantasy points')}</div><div><h3>The rough week</h3>${formRecords(g.rough,'Fantasy points')}</div></div></div></details>
  <div class="team-wire"><h3>Your team wire</h3><ul class="plain-list">${personal.news.map(n=>`<li><a href="${esc(n.url)}">${esc(n.headline)}</a><span class="cell-secondary">${esc(n.outlet.name)} · synthetic · ${date(n.publishedAt)}</span></li>`).join('')}</ul></div>`;
}

function leagueSheet() {
  const rows=[...teams.filter(t=>has([t.identity,t.players]))].sort((a,b)=>order==='name'?a.identity.name.localeCompare(b.identity.name):order==='pf'?(standings.get(b.identity.id)?.pointsFor??-Infinity)-(standings.get(a.identity.id)?.pointsFor??-Infinity):order==='roster'?b.players.length-a.players.length:(standings.get(a.identity.id)?.rank??Infinity)-(standings.get(b.identity.id)?.rank??Infinity));
  $('#result-count').textContent=`${rows.length} of ${teams.length} teams · ${query?'player search includes full rosters':'228 roster references'}`;
  if(!rows.length)return '<div class="empty"><h3>No matching franchises</h3><p>Try a team, manager or full player name.</p><button type="button" data-reset>Reset register</button></div>';
  return `<table class="ledger league-ledger" aria-label="Franchise standings, faces and roster readers"><colgroup><col class="line-number"><col class="team-col"><col class="record-col"><col class="pf-col"><col class="week-col"><col class="face-col"><col class="inspect-col"></colgroup><thead><tr><th>#</th><th>Franchise / manager</th><th>W–L</th><th>PF</th><th class="field-week">Week 3</th><th class="field-faces">League face / FAAB</th><th>Roster / 2025</th></tr></thead><tbody>${rows.map(t=>{
    const id=t.identity.id,s=standings.get(id),f=faces.get(id),m=t.currentMatchup,key=`team-${id}`,kind=opened.get(key),opponent=m?.home.id===id?m.away:m?.home;
    return `<tr class="record-row" id="team-${id}">${td('Rank',s?.rank??'Unavailable','line-number')}${td('Franchise',`<strong class="cell-main">${teamLink(t.identity)}</strong><span class="cell-secondary">${esc(t.identity.managerName)}${personal?.team.id===id?' · your team':''}</span>${f?.champion?'<span class="cell-secondary">2025 champion</span>':''}${t.previousSeason?.ownerNote?'<span class="cell-secondary">2025: QBs Gremlins, previous manager.</span>':''}`,'team-name')}${td('Record',`${record(t.currentRecord??t.identity)}<span class="phone-rank">Rank ${s?.rank??'—'}</span>`,'field-standings')}${td('Points for',s?(s.pointsFor/100).toFixed(2):'Unavailable','field-standings')}${td('Week 3',opponent?`${teamLink(opponent)}<span class="cell-secondary">${num(m.home.id===id?m.homePoints:m.awayPoints)} / ${num(m.home.id===id?m.awayPoints:m.homePoints)}<br>Own / opponent · incomplete</span>`:'Not supplied','field-week')}${td('League face',f?.player?`<div class="face"><img src="${inventory.portraits[f.player.id]}" alt="" width="44" height="44" loading="lazy"><div>${playerLink(f.player.id,f.player.name)}<span class="cell-secondary">${esc(f.player.position)} · ${money(f.player.value)}<br>Modeled FAAB</span></div></div>`:'Not supplied','field-faces')}${td('Inspect',`<span class="cell-secondary">${t.players.length} players<br>2025: ${t.previousSeason?record(t.previousSeason):'unavailable'}</span><div class="row-actions">${action(key,'roster','Roster')}${personal?.team.id===id?action(key,'brief','Your brief'):''}</div>`,'actions-cell')}</tr>${kind==='roster'?foldout(key,`${esc(t.identity.name)} · roster`,rosterTable(t),'roster'):kind==='brief'?foldout(key,'Your modeled value',personalBrief(),'brief'):''}`;
  }).join('')}</tbody></table>`;
}

function editionPreview() {
  const a=data.archive[0],game=a.game;
  const qualifiers=["Sample opinion using last-season NBA averages; not a played 2026 fantasy-week award.","Subjective last-season criticism; current roster ownership only, not an injury judgment.","Preseason watch using college averages; not NBA or fantasy points, or a playing-time forecast."];
  return heading('editorial','Dated editions · the October file','Unpublished drafts. October’s Week 1 preview and the 2025 final are separate from current Week 3.')+
  `<div class="edition-lead"><div class="edition-dates"><h3>${esc(a.title)}</h3><p>${esc(a.dateLabel)}<br>${esc(a.id)}<br>${esc(a.status)} · unpublished</p><a href="/weekly/${esc(a.id)}">Open dated edition</a></div><div class="readable"><h3>${esc(game.title)}</h3><p>${game.teamIds.map(id=>teamLink(byId.get(id).identity)).join(' / ')} · Week ${game.leagueWeek} · ${esc(game.state)} · no scores supplied.</p><p>${esc(game.context)}</p><p class="quiet">${esc(game.selectionReason)}</p></div></div>
  <div class="editorial-picks">${a.playerSpotlights.map((s,i)=>`<article class="editorial-pick pick-${i}"><div class="pick-name"><img src="${inventory.portraits[s.playerId]}" width="44" height="44" alt="" loading="lazy"><div><h3>${playerLink(s.playerId,s.name)}</h3><p class="quiet">${esc(s.position)} · ${teamLink(byId.get(s.teamId).identity)}</p></div></div><p class="quiet">${esc(s.periodLabel)}</p><h3>${esc(s.headline)}</h3><p>${esc(s.opinion)}</p><div class="statline">${s.stats.map(x=>`<span><strong>${esc(x.value)}</strong>${esc(x.label)}</span>`).join('')}</div><p class="quiet">${esc(s.statPeriod)}.</p><p class="pick-qualification">${qualifiers[i]}</p><p class="source-credit"><a href="${esc(s.source.url)}">${esc(s.source.label)}</a> · checked ${esc(s.source.checkedAt)}</p></article>`).join('')}</div>
  <div class="edition-history"><h3>${esc(data.archive[1].title)}</h3><p>${esc(data.archive[1].dateLabel)} · ${esc(data.archive[1].status)} · unpublished · ${esc(data.archive[1].id)}</p><p class="readable">${esc(data.archive[1].game.context)}</p><a href="/weekly/${esc(data.archive[1].id)}">Open historical edition</a></div>
  <details class="attached-record" id="archive-record"><summary>Read the October file · happenings, date bounds & sources</summary><div class="disclosure-content">${data.archive.map(e=>`<article><h3>${esc(e.id)} · ${esc(e.title)}</h3><p>${esc(e.dateLabel)} · ${esc(e.status)} · ${e.publishedAt?`published ${date(e.publishedAt)}`:'unpublished'}. Bounds ${date(e.startsAt)} to ${date(e.endsAt)} (end exclusive).</p>${e.playerSpotlights.length?`<h4>Selection notes</h4><dl class="provenance">${e.playerSpotlights.map(s=>`<dt>${esc(s.name)}</dt><dd>${esc(s.selectionReason)}</dd>`).join('')}</dl>`:''}<ul class="plain-list">${e.happenings.map(h=>`<li><strong>${esc(h.title)}</strong><p>${esc(h.text)}</p><a href="${esc(localHref(h.href))}">Open reference</a> · ${esc(h.dateLabel)}</li>`).join('')}</ul><h4>Source register</h4><ul class="plain-list">${e.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><span class="cell-secondary">Checked ${esc(s.checkedAt)}</span></li>`).join('')}</ul></article>`).join('')}</div></details>`;
}
function moves() {
  return heading('moves','Moves · current fixture','Three sample transaction summaries. Missing add/drop legs do not prove that no players moved.')+
  `<table class="ledger moves-ledger"><thead><tr><th>Recorded time / period</th><th>Summary</th><th>Supplied legs</th></tr></thead><tbody>${data.home.hub.transactions.map(m=>`<tr class="record-row">${td('When',`${date(m.createdAt)}<span class="cell-secondary">Week ${m.week} · synthetic ${esc(m.type)}</span>`)}${td('Move',esc(m.summary),'title-cell')}${td('Legs',`${m.adds.length} add / ${m.drops.length} drop legs supplied. Player identities unavailable.`)}</tr>`).join('')}</tbody></table><div class="inline-links"><a href="/transactions">All transactions</a><a href="/trade-analyzer">Analyze a trade</a></div>`;
}
function tools() {
  const rows=[['Player market','Modeled FAAB quotes and coverage. Inspect players at the existing board.','/stocks#player-board','Open Stocks'],['Trade analyzer','Compare a proposed trade with the existing analyzer.','/trade-analyzer','Analyze'],['Free Throw','The existing basketball game; browse more games in Arcade.','/arcade/free-throw','Play Free Throw'],['Recorded history',inventory.missing.history,'/history','League history'],['Lineup Power',inventory.missing.power,'/intel','News & analysis']];
  return heading('tools','Keep working','Useful destinations and honest coverage. No value-history line or power ranking is inferred.')+`<dl class="tool-register">${rows.map(([name,context,href,label])=>`<div><dt>${name}</dt><dd>${esc(context)}</dd><dd><a href="${href}">${label}</a></dd></div>`).join('')}</dl><p class="quiet readable">Current form uses observed games. Completed-week records exclude DNP, no-game and unknown entries. A missing producer remains unavailable, even when today’s modeled roster total is complete.</p>`;
}

function renderSection(id) {
  if(id==='league')$('#sheet').innerHTML=leagueSheet();
  if(id==='matchups')$('#matchups').innerHTML=matchupSheet();
}
function render() {
  $('#opening').innerHTML=opening();$('#matchups').innerHTML=matchupSheet();
  $('#member').hidden=!personal;$('#member').innerHTML=memberAccount();
  $('#sheet').innerHTML=leagueSheet();$('#editorial').innerHTML=editionPreview();
  $('#moves').innerHTML=moves();$('#tools').innerHTML=tools();
}
function focusOrigin(key,kind) {
  const target=document.querySelector(`[data-toggle="${CSS.escape(key)}"][data-kind="${CSS.escape(kind)}"]`);
  target?.focus({preventScroll:true});
  if(target){const box=target.getBoundingClientRect();if(box.top<0||box.bottom>innerHeight)target.scrollIntoView({block:'center',behavior:'instant'});}
}
function remember() {
  history.replaceState({ledger:'17-home',mode,query,order,fields:document.body.dataset.fields,opened:[...opened],scroll:scrollY},'');
}
function reset() {
  query='';order='rank';opened.clear();$('#search').value='';$('#sort').value='rank';renderSection('league');remember();
}
function jump(id) {
  const section=document.getElementById(id);
  if(!section || section.hidden)return;
  document.querySelectorAll('#category-index a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')===`#${id}`?'location':'false'));
  $('#category-select').value=id;
  section.scrollIntoView({block:'start',behavior:'instant'});
  const title=section.querySelector('h2');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
}
const sections=[['matchups','Week 3'],...(personal?[['member','My account']]:[]),['league','Franchises'],['editorial','Dated editions'],['moves','Moves'],['tools','Tools']];
$('#category-index').innerHTML=sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('');
$('#category-select').innerHTML=sections.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
$('#category-select').addEventListener('change',e=>jump(e.target.value));
$('#category-index').addEventListener('click',e=>{const a=e.target.closest('a');if(a){e.preventDefault();jump(a.hash.slice(1));}});
const narrow=matchMedia('(max-width:56rem)');
const syncMenu=()=>{$('.site-navigation').open=!narrow.matches;};syncMenu();narrow.addEventListener('change',syncMenu);
$('#account-link').innerHTML=personal?'<a href="/team">My team</a>':'<a href="/login">My team / sign in</a>';
const comparison=new URLSearchParams(location.search);comparison.set('view',personal?'public':'member');
$('#footer-links').innerHTML=`<a href="?${esc(comparison.toString())}">View ${personal?'public':'member'} edition</a><a href="/weekly">Weekly archive</a><a href="/teams">All teams</a><a href="/arcade">Arcade</a>`;
$('#search').addEventListener('input',e=>{
  query=e.target.value.trim().toLocaleLowerCase();
  if(query)teams.forEach(t=>{if(t.players.some(p=>has(p)))opened.set(`team-${t.identity.id}`,'roster');});
  renderSection('league');remember();
});
$('#sort').addEventListener('change',e=>{order=e.target.value;renderSection('league');remember();});
$('#fields').addEventListener('change',e=>{document.body.dataset.fields=e.target.value;remember();});
$('#clear').addEventListener('click',reset);
document.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-toggle]'),close=e.target.closest('[data-close]');
  if(e.target.closest('[data-reset]')){reset();$('#search').focus();}
  if(toggle||close){
    const key=(toggle??close).dataset[toggle?'toggle':'close'],kind=(toggle??close).dataset.kind;
    if(close||opened.get(key)===kind)opened.delete(key);else opened.set(key,kind);
    renderSection(key.startsWith('pair-')?'matchups':'league');focusOrigin(key,kind);remember();
  }
  if(e.target.closest('a[href]'))remember();
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const fold=e.target.closest('.foldout');
  if(fold){fold.querySelector('[data-close]')?.click();return;}
  const details=e.target.closest('details[open]');
  if(details){details.open=false;details.querySelector('summary').focus();return;}
  if(narrow.matches&&$('.site-navigation').open){$('.site-navigation').open=false;$('.site-navigation summary').focus();}
});
const previous=history.state;
document.body.dataset.fields=['faces','week','all'].includes(previous?.fields)?previous.fields:'faces';
if(previous?.ledger==='17-home'&&previous.mode===mode){
  query=typeof previous.query==='string'?previous.query.slice(0,256):'';
  order=['rank','name','pf','roster'].includes(previous.order)?previous.order:'rank';
  if(Array.isArray(previous.opened))previous.opened.forEach(entry=>{if(Array.isArray(entry)&&/^(team|pair)-[0-9]+$/.test(entry[0])&&['roster','brief','source'].includes(entry[1])&&(personal||entry[1]!=='brief'))opened.set(...entry);});
}
$('#search').value=query;$('#sort').value=order;$('#fields').value=document.body.dataset.fields;
render();
document.querySelectorAll('.home-section h2').forEach(h=>h.tabIndex=-1);
if(previous?.ledger==='17-home'&&previous.mode===mode)window.scrollTo(0,previous.scroll??0);
remember();
document.documentElement.dataset.homepageReady='17';
