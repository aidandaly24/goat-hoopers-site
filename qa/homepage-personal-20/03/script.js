import { fixture } from '../fixture.js';

const params = new URLSearchParams(location.search);
const personaKey = Object.hasOwn(fixture.personas, params.get('persona')) ? params.get('persona') : 'reaves';
const person = fixture.personas[personaKey];
const member = person.kind === 'member';
const root = document.documentElement;
root.dataset.persona = personaKey;
if (params.get('stage') === 'structure') root.dataset.stage = 'structure';
document.querySelector('#persona').value = personaKey;
document.querySelector('#persona').addEventListener('change', (event) => {
  const url = new URL(location.href);
  url.searchParams.set('persona', event.target.value);
  url.hash = '';
  location.assign(url.href);
});
if (!member) document.querySelector('[data-member-nav]').remove();
document.querySelector('.brand').href = location.search || './';
document.querySelector('.primary-nav [aria-current]').href = location.search || './';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => new Intl.NumberFormat('en-US', {maximumFractionDigits:2}).format(value);
const team = id => fixture.teams.find(t => t.id === id);
function labelExternalLinks(container) {
  container.querySelectorAll('a[href^="https://goathoopers.com"]').forEach(link => {
    if (link.querySelector('.exit-icon')) return;
    link.setAttribute('aria-label', `${link.textContent.trim()} — current GOAT site; leaves prototype`);
    link.insertAdjacentHTML('beforeend','<svg class="exit-icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 10 10 2M3 2h7v7"/></svg>');
  });
}
const ordinal = value => `${value}${value % 100 > 10 && value % 100 < 14 ? 'th' : ({1:'st',2:'nd',3:'rd'}[value % 10] || 'th')}`;
const portrait = player => `<span class="portrait" aria-hidden="true">${player.portrait ? `<img src="${escape(player.portrait)}" alt="" width="36" height="36">` : escape(player.name.split(' ').map(w => w[0]).slice(0,2).join(''))}</span>`;
const playerButton = (player, prefix, photo = false) => `<button type="button" id="${prefix}-${player.id}" class="player-button" data-player="${player.id}" aria-expanded="false">${photo ? portrait(player) : ''}<span>${escape(player.name)}${photo ? `<small>${escape(player.position)} · Counted sample</small>` : ''}</span></button>`;

function pageHeading() {
  return `<div class="page-top"><div><p class="eyebrow">2026 season / Week 03 / ${member ? 'Your notebook' : 'Public league notebook'}</p><h1>${member ? escape(person.team.name) : 'The league, at a glance.'}</h1><p class="identity-sub">${member ? `${escape(person.team.manager)} <span aria-hidden="true">·</span> ${person.players.length} players in this demo roster` : 'GOAT Hoopers · Ten teams, one season to follow'}</p></div>${member ? `<dl class="identity-stats"><div><dt>Season record</dt><dd>${person.team.wins}–${person.team.losses}</dd></div><div><dt>League position</dt><dd>${ordinal(person.standing.rank)}<span>/ 10</span></dd></div></dl>` : `<p class="small muted">Synthetic snapshot<br><time datetime="2026-10-30T08:30:00Z">30 October · 08:30 UTC</time></p>`}</div>`;
}

function updates() {
  const item = person.changes[0];
  return `<div class="update-line"><p class="eyebrow">New to inspect</p><a href="#${item.target === 'players' ? 'players' : 'valuation'}">${escape(item.headline)} <span aria-hidden="true">→</span></a><time datetime="${item.at}">${item.at.slice(11,16)} UTC · demo</time></div>`;
}

function evidence() {
  const verified = person.players.filter(p => p.completedWeekPoints !== null);
  return `<section id="players" aria-labelledby="players-title"><div class="section-top"><div><p class="eyebrow">The player notebook</p><h2 id="players-title">${personaKey === 'reaves' ? 'Five performances to inspect.' : 'Start with what is counted.'}</h2></div><span class="tag">Completed Week 2</span></div><p class="section-intro">${personaKey === 'reaves' ? 'New player evidence is ready. Open a name to put the counted points beside its current modeled quote.' : 'Three players have counted evidence in this sample. Keep that small window separate from the missing matchup score.'}</p><table class="evidence-table"><caption>Synthetic October 19–25, 2026 · player points</caption><thead><tr><th scope="col">Player / position</th><th scope="col">Counted points</th></tr></thead><tbody>${verified.map(p => `<tr>${`<td>${playerButton(p,'evidence',true)}</td><td class="points">${number(p.completedWeekPoints)}</td>`}</tr>`).join('')}</tbody></table><div class="sample-note"><span class="data">${verified.length} / ${person.players.length}</span><p>roster players have counted evidence. The other ${person.players.length - verified.length} are unknown in this sample, not zero.</p></div></section>`;
}

