import {inventory,data,mode,aiState,esc,money} from '../../data.js';

const e=esc;
const isMember=mode==='member'&&data.personal.kind==='member';
const personal=isMember?data.personal.summary:null;
const guide=personal?.playerGuide;
const teams=new Map(data.home.directory.map(t=>[t.identity.id,t]));
const players=new Map(data.home.directory.flatMap(t=>t.players.map(p=>[p.id,{...p,teamId:t.identity.id}])));
const standings=new Map(data.home.hub.standings.map(s=>[s.team.id,s]));
const faces=new Map(data.faces.map(f=>[f.team.id,f]));
const opinions=data.archive.flatMap(a=>a.playerSpotlights.map(p=>({...p,edition:a})));
const quoteMap=new Map(data.faces.map(f=>[f.player.id,{value:f.player.value,source:'Supplied face projection; individual quote timestamp and pricing basis not carried.'}]));
if(personal)for(const q of personal.rosterValues)quoteMap.set(q.id,{value:q.value,source:`${personal.market.pricingBasis} basis · ${new Date(personal.market.updatedAt).toISOString()}`});
const completed=new Map();
if(guide)for(const kind of ['best','rough'])for(const p of guide[kind]){const previous=completed.get(p.id);completed.set(p.id,{...p,lists:[...(previous?.lists??[]),kind]});}
const initialPlayers=isMember?['1511','1444']:['1511','1658'];
const entryNavigation=performance.getEntriesByType('navigation')[0]?.type;
const restoredEntry=entryNavigation==='back_forward'?history.state?.goatEvidence18:null;
if(entryNavigation!=='back_forward'&&history.state?.goatEvidence18)history.replaceState({...history.state,goatEvidence18:null},'',location.href);
const validEntry=restoredEntry?.mode===mode&&Array.isArray(restoredEntry.players)&&restoredEntry.players.length>0&&restoredEntry.players.length<=3&&restoredEntry.players.every(id=>players.has(id))&&Array.isArray(restoredEntry.teams)&&restoredEntry.teams.length>0&&restoredEntry.teams.length<=3&&restoredEntry.teams.every(id=>teams.has(id));
let context=validEntry&&restoredEntry.context==='teams'?'teams':'players',pinnedPlayers=validEntry?[...restoredEntry.players]:[...initialPlayers],pinnedTeams=validEntry?[...restoredEntry.teams]:['1','2'];
function rememberWorkspace(extra={}){history.replaceState({...history.state,goatEvidence18:{...(history.state?.goatEvidence18??{}),mode,context,players:[...pinnedPlayers],teams:[...pinnedTeams],tones:{players:[...identityTones.players],teams:[...identityTones.teams]},...extra}},'',location.href);}
let pointerAnimationCount=0;
const restoredTones=key=>validEntry&&Array.isArray(restoredEntry.tones?.[key])?restoredEntry.tones[key].filter(pair=>Array.isArray(pair)&&pair.length===2&&['peach','lavender','teal'].includes(pair[1])):[];
const identityTones={players:new Map(restoredTones('players')),teams:new Map(restoredTones('teams'))};
function comparisonTones(ids){const used=new Set();const palette=['peach','lavender','teal'];return ids.map(id=>{let tone=identityTones[context].get(id);if(!tone||used.has(tone))tone=palette.find(t=>!used.has(t));used.add(tone);identityTones[context].set(id,tone);return tone;});}
const name=id=>teams.get(id)?.identity.name??id;
const teamLink=(id,label=name(id))=>`<a href="/teams/${e(id)}">${e(label)}</a>`;
const playerLink=(id,label=players.get(id)?.fullName??id)=>`<a href="/player/${e(id)}">${e(label)}</a>`;
const score=x=>x==null?'Pending':Number(x).toFixed(1);
const record=t=>`${t.wins}–${t.losses}${t.ties?'–'+t.ties:''}`;
const when=x=>new Date(x).toISOString();
const disclosure=(label,body)=>`<details class="cell-detail"><summary>${label}</summary><div>${body}</div></details>`;
const missing=text=>({html:`<p class="missing">${e(text)}</p>`,text,missing:true});
const cell=(html,text)=>({html,text,missing:false});
const valueCell=(value,scope,detail='')=>cell(`<p class="cell-value">${e(value)}</p><span class="cell-scope">${e(scope)}</span>${detail}`,`${value}. ${scope}`);
const textCell=(html,text)=>cell(`<div class="cell-value text">${html}</div>`,text);
const seasonPoint=()=>guide?.period??'Completed-player period not supplied in the public fixture.';
const pickForTeam=id=>data.weekly?.matchups.find(m=>m.teamIds.includes(id));
function modelCell(id){
  const m=pickForTeam(id);
  if(!m?.result)return missing('Saved AI unavailable; no choice or probability inferred.');
  const r=m.result,prob=r.probabilities.find(p=>p.choice===id);
  const state=aiState==='stale'?'STALE saved slate. ':'';
  return textCell(`<p><strong>${state}${e(name(r.choice))}</strong> is the returned choice.</p><p>${r.probabilities.map(p=>`${e(name(p.choice))}: ${p.probability*100}%`).join('<br>')}</p><p>Independent confidence: ${r.confidence*100}%.</p>${disclosure('Saved source',`<p>${e(data.weekly.generatedAt)} · ${e(r.model)} · ${e(r.promptVersion)}</p><p>${e(r.probabilityLabel)}</p><p>Input snapshot: ${r.snapshot?e(JSON.stringify(r.snapshot)):'unavailable (null)'}. ${m.evidence.map(e).join(' ')}</p>`)}`,`${state}Returned choice ${name(r.choice)}. ${r.probabilities.map(p=>`${name(p.choice)} ${p.probability*100}%`).join('; ')}. Confidence ${r.confidence*100}%. This team ${prob?.probability*100}%. Saved ${data.weekly.generatedAt}, model ${r.model}, prompt ${r.promptVersion}.`);
}
function playerRows(ids){
  return [
    {label:'Current quote',scope:'Modeled FAAB. Never fantasy points or a traded balance.',cells:ids.map(id=>{const q=quoteMap.get(id);return q?valueCell(money(q.value),q.source):missing('No supplied current quote for this player. This does not mean $0 or a proven unpriced record.');})},
    {label:'Completed points',scope:seasonPoint(),cells:ids.map(id=>{const p=completed.get(id);return p?valueCell(`${p.value} FP`,`${p.games} GP · ${p.lists.join(' and ')} list. ${guide.coverage}`):missing(isMember?'No counted completed-week player record supplied in this cohort.':'Completed-player evidence is not supplied in the public fixture.');})},
    {label:'Form watch',scope:guide?guide.watch.label:'No member form guide in the public edition.',cells:ids.map(id=>{const p=guide?.watch.rows.find(p=>p.id===id);return p?valueCell(`${p.value} EMA FP/G`,`${p.games} observed games. ${guide.watch.message} ${p.note}`):missing('No form-watch row supplied.');})},
    {label:'Dated NBA averages',scope:'2025–26 NBA averages only. PPG / RPG / APG.',cells:ids.map(id=>{const p=opinions.find(p=>p.playerId===id&&p.statPeriod==='2025–26 NBA averages');return p?valueCell(p.stats.map(s=>`${s.value} ${s.label}`).join(' / '),`${p.statPeriod}; ${p.source.label}, checked ${p.source.checkedAt}.`):missing('No supplied NBA-average editorial record.');})},
    {label:'Dated college averages',scope:'2025–26 college · BYU only. Kept apart from NBA and fantasy points.',cells:ids.map(id=>{const p=opinions.find(p=>p.playerId===id&&p.statPeriod==='2025–26 college · BYU');return p?valueCell(p.stats.map(s=>`${s.value} ${s.label}`).join(' / '),`${p.statPeriod}; ${p.source.label}, checked ${p.source.checkedAt}.`):missing('No supplied college-average editorial record.');})},
    {label:'Current team',scope:'Current directory identity; not historical ownership.',cells:ids.map(id=>{const p=players.get(id);return textCell(`${teamLink(p.teamId)}<br>${e(p.position)} · ${e(p.nbaTeam)}`,`${name(p.teamId)}. ${p.position}, ${p.nbaTeam}. Current directory ownership only.`);})},
    {label:'Dated opinion',scope:'Editorial selection and date; not a computed award.',cells:ids.map(id=>{const p=opinions.find(p=>p.playerId===id);return p?textCell(`<p><strong>${e(p.headline)}</strong></p><p>${e(p.opinion)}</p><p>${e(p.periodLabel)} · ${e(p.edition.dateLabel)} · ${e(p.edition.status)} / unpublished</p>${disclosure('Selection and source',`<p>${e(p.selectionReason)}</p><p><a href="${e(p.source.url)}">${e(p.source.label)}</a> · checked ${e(p.source.checkedAt)}</p>`)}`,`${p.headline} ${p.opinion} ${p.periodLabel}. ${p.edition.dateLabel}, ${p.edition.status}, unpublished. ${p.selectionReason} ${p.source.label}, checked ${p.source.checkedAt}.`):missing('No supplied dated opinion for this player.');})},
  ];
}
function teamRows(ids){
  return [
    {label:'Current pairing',scope:'Current Week 3 fixture; incomplete, never final.',cells:ids.map(id=>{const m=teams.get(id).currentMatchup,home=m.home.id===id,op=home?m.away:m.home;return textCell(`<p>${teamLink(op.id,`vs ${op.name}`)}</p><p><strong>${score(home?m.homePoints:m.awayPoints)}</strong> / opponent ${score(home?m.awayPoints:m.homePoints)}</p><p>Week ${m.week} · incomplete</p>`,`${name(id)} ${score(home?m.homePoints:m.awayPoints)}, opponent ${op.name} ${score(home?m.awayPoints:m.homePoints)}. Week ${m.week}, incomplete.`);})},
    {label:'Current standing',scope:'Current fixture rank, W/L, PF. PF = source hundredths / 100.',cells:ids.map(id=>{const s=standings.get(id);return valueCell(`#${s.rank} · ${s.wins} W / ${s.losses} L`,`${(s.pointsFor/100).toFixed(2)} PF · ${s.team.managerName}`);})},
    {label:'Saved model opinion',scope:data.weekly?`Week ${data.weekly.week} · ${data.weekly.generatedAt} · ${data.weekly.status}. Probability and confidence stay separate.`:'Saved slate unavailable.',cells:ids.map(modelCell)},
    {label:'Current quote: roster subtotal',scope:'Modeled FAAB subtotal for the member’s roster only; no other totals inferred.',cells:ids.map(id=>personal?.team.id===id?valueCell(money(personal.valuation.total),`${personal.valuation.priced} priced / ${personal.valuation.unpriced} unpriced; ${personal.market.pricingBasis} basis; ${when(personal.market.updatedAt)}.`):missing('No supplied roster subtotal for this team.'))},
    {label:'Current quote: supplied face',scope:'One player’s modeled FAAB value. This is not a roster total.',cells:ids.map(id=>{const f=faces.get(id);return textCell(`${playerLink(f.player.id,f.player.name)}<p class="cell-value">${money(f.player.value)}</p><p>${e(f.player.position)} · face projection</p>`,`${f.player.name}, ${f.player.position}, ${money(f.player.value)} modeled FAAB. Supplied face projection.`);})},
    {label:'Completed player points',scope:seasonPoint(),cells:ids.map(id=>personal?.team.id===id?textCell([...completed.values()].map(p=>`<p>${playerLink(p.id,p.name)}: <strong>${p.value} FP</strong> / ${p.games} GP · ${p.lists.join(' and ')}.</p>`).join(''),`${[...completed.values()].map(p=>`${p.name} ${p.value} FP over ${p.games} GP (${p.lists.join(' and ')})`).join('; ')}. ${guide.coverage}`):missing('No supplied completed-player cohort for this team.'))},
    {label:'Dated edition appearances',scope:'Original archive bounds and game states; not current pairings.',cells:ids.map(id=>{const archives=data.archive.filter(a=>a.game.teamIds.includes(id));return archives.length?textCell(archives.map(a=>`<p><a href="/weekly/${e(a.id)}">${e(a.title)}</a><br>${e(a.dateLabel)} · ${e(a.status)} / unpublished<br>${a.game.teamIds.map(t=>e(name(t))).join(' vs ')}: ${a.game.scores?a.game.scores.map(score).join('–'):'Upcoming / Pending'}<br>${e(a.game.note)}</p>`).join(''),archives.map(a=>`${a.title}, ${a.dateLabel}, ${a.status}, unpublished. ${a.game.teamIds.map(name).join(' vs ')} ${a.game.scores?a.game.scores.map(score).join('–'):'Upcoming/Pending'}. ${a.game.note}`).join(' ')):missing('No supplied dated game appearance.');})},
    {label:'Dated player opinions',scope:'Only opinions whose supplied current team is this franchise; no historical ownership inferred.',cells:ids.map(id=>{const op=opinions.filter(p=>p.teamId===id);return op.length?textCell(op.map(p=>`<p>${playerLink(p.playerId,p.name)}: ${e(p.headline)}<br>${e(p.statPeriod)} · checked ${e(p.source.checkedAt)}</p>`).join(''),op.map(p=>`${p.name}: ${p.headline}. ${p.statPeriod}, source checked ${p.source.checkedAt}.`).join(' ')):missing('No supplied dated opinion associated with this team.');})},
    {label:'Previous-season attribution',scope:'2025 history, distinct from current manager/record.',cells:ids.map(id=>{const p=teams.get(id).previousSeason;return valueCell(`${p.wins}–${p.losses} · finish ${p.finish}`,p.ownerNote??'No previous-manager qualification supplied.');})},
  ];
}
function selected(){return context==='players'?pinnedPlayers:pinnedTeams;}
function renderPicker(){
  const q=document.querySelector('#identity-search').value.trim().toLocaleLowerCase();
  const existing=selected();
  const entries=context==='players'?[...players.values()].map(p=>({id:p.id,label:`${p.fullName} · ${name(p.teamId)} · ${p.position} ${p.nbaTeam}`})):[...teams.values()].map(t=>({id:t.identity.id,label:`${t.identity.name} · ${t.identity.managerName}`}));
  const list=entries.filter(p=>!existing.includes(p.id)&&p.label.toLocaleLowerCase().includes(q)).sort((a,b)=>a.label.localeCompare(b.label));
  document.querySelector('#identity-select-label').firstChild.textContent=context==='players'?'Add player':'Add team';
  document.querySelector('#identity-select').innerHTML=list.length?list.map(p=>`<option value="${e(p.id)}">${e(p.label)}</option>`).join(''):'<option value="">No matching names</option>';
  document.querySelector('#pin-button').disabled=!list.length;
}
function renderMatrix({newId=null,animate=false}={}){
  const ids=selected();
  const labels=ids.map(id=>context==='players'?players.get(id).fullName:name(id));
  const tones=comparisonTones(ids);
  const allRows=context==='players'?playerRows(ids):teamRows(ids);
  const rows=context==='players'?[allRows[0],...(isMember?[allRows[1],allRows[2]]:[allRows[3],allRows[4]]),allRows[5]]:[allRows[0],allRows[1],allRows[2],allRows[8]];
  const common=rows.filter(r=>r.cells.length>1&&r.cells.every(c=>!c.missing)).length;
  document.querySelector('#player-mode').setAttribute('aria-pressed',String(context==='players'));
  document.querySelector('#team-mode').setAttribute('aria-pressed',String(context==='teams'));
  document.querySelector('#follow-pins').hidden=context==='teams';
  document.querySelector('#comparison-title').textContent=context==='players'?'Player comparison':'Franchise relationships';
  document.querySelector('#selection-status').textContent=`${ids.length} ${context==='players'?'players':'teams'} pinned. ${common} fields with records for every name.`;
  document.querySelector('#comparison-table').innerHTML=`<caption>${context==='players'?'Pinned players, with measures and source periods kept separate.':'Team identities connect current opponents, picks, roster evidence and dated editions.'}</caption><thead><tr><th scope="col">Field / source period</th>${ids.map((id,i)=>`<th scope="col" data-column="${e(id)}" class="identity-${tones[i]}"><p class="column-title">${context==='players'?playerLink(id):teamLink(id)}</p><p class="column-sub">${context==='players'?'<span>'+e(name(players.get(id).teamId))+'</span><span>'+e(players.get(id).position)+' '+e(players.get(id).nbaTeam)+'</span>':e(teams.get(id).identity.managerName)+' · '+teams.get(id).players.length+' players'}</p><div class="column-actions"><button data-remove="${e(id)}" aria-label="Remove ${e(labels[i])}">Remove</button>${context==='teams'?`<button data-roster-compare="${e(id)}">Compare roster players</button>`:''}</div></th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${e(r.label)}<span class="field-period">${e(r.scope)}</span></th>${r.cells.map((c,i)=>`<td data-column="${e(ids[i])}" class="identity-${tones[i]}"><span class="cell-label">${e(labels[i])}</span>${c.html}</td>`).join('')}</tr>`).join('')}</tbody>`;
  document.querySelector('#transcript-content').innerHTML=`<p>${context==='players'?'Player comparison':'Franchise relationships'}: ${labels.map(e).join('; ')}. ${common} fields have supplied records for every pinned identity. Missing cells are missing evidence, not zeros.</p>${rows.map(r=>`<section><h3>${e(r.label)}</h3><p>${e(r.scope)}</p><ul>${r.cells.map((c,i)=>`<li><strong>${e(labels[i])}</strong>: ${e(c.text)}</li>`).join('')}</ul></section>`).join('')}`;
  renderPicker();
  // Pointer additions identify their newly aligned evidence; keyboard and reduced motion stay immediate.
  if(animate&&newId&&!matchMedia('(prefers-reduced-motion: reduce)').matches){pointerAnimationCount++;const roles=getComputedStyle(document.documentElement);document.querySelectorAll(`#comparison-table [data-column="${CSS.escape(newId)}"]`).forEach(el=>el.animate([{backgroundColor:roles.getPropertyValue('--paint-feedback').trim()},{backgroundColor:getComputedStyle(el).backgroundColor}],{duration:parseFloat(roles.getPropertyValue('--motion-recompose')),easing:roles.getPropertyValue('--motion-ease').trim()}));}
  document.body.dataset.comparisonContext=context;
  rememberWorkspace();
}
function switchContext(next){context=next;document.querySelector('#identity-search').value='';renderMatrix();}
function pin(id,next=context,animate=false){
  if(!id)return;
  context=next;
  const list=selected();
  if(list.includes(id)){renderMatrix();notice(`${context==='players'?players.get(id).fullName:name(id)} is already pinned.`);return;}
  if(list.length>=3){renderMatrix();notice('Three names are pinned. Remove one column before adding another.');return;}
  list.push(id);document.querySelector('#identity-search').value='';renderMatrix({newId:id,animate});notice(`${context==='players'?players.get(id).fullName:name(id)} added to the comparison above.`);
}
function notice(text){document.querySelector('#selection-status').textContent=text;document.querySelector('#record-notice').textContent=text;}
function followPlayers(){pinnedTeams=[...new Set(pinnedPlayers.map(id=>players.get(id).teamId))];switchContext('teams');document.querySelector('#team-mode').focus();}

