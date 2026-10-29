import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const personal = data.personal.kind === 'member' ? data.personal.summary : null;
const directory = data.home.directory;
const teams = new Map(directory.map(d => [d.identity.id, d.identity]));
const teamName = id => teams.get(String(id))?.name ?? 'Unknown team';
const date = v => new Date(v).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const teamLink = (id, name = teamName(id)) => `<a href="/teams/${esc(id)}">${esc(name)}</a>`;
const cross = (channel, target, label) => `<button class="cross" type="button" data-cross="${channel}" data-target="${target}">${esc(label)}</button>`;
const disclosure = (title, content, classes = '') => `<details class="disclosure ${classes}"><summary>${title}</summary>${content}</details>`;
const channels = [
  { id:'team', number:'01', name:personal ? 'Your team' : 'At a glance', subtitle:personal ? 'Your next decision, in context.' : 'The current pairing, in context.' },
  { id:'league', number:'02', name:'League action', subtitle:'Five pairings. Ten teams. One open ledger.' },
  { id:'scouting', number:'03', name:'Scouting', subtitle:'Separate the form, the value and the opinion.' },
  { id:'culture', number:'04', name:'Culture', subtitle:'The archive has a different clock.' }
];
let active = 'team';
const positions = {team:0,league:0,scouting:0,culture:0};
const history = [];
const compact = matchMedia('(max-width:63rem)');
const root = document.querySelector('#channels');
root.innerHTML = channels.map(c=>`<section class="channel ${c.id}" data-channel="${c.id}" aria-labelledby="heading-${c.id}"><header class="channel-heading"><span class="ordinal">${c.number} /</span><div><h2 id="heading-${c.id}">${c.name}</h2><p>${c.subtitle}</p></div></header><div class="scroll" id="reader-${c.id}" tabindex="0" role="region" aria-label="${c.name} reading stream"><div class="return-path"></div><div id="content-${c.id}"></div><p class="channel-footer">End of this channel. Choose another above; your place stays here.</p></div></section>`).join('');
document.querySelector('.channel-index').innerHTML = channels.map(c=>`<button type="button" data-select="${c.id}" aria-controls="reader-${c.id}" aria-pressed="${c.id===active}"><strong>${c.number} ${c.name}</strong><span class="position">Start</span></button>`).join('');
const reader = id => document.querySelector(`#reader-${id}`);
const content = id => document.querySelector(`#content-${id}`);

function matchup(pair) {
  if (!pair) return '<p class="empty">Current pairing unavailable.</p>';
  return `<span class="eyebrow">2026 · Week ${esc(pair.week)} · Current score</span>${[['home','homePoints'],['away','awayPoints']].map(([side,score],i)=>`${i ? '<p class="versus">versus</p>' : ''}<div class="pair-side"><div>${teamLink(pair[side].id,pair[side].name)}<small>${esc(pair[side].managerName)} · ${record(pair[side])}</small></div><span class="score">${pair[score] == null ? 'Pending' : Number(pair[score]).toFixed(1)}</span></div>`).join('')}<p class="incomplete">Incomplete · ${pair.homePoints == null || pair.awayPoints == null ? 'score data pending' : 'not a final result'}</p><p class="source">A known 0.0 is a recorded zero. Pending means unknown.</p>`;
}