function gaps() {
  const missing = person.players.filter(p => p.modeledFaab === null);
  return `<section class="gap-block" aria-labelledby="gaps-title"><p class="eyebrow">Coverage needs attention</p><h2 id="gaps-title">Six names without a quote.</h2><p>The $${number(person.valuation.modeledFaabSubtotal)} modeled FAAB subtotal covers 16 of 22 players. It cannot stand in for the whole roster or receive a team-value rank.</p><ul class="gap-list">${missing.map(p => `<li><button type="button" id="gap-${p.id}" data-gap="${p.id}" aria-expanded="false">${escape(p.name)} <span>${p.position}</span></button></li>`).join('')}</ul></section>`;
}

function matchup() {
  const ownScore = person.matchup.home === person.teamId ? person.matchup.homePoints : person.matchup.awayPoints;
  const otherScore = person.matchup.home === person.teamId ? person.matchup.awayPoints : person.matchup.homePoints;
  const scoreRow = (t,s,own) => `<div class="scoreline"><p class="team-name">${escape(t.name)}<span>${own ? 'Your team' : 'Opponent'} · ${t.wins}–${t.losses}</span></p><p class="score${s === null ? ' missing' : ''}">${s === null ? 'Score unavailable' : number(s)}</p></div>`;
  return `<aside aria-labelledby="matchup-title"><section class="companion" id="matchup"><div><p class="eyebrow">Beside the notebook</p><h2 id="matchup-title">This week’s pairing</h2>${scoreRow(person.team,ownScore,true)}${scoreRow(person.opponent,otherScore,false)}<p class="match-note">${ownScore === null ? '<strong>No leader can be determined.</strong> Papichooter’s recorded zero is a known value; your score has not been returned.' : `<strong>${escape(person.team.name)} leads by ${number(ownScore - otherScore)}.</strong> In-progress synthetic score; this is not a final result.`}</p><details class="local-detail"><summary>Inspect matchup context</summary><dl class="match-detail-list"><div><dt>Your season points</dt><dd>${number(person.team.pointsFor)}</dd></div><div><dt>Opponent’s season points</dt><dd>${number(person.opponent.pointsFor)}</dd></div></dl><p>Week 3 pairs ${escape(person.team.name)} with ${escape(person.opponent.name)}. Season points and the current matchup score describe different periods.</p><p class="small sans">Score snapshot: October 30, 2026 · 08:30 UTC. Synthetic data; no live clock.</p></details></div><section class="model-section" aria-labelledby="model-title"><p class="eyebrow">${person.savedAi.status === 'ready' ? 'Saved model context' : 'Model context'}</p><h3 id="model-title">${person.savedAi.status === 'ready' ? 'A slight lean, with low confidence.' : 'No saved estimate for this pairing.'}</h3>${person.savedAi.status === 'ready' ? `<div class="model-numbers"><span>Reaves 56%</span><span>Ware 44%</span></div><div class="model-bar" aria-hidden="true"><span></span></div><p>Returned choice: Reaves Dropper. Confidence: <span class="data">0.35</span>, separate from the probabilities.</p><p style="margin-top:.6rem">Synthetic saved model estimate, generated October 26 at 08:00 UTC. Not calibrated odds; no fresh run is performed.</p>` : '<p>No pick, probabilities or confidence are available. The notebook remains usable without an AI result.</p>'}</section></section><div class="side-note"><p>${personaKey === 'reaves' ? 'Your matchup tells you where you stand. The player notebook shows which evidence is actually available.' : 'A missing value is a reason to inspect the source, never a reason to fill in a zero.'}</p></div></aside>`;
}