// Surface contract: understand the league's evidence → open a named record or compare
// identities → member/public, incomplete scores, dated drafts, stale/missing saved AI →
// normal-flow measure groups on phones → no live inference or bounded home readers.
const current=personal?.matchup??data.home.directory[0].currentMatchup;
const routeList=[['Home','./index.html'+location.search],['News','/intel'],['History','/history'],['Arcade','/arcade'],['AI Decides','/ai-decides'],['Teams','/teams'],['Transactions','/transactions'],['Trade analyzer','/trade-analyzer'],['Weekly archive','/weekly'],['Free throws','/arcade/free-throw']];
if(isMember)routeList.push(['My team','/team'],['My roster',`/teams/${personal.team.id}#team-roster`]);
document.querySelector('#destinations').innerHTML=routeList.map(([label,href])=>`<a href="${e(href)}">${e(label)}</a>`).join('');
document.querySelector('.identity').href='./index.html'+location.search;
document.querySelector('#edition-name').textContent=`${isMember?'Member':'Public'} edition / GOAT Hoopers`;
document.querySelector('#current-date').innerHTML=`Week ${current.week} · incomplete fixture<br>Checked Nov 12, 2026 · not today`;
document.querySelector('#provenance-copy').innerHTML=`<p>${e(inventory.warning)}</p><p>Fixture check: ${e(data.home.checkedAt)}. Actual review date: October 29, 2026. November 12 is a future fixture date, not today.</p><p>October editorial stays dated, draft and unpublished. Archive entries supply coherent dated games; the preserved home-edition 1/2 pairing is not combined with the archive's 1/5 opener.</p><p>All source imports are local. No API, quote, model, counted points or live update is generated. Current roster ownership does not establish historical ownership. The member/public switch is a design comparison, not authentication.</p>`;
document.querySelector('#edition-link').href=`?view=${isMember?'public':'member'}${aiState!=='ready'?'&ai='+encodeURIComponent(aiState):''}`;
document.querySelector('#edition-link').textContent=`Compare ${isMember?'public':'member'} edition`;
function modelSource(m){
  if(!m?.result)return '';
  const r=m.result;
  return `<details class="source"><summary>Saved input and model details</summary><div><p>${e(r.probabilityLabel)}.</p><dl><dt>Saved / slate / pair status</dt><dd>${e(data.weekly.generatedAt)} / ${e(data.weekly.status)} / ${e(m.status)}</dd><dt>Model / prompt</dt><dd>${e(r.model)} / ${e(r.promptVersion)}</dd><dt>Input identity</dt><dd>League ${e(data.weekly.leagueId)} · ${e(data.weekly.season)} · Week ${data.weekly.week} · rosters ${e(m.teamIds.join(' / '))}</dd><dt>Snapshots / baseline</dt><dd>Result: ${r.snapshot?e(JSON.stringify(r.snapshot)):'unavailable (null)'}. Slate: ${data.weekly.snapshot?e(JSON.stringify(data.weekly.snapshot)):'unavailable (null)'}. Baseline: ${m.baseline?e(JSON.stringify(m.baseline)):'unavailable (null)'}.</dd><dt>Evidence</dt><dd>${m.evidence.map(e).join(' ')} ${r.evidence.length?r.evidence.map(e).join(' '):'No additional returned evidence.'}</dd></dl></div></details>`;
}
function pickSummary(m,featured=false){
  if(!m?.result)return `<p class="missing">Saved model opinion unavailable. No choice, probability or confidence inferred.</p>`;
  const r=m.result;
  return `<p>${aiState==='stale'?'<strong>STALE saved slate.</strong> ':''}${featured?'Actual returned choice:':''}</p><p class="${featured?'model-choice':'pick-line'}">${featured?teamLink(r.choice):'Returned '+teamLink(r.choice)}</p><p>${r.probabilities.map(p=>`${e(name(p.choice))} <strong>${p.probability*100}%</strong>`).join(' / ')}</p><p>Independent confidence <strong>${r.confidence*100}%</strong>.</p>${featured?'<p>The returned 35% choice is preserved alongside the alternate 65%.</p>':''}`;
}
const featuredPick=pickForTeam(current.home.id);
document.querySelector('#featured-pair').innerHTML=`<div class="featured-grid"><div class="featured-matchup"><p class="pair-status">${isMember?'Your matchup':'Featured current pairing'} / Week ${current.week} / incomplete</p><div class="pair-identities">${[current.home,current.away].map((t,i)=>`<div class="pair-identity identity-${i?'lavender':'peach'}"><h3>${teamLink(t.id)}</h3><p>${e(t.managerName)}<br>${record(t)} current record${personal?.team.id===t.id?' · Your team':''}</p><span class="score${(i?current.awayPoints:current.homePoints)==null?' is-pending':''}">${score(i?current.awayPoints:current.homePoints)}</span><p>Current score</p></div>`).join('')}</div><p class="pair-foot">A known 0.0 stays 0.0. An absent score stays Pending. Neither establishes a final.</p><div class="record-links pair-foot"><button data-set-teams="${current.home.id},${current.away.id}">Compare this pairing</button>${teamLink(current.home.id,'Home team profile')}${teamLink(current.away.id,'Away team profile')}</div></div><aside class="model-note"><h3>Saved model opinion</h3>${pickSummary(featuredPick,true)}<p>${data.weekly?'Saved Nov 10, 2026 · Week '+data.weekly.week:'No saved slate supplied.'}</p>${modelSource(featuredPick)}<a class="text-action" href="/ai-decides">Open AI Decides</a></aside></div>`;
const uniquePairs=[...new Map(data.home.directory.map(t=>[t.currentMatchup.home.id,t.currentMatchup])).values()];
document.querySelector('#slate').innerHTML=`<div class="slate-heading"><h3>The rest of the Week ${current.week} slate</h3><p>${uniquePairs.length} pairings supplied / ${data.weekly?data.weekly.matchups.length+' saved model rows':'saved model rows unavailable'}</p></div><div class="slate-grid">${uniquePairs.filter(m=>m.home.id!==current.home.id).map(m=>`<article class="slate-row"><div class="mini-pair">${[m.home,m.away].map((t,i)=>`<p>${teamLink(t.id)}<small> · ${record(t)}</small></p><span class="mini-score">${score(i?m.awayPoints:m.homePoints)}</span>`).join('')}</div><p class="muted">Current score · incomplete</p>${pickSummary(pickForTeam(m.home.id))}<details class="source"><summary>Pairing actions and sources</summary><div><p>Current team identities; checked ${e(data.home.checkedAt)}. Manager ${e(m.home.managerName)} / ${e(m.away.managerName)}.</p>${modelSource(pickForTeam(m.home.id))}<button data-set-teams="${m.home.id},${m.away.id}">Compare these teams</button></div></details></article>`).join('')}</div><p class="method">Saved model probabilities are experimental opinions, not calibrated sports odds. ${data.weekly?'All five use the saved '+e(data.weekly.generatedAt)+' slate.':''} <a href="?view=${mode}&ai=stale">Inspect stale state</a> · <a href="?view=${mode}&ai=missing">Inspect missing state</a></p>`;