function teamContent() {
  const pair = personal?.matchup ?? directory[0].currentMatchup;
  if (!personal) return `<section class="passage" id="team-start"><span class="eyebrow">Public edition</span><h1 class="hero-name">Follow the week.</h1><p>Ten teams, five pairings, and four ways into the league.</p><div class="actions"><a class="action" href="/teams">Meet the teams</a><a href="?view=member${aiState==='ready'?'':`&ai=${esc(aiState)}`}">Compare member edition</a></div></section><section class="passage" id="current-pair">${matchup(pair)}${cross('league','ai-0','Read this pairing’s saved AI context')}</section><section class="passage rule"><h3>The people behind the names</h3><p>Browse every team, manager and roster in the league ledger. Search players by name, position or NBA team.</p>${cross('league','directory','Find a team or player')}${cross('scouting','faces','See all ten roster anchors')}</section><section class="passage"><h3>Useful places</h3><div class="actions"><a href="/stocks#player-board">Player stock board</a><a href="/trade-analyzer">Analyze a trade</a><a href="/arcade/free-throw">Play free throw</a></div></section><footer class="footer-note"><p>No personal summary is rendered in the public edition.</p><p>${esc(inventory.warning)}</p></footer>`;
  const s=personal;
  return `<section class="passage" id="team-start"><span class="eyebrow">Member edition · Synthetic fixture</span><h1 class="hero-name">${esc(s.team.name)}</h1><span class="manager">${esc(s.team.managerName)}</span><p class="record-line">${record(s.team)} · Standing ${s.standing.rank} of ${s.season.totalTeams} · ${s.coverage.roster} rostered</p><div class="actions"><a class="action" href="/team">My team</a><a href="/teams/${esc(s.team.id)}#team-roster">View roster</a></div></section><section class="passage" id="current-pair">${matchup(pair)}${cross('league','ai-0','Why the saved model picked the opponent')}</section><section class="passage rule" id="team-value"><h3>What your roster is worth</h3><p class="number">${money(s.valuation.total)}</p><p>Modeled FAAB ${s.valuation.complete?'total':'subtotal'} · ${esc(s.market.pricingBasis)} basis.</p><p class="source">${s.coverage.priced}/${s.coverage.roster} priced · ${s.valuation.unpriced} unpriced. Computed ${date(s.market.updatedAt)}. Checked ${date(s.checkedAt)}. Modeled value is not a FAAB balance or sale.</p><ol>${s.players.map(p=>`<li class="price-row">${playerLink(p.id,p.name)}<span>${money(p.value)}</span><small>${esc(p.position)} · Up ${esc(p.changePct)}% modeled price change</small></li>`).join('')}</ol>${disclosure(`All ${s.rosterValues.length} roster values`, `<ul class="roster-values">${s.rosterValues.map(p=>`<li class="price-row">${playerLink(p.id,p.name)}<span>${money(p.value)}</span><small>${esc(p.position)}</small></li>`).join('')}</ul>`)}${cross('scouting','watch','Read form separately from modeled value')}<p id="history-unavailable" class="source">${esc(inventory.missing.history)}</p><a class="text-link" href="/history">League history</a></section><section class="passage" id="team-wire"><h3>Your team wire</h3><ul class="plain-list">${s.news.map(n=>`<li><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="source">${esc(n.outlet.name)} · ${date(n.publishedAt)} · synthetic</p></li>`).join('')}</ul>${s.moves.map(m=>`<div class="move"><p>${esc(m.summary)}</p><p class="source">Week ${m.week} · ${date(m.createdAt)} · synthetic · no player legs supplied.</p></div>`).join('')}${cross('league','moves','Follow the rest of the league’s moves')}</section><footer class="footer-note"><p><a href="?view=public${aiState==='ready'?'':`&ai=${esc(aiState)}`}">Compare public edition</a></p><p>${esc(inventory.warning)}</p></footer>`;
}

