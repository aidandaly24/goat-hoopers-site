import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// Local static homepage. All source facts enter through the supplied fixture.
const personal = data.personal.kind === 'member' ? data.personal.summary : null;
const directory = data.home.directory;
const teams = new Map(directory.map(d => [d.identity.id, d.identity]));
const teamName = id => teams.get(String(id))?.name ?? 'Unknown team';
const date = value => new Date(value).toLocaleString('en-GB', {timeZone:'UTC', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) + ' UTC';
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamLink = (id, name = teamName(id)) => `<a href="/teams/${esc(id)}">${esc(name)}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const cross = (channel, target, label) => `<button class="cross" type="button" data-cross="${channel}" data-target="${target}">${esc(label)}</button>`;
const details = (label, body) => `<details class="disclosure"><summary>${label}</summary>${body}</details>`;
const score = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : 'Pending';
// Missing or mismatched saved data remains unavailable, never a substitute pick.
const validPick = (result, pair) => {
  const ids = [pair.home.id, pair.away.id];
  return result && ids.includes(result.choice) && Number.isFinite(result.confidence)
    && result.confidence >= 0 && result.confidence <= 1
    && result.probabilities?.length === 2
    && new Set(result.probabilities.map(p => p.choice)).size === 2
    && result.probabilities.every(p => ids.includes(p.choice) && Number.isFinite(p.probability) && p.probability >= 0 && p.probability <= 1);
};
const channels = [
  {id:'team', name:personal ? 'Your team' : 'The week', subtitle:personal ? 'Start with your own next decision.' : 'Get your bearings in the league.'},
  {id:'league', name:'League action', subtitle:'The whole slate, then the people.'},
  {id:'scouting', name:'Scouting', subtitle:'Form, value and opinion have different jobs.'},
  {id:'culture', name:'Culture', subtitle:'The archive has a different clock.'}
];
document.querySelector('#channels').innerHTML = channels.map(c => `<section class="channel ${c.id}" id="dispatch-${c.id}" data-channel="${c.id}" aria-labelledby="heading-${c.id}"><header class="channel-heading"><h2 id="heading-${c.id}">${c.name}</h2><p>${c.subtitle}</p></header><div id="content-${c.id}"></div></section>`).join('');
document.querySelector('.channel-index').innerHTML = channels.map(c => `<a href="#dispatch-${c.id}">${c.name}</a>`).join('');

function currentPair(pair) {
  if (!pair) return '<p class="empty">Current pairing unavailable.</p>';
  return `<span class="eyebrow">2026 · Week ${esc(pair.week)} · Current score</span>${[['home','homePoints'],['away','awayPoints']].map(([side,key],i) => `${i ? '<p class="versus">versus</p>' : ''}<div class="pair-side"><div>${teamLink(pair[side].id,pair[side].name)}<small>${esc(pair[side].managerName)} · ${record(pair[side])}</small></div><span class="score">${score(pair[key])}</span></div>`).join('')}<p class="incomplete">Incomplete · score data pending</p><p class="source">0.0 is a known zero. Pending is unknown.</p>`;
}

function teamContent() {
  const pair = personal?.matchup ?? directory[0].currentMatchup;
  if (!personal) return `<section class="passage" id="team-start"><span class="eyebrow">Public edition</span><h1 class="hero-name">Follow the week.</h1><p>Ten friends’ teams, five pairings and four connected dispatches. Read what is happening now beside the stories the league keeps.</p><div class="actions"><a class="action" href="/teams">Meet the teams</a></div></section><section class="passage" id="current-pair">${currentPair(pair)}${cross('league','ai-0','Read this pairing’s saved choice')}</section><section class="passage" id="public-guide"><h3>Find your way in.</h3><p>The league ledger connects each team to its manager, current record and full roster. It keeps the 2025 record in its own season.</p>${cross('league','directory','Meet all ten teams')}<p>Scouting keeps the three October takes beside their NBA and college samples. They are dated opinions, not current fantasy awards.</p>${cross('scouting','editorial-picks','Read the three dated takes')}</section><section class="passage"><h3>Work the next decision.</h3><p>Use modeled FAAB values as a reference, then inspect the actual player. A modeled price is not a sale or a balance.</p><div class="actions"><a href="/stocks#player-board">Player stock board</a><a href="/trade-analyzer">Trade analyzer</a></div></section><section class="passage"><h3>Keep the story straight.</h3><p>The November fixture’s unfinished Week 3 pairing is separate from October’s opening-week draft and the verified 2025 final.</p>${cross('culture','archive-2026-W40','Read the inaugural final')}</section>`;
  const s = personal;
  return `<section class="passage" id="team-start"><span class="eyebrow">Member edition</span><h1 class="hero-name">${esc(s.team.name)}</h1><span class="manager">${esc(s.team.managerName)}</span><p class="record-line">${record(s.team)} · Standing ${s.standing.rank}/${s.season.totalTeams}<br>${s.coverage.roster} rostered</p><div class="actions"><a class="action" href="/team">My team</a><a href="/teams/${esc(s.team.id)}#team-roster">Full roster</a></div></section><section class="passage" id="current-pair">${currentPair(pair)}${cross('league','ai-0','Why the saved model picked the opponent')}</section><section class="passage" id="team-value"><h3>Your roster value</h3><p class="number">${money(s.valuation.total)}</p><p>Modeled FAAB ${s.valuation.complete ? 'total' : 'subtotal'} · ${esc(s.market.pricingBasis)} basis</p><p class="source">${s.coverage.priced}/${s.coverage.roster} priced · ${s.valuation.unpriced} unpriced<br>Computed ${date(s.market.updatedAt)}</p><ol>${s.players.map(p => `<li class="price-row">${playerLink(p.id,p.name)}<span>${money(p.value)}</span><small>${esc(p.position)} · Up ${esc(p.changePct)}% modeled price change</small></li>`).join('')}</ol>${details(`All ${s.rosterValues.length} modeled values`, `<ul class="roster-values">${s.rosterValues.map(p => `<li class="price-row">${playerLink(p.id,p.name)}<span>${money(p.value)}</span></li>`).join('')}</ul><p class="source">Checked ${date(s.checkedAt)}. Modeled value is not a FAAB balance or sale.</p>`)}${cross('scouting','watch','Read form separately from price')}<p class="source">${esc(inventory.missing.history)}</p><a class="text-link" href="/history">League history</a></section><section class="passage" id="team-wire"><h3>Your team wire</h3><ul class="plain-list">${s.news.map(n => `<li><a href="${esc(n.url)}">${esc(n.headline)}</a><p class="source">${esc(n.outlet.name)} · ${date(n.publishedAt)} · synthetic</p></li>`).join('')}</ul>${s.moves.map(m => `<p>${esc(m.summary)}</p><p class="source">Week ${m.week} · ${date(m.createdAt)} · synthetic; player legs not supplied.</p>`).join('')}${cross('league','moves','Follow the rest of the league’s moves')}</section>`;
}

function modelSlate() {
  const pairs = [...new Map(directory.map(d => [d.currentMatchup.home.id, d.currentMatchup])).values()];
  const slate = data.weekly;
  return pairs.map((pair,i) => {
    const pick = slate?.matchups.find(m => m.teamIds.includes(pair.home.id) && m.teamIds.includes(pair.away.id));
    const r = validPick(pick?.result, pair) ? pick.result : null;
    const status = !r ? 'Saved pick unavailable' : slate.status === 'stale' ? 'Stale saved pick' : 'Saved pick';
    return `<article class="ai-pair" id="ai-${i}"><h4>${teamLink(pair.home.id)} <span class="muted">/</span> ${teamLink(pair.away.id)}</h4><p class="pair-current">${score(pair.homePoints)} / ${score(pair.awayPoints)} <span>· Incomplete</span></p><p class="eyebrow">${status}</p>${r ? `<p class="picked">Returned choice: ${esc(teamName(r.choice))}</p><p class="prob-copy">${r.probabilities.map(p => `${esc(teamName(p.choice))} <strong>${Math.round(p.probability*100)}%</strong>`).join('<br>')}</p><p class="source">Independent confidence ${Math.round(r.confidence*100)}%</p>${details('Model receipt',`<dl><dt>Saved</dt><dd>${date(slate.generatedAt)}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot || slate.snapshot ? esc(JSON.stringify(r.snapshot ?? slate.snapshot)) : 'Unavailable; fixture carries no input snapshot.'}</dd><dt>Evidence</dt><dd>${[...pick.evidence,...r.evidence].map(esc).join('<br>') || 'None supplied.'}</dd><dt>Meaning</dt><dd>${esc(r.probabilityLabel)}. Returned choice is preserved independently of the larger probability. Season ${esc(slate.season)}, Week ${slate.week}. ${status}; no generation on render.</dd></dl>`)}` : '<p>No saved probabilities or choice. No prediction inferred.</p>'}${i===0 ? cross('team','current-pair','Return to the current pairing context') : ''}</article>`;
  }).join('');
}

function leagueContent() {
  return `<section class="passage" id="ai-slate"><h3>Week 3, across the league</h3><p class="source">2026 current scores are incomplete. ${data.weekly ? `${data.weekly.status === 'stale' ? 'Stale slate. ' : ''}Saved ${date(data.weekly.generatedAt)}.` : 'Saved slate unavailable.'} Synthetic model estimates, not sports odds.</p>${modelSlate()}<a class="text-link" href="/ai-decides">Open AI Decides</a></section><section class="passage" id="directory"><h3>The ten-team ledger</h3><p class="source">2026 current record / fantasy points for. Standing order is supplied by the fixture. Full roster lives on each team page.</p><ol class="club-ledger">${data.home.hub.standings.map(s => {
    const d = directory.find(d => d.identity.id === s.team.id);
    return `<li class="club-line" id="club-${s.team.id}"><span class="standing-rank">${s.rank}</span><div><h4>${teamLink(s.team.id)}</h4><p>${esc(s.team.managerName)}</p><p><strong>${record(s)}</strong> · ${(s.pointsFor/100).toFixed(1)} PF · ${d.players.length} rostered</p><p class="source">${d.previousSeason?.finish===1 ? '2025 champion · ' : ''}${d.previousSeason ? `2025: ${d.previousSeason.wins}–${d.previousSeason.losses}, finish ${d.previousSeason.finish}. ${esc(d.previousSeason.ownerNote ?? '')}` : '2025 record unavailable.'}</p><a class="roster-route" href="/teams/${s.team.id}#team-roster">Full roster</a></div></li>`;
  }).join('')}</ol><a class="text-link" href="/teams">All team profiles</a></section><section class="passage" id="moves"><h3>On the wire</h3>${data.home.hub.transactions.map(m => `<div class="move"><p>${esc(m.summary)}</p><p class="source">Week ${m.week} · ${date(m.createdAt)} · ${esc(m.type)} · synthetic</p></div>`).join('')}<p class="source">Player legs are not supplied; no add/drop names are inferred.</p><a class="text-link" href="/transactions">All transactions</a></section><section class="passage"><h3>Still unconnected</h3><p class="source">League leaders unavailable. No streak, activity or margin leader is inferred.</p>${cross('scouting','power','Check Lineup Power coverage')}</section>`;
}

function scoutingContent() {
  const g = personal?.playerGuide;
  const form = g ? `<section class="passage" id="watch"><h3>${esc(g.watch.label)}</h3><p class="source">2026 · current Week ${g.currentWeek} · synthetic EMA fantasy points per game</p><ul class="watch-list">${g.watch.rows.map(p => `<li>${playerLink(p.id,p.name)}<strong>${p.value.toFixed(1)}</strong><small>${p.games} observed games · availability unknown</small></li>`).join('')}</ul><p class="source">${esc(g.watch.message)} Form is separate from modeled FAAB value.</p>${cross('team','team-value','Compare your roster’s modeled value')}</section><section class="passage" id="recap"><h3>The completed week</h3><p class="source">${esc(g.period)} · synthetic recorded performers</p>${['best','rough'].map(k => `<h4>${k==='best' ? 'Best totals' : 'Rough totals'}</h4><ul class="watch-list">${g[k].map(p => `<li>${playerLink(p.id,p.name)}<strong>${p.value.toFixed(1)} pts</strong><small>${p.games} GP · ${esc(p.note)}</small></li>`).join('')}</ul>`).join('')}<p class="source">${esc(g.recapMessage)} ${esc(g.coverage)}</p></section>` : `<section class="passage" id="watch"><h3>Read the sample.</h3><p>These three takes belong to the October 5–11 draft. The NBA averages and college season are named beside each player.</p><p class="source">Dated editorial is separate from the current synthetic Week 3 slate.</p></section>`;
  return `${form}<section class="passage" id="editorial-picks"><h3>Three dated takes</h3><p class="source">Oct 5–11, 2026 · unpublished draft</p>${data.archive[0].playerSpotlights.map(p => `<article class="story" id="story-${p.playerId}"><header class="story-byline">${inventory.portraits[p.playerId] ? `<img class="portrait" src="${esc(inventory.portraits[p.playerId])}" alt="">` : ''}<div><strong>${playerLink(p.playerId,p.name)}</strong><p class="source">${esc(p.position)} · ${esc(p.periodLabel)}</p></div></header><h4>${esc(p.headline)}</h4><p class="quote">${esc(p.opinion)}</p><div class="statline">${p.stats.map(s => `<span><strong>${esc(s.value)}</strong>${esc(s.label)}</span>`).join('')}</div><p class="source">${esc(p.statPeriod)} · source checked ${esc(p.source.checkedAt)}</p>${details('Why this pick / source',`<p>${esc(p.selectionReason)}</p><a class="text-link" href="${esc(p.source.url)}">${esc(p.source.label)}</a>`)}${cross('league',`club-${p.teamId}`,`Find ${teamName(p.teamId)} in the ledger`)}</article>`).join('')}</section><section class="passage" id="power"><h3>Lineup Power</h3><p class="source">${esc(inventory.missing.power)}</p><a class="text-link" href="/intel">League Intel</a></section>`;
}

function cultureContent() {
  return `<section class="passage culture-intro"><h3 class="culture-title">The league has a memory.</h3><p>Two dated drafts, openly on the page. They are separate from November’s current scores.</p>${cross('league','ai-slate','Read the current week')}</section>${data.archive.map(a => {
    const game = a.game;
    return `<article class="passage archive-story" id="archive-${esc(a.id)}"><span class="eyebrow">${esc(a.dateLabel)} · ${esc(a.status)}<br>Unpublished sample</span><h3 class="culture-title">${esc(game.title)}</h3><p class="source">${esc(game.note)} · ${esc(game.state)}</p>${game.scores ? `<p class="archive-score">${game.scores.map(s => Number(s).toFixed(1)).join(' / ')}</p>` : '<p class="archive-state">Upcoming in this dated draft</p>'}<p>${game.teamIds.map(id => teamLink(id)).join(' / ')}</p><p>${esc(game.context)}</p>${details('Editorial reason',`<p>${esc(game.selectionReason)}</p>`)}<a class="text-link" href="/weekly/${esc(a.id)}">Read ${esc(a.id)}</a>${a.id==='2026-W41' ? cross('scouting','editorial-picks','Read this edition’s three takes') : cross('league','club-8','Find the franchise that changed hands')}<h4>Happenings</h4><ul class="plain-list">${a.happenings.map(h => `<li><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p><p class="source">${esc(h.dateLabel)} · dated archive</p></li>`).join('')}</ul>${details('Edition sources',`<ul class="source-list">${a.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a><p class="source">Checked ${esc(s.checkedAt)}</p></li>`).join('')}</ul>`)}</article>`;
  }).join('')}<section class="passage" id="play"><h3 class="culture-title">Take a shot.</h3><a class="game-preview" href="/arcade/free-throw"><img src="${esc(inventory.assets.game)}" alt="Free-throw practice preview" loading="lazy"><span>Play free throw</span></a><p class="source">Existing practice game. No league result or reward is implied.</p><a class="text-link" href="/arcade">All Arcade</a></section>`;
}

for (const [id, render] of Object.entries({team:teamContent,league:leagueContent,scouting:scoutingContent,culture:cultureContent})) document.querySelector(`#content-${id}`).innerHTML=render();
const editionSwitch = document.querySelector('#edition-switch');
editionSwitch.textContent = personal ? 'Public edition' : 'Member edition';
editionSwitch.href = `?view=${personal ? 'public' : 'member'}${aiState==='ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;
document.querySelector('#full-provenance').textContent=inventory.warning;
const homeHref=`./index.html?view=${mode}${aiState==='ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;
document.querySelector('.identity').href=homeHref;
document.querySelector('.primary [aria-current]').href=homeHref;
const routeToggle=document.querySelector('#route-toggle');
const routeList=document.querySelector('#route-list');
routeToggle.addEventListener('click',()=>{const open=routeToggle.getAttribute('aria-expanded')==='true';routeToggle.setAttribute('aria-expanded',String(!open));routeList.hidden=open;});

// A relationship moves through the document, retaining actual departure scroll/focus.
// No independent readers, no channel visibility state, no delayed content.
let returnState=null;
let wash=null;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const cancelWash=()=>wash?.cancel();
reduced.addEventListener('change',cancelWash);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelWash();});
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-cross]');
  if(trigger){
    const target=document.getElementById(trigger.dataset.target);
    if(!target)return;
    cancelWash();
    document.querySelector('.return-path')?.remove();
    returnState={trigger,top:scrollY};
    const from=channels.find(c=>c.id===trigger.closest('[data-channel]').dataset.channel);
    const receipt=document.createElement('div');
    receipt.className='return-path';
    receipt.innerHTML=`<span>From ${esc(from.name)}</span><button type="button" data-return>Return to your previous place</button>`;
    target.prepend(receipt);
    target.tabIndex=-1;
    target.scrollIntoView({block:'start',behavior:'instant'});
    target.focus({preventScroll:true});
    document.querySelector('#announcement').textContent=`Related passage in ${channels.find(c=>c.id===trigger.dataset.cross)?.name ?? 'the dispatch'}. Return control available.`;
    if(event.detail>0&&!reduced.matches){const s=getComputedStyle(target);wash=target.animate([{backgroundColor:s.getPropertyValue('--arrival-wash').trim()},{backgroundColor:s.getPropertyValue('--arrival-rest').trim()}],{duration:parseFloat(s.getPropertyValue('--arrival-duration')),easing:s.getPropertyValue('--arrival-ease').trim()});}
  }
  if(event.target.closest('[data-return]')&&returnState){
    cancelWash();
    const saved=returnState;returnState=null;
    document.querySelector('.return-path')?.remove();
    scrollTo({top:saved.top,behavior:'instant'});
    if(saved.trigger.isConnected)saved.trigger.focus({preventScroll:true});
    document.querySelector('#announcement').textContent='Returned to your previous place.';
  }
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(!routeList.hidden){routeList.hidden=true;routeToggle.setAttribute('aria-expanded','false');routeToggle.focus();}
  else {const provenance=document.querySelector('.concept-provenance');if(provenance.open){provenance.open=false;provenance.querySelector('summary').focus();}}
});
document.fonts.ready.then(()=>{document.documentElement.dataset.homepageReady='14';});