function memberHome(){
  if(!personal)return '';
  const p=personal,g=p.playerGuide;
  const cohort=[...completed.values()].sort((a,b)=>b.value-a.value);
  return `<section class="member-section" aria-labelledby="member-title" data-member-content><div class="section-heading"><h2 id="member-title">Your roster notebook.</h2><p>${teamLink(p.team.id)} · ${e(p.team.managerName)}<br>Standing ${p.standing.rank}/${p.season.totalTeams} · ${record(p.team)} · ${p.coverage.roster} players</p></div><div class="member-grid"><div><h3>Modeled roster value</h3><p class="value-total">${money(p.valuation.total)}</p><p>${p.valuation.priced} priced / ${p.valuation.unpriced} unpriced<br>${e(p.market.pricingBasis)} basis · ${e(when(p.market.updatedAt))}</p><p>Supplied modeled-value rank ${p.valuation.rank.rank}/${p.valuation.rank.teams}${p.valuation.rank.tied?' (tied)':''}. ${p.valuation.complete?'Complete supplied roster pricing.':'Partial subtotal.'}</p><ul class="reading-list">${p.players.map(x=>`<li><div class="value-row">${playerLink(x.id,x.name)}<strong>${money(x.value)}</strong></div><small>Up ${x.changePct}% · supplied modeled change</small></li>`).join('')}</ul><details class="source"><summary>All ${p.rosterValues.length} supplied roster values</summary><div><ul class="all-values">${p.rosterValues.map(x=>`<li data-roster-value>${playerLink(x.id,x.name)} · ${money(x.value)}</li>`).join('')}</ul></div></details><p>${e(inventory.missing.history)}</p><div class="record-links"><a href="/team">My team</a><a href="/teams/${p.team.id}#team-roster">My full roster</a></div></div><div><h3>Completed points / small cohort</h3><p>${e(g.period)}</p><p>${e(g.coverage)}</p><div class="cohort"><strong>Player</strong><strong>Counted FP</strong><span>GP / list</span></div>${cohort.map(x=>`<div class="cohort">${playerLink(x.id,x.name)}<strong>${x.value} FP</strong><span>${x.games} GP<small>${x.lists.map(k=>k==='best'?'Best':'Rough').join(' + ')}</small></span></div>`).join('')}<p class="member-period">${e(inventory.missing.recap)}</p><h3>Form watch / EMA FP/G</h3><p>${e(g.watch.message)}</p><ul class="reading-list">${g.watch.rows.map(x=>`<li><div class="value-row">${playerLink(x.id,x.name)}<strong>${x.value} EMA FP/G</strong></div><small>${x.games} observed games · ${e(x.note)}</small></li>`).join('')}</ul></div><aside class="member-wire"><h3>Your team wire</h3>${p.news.map(n=>`<p><a href="${e(n.url)}">${e(n.headline)}</a><br><small>${e(n.outlet.name)}<br>${e(when(n.publishedAt))}</small></p>`).join('')}<p>${e(p.moves[0].summary)}<br><small>Week ${p.moves[0].week} · ${e(when(p.moves[0].createdAt))}<br>No add/drop player legs supplied.</small></p><a class="text-action" href="/transactions">Open transactions</a></aside></div></section>`;
}
document.querySelector('#member-home').innerHTML=memberHome();
document.querySelector('#editorial').innerHTML=opinions.map(p=>`<article class="editorial-take identity-${p.playerId==='1511'?'peach':p.playerId==='1658'?'lavender':'teal'}"><div class="take-person">${inventory.portraits[p.playerId]?`<img src="${e(inventory.portraits[p.playerId])}" alt="" loading="lazy">`:''}<p>${playerLink(p.playerId,p.name)}<small>${e(p.periodLabel)}<br>Current team: ${teamLink(players.get(p.playerId).teamId)}</small></p></div><h3>${e(p.headline)}</h3><p>${e(p.opinion)}</p><div class="stat-line">${p.stats.map(s=>`<span><strong>${e(s.value)}</strong>${e(s.label)}</span>`).join('')}</div><p>${e(p.statPeriod)}</p><p class="take-source">${e(p.source.label)} · checked ${e(p.source.checkedAt)}</p><details class="source"><summary>Why this take / original source</summary><div><p>${e(p.selectionReason)}</p><a href="${e(p.source.url)}">${e(p.source.label)}</a><p>${e(p.edition.dateLabel)} · ${e(p.edition.status)} / unpublished</p></div></details><button data-compare-player="${e(p.playerId)}">Compare ${e(p.name)}</button></article>`).join('');

