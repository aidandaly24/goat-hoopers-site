import {inventory, data, mode, aiState, esc, money} from '../../data.js';

const $ = selector => document.querySelector(selector);
const teams = data.home.directory;
const personal = mode === 'member' ? data.personal.summary : null;
const byId = new Map(teams.map(t => [t.identity.id, t]));
const faces = new Map(data.faces.map(f => [f.team.id, f]));
const standings = new Map(data.home.hub.standings.map(s => [s.team.id, s]));
const pairs = [...new Map(teams.filter(t => t.currentMatchup).map(t => [t.currentMatchup.home.id, t.currentMatchup])).values()];
const categories = [
  {id:'league', label:'League sheet', count:'10'},
  {id:'matchups', label:'Matchup sheet', count:'5'},
  ...(personal ? [{id:'evidence', label:'My evidence', count:'5'}] : []),
  {id:'editorial', label:'Dated editions', count:'2'},
  {id:'moves', label:'Moves & tools', count:'9'}
];
let category = 'league';
let query = '';
let order = 'rank';
const opened = new Map();
const num = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamName = id => byId.get(String(id))?.identity.name ?? String(id);
const teamLink = team => `<a href="/teams/${esc(team.id)}">${esc(team.name)}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const date = value => value ? new Date(value).toISOString().replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC') : 'Not supplied';
const localHref = value => String(value).replace(/^https:\/\/goathoopers\.com/,'');
const td = (label, html, cls='') => `<td data-label="${esc(label)}" class="${cls}"><div class="cell-value">${html}</div></td>`;
const action = (key, kind, label) => `<button type="button" data-toggle="${key}" data-kind="${kind}" aria-expanded="${opened.get(key)===kind}" ${opened.get(key)===kind?`aria-controls="detail-${key}"`:""}>${label}</button>`;
const has = value => !query || JSON.stringify(value).toLocaleLowerCase().includes(query);
const narrative = (title, text) => `<div class="readable"><h4>${title}</h4><p>${esc(text)}</p></div>`;
const foldout = (key, title, content, kind) => `<tr class="subrow" id="detail-${key}"><td colspan="8"><div class="foldout"><div class="foldout-top"><h3>${title}</h3><button type="button" data-close="${key}" data-kind="${kind}">Close row</button></div>${content}</div></td></tr>`;
const caption = (title, description) => `<div class="sheet-caption"><h2>${title}</h2><p>${description}</p></div>`;

function sorted(list, name, pf, size) {
  return [...list].sort((a,b) => {
    if(order==='name') return name(a).localeCompare(name(b));
    if(order==='pf') return pf(b)-pf(a) || name(a).localeCompare(name(b));
    if(order==='roster') return size(b)-size(a) || name(a).localeCompare(name(b));
    return 0;
  });
}
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
  <div class="inline-links"><a href="/team">My team</a><a href="/teams/1#team-roster">Full team roster</a><a href="/stocks#player-board">Stocks</a><button type="button" data-category="evidence">Read my evidence</button></div>`;
}
function leagueSheet() {
  const filtered=sorted(teams.filter(t=>has([t.identity,t.players])),t=>t.identity.name,t=>t.currentRecord?.pointsFor??-Infinity,t=>t.players.length);
  const body=filtered.map(t=>{
    const id=t.identity.id, team=t.identity, s=standings.get(id), f=faces.get(id), m=t.currentMatchup;
    const home=m?.home.id===id, opponent=home?m?.away:m?.home;
    const ownScore=home?m?.homePoints:m?.awayPoints, oppScore=home?m?.awayPoints:m?.homePoints;
    const key=`team-${id}`;
    if(query && t.players.some(p=>has(p))) opened.set(key,'roster');
    const kind=opened.get(key);
    const face=f?.player;
    return `<tr class="record-row" id="team-${id}">${td('Rank',s?String(s.rank):'Unavailable','line-number')}
    ${td('Team',`<strong class="cell-main">${teamLink(team)}</strong><span class="cell-secondary">${esc(team.managerName)}</span>${personal?.team.id===id?'<span class="you">Your team</span>':''}${f?.champion?'<span class="cell-secondary">2025 champion</span>':''}${t.previousSeason?.ownerNote?`<span class="cell-secondary">2025 record belongs to previous manager QBs Gremlins.</span>`:''}`,'team-name')}
    ${td('Record',`<strong class="numeric">${record(t.currentRecord??team)}</strong><span class="cell-secondary">2026 · #${s?.rank??'—'}</span>`,'field-standings')}
    ${td('Points for',`<span class="numeric">${s?(s.pointsFor/100).toFixed(2):'Unavailable'}</span>`,'field-standings')}
    ${td('Week 3',m?`<span class="cell-main">${teamLink(opponent)}</span><span class="cell-secondary">${esc(opponent.managerName)} · ${record(opponent)}</span><strong class="cell-main numeric">${num(ownScore)} / ${num(oppScore)}</strong><span class="cell-secondary">Week ${m.week} · incomplete</span>`:'No current matchup','field-week')}
    ${td('League face',face?`<div class="face">${inventory.portraits[face.id]?`<img src="${inventory.portraits[face.id]}" alt="" width="44" height="44">`:''}<div>${playerLink(face.id,face.name)}<span class="cell-secondary">${esc(face.position)} · ${money(face.value)}<br>Modeled FAAB</span></div></div>`:'Not supplied','field-faces')}
    ${td('Inspect',`<span class="cell-secondary">${t.players.length} players</span><div class="row-actions">${action(key,'roster','Roster')}${personal?.team.id===id?action(key,'brief','Your brief'):''}</div>`,'actions-cell')}</tr>
    ${kind==='roster'?foldout(key,`${esc(team.name)} · roster`,rosterTable(t),'roster'):kind==='brief'?foldout(key,'Your team · modeled value',personalBrief(),'brief'):''}`;
  }).join('');
  $('#result-count').textContent=`${filtered.length} of 10 teams · 228 player references`;
  return caption('2026 league sheet','Read across each team. Open a roster or your brief below its row. Scores are own / opponent; 0.0 is known, Pending is unknown.')+
  (filtered.length?`<table class="ledger league-ledger" aria-label="League teams, current matchups and faces"><colgroup><col class="line-number"><col class="team-col"><col class="record-col"><col class="pf-col"><col class="week-col"><col class="face-col"><col class="inspect-col"></colgroup><thead><tr><th scope="col">#</th><th scope="col">Franchise / manager</th><th scope="col">W–L</th><th scope="col">PF</th><th scope="col">Current opponent / score</th><th scope="col">League face / value</th><th scope="col">Inline reader</th></tr></thead><tbody>${body}</tbody></table>`:empty());
}
function aiProvenance(pick) {
  const result=pick?.result;
  if(!result) return '<p class="readable">Saved AI unavailable. No choice, probability or confidence is inferred. Current matchup scores remain separate.</p>';
  return `<p class="readable">${esc(result.probabilityLabel)}. The saved returned choice is preserved even when the other probability is higher. Confidence is a separate field.</p><dl class="provenance"><dt>Result state</dt><dd>${aiState==='stale'?'Stale saved result · not a fresh pick':'Saved ready fixture result'}</dd><dt>Returned choice</dt><dd>${esc(teamName(result.choice))}</dd><dt>Probabilities as returned</dt><dd>${result.probabilities.map(p=>`${esc(teamName(p.choice))}: ${Math.round(p.probability*100)}%`).join(' / ')}</dd><dt>Independent confidence</dt><dd>${Math.round(result.confidence*100)}%</dd><dt>Saved at</dt><dd>${date(data.weekly?.generatedAt)}</dd><dt>Model / prompt version</dt><dd>${esc(result.model)} / ${esc(result.promptVersion)}</dd><dt>Input snapshot</dt><dd>${result.snapshot?esc(JSON.stringify(result.snapshot)):'Not supplied (null)'}; slate snapshot ${data.weekly?.snapshot?esc(JSON.stringify(data.weekly.snapshot)):'not supplied (null)'}.</dd><dt>Matchup evidence</dt><dd>${pick.evidence?.length?pick.evidence.map(esc).join('; '):'No matchup evidence supplied.'}</dd><dt>Result evidence / baseline</dt><dd>${result.evidence?.length?result.evidence.map(esc).join('; '):'No result-level evidence supplied.'} Baseline ${pick.baseline?esc(JSON.stringify(pick.baseline)):'not supplied (null)'}.</dd><dt>Input identity</dt><dd>League ${esc(data.weekly?.leagueId)} · season ${esc(data.weekly?.season)} · Week ${data.weekly?.week} · team IDs ${pick.teamIds.map(esc).join(' / ')} · matchup ${esc(pick.matchupId)}.</dd></dl><div class="inline-links"><a href="/ai-decides">Open AI Decides</a></div>`;
}
function matchupSheet() {
  const filtered=sorted(pairs.filter(m=>has([m,data.weekly?.matchups.find(p=>p.teamIds.includes(m.home.id))])),m=>m.home.name,()=>0,()=>0);
  $('#result-count').textContent=`${filtered.length} of 5 current pairs · saved AI ${aiState==='missing'?'unavailable':aiState}`;
  return caption('Week 3 · incomplete matchups',`Both teams and every saved pick share one row. ${aiState==='stale'?'Saved AI is stale.':aiState==='missing'?'Saved AI is unavailable.':'AI choices are saved synthetic model output.'}`)+
  (filtered.length?`<table class="ledger match-ledger" aria-label="Current matchups and saved AI choices"><colgroup><col class="teams-col"><col class="score-col"><col class="pick-col"><col class="prob-col"><col class="inspect-col"></colgroup><thead><tr><th>Teams / managers / records</th><th>Score</th><th>Returned model choice</th><th>Model probabilities</th><th>Inline reader</th></tr></thead><tbody>${filtered.map(m=>{
    const pick=data.weekly?.matchups.find(p=>p.teamIds.includes(m.home.id));const r=pick?.result,key=`pair-${m.home.id}`;
    return `<tr class="record-row">${td('Teams',[m.home,m.away].map(t=>`<div class="match-team"><div><strong>${teamLink(t)}</strong><span class="cell-secondary">${esc(t.managerName)}</span></div><span class="numeric">${record(t)}</span></div>`).join('')+(personal&&[m.home.id,m.away.id].includes(personal.team.id)?'<span class="you">Your pairing</span>':''),'team-name')}${td('Score',`<strong class="cell-main numeric">${num(m.homePoints)}</strong><strong class="cell-main numeric">${num(m.awayPoints)}</strong><span class="cell-secondary">Week ${m.week}<br>Incomplete</span>`)}${td('Model choice',r?`<strong>${esc(teamName(r.choice))}</strong><span class="cell-secondary">${aiState==='stale'?'Stale saved pick':'Saved pick'}<br>Confidence ${Math.round(r.confidence*100)}%</span>`:'Unavailable')}${td('Probabilities',r?r.probabilities.map(p=>`<div class="probability-line"><span>${esc(teamName(p.choice))}</span><strong>${Math.round(p.probability*100)}%</strong></div><div class="bar" aria-hidden="true"><span style="width:${p.probability*100}%"></span></div>`).join(''):'Unavailable')}${td('Evidence',`<div class="row-actions">${action(key,'source','Source')}</div>`,'actions-cell')}</tr>${opened.get(key)?foldout(key,'Saved model receipt',aiProvenance(pick),'source'):''}`;
  }).join('')}</tbody></table>`:empty());
}
function guideRows(rows, valueLabel) {
  return `<table class="mini-table"><thead><tr><th>Player</th><th>${valueLabel}</th><th>Games played</th><th>Source note</th></tr></thead><tbody>${rows.map(p=>`<tr>${td('Player',playerLink(p.id,p.name))}${td(valueLabel,esc(p.value))}${td('Games',esc(p.games))}${td('Source note',esc(p.note))}</tr>`).join('')}</tbody></table>`;
}
function evidenceSheet() {
  if(!personal) return caption('Public edition','Personal evidence is available only in this study’s member edition.')+'<p>No personal summary is rendered here.</p>';
  const g=personal.playerGuide;
  const specs=[
    {id:'value',period:'Current fixture quote',title:'Your roster value',summary:`${money(personal.valuation.total)} modeled FAAB ${personal.valuation.complete?'total':'subtotal'} · ${personal.valuation.priced}/${personal.coverage.roster} priced`,content:()=>personalBrief()+rosterTable(byId.get(personal.team.id))},
    {id:'watch',period:'In-season form',title:'Players to watch',summary:g.watch.label,content:()=>`<p class="readable">${esc(g.watch.message)}</p>${guideRows(g.watch.rows,'EMA fantasy PPG')}<p class="quiet">Availability status unknown is retained; it is not an injury designation. Observed-game sample is separate from the completed-week recap below.</p>`},
    {id:'recap',period:g.period,title:'Your best & rough week',summary:`${g.eligiblePlayed} eligible players with verified games; small lists may overlap.`,content:()=>`<p class="readable"><strong>Synthetic completed-week fixture.</strong> ${esc(inventory.missing.recap)}</p><p class="readable">${esc(g.recapMessage)} ${esc(g.coverage)}</p><p class="readable">${esc(g.period)}</p><h4>Your best</h4>${guideRows(g.best,'Weekly fantasy points')}<h4>The rough week</h4>${guideRows(g.rough,'Weekly fantasy points')}`},
    {id:'wire',period:'Nov 12 fixture',title:'Your team wire',summary:`${personal.news.length} news references · ${personal.moves.length} recent move`,content:()=>`<ul class="plain-list">${personal.news.map(n=>`<li><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="quiet">${esc(n.outlet.name)} · ${date(n.publishedAt)} · synthetic</p></li>`).join('')}${personal.moves.map(m=>`<li>${esc(m.summary)}<p class="quiet">Week ${m.week} · ${date(m.createdAt)} · ${esc(m.type)} · no add/drop player legs supplied</p></li>`).join('')}</ul>`},
    {id:'history',period:'Recorded evidence',title:'History & Lineup Power',summary:'Both unavailable · no connected producer',content:()=>`<p class="readable">${esc(inventory.missing.history)}</p><p class="readable">${esc(inventory.missing.power)}</p><div class="inline-links"><a href="/history">League history</a><a href="/intel">News & analysis</a></div>`}
  ];
  const rows=sorted(specs.filter(s=>has([s.id,s.period,s.title,s.summary])),s=>s.title,()=>0,()=>0);
  $('#result-count').textContent=`${rows.length} of 5 evidence records · member fixture`;
  return caption(`${personal.team.name} · evidence register`,'Open a source record in place. Form, completed-week points and modeled prices keep their own basis and period.')+`<table class="ledger evidence-ledger" aria-label="Personal evidence register"><colgroup><col class="date-col"><col class="title-col"><col class="subject-col"><col class="inspect-col"></colgroup><thead><tr><th>Period / basis</th><th>Record</th><th>What is supplied</th><th>Inline reader</th></tr></thead><tbody>${rows.map(s=>{const key=`evidence-${s.id}`;return `<tr class="record-row">${td('Period',esc(s.period))}${td('Record',esc(s.title),'title-cell')}${td('Supplied',esc(s.summary))}${td('Read',`<div class="row-actions">${action(key,'read','Read')}</div>`,'actions-cell')}</tr>${opened.has(key)?foldout(key,esc(s.title),s.content(),'read'):''}`}).join('')}</tbody></table>`+(rows.length?'':empty());
}
function archiveReader(edition) {
  const game=edition.game;
  return `<div class="editorial-intro readable"><p><strong>Dated ${esc(edition.status)} · ${esc(edition.dateLabel)}</strong>. ${edition.publishedAt?`Published ${date(edition.publishedAt)}.`:'Not published; this is a sample editorial entry.'} October narrative is separate from the synthetic current Week 3 sheet.</p><h4>${esc(game.title)}</h4><p>${esc(game.note)} · ${game.leagueWeek?`Week ${game.leagueWeek}`:'2025 season final'} · ${esc(game.state)}.</p><p>${game.teamIds.map(id=>teamLink(byId.get(id).identity)).join(' / ')}${game.scores?` · ${game.scores.map(num).join(' / ')}`:' · scores not supplied for upcoming fixture'}.</p><p>${esc(game.context)}</p><p><strong>Selection:</strong> ${esc(game.selectionReason)}</p><p class="quiet">Edition bounds: ${date(edition.startsAt)} to ${date(edition.endsAt)} (end exclusive).</p></div>
  ${edition.playerSpotlights.map(s=>`<article class="story-row"><div><p class="quiet">${esc(s.periodLabel)}<br>${esc(s.role)}</p><h4>${playerLink(s.playerId,s.name)}</h4><p>${esc(s.position)} · ${teamLink(byId.get(s.teamId).identity)}</p><div class="statline">${s.stats.map(stat=>`<span><strong>${esc(stat.value)}</strong>${esc(stat.label)}</span>`).join('')}</div><p class="quiet">${esc(s.statPeriod)}</p></div><div class="readable"><h4>${esc(s.headline)}</h4><p>${esc(s.opinion)}</p><p><strong>Why this selection:</strong> ${esc(s.selectionReason)}</p><p><a href="${esc(s.source.url)}">${esc(s.source.label)}</a> · checked ${esc(s.source.checkedAt)}</p></div></article>`).join('')}
  <div class="detail-pair sources"><div><h4>Happenings</h4><ul class="plain-list">${edition.happenings.map(h=>`<li><strong>${esc(h.title)}</strong><p>${esc(h.text)}</p><a href="${esc(localHref(h.href))}">Open reference</a> · ${esc(h.dateLabel)}</li>`).join('')}</ul></div><div><h4>Source register</h4><ul class="plain-list">${edition.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><span class="cell-secondary">Checked ${esc(s.checkedAt)}</span></li>`).join('')}</ul></div></div><div class="inline-links"><a href="/weekly/${esc(edition.id)}">Open dated edition ${esc(edition.id)}</a><a href="/weekly">Weekly archive</a></div>`;
}
function editorialSheet() {
  const rows=sorted(data.archive.filter(has),a=>a.title,()=>0,()=>0);
  $('#result-count').textContent=`${rows.length} of 2 dated editions · draft status preserved`;
  return caption('Dated editorial register','The October editions are samples, not current Week 3 results. Read their full narrative, exact stat period and source dates in the row.')+(rows.length?`<table class="ledger archive-ledger" aria-label="Dated weekly editions"><colgroup><col class="date-col"><col class="title-col"><col class="subject-col"><col class="inspect-col"></colgroup><thead><tr><th>Edition / dates</th><th>Editorial</th><th>Matchup / status</th><th>Inline reader</th></tr></thead><tbody>${rows.map(a=>{const key=`archive-${a.id}`;return `<tr class="record-row">${td('Date',`<strong>${esc(a.id)}</strong><span class="cell-secondary">${esc(a.dateLabel)}<br>${esc(a.status)} · unpublished</span>`)}${td('Editorial',`<strong>${esc(a.title)}</strong><span class="cell-secondary">${esc(a.game.title)}</span>`,'title-cell')}${td('Subject',`${a.game.teamIds.map(id=>esc(teamName(id))).join(' / ')}<span class="cell-secondary">${esc(a.game.note)} · ${esc(a.game.state)}${a.game.scores?` · ${a.game.scores.map(num).join(' / ')}`:''}</span>`)}${td('Read',`<div class="row-actions">${action(key,'read','Read edition')}</div>`,'actions-cell')}</tr>${opened.has(key)?foldout(key,esc(a.title),archiveReader(a),'read'):''}`}).join('')}</tbody></table>`:empty());
}
function movesSheet() {
  const rows=[...data.home.hub.transactions.map(m=>({title:m.summary,period:`Week ${m.week} · ${date(m.createdAt)}`,summary:`Synthetic ${m.type}; ${m.adds.length} add / ${m.drops.length} drop legs supplied.`,href:'/transactions',action:'Transactions'})),
  {title:'Player market',period:'Modeled FAAB',summary:'Inspect player values and coverage at the player board.',href:'/stocks#player-board',action:'Stocks'},
  {title:'Trade analyzer',period:'Decision tool',summary:'Compare a trade with the existing analyzer.',href:'/trade-analyzer',action:'Analyze'},
  {title:'Free Throw',period:'Arcade game',summary:'Open the existing free-throw game, or browse the Arcade.',href:'/arcade/free-throw',action:'Play Free Throw'},
  {title:'Recorded history',period:'Unavailable',summary:inventory.missing.history,href:'/history',action:'History'},
  {title:'Lineup Power',period:'Unavailable',summary:inventory.missing.power,href:'/intel',action:'News / analysis'},
  {title:'League directory',period:'10 franchises / 228 players',summary:'Browse team profiles, current managers and complete roster references.',href:'/teams',action:'Teams'}];
  const filtered=sorted(rows.filter(has),r=>r.title,()=>0,()=>0);
  $('#result-count').textContent=`${filtered.length} of ${rows.length} move / destination records`;
  return caption('Moves & destination register','Every destination is a real existing route. No transaction details, history line or power ranking are invented.')+(filtered.length?`<table class="ledger tools-ledger" aria-label="League moves and tools"><colgroup><col class="date-col"><col class="title-col"><col class="subject-col"><col class="inspect-col"></colgroup><thead><tr><th>Period / basis</th><th>Record / destination</th><th>Context</th><th>Action</th></tr></thead><tbody>${filtered.map(r=>`<tr class="record-row">${td('Period',esc(r.period))}${td('Record',esc(r.title),'title-cell')}${td('Context',esc(r.summary))}${td('Action',`<div class="inline-links"><a href="${esc(r.href)}">${esc(r.action)}</a></div>`,'actions-cell')}</tr>`).join('')}</tbody></table>`:empty());
}
function empty() {return `<div class="empty"><h3>No matching rows</h3><p>Try a team, manager or full player name, or reset this sheet to restore its rows.</p><button type="button" data-reset>Reset this sheet</button></div>`;}
function updateControls() {
  const options=category==='league'?[
    ['rank','Standing: highest first'],['name','Name: A–Z'],['pf','Points for: highest first'],['roster','Roster size: largest first']
  ]: [['rank',category==='editorial'?'Newest edition first':'Source order'],['name',category==='matchups'?'Home team: A–Z':'Title: A–Z']];
  $('#sort').innerHTML=options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
  $('#sort').value=order;
  $('#category-select').value=category;
  $('#search').value=query;
  $('#fields').disabled=category!=='league';
  $('#fields').closest('label').hidden=category!=='league';
  $('#category-index').querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.category===category?'page':'false'));
}
function render() {
  $('#sheet').innerHTML=({league:leagueSheet,matchups:matchupSheet,evidence:evidenceSheet,editorial:editorialSheet,moves:movesSheet}[category])();
  document.body.dataset.studyState=category;
}
function selectCategory(next, focus=false) {
  if(!categories.some(c=>c.id===next)) return;
  category=next;query='';order='rank';
  updateControls();render();
  if(focus) $('#sheet').focus({preventScroll:true});
}
$('#category-select').innerHTML=categories.map(c=>`<option value="${c.id}">${c.label} (${c.count})</option>`).join('');
$('#category-select').addEventListener('change',event=>selectCategory(event.target.value));
const narrowNavigation=matchMedia('(max-width:56rem)');
const setNavigation=()=>{$('.site-navigation').open=!narrowNavigation.matches;};
setNavigation();narrowNavigation.addEventListener('change',setNavigation);
$('#category-index').innerHTML=categories.map(c=>`<button type="button" data-category="${c.id}" aria-current="${c.id===category?'page':'false'}">${c.label}<span>${c.count}</span></button>`).join('');
$('#account-link').innerHTML=personal?'<a href="/team">My team</a>':'<a href="/login">My team / sign in</a>';
$('#footer-links').innerHTML=`<a href="?view=${mode==='member'?'public':'member'}">View ${mode==='member'?'public':'member'} study</a><a href="/weekly">Dated weekly archive</a><a href="/arcade">Arcade</a><a href="/ai-decides">AI Decides</a>`;
$('#category-index').addEventListener('click',event=>{const b=event.target.closest('[data-category]');if(b)selectCategory(b.dataset.category);});
$('#search').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase();render();});
$('#sort').addEventListener('change',event=>{order=event.target.value;render();});
$('#fields').addEventListener('change',event=>{document.body.dataset.fields=event.target.value;});
$('#clear').addEventListener('click',()=>{query='';order='rank';opened.clear();updateControls();render();});
$('#sheet').addEventListener('click',event=>{
  const toggle=event.target.closest('[data-toggle]');
  const close=event.target.closest('[data-close]');
  const nav=event.target.closest('[data-category]');
  if(nav){selectCategory(nav.dataset.category,true);return;}
  if(event.target.closest('[data-reset]')){query='';$('#search').value='';render();$('#search').focus();return;}
  if(toggle){const key=toggle.dataset.toggle,kind=toggle.dataset.kind;opened.get(key)===kind?opened.delete(key):opened.set(key,kind);render();document.querySelector(`[data-toggle="${key}"][data-kind="${kind}"]`)?.focus({preventScroll:true});}
  if(close){const key=close.dataset.close,kind=close.dataset.kind;opened.delete(key);render();document.querySelector(`[data-toggle="${key}"][data-kind="${kind}"]`)?.focus({preventScroll:true});}
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const fold=event.target.closest('.foldout');
  if(fold){const close=fold.querySelector('[data-close]');close?.click();return;}
  const menu=$('.site-navigation');if(menu.open && matchMedia('(max-width:56rem)').matches){menu.open=false;menu.querySelector('summary').focus();}
});
const states=[{id:'default',label:'League ledger / all teams'},{id:'league',label:'All ten team rows'},{id:'roster',label:'Full roster subrow'},{id:'matchups',label:'Five pairs and saved AI receipt'},...(personal?[{id:'evidence',label:'Personal form and evidence'}]:[]),{id:'editorial',label:'Dated edition and source subrows'},{id:'moves',label:'Moves and route register'},{id:'search',label:'Local player search'}];
window.goatStudy={states,activate(id){
  if(!states.some(s=>s.id===id))throw new Error(`Unknown study state ${id}`);
  opened.clear();query='';order='rank';
  if(id==='default'){category='league';}
  else if(id==='roster'){category='league';opened.set('team-1','roster');}
  else if(id==='search'){category='league';query='embiid';opened.set('team-1','roster');}
  else if(id==='matchups'){category='matchups';opened.set('pair-1','source');}
  else if(id==='editorial'){category='editorial';opened.set('archive-2026-W41','read');}
  else if(id==='evidence'){category='evidence';opened.set('evidence-watch','read');opened.set('evidence-recap','read');}
  else category=id;
  updateControls();render();window.scrollTo(0,0);return {id,category,mode,aiState};
}};
document.body.dataset.fields='week';
updateControls();render();
document.body.dataset.studyReady='17';