function roster() {
  const v = person.valuation;
  const half = Math.ceil(person.players.length / 2);
  const table = (players, i) => `<table class="roster-table"><caption>Roster names ${i === 0 ? `1–${half}` : `${half+1}–${person.players.length}`}</caption><thead><tr><th scope="col">Player</th><th scope="col">Pos.</th><th scope="col">Modeled FAAB</th></tr></thead><tbody>${players.map(p => `<tr data-roster-name="${escape(p.name.toLowerCase())}"><td>${playerButton(p,'quote')}</td><td class="position">${escape(p.position)}</td><td class="${p.modeledFaab === null ? 'no-quote' : 'quote'}">${p.modeledFaab === null ? 'Unpriced' : `$${number(p.modeledFaab)}`}</td></tr>`).join('')}</tbody></table>`;
  return `<section class="ledger" id="valuation" aria-labelledby="roster-title"><div class="ledger-heading"><div><p class="eyebrow">Your full roster / Quote inspection</p><h2 id="roster-title">${v.complete ? 'Every name has a quote.' : 'Keep the gaps in the picture.'}</h2><p>${v.complete ? 'All 24 player quotes are included. Inspect any player’s modeled value and counted evidence together, without leaving this page.' : 'Browse all 22 players, including the six who remain unpriced. Missing prices stay visible; they are excluded from the available subtotal.'}</p></div><div class="quote-total"><p class="eyebrow">${v.complete ? 'Complete modeled roster total' : 'Available modeled subtotal'}</p><p class="data">$${number(v.modeledFaabSubtotal)}</p><p>Modeled FAAB · ${v.priced}/${v.roster} players quoted${v.complete ? ' · Full roster coverage' : ' · No complete value rank'}</p><div class="coverage-track" aria-hidden="true"><span style="width:${100*v.priced/v.roster}%"></span></div><p>This is a model quote, not a cash balance. League value rank is unavailable: not every team has a complete comparable quote.</p></div></div><div class="ledger-tools"><label for="roster-search">Find a roster player <input id="roster-search" type="search" autocomplete="off" placeholder="Search by name"></label><p id="roster-count" aria-live="polite">${person.players.length} players · open a name to inspect</p></div><div class="ledger-tables">${table(person.players.slice(0,half),0)}${table(person.players.slice(half),1)}</div><p id="empty-search" class="empty-search" hidden>No matching player in this demo roster. Try a shorter name.</p><div class="roster-foot"><p>Quotes checked October 30, 2026 · 08:10 UTC. Synthetic modeled values. No availability, injury or lineup status is inferred from the price or sample.</p><p>No recorded team-value history is included, so no trend is drawn. Lineup Power is unavailable because this fixture has no producer snapshot.</p></div></section>`;
}

function standings() {
  return `<table class="standings-table"><caption>Synthetic 2026 standings · after two completed weeks</caption><thead><tr><th scope="col">Pos.</th><th scope="col">Team</th><th scope="col">W–L</th><th scope="col">Points for</th></tr></thead><tbody>${fixture.standings.map(t=>`<tr class="${member && t.id === person.teamId ? 'is-viewer' : ''}"><td>${String(t.rank).padStart(2,'0')}</td><td><button type="button" class="team-button" id="standing-${t.id}" data-team="${t.id}" aria-expanded="false">${escape(t.name)}</button>${member && t.id === person.teamId ? '<span class="you">Your team</span>' : ''}</td><td>${t.wins}–${t.losses}</td><td>${number(t.pointsFor)}</td></tr>`).join('')}</tbody></table>`;
}

function league() {
  return `<section class="league-section" id="league" aria-labelledby="league-title"><p class="eyebrow">The wider picture</p><h2 id="league-title" style="margin-top:.4rem">A place in a ten-team league.</h2><p class="league-intro">${member ? `${escape(person.team.name)} is ${ordinal(person.standing.rank)} after two completed weeks. Open any team for its season and historical context.` : 'Three teams are 2–0. Open a team name to inspect the record behind its place.'}</p><div class="league-layout"><div>${standings()}</div><aside class="league-aside"><p class="eyebrow">Season context</p><h3>Six playoff places.<br>Plenty of season left.</h3><p>Ten teams are playing toward a six-team playoff field beginning in Week 20. These Week 3 positions describe the demo today, not a playoff projection.</p><p class="small">Historical reference · 2025 final</p><p>${escape(team(fixture.historicalFinal.winner).name)} beat ${escape(team(fixture.historicalFinal.runnerUp).name)}, <span class="data">326–251.5</span>.</p><a class="text-link" href="https://goathoopers.com/history">Explore league history</a><p class="small">Leaves this prototype for the current site.</p></aside></div></section>`;
}