const season=data.home.hub.season;
document.querySelector('#season-context').innerHTML=`${e(season.seasonYear)} · in season · ${season.totalTeams} teams<br>${season.playoffTeams} playoff places · start Week ${season.playoffWeekStart}`;
document.querySelector('#standings').innerHTML=[...standings.values()].map(s=>{const t=teams.get(s.team.id),m=t.currentMatchup,op=m.home.id===s.team.id?m.away:m.home;return `<li class="standing-row" data-viewer="${personal?.team.id===s.team.id}"><span class="standing-rank">${s.rank}</span><div><p><strong>${teamLink(s.team.id)}</strong>${personal?.team.id===s.team.id?' · Your team':''}</p><small>${e(t.identity.managerName)} · ${t.players.length} rostered<br>Week ${m.week}: vs ${teamLink(op.id)}</small>${t.previousSeason.ownerNote?`<small>2025: ${t.previousSeason.wins}–${t.previousSeason.losses} · ${e(t.previousSeason.ownerNote)}</small>`:''}<details class="standing-history"><summary>Roster links / 2025 record</summary><div><p>2025: ${t.previousSeason.wins}–${t.previousSeason.losses}, finish ${t.previousSeason.finish}. ${e(t.previousSeason.ownerNote??'')}</p><p>Current featured references: ${t.featuredPlayerIds.map(id=>playerLink(id)).join(', ')}.</p><p>${teamLink(s.team.id,'Open public team and full roster')}</p><button data-set-teams="${s.team.id},${op.id}">Compare current opponents</button></div></details></div><p class="standing-numbers">${s.wins}–${s.losses}${s.ties?'–'+s.ties:''}<small>${(s.pointsFor/100).toFixed(2)} PF</small></p></li>`;}).join('');
document.querySelector('#league-wire').innerHTML=`<h3 id="wire-title">Latest league moves</h3><p>Week 3 · synthetic activity<br>Nov 12, 2026 source fixture</p>${data.home.hub.transactions.map(m=>`<div class="wire-item"><p>${e(m.summary)}</p><small>${m.teamIds.map(id=>teamLink(id)).join(', ')} · ${e(m.type)}<br>${e(when(m.createdAt))}<br>No add/drop player legs supplied.</small></div>`).join('')}<a class="text-action" href="/transactions">Read the full transaction wire</a><div class="availability"><h3>Evidence gaps</h3><p>${e(inventory.missing.power)}</p><p>League aggregate leaders and streaks are unavailable in this fixture. No leader is inferred from incomplete scores.</p><a href="/intel">Open League Intel</a></div>`;