function aiRows() {
  const pairs = [...new Map(directory.map(d=>[d.currentMatchup.home.id, d.currentMatchup])).values()];
  const slate = data.weekly;
  return pairs.map((pair,i)=>{
    const pick=slate?.matchups.find(m=>m.teamIds.includes(pair.home.id)&&m.teamIds.includes(pair.away.id));
    const r=pick?.result;
    const status=slate?.status==='stale'?'Stale saved pick':r?'Saved synthetic pick':'Saved pick unavailable';
    const probs = r?.probabilities ?? [];
    return `<article class="ai-pair" id="ai-${i}"><span class="eyebrow">Pair ${i+1} · ${esc(status)}</span><h4>${teamLink(pair.home.id)}<br><span class="muted">vs</span> ${teamLink(pair.away.id)}</h4><p class="source">${esc(pair.home.managerName)} (${record(pair.home)}) / ${esc(pair.away.managerName)} (${record(pair.away)})</p><p>Current score: ${pair.homePoints==null?'Pending':Number(pair.homePoints).toFixed(1)} / ${pair.awayPoints==null?'Pending':Number(pair.awayPoints).toFixed(1)} · Incomplete</p>${r?`<p class="picked">Returned choice: ${esc(teamName(r.choice))}</p><div class="probabilities" aria-hidden="true">${probs.map(p=>`<span style="width:${p.probability*100}%"></span>`).join('')}</div><div class="prob-labels">${probs.map(p=>`<span>${esc(teamName(p.choice))}<br><strong>${Math.round(p.probability*100)}%</strong></span>`).join('')}</div><p class="confidence">Independent confidence: ${Math.round(r.confidence*100)}%</p>${disclosure('Model receipt and evidence',`<dl><dt>Saved</dt><dd>${date(slate.generatedAt)}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot||slate.snapshot?esc(JSON.stringify(r.snapshot??slate.snapshot)):'Unavailable; fixture carries no input snapshot.'}</dd><dt>Evidence</dt><dd>${[...pick.evidence,...r.evidence].map(esc).join('<br>') || 'No returned evidence supplied.'}</dd><dt>Interpretation</dt><dd>${esc(r.probabilityLabel)}. The returned choice remains ${esc(teamName(r.choice))} at 35%; the 65% other probability does not override it. Confidence is a separate 20%.</dd><dt>Period and state</dt><dd>Season ${esc(slate.season)} · Week ${slate.week}. ${esc(status)}; no generation on render.</dd></dl>`)}`:'<p class="empty">No saved result or probabilities available. No prediction is inferred.</p>'}${i===0?cross('team','current-pair','Compare the actual pairing context'):''}${cross('league',`club-${pair.away.id}`,`Open ${teamName(pair.away.id)}’s roster`)}</article>`;
  }).join('');
}