function guest() {
  return `<div class="guest-grid"><section id="matchup" aria-labelledby="public-match-title"><p class="eyebrow">Week 03 pairings</p><h2 id="public-match-title" style="margin-top:.4rem">Five games to follow.</h2><p class="guest-intro">A public look at the synthetic week. Open a pairing for its score context. A missing score remains unknown.</p><ul class="pair-list">${fixture.matchups.map(m => `<li><details><summary>${[[m.home,m.homePoints],[m.away,m.awayPoints]].map(([id,score])=>`<div class="pair-row"><span class="team-name">${escape(team(id).name)}</span><span class="${score === null ? 'missing-small' : 'data'}">${score === null ? 'No score' : number(score)}</span></div>`).join('')}<span class="pair-detail-hint">${m.state === 'partly_unavailable' ? 'Partial score coverage' : 'In-progress sample'} · Inspect context +</span></summary><p>${m.state === 'partly_unavailable' ? 'Papichooter has a recorded zero. NeuralNets has no returned score. These are different states; no leader can be inferred.' : 'Both scores are present in this in-progress synthetic sample. They are not a final result.'}</p><p>Snapshot: October 30 at 08:30 UTC. No live score connection.</p></details></li>`).join('')}</ul></section><aside><section class="guest-entry"><p class="eyebrow">You’re browsing the public edition</p><h2>Your own team has<br>its own notebook.</h2><p>Sign in on GOAT to reach your actual team. This public demo does not identify you or claim a private roster.</p><a class="button" href="https://goathoopers.com/login">Sign in on GOAT</a><p class="small sans">Opens the current GOAT site.</p></section><dl class="league-facts"><div><dt>League teams</dt><dd>10</dd></div><div><dt>Playoff places</dt><dd>6</dd></div><div><dt>Season</dt><dd>2026</dd></div><div><dt>Playoffs begin</dt><dd>Week 20</dd></div></dl><div class="guest-news"><p class="eyebrow">What this page can show</p><p>Public pairings, standings and franchise history are available below. Real league stories, transactions and tools are reachable in Explore GOAT.</p><a class="text-link" href="#league">Read the league table ↓</a></div></aside></div>`;
}

function directory() {
  return `<section class="directory" aria-labelledby="directory-title"><p class="eyebrow">The people in the league</p><h2 id="directory-title" style="margin-top:.4rem">Ten teams. Meet the field.</h2><div class="directory-list">${fixture.teams.map(t => `<details class="directory-item"><summary>${escape(t.name)}<small>${escape(t.manager)}${t.previousSeason.finish === 1 ? ' · 2025 champion' : ''}</small></summary><p>2026 demo record: ${t.wins}–${t.losses}. Season points: ${number(t.pointsFor)}.</p><p>Historical 2025: ${t.previousSeason.wins}–${t.previousSeason.losses}, ${ordinal(t.previousSeason.finish)} finish. ${escape(t.previousSeason.ownerNote || '')}</p><a href="https://goathoopers.com/teams/${t.id}">Public team profile on current GOAT site</a></details>`).join('')}</div></section>`;
}

document.querySelector('#main').innerHTML = pageHeading() + (member ? `${updates()}<div class="notebook-grid"><div>${personaKey === 'neural' ? gaps() : ''}${evidence()}</div>${matchup()}</div>${roster()}${league()}` : `${guest()}${league()}${directory()}`);
labelExternalLinks(document);
document.title = `${member ? person.team.name : 'The league'} · GOAT Hoopers notebook`;