document.querySelector('#archive').innerHTML=data.archive.map(a=>`<article class="archive-entry"><p>${e(a.dateLabel)} · ${e(a.status)} / unpublished</p><h3><a href="/weekly/${e(a.id)}">${e(a.title)}</a></h3><p><strong>${e(a.game.title)}</strong><br>${e(a.game.note)}</p><p>${a.game.teamIds.map(id=>teamLink(id)).join(' / ')}</p><p class="dated-score">${a.game.scores?a.game.scores.map(score).join('–'):'Upcoming / Pending'}</p><p>${e(a.game.context)}</p><details class="source"><summary>Dated bounds and source notes</summary><div><p>${e(a.game.selectionReason)}</p><p>${e(a.startsAt)} to ${e(a.endsAt)} (end exclusive). Published: ${a.publishedAt??'none'}.</p>${a.sources.map(s=>`<p><a href="${e(s.url)}">${e(s.label)}</a> · checked ${e(s.checkedAt)}</p>`).join('')}</div></details><a class="text-action" href="/weekly/${e(a.id)}">Open dated edition</a></article>`).join('');
const datedHappenings=data.archive[0].happenings;
document.querySelector('#archive-wire').innerHTML=`<h3>From the October wire</h3><p>Dated context from the Oct 5–11 draft; these are not current November moves.</p><div>${datedHappenings.map(h=>`<p><strong><a href="${e(h.href)}">${e(h.title)}</a></strong><br>${e(h.text)}<br><small>${e(h.dateLabel)} · source checked Oct 8, 2026</small></p>`).join('')}</div>`;
document.querySelector('#availability').textContent=`${inventory.missing.power} ${inventory.missing.history} No producer is invoked by this page.`;
renderMatrix();