function leagueContent() {
  return `<section class="passage" id="league-start"><span class="eyebrow">Synthetic current Week 3</span><p>Read the saved choices beside the unfinished scores. Then follow a team into its roster.</p><div class="actions"><a href="/ai-decides">AI Decides</a><a href="/teams">Team profiles</a></div></section><section class="passage" id="ai-slate"><h3>The saved slate</h3><p class="source">${data.weekly?`${data.weekly.status==='stale'?'Stale · ':''}Saved ${date(data.weekly.generatedAt)}.`:'Unavailable saved slate.'} All metrics here are synthetic. No odds or results are implied.</p><div style="margin-top:1.3rem">${aiRows()}</div></section><section class="passage rule" id="standings"><h3>Standings</h3><p class="source">2026 current records · synthetic. PF in fantasy points.</p><table class="standings"><caption class="sr-only">All ten current teams by standings rank</caption><thead><tr><th scope="col">#</th><th scope="col">Team</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s=>`<tr><td>${s.rank}</td><td>${teamLink(s.team.id)}</td><td>${record(s)}</td><td>${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table></section><section class="passage rule" id="directory"><h3>Clubhouse index</h3><p>10 teams · 228 unique player references. Open a roster in place or follow a profile.</p><div class="search-controls"><label for="search"><span>Find team, manager or player</span><input id="search" type="search" placeholder="Try Embiid, NeuralNets or PG"></label><label for="sort"><span>Order teams</span><select id="sort"><option value="rank">Standing</option><option value="name">Team name A–Z</option><option value="roster">Roster size, most first</option></select></label><button type="button" id="clear-search">Clear search</button></div><p id="search-count" class="source search-count" role="status">10 teams shown</p><div id="team-directory"></div></section><section class="passage rule" id="moves"><h3>Recent league moves</h3>${data.home.hub.transactions.map(m=>`<div class="move"><p>${esc(m.summary)}</p><p class="source">${esc(m.type)} · Week ${m.week} · ${date(m.createdAt)} · synthetic · no player legs supplied.</p><p>${m.teamIds.map(id=>teamLink(id)).join(', ')}</p></div>`).join('')}<a class="text-link" href="/transactions">All transactions</a></section><section class="passage"><h3>League leaders</h3><p>Unavailable in this fixture. No point, streak, activity or margin leader is inferred.</p>${cross('scouting','power','Read Lineup Power availability')}</section><footer class="footer-note"><p>Source boundary: local synthetic fixture. Week 3 current data is distinct from the dated October drafts in Culture.</p><a class="text-link" href="/trade-analyzer">Trade analyzer</a></footer>`;
}

function rosterDirectory() {
  const q=document.querySelector('#search').value.trim().toLocaleLowerCase();
  const sort=document.querySelector('#sort').value;
  let rows=directory.filter(d=>[d.identity.name,d.identity.managerName,...d.players.flatMap(p=>[p.fullName,p.position,p.nbaTeam])].some(v=>v?.toLocaleLowerCase().includes(q)));
  const rank=id=>data.home.hub.standings.find(s=>s.team.id===id)?.rank??99;
  rows.sort((a,b)=>sort==='name'?a.identity.name.localeCompare(b.identity.name):sort==='roster'?(b.players.length-a.players.length||rank(a.identity.id)-rank(b.identity.id)):rank(a.identity.id)-rank(b.identity.id));
  document.querySelector('#search-count').textContent=`${rows.length} of 10 teams shown${q?` for “${q}”`:''}`;
  document.querySelector('#team-directory').innerHTML=rows.length?rows.map(d=>{
    const t=d.identity, m=d.currentMatchup, opponent=m.home.id===t.id?m.away:m.home;
    return `<article class="team-entry" id="club-${esc(t.id)}"><h4>${teamLink(t.id,t.name)}${d.previousSeason?.finish===1?' · 2025 champion':''}</h4><p>${esc(t.managerName)} · ${record(d.currentRecord)} · ${d.players.length} rostered</p><p class="source">Current Week ${m.week} opponent: ${esc(opponent.name)} · Incomplete</p>${disclosure(`Roster · all ${d.players.length} players`, `<ul>${d.players.map(p=>`<li class="roster-player">${playerLink(p.id,p.fullName)}<small>${esc(p.position)} · ${esc(p.nbaTeam??'NBA unavailable')}</small></li>`).join('')}</ul><p class="source">${d.previousSeason?`${esc(d.previousSeason.season)}: ${d.previousSeason.wins}–${d.previousSeason.losses}, finish ${d.previousSeason.finish}. ${esc(d.previousSeason.ownerNote??'')}`:'Prior-season record unavailable.'}</p><a class="text-link" href="/teams/${esc(t.id)}#team-roster">Full team roster page</a>`)}${cross('scouting',`face-${t.id}`,'Compare this team’s modeled-value anchor')}</article>`;
  }).join(''):'<p class="empty">No team or player matches. Clear search to restore all ten teams.</p>';
}

function editorialStories() {
  return data.archive[0].playerSpotlights.map(p=>`<article class="story" id="story-${p.playerId}"><span class="eyebrow">${esc(p.periodLabel)} · dated editorial</span><p>${playerLink(p.playerId,p.name)} · ${esc(p.position)}</p><h4>${esc(p.headline)}</h4><p class="quote">${esc(p.opinion)}</p><div class="statline">${p.stats.map(s=>`<span><strong>${esc(s.value)}</strong>${esc(s.label)}</span>`).join('')}</div><p class="source">${esc(p.statPeriod)}.</p><p>${esc(p.selectionReason)}</p><p class="source"><a href="${esc(p.source.url)}">${esc(p.source.label)}</a> · checked ${esc(p.source.checkedAt)}</p>${cross('league',`club-${p.teamId}`,`Find the linked team, ${teamName(p.teamId)}`)}${p.playerId==='1511'&&personal?cross('team','team-value','Compare Embiid’s current modeled value'):''}</article>`).join('');
}

function scoutingContent() {
  const g=personal?.playerGuide;
  return `${g?`<section class="passage" id="watch"><span class="eyebrow">Your form watch · synthetic</span><h3>${esc(g.watch.label)}</h3><ul class="watch-list">${g.watch.rows.map(p=>`<li>${playerLink(p.id,p.name)}<strong>${p.value.toFixed(1)}</strong><small>${p.games} observed games · EMA fantasy points per game · availability unknown</small></li>`).join('')}</ul><p class="source">${esc(g.watch.message)} Season ${g.season}, current Week ${g.currentWeek}. EMA is a form measure, separate from modeled FAAB value.</p>${cross('team','team-value','Return to your roster value')}</section><section class="passage rule" id="recap"><h3>Best & rough week</h3><p class="source">${esc(g.period)} · Completed-week synthetic fixture, not official current Week 2 awards.</p>${['best','rough'].map(k=>`<h4>${k==='best'?'Best recorded totals':'Rough recorded totals'}</h4><ul class="watch-list">${g[k].map(p=>`<li>${playerLink(p.id,p.name)}<strong>${p.value.toFixed(1)} pts</strong><small>${p.games} GP · ${esc(p.note)}</small></li>`).join('')}</ul>`).join('')}<p class="source">${esc(g.recapMessage)} ${esc(g.coverage)}</p></section>`:`<section class="passage" id="watch"><span class="eyebrow">Public scouting notebook</span><h3>Know what you’re reading.</h3><p>Current modeled value, historical averages and editorial opinion answer different questions. Their periods stay attached.</p>${cross('league','directory','Find a player’s current roster')}</section>`}<section class="passage rule" id="editorial-picks"><h3>Three dated takes</h3><p class="source">Oct 5–11, 2026 draft · sources checked Oct 8. NBA and college samples are not current fantasy-week awards.</p><div style="margin-top:1.5rem">${editorialStories()}</div></section><section class="passage rule" id="faces"><h3>Ten roster anchors</h3><p class="source">Each team’s supplied modeled-value anchor. Synthetic current FAAB values, not performance rankings.</p><ol>${data.faces.map(f=>`<li class="anchor-player" id="face-${f.team.id}">${inventory.portraits[f.player.id]?`<img class="portrait" loading="lazy" src="${esc(inventory.portraits[f.player.id])}" alt="">`:`<span class="portrait initials" aria-hidden="true">${esc(f.player.name.split(' ').map(s=>s[0]).slice(0,2).join(''))}</span>`}<div><strong>${playerLink(f.player.id,f.player.name)}</strong><p>${esc(f.player.position)} · ${money(f.player.value)} modeled FAAB</p><p class="team-link">${teamLink(f.team.id)}${f.champion?' · 2025 champion':''}</p>${cross('league',`club-${f.team.id}`,'Read this roster')}</div></li>`).join('')}</ol></section><section class="passage rule" id="power"><h3>Lineup Power</h3><p>${esc(inventory.missing.power)}</p><p class="source">No ranking is drawn.</p><div class="actions"><a href="/stocks#player-board">Open Stocks</a><a href="/trade-analyzer">Trade analyzer</a></div></section>`;
}

let archiveIndex=0;
function archiveStory() {
  const a=data.archive[archiveIndex],g=a.game;
  return `<article id="archive-story"><span class="eyebrow">${esc(a.dateLabel)} · ${esc(a.status)} · ${a.publishedAt?'published '+date(a.publishedAt):'unpublished sample'}</span><h3 class="culture-title">${esc(g.title)}</h3><p class="source">${esc(g.note)} · ${g.leagueWeek?`Historical Week ${g.leagueWeek} context`:'2025 historical final'} · ${esc(g.state)}</p>${g.scores?`<p class="archive-score">${g.scores.map(v=>Number(v).toFixed(1)).join(' / ')}</p>`:''}<p>${g.teamIds.map(id=>teamLink(id)).join(' / ')}</p><p>${esc(g.context)}</p><p class="source">${esc(g.selectionReason)}</p><a class="text-link" href="/weekly/${esc(a.id)}">Read dated edition ${esc(a.id)}</a>${archiveIndex===0?cross('scouting','editorial-picks','Read the three takes in this edition'):cross('league','club-8','Find the franchise mentioned in this archive')}<h4>Happenings</h4><ul class="plain-list">${a.happenings.map(h=>`<li><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p><p class="source">${esc(h.dateLabel)} · dated archive context</p></li>`).join('')}</ul>${disclosure('Edition sources',`<ul class="source-list">${a.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><p class="source">Checked ${esc(s.checkedAt)}</p></li>`).join('')}</ul>`)}</article>`;
}
function cultureContent() {
  return `<section class="passage" id="culture-start"><span class="eyebrow">A different clock</span><h3 class="culture-title">The league has a memory.</h3><p>These October drafts belong to their dates. The current Week 3 scores run in the next channel.</p>${cross('league','ai-slate','Read the current week instead')}<div class="archive-picker" aria-label="Choose dated edition">${data.archive.map((a,i)=>`<button type="button" data-archive="${i}" aria-pressed="${i===archiveIndex}">${esc(a.title)}<span>${esc(a.dateLabel)} · ${esc(a.status)}</span></button>`).join('')}</div><div id="archive-reader">${archiveStory()}</div></section><section class="passage rule" id="play"><span class="eyebrow">After the reading</span><h3 class="culture-title">Take a shot.</h3><p>Existing free-throw practice. No league result or reward claim is implied by this study.</p><div class="actions"><a class="action" href="/arcade/free-throw">Play free throw</a><a href="/arcade">All Arcade</a></div></section><footer class="footer-note"><p><a href="/weekly">Browse the weekly archive</a></p><p>Dated narrative comes only from coherent archive entries 2026-W41 (teams 1/5) and W40 (5/7). It is separate from current Week 3.</p><p>${esc(inventory.warning)}</p><p>Local wireframe 14. No live providers, model generation or publishing.</p></footer>`;
}

content('team').innerHTML=teamContent();
content('league').innerHTML=leagueContent();
content('scouting').innerHTML=scoutingContent();
content('culture').innerHTML=cultureContent();
rosterDirectory();
const editionSwitch=document.querySelector('#edition-switch');
editionSwitch.textContent=personal?'Compare public edition':'Compare member edition';
editionSwitch.href=`?view=${personal?'public':'member'}${aiState==='ready'?'':`&ai=${encodeURIComponent(aiState)}`}`;
const homeHref=`./index.html?view=${mode}${aiState==='ready'?'':`&ai=${encodeURIComponent(aiState)}`}`;
document.querySelector('.identity').href=homeHref;
document.querySelector('.primary [aria-current="page"]').href=homeHref;

function updateProgress(id) {
  if(document.querySelector(`[data-channel="${id}"]`).hidden)return;
  const r=reader(id); positions[id]=r.scrollTop;
  const max=r.scrollHeight-r.clientHeight;
  const pct=max>0?Math.round(r.scrollTop/max*100):0;
  document.querySelector(`[data-select="${id}"] .position`).textContent=r.scrollTop<5?'Start':`${pct}% read`;
}
function selectChannel(id, focus=false) {
  if(!channels.some(c=>c.id===id))return;
  if(!document.querySelector(`[data-channel="${active}"]`).hidden)positions[active]=reader(active).scrollTop;
  active=id;
  channels.forEach(c=>{
    const el=document.querySelector(`[data-channel="${c.id}"]`);
    el.hidden=compact.matches&&c.id!==id;
    if(!el.hidden)reader(c.id).scrollTop=positions[c.id];
    document.querySelector(`[data-select="${c.id}"]`).setAttribute('aria-pressed',String(c.id===id));
  });
  reader(id).scrollTop=positions[id];
  if(focus)reader(id).focus({preventScroll:true});
}
function jump(channel,target,save=true) {
  const trigger=document.activeElement;
  const from=trigger?.closest('[data-channel]')?.dataset.channel??active;
  const token=String(history.length+1)+'-'+String(performance.now());
  if(save)history.push({from,top:reader(from).scrollTop,trigger,token});
  if(channel==='league'&&target.startsWith('club-')) {
    document.querySelector('#search').value='';rosterDirectory();
  }
  selectChannel(channel);
  const r=reader(channel),t=document.getElementById(target);
  if(!t)return;
  if(target.startsWith('club-'))t.querySelector('details').open=true;
  const receipt=document.querySelector(`[data-channel="${channel}"] .return-path`);
  if(save){receipt.innerHTML=`<span>From ${esc(channels.find(c=>c.id===from).name)}</span><br><button type="button" data-return="${token}">Return to your previous place</button>`;}
  r.scrollTop+=t.getBoundingClientRect().top-r.getBoundingClientRect().top;
  t.tabIndex=-1;t.focus({preventScroll:true});
  updateProgress(channel);
  document.querySelector('#announcement').textContent=`Reading ${channels.find(c=>c.id===channel).name}. ${t.querySelector('h3,h4')?.textContent??'Related passage'}.`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.select)selectChannel(b.dataset.select,true);
  if(b.dataset.cross)jump(b.dataset.cross,b.dataset.target);
  if(b.hasAttribute('data-return')){
    const index=history.findIndex(h=>h.token===b.dataset.return);
    if(index<0){b.parentElement.innerHTML='';return;}
    const prev=history[index];history.splice(index);
    b.parentElement.innerHTML='';selectChannel(prev.from);reader(prev.from).scrollTop=prev.top;updateProgress(prev.from);
    if(prev.trigger?.isConnected)prev.trigger.focus({preventScroll:true});else reader(prev.from).focus({preventScroll:true});
  }
  if(b.dataset.archive!==undefined){
    archiveIndex=Number(b.dataset.archive);document.querySelector('#archive-reader').innerHTML=archiveStory();
    document.querySelectorAll('[data-archive]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.archive)===archiveIndex)));
    document.querySelector('#announcement').textContent=`Edition selected: ${data.archive[archiveIndex].title}`;
  }
  if(b.id==='clear-search'){document.querySelector('#search').value='';rosterDirectory();document.querySelector('#search').focus();}
});
document.querySelector('#search').addEventListener('input',rosterDirectory);
document.querySelector('#sort').addEventListener('change',rosterDirectory);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const menu=document.querySelector('.site-menu');
    if(menu.open){menu.open=false;menu.querySelector('summary').focus();}
  }
});
channels.forEach(c=>reader(c.id).addEventListener('scroll',()=>updateProgress(c.id),{passive:true}));
compact.addEventListener('change',()=>selectChannel(active));
selectChannel('team');
window.goatStudy={
  states:[{id:'default',label:'Four parallel channels'},{id:'league',label:'Saved slate, including returned 35% choice'},{id:'directory',label:'Searchable full clubhouse directory'},{id:'scouting',label:'Form and completed-week notebook'},{id:'culture',label:'Dated October editorial'},{id:'archive',label:'Historical final archive'},{id:'value',label:'Full member valuation / public current pair'}],
  activate(id){
    if(id==='default'){history.length=0;archiveIndex=0;document.querySelector('#archive-reader').innerHTML=archiveStory();document.querySelectorAll('[data-archive]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.archive==='0')));document.querySelector('#search').value='';document.querySelector('#sort').value='rank';rosterDirectory();document.querySelectorAll('.disclosure').forEach(d=>d.open=false);channels.forEach(c=>{positions[c.id]=0;reader(c.id).scrollTop=0;document.querySelector(`[data-channel="${c.id}"] .return-path`).innerHTML='';document.querySelector(`[data-select="${c.id}"] .position`).textContent='Start';});selectChannel('team');return;}
    if(id==='league')return jump('league','ai-slate',false);
    if(id==='directory')return jump('league','directory',false);
    if(id==='scouting')return jump('scouting','watch',false);
    if(id==='culture')return jump('culture','culture-start',false);
    if(id==='archive'){archiveIndex=1;document.querySelector('#archive-reader').innerHTML=archiveStory();document.querySelectorAll('[data-archive]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.archive==='1')));return jump('culture','archive-story',false);}
    if(id==='value'){if(personal){document.querySelector('.roster-values').closest('details').open=true;return jump('team','team-value',false);}return jump('team','current-pair',false);}
  }
};
document.body.dataset.studyReady='14';