let openInspection = null;
function closeInspection(returnFocus = true) {
  if (!openInspection) return;
  const previous = openInspection;
  previous.detail.remove();
  previous.trigger.setAttribute('aria-expanded','false');
  previous.trigger.removeAttribute('aria-controls');
  openInspection = null;
  if (returnFocus) previous.trigger.focus({preventScroll:true});
}
function playerContent(player) {
  return `<p><strong>${escape(player.name)}</strong> · ${escape(player.position)}</p><dl><div><dt>Modeled FAAB quote</dt><dd>${player.modeledFaab === null ? 'Unavailable' : `$${number(player.modeledFaab)}`}</dd></div><div><dt>Completed Week 2 points</dt><dd>${player.completedWeekPoints === null ? 'No counted evidence' : number(player.completedWeekPoints)}</dd></div></dl><p class="detail-note">${player.completedWeekPoints === null ? 'Missing sample evidence does not mean zero points or a DNP. ' : 'Counted points refer only to the synthetic October 19–25 sample. '} ${player.modeledFaab === null ? 'This player is excluded from the available quote subtotal.' : 'Quote checked October 30 at 08:10 UTC. Modeled FAAB is not cash.'}</p>`;
}
function inspectRow(trigger, type) {
  if (openInspection?.trigger === trigger) { closeInspection(); return; }
  closeInspection(false);
  const row = trigger.closest('tr');
  const detail = document.createElement('tr');
  detail.className = 'inline-detail';
  detail.id = `inspection-${trigger.id}`;
  let content;
  if (type === 'player') content = playerContent(person.players.find(p=>p.id === trigger.dataset.player));
  else {
    const t = team(trigger.dataset.team);
    content = `<p><strong>${escape(t.name)}</strong> · ${escape(t.manager)}</p><dl><div><dt>2026 demo record</dt><dd>${t.wins}–${t.losses}</dd></div><div><dt>2026 season points</dt><dd>${number(t.pointsFor)}</dd></div></dl><p class="detail-note">Historical 2025: ${t.previousSeason.wins}–${t.previousSeason.losses}, ${ordinal(t.previousSeason.finish)} finish. ${escape(t.previousSeason.ownerNote || '')}</p><p class="detail-note"><a href="https://goathoopers.com/teams/${t.id}">Team profile on current GOAT site</a></p>`;
  }
  detail.innerHTML = `<td colspan="${row.cells.length}"><div class="inline-detail-inner"><div>${content}</div><button type="button" data-close-inspection>Close ×</button></div></td>`;
  row.after(detail);
  labelExternalLinks(detail);
  openInspection = {trigger,detail};
  trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls',detail.id);
  detail.querySelector('[data-close-inspection]').focus({preventScroll:true});
}
document.querySelector('#main').addEventListener('click',event=>{
  const player = event.target.closest('[data-player]');
  const teamTrigger = event.target.closest('[data-team]');
  const gap = event.target.closest('[data-gap]');
  if (player) inspectRow(player,'player');
  if (teamTrigger) inspectRow(teamTrigger,'team');
  if (event.target.closest('[data-close-inspection]')) closeInspection();
  if (gap) {
    if (openInspection?.trigger === gap) {closeInspection();return;}
    closeInspection(false);
    const p = person.players.find(p=>p.id===gap.dataset.gap);
    const detail = document.createElement('div');detail.className='gap-inspect';detail.id=`inspection-${gap.id}`;
    detail.innerHTML = `<p>No modeled FAAB quote is available for ${escape(p.name)}. Counted Week 2 evidence is also unavailable. Neither missing value is zero.</p><button type="button" data-close-inspection>Close inspection ×</button>`;
    gap.after(detail);gap.setAttribute('aria-expanded','true');gap.setAttribute('aria-controls',detail.id);openInspection={trigger:gap,detail};detail.querySelector('button').focus({preventScroll:true});
  }
});
document.addEventListener('keydown',event=>{if(event.key === 'Escape' && !document.querySelector('#sources').open) closeInspection();});
document.querySelector('#roster-search')?.addEventListener('input',event=>{
  closeInspection(false);
  const term = event.target.value.toLocaleLowerCase().trim();let count=0;
  document.querySelectorAll('[data-roster-name]').forEach(row=>{row.hidden=!row.dataset.rosterName.includes(term);if(!row.hidden)count++;});
  document.querySelector('#roster-count').textContent=`${count} of ${person.players.length} players shown`;
  document.querySelector('#empty-search').hidden=count>0;
});
const sourceDialog=document.querySelector('#sources');
document.querySelector('#source-trigger').addEventListener('click',()=>sourceDialog.showModal());
document.querySelector('#source-close').addEventListener('click',()=>sourceDialog.close());
sourceDialog.addEventListener('click',event=>{if(event.target===sourceDialog){const r=sourceDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sourceDialog.close();}});
sourceDialog.addEventListener('close',()=>document.querySelector('#source-trigger').focus({preventScroll:true}));

await document.fonts.ready;
await Promise.all([...document.images].map(img=>img.complete ? Promise.resolve() : new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
root.dataset.personalStudyReady='03';