function focusComparison(){document.querySelector('#comparison-title').scrollIntoView({block:'start'});document.querySelector(context==='players'?'#player-mode':'#team-mode').focus({preventScroll:true});}
document.querySelector('#player-mode').addEventListener('click',()=>switchContext('players'));
document.querySelector('#team-mode').addEventListener('click',()=>switchContext('teams'));
document.querySelector('#follow-pins').addEventListener('click',followPlayers);
document.querySelector('#identity-search').addEventListener('input',renderPicker);
document.querySelector('#pin-form').addEventListener('submit',event=>{event.preventDefault();pin(document.querySelector('#identity-select').value);document.querySelector('#pin-chooser').open=false;document.querySelector('#pin-chooser>summary').focus();});
document.querySelector('#footer-provenance').addEventListener('click',()=>{document.querySelector('#provenance').open=true;document.querySelector('#provenance>summary').focus();});
document.addEventListener('click',event=>{
  let target=event.target.closest('[data-remove]');
  if(target){const list=selected();if(list.length===1){notice('Keep one name pinned; add another before removing it.');return;}list.splice(list.indexOf(target.dataset.remove),1);renderMatrix();document.querySelector('#pin-chooser>summary').focus();return;}
  target=event.target.closest('[data-set-teams]');if(target){pinnedTeams=target.dataset.setTeams.split(',');switchContext('teams');focusComparison();return;}
  target=event.target.closest('[data-compare-player]');if(target){const id=target.dataset.comparePlayer;pinnedPlayers=[id,...pinnedPlayers.filter(p=>p!==id)].slice(0,3);switchContext('players');focusComparison();notice(`${players.get(id).fullName} is in the player comparison.`);return;}
  target=event.target.closest('[data-roster-compare]');if(target){pinnedPlayers=teams.get(target.dataset.rosterCompare).featuredPlayerIds.slice(0,3);switchContext('players');focusComparison();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=document.querySelector('#site-links[open]')??document.querySelector('#provenance[open]')??document.querySelector('#pin-chooser[open]');if(open){open.open=false;open.querySelector('summary').focus();}}});
// A native Back return restores only this entry and this edition. Public rendering is
// constructed independently and never hydrates the member notebook or its history state.
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link||link.getAttribute('href').startsWith('#'))return;const href=link.getAttribute('href');rememberWorkspace({departure:{scrollY,focusId:link.id,focusHref:href,focusOccurrence:[...document.querySelectorAll('a[href]')].filter(a=>a.getAttribute('href')===href).indexOf(link),details:[...document.querySelectorAll('details')].map(d=>d.open)}});});
const textSizing=new ResizeObserver(()=>document.body.classList.toggle('large-text',parseFloat(getComputedStyle(document.documentElement).fontSize)>=24));textSizing.observe(document.documentElement);
await document.fonts.ready;
if(validEntry&&restoredEntry.departure){const d=restoredEntry.departure;document.querySelectorAll('details').forEach((detail,i)=>detail.open=!!d.details?.[i]);await new Promise(requestAnimationFrame);scrollTo(0,d.scrollY);const origin=d.focusId?document.getElementById(d.focusId):[...document.querySelectorAll('a[href]')].filter(a=>a.getAttribute('href')===d.focusHref)[d.focusOccurrence??0];origin?.focus({preventScroll:true});}
document.documentElement.dataset.homepageReady='18';

