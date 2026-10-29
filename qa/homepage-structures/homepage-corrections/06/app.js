import {inventory, data, mode, aiState, esc, money} from '../../data.js';

// User question: what has happened, and what should I inspect next?
// Primary action: inspect the current pairing; team/player lookup stays inline.
// States: member/public, ready/stale/missing AI, current/dated draft, 0/Pending.
// Phone: source dates become left-spine markers, then one continuous reading feed.
// No replacement reader, fixed panel, generated result or auto-refresh.
const $ = selector => document.querySelector(selector);
const home = data.home;
const personal = mode === 'member' ? data.personal.summary : null;
const teams = home.hub.teams;
const byId = new Map(teams.map(t => [t.id, t]));
const directories = home.directory;
const uniquePlayers = new Set(directories.flatMap(t => t.players.map(p => p.id))).size;
const pairs = directories.map(t => t.currentMatchup).filter((p, i, all) => p && all.findIndex(o => o.home.id === p.home.id && o.away.id === p.away.id) === i);
const ranks = new Map(home.hub.standings.map(s => [s.team.id, s]));
const teamName = id => byId.get(String(id))?.name ?? `Roster ${id}`;
const teamLink = id => `<a href="/teams/${esc(id)}">${esc(teamName(id))}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const portrait = (id, name, extra = '') => inventory.portraits[id] ? `<img class="portrait ${extra}" src="${esc(inventory.portraits[id])}" alt="${esc(name)}" loading="lazy" width="80" height="80">` : '';
const record = team => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ''}`;
const percent = value => `${Math.round(value * 100)}%`;
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const date = (value, time = false) => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', ...(time ? {hour:'2-digit', minute:'2-digit', timeZoneName:'short'} : {}), timeZone:'UTC'}).format(new Date(value));
let scope = 'all';
let period = 'all';
let query = '';
let sort = 'rank';
let selectedPair = personal ? pairs.findIndex(p => [p.home.id, p.away.id].includes(personal.team.id)) : 0;
if (selectedPair < 0) selectedPair = 0;
let returnPoint = null;

function entry({id, day, month, label, source = 'nov12', types = 'league', body}) {
  return {id, source, types:types.split(' '), html:`<section class="entry entry-${id}" id="entry-${id}" aria-labelledby="heading-${id}"><div class="stamp"><strong>${esc(day)}</strong><span>${esc(month)}</span></div><div class="entry-content"><p class="eyebrow">${esc(label)}</p>${body}</div></section>`};
}

function pickFor(pair) { return data.weekly?.matchups.find(row => row.teamIds.includes(pair.home.id) && row.teamIds.includes(pair.away.id)); }
function selectedMatchup() {
  const pair = pairs[selectedPair];
  const pick = pickFor(pair);
  const result = pick?.result;
  return `<div class="featured-pair">${[['home',pair.homePoints],['away',pair.awayPoints]].map(([key,points]) => {
    const team = pair[key];
    const face = data.faces.find(f => f.team.id === team.id);
    return `<div class="score-team">${portrait(face.player.id,face.player.name,'pair-portrait')}<div><h3>${teamLink(team.id)}</h3><p>${esc(team.managerName)} · ${record(team)}</p><p class="current-score">${score(points)} <span>${points == null ? 'score not received' : 'known points'}</span></p></div></div>`;
  }).join('')}</div><p class="status-note">Incomplete. Known 0.0 is a score; Pending means no score was supplied.</p><div class="saved-preview">${result ? `<p>${aiState === 'stale' ? '<strong>Stale saved pick.</strong> ' : 'Saved model choice: '}<strong>${teamLink(result.choice)}</strong> · ${percent(result.probabilities.find(p => p.choice === result.choice)?.probability ?? 0)} model probability. Independent confidence ${percent(result.confidence)}.</p><a href="#entry-ai">Read the Nov 10 saved slate</a>` : '<p>Saved AI unavailable. No choice or probability is inferred.</p><a href="/ai-decides">Open AI Decides</a>'}</div>`;
}

function currentHTML() {
  return `<div class="current-heading"><h2 id="heading-current">Week 3, still in play.</h2><label>Inspect a pairing<select id="pairing">${pairs.map((pair,i) => `<option value="${i}" ${i === selectedPair ? 'selected' : ''}>${esc(pair.home.name)} / ${esc(pair.away.name)}</option>`).join('')}</select></label></div><div class="lead-layout"><div id="selected-matchup">${selectedMatchup()}</div><aside class="team-desk">${personal ? `<p class="eyebrow">Your desk</p><h3>${teamLink(personal.team.id)}</h3><p>${esc(personal.team.managerName)} · ${record(personal.team)}<br>Standing ${personal.standing.rank} of ${teams.length}<br>${personal.coverage.roster} roster players</p><div class="actions"><a href="/team">My team</a><a href="/teams/${esc(personal.team.id)}#team-roster">View roster</a></div>` : `<p class="eyebrow">The league desk</p><h3>Ten teams to follow.</h3><p>${home.hub.season.seasonYear} season · ${teams.length} teams<br>${home.hub.season.playoffTeams} playoff places · playoffs start Week ${home.hub.season.playoffWeekStart}</p><div class="actions"><a href="/teams">Team profiles</a><a href="/login">Sign in</a></div>`}<p class="small">Snapshot checked ${date(home.checkedAt,true)}. Current records and scores are synthetic.</p></aside></div><h3 class="subhead">Around the matchups</h3><ul class="pairing-list">${pairs.map(pair => `<li><div>${teamLink(pair.home.id)} <span class="num">${score(pair.homePoints)}</span></div><div>${teamLink(pair.away.id)} <span class="num">${score(pair.awayPoints)}</span></div><span class="small">Week ${pair.week} · incomplete</span></li>`).join('')}</ul>`;
}

function registerResults() {
  const term = query.trim().toLocaleLowerCase();
  let rows = directories.map(t => ({...t, teamMatch:`${t.identity.name} ${t.identity.managerName}`.toLocaleLowerCase().includes(term), matches:t.players.filter(p => `${p.fullName} ${p.position} ${p.nbaTeam}`.toLocaleLowerCase().includes(term))})).filter(t => !term || t.teamMatch || t.matches.length);
  rows.sort((a,b) => sort === 'name' || sort === 'players' ? a.identity.name.localeCompare(b.identity.name) : sort === 'roster' ? b.players.length - a.players.length || a.identity.name.localeCompare(b.identity.name) : ranks.get(a.identity.id).rank - ranks.get(b.identity.id).rank);
  const count = rows.reduce((sum,t) => sum + (!term || t.teamMatch ? t.players.length : t.matches.length), 0);
  return {count, rows, html:rows.map(t => {
    const standings = ranks.get(t.identity.id);
    const face = data.faces.find(f => f.team.id === t.identity.id);
    const pair = t.currentMatchup;
    const opponent = pair.home.id === t.identity.id ? pair.away : pair.home;
    const players = [...(!term || t.teamMatch ? t.players : t.matches)];
    if (sort === 'players') players.sort((a,b) => a.fullName.localeCompare(b.fullName));
    return `<li class="franchise" data-team="${esc(t.identity.id)}"><div class="franchise-line"><span class="rank num">${standings.rank}</span>${portrait(face.player.id,face.player.name)}<div class="franchise-name"><h3>${teamLink(t.identity.id)}${personal?.team.id === t.identity.id ? '<span class="you">Your team</span>' : ''}</h3><p>${esc(t.identity.managerName)} · ${t.players.length} players</p><p class="small">Week ${pair.week} vs ${teamLink(opponent.id)}</p></div><div class="standing"><strong class="num">${standings.wins}–${standings.losses}</strong><span>W–L</span><strong class="num">${(standings.pointsFor / 100).toFixed(1)}</strong><span>PF</span></div><div class="face-value">${playerLink(face.player.id,face.player.name)}<strong class="num">${money(face.player.value)}</strong><span>leading modeled FAAB</span></div></div><div class="franchise-history small">2025: ${t.previousSeason.wins}–${t.previousSeason.losses} · finish ${t.previousSeason.finish}${face.champion ? ' · 2025 champion' : ''}${t.previousSeason.ownerNote ? ` · ${esc(t.previousSeason.ownerNote)}` : ''}</div><details class="roster-disclosure" ${term ? 'open' : ''}><summary>${term ? `${players.length} matching roster references` : `Roster · ${t.players.length} players`}</summary><ul class="roster-list">${players.map(p => `<li>${playerLink(p.id,p.fullName)}<span>${esc(p.position)} · ${esc(p.nbaTeam || 'NBA team unavailable')} · ID ${esc(p.id)}</span></li>`).join('')}</ul><a href="/teams/${esc(t.identity.id)}#team-roster">Full team roster</a></details></li>`;
  }).join('')};
}

function registerHTML() {
  const results = registerResults();
  return `<div id="register" tabindex="-1"><h2 id="heading-register">The whole league, in order.</h2><p>2026 synthetic standings · PF in fantasy points. Every team, current opponent and roster is here.</p><form class="directory-controls" id="directory-form"><label>Find a team, manager or player<input type="search" id="directory-search" placeholder="Try Embiid or NeuralNets" value="${esc(query)}"></label><label>Sort teams<select id="directory-sort"><option value="rank">Current standing</option><option value="name">Team A–Z</option><option value="roster">Roster count, high first</option><option value="players">Player names A–Z</option></select></label><button type="button" id="clear-search">Clear search</button></form><p class="small" id="directory-count" role="status">${results.rows.length} teams · ${results.count} roster references · ${uniquePlayers} unique players in the full register</p><ol class="franchises" id="directory-results">${results.html}</ol><p class="small">FAAB-denominated prices are modeled values, not available FAAB or cash. Roster membership belongs to this check date; it is not an ownership history.</p><details><summary>Unavailable league measures</summary><p>${esc(inventory.missing.power)}</p><p>League leaders and streak measures have no supplied values. No ranking is inferred from modeled prices.</p></details><div class="actions"><a href="/teams">All team profiles</a><button type="button" id="return-wire">Return to the wire heading</button></div></div>`;
}

function marketHTML() {
  const v = personal.valuation;
  const guide = personal.playerGuide.watch;
  return `<h2 id="heading-market">The roster, in two different measures.</h2><div class="market-layout"><div><p class="eyebrow">Your current modeled roster value</p><p class="total">${money(v.total)}</p><p>${v.priced} priced / ${personal.coverage.roster} roster · ${v.unpriced} unpriced<br>Modeled value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied ? ' (tied)' : ''}</p><p class="small">FAAB-denominated model · ${esc(personal.market.pricingBasis)} basis<br>Computed ${date(personal.market.updatedAt,true)}</p><ul class="top-values">${personal.players.map(p => `<li>${portrait(p.id,p.name)}<div>${playerLink(p.id,p.name)}<span>${esc(p.position)} · modeled change ${p.changePct == null ? 'unavailable' : `${p.changePct > 0 ? 'Up' : p.changePct < 0 ? 'Down' : 'Flat'} ${Math.abs(p.changePct).toFixed(1)}%`}</span></div><strong class="num">${money(p.value)}</strong></li>`).join('')}</ul><details><summary>All ${personal.rosterValues.length} roster values</summary><ul class="value-list">${personal.rosterValues.map(p => `<li>${playerLink(p.id,p.name)}<span>${esc(p.position)}</span><strong class="num">${money(p.value)}</strong></li>`).join('')}</ul></details><p class="small">${esc(inventory.missing.history)}</p><div class="actions"><a href="/stocks#player-board">Inspect Player Stocks</a><a href="/trade-analyzer">Analyze a trade</a></div></div><aside class="form-guide"><h3>Players to watch</h3><p>${esc(guide.label)}</p><ul class="form-rows">${guide.rows.map(p => `<li><div>${playerLink(p.id,p.name)}<span>${p.games} observed games · ${esc(p.note)}</span></div><strong class="num">${p.value.toFixed(1)}<span>EMA FPPG</span></strong></li>`).join('')}</ul><p class="small">${esc(guide.message)}</p><p class="small">Fantasy form and modeled price use different units. Price movement is not playing performance.</p></aside></div>`;
}

function movesHTML() {
  return `<h2 id="heading-moves">At the transaction desk.</h2><div class="moves-layout"><div>${home.hub.transactions.map(t => `<article class="move"><p>${esc(t.summary)}</p><span class="small">${date(t.createdAt,true)} · Week ${t.week} · ${esc(t.type.replaceAll('_',' '))}</span></article>`).join('')}<p class="small">The supplied summaries contain no add/drop legs. Player details are not inferred.</p><a class="text-action" href="/transactions">All transactions</a></div>${personal ? `<aside><h3>Your team wire</h3>${personal.news.map(n => `<p><a href="${esc(n.url)}">${esc(n.headline)}</a><span class="meta">${esc(n.outlet.name)} · ${date(n.publishedAt)}</span></p>`).join('')}<a class="text-action" href="/intel">News desk</a></aside>` : `<aside><h3>Between matchups</h3><p>The league's Free Throw practice is a separate game. No fantasy outcome or reward is implied.</p><a class="text-action" href="/arcade/free-throw">Play Free Throw</a></aside>`}</div>`;
}

function aiHTML() {
  if (!data.weekly) return `<h2 id="heading-ai">No saved slate supplied.</h2><p>Saved AI is unavailable in this edition state. No choices, probabilities or confidence are invented.</p><a class="text-action" href="/ai-decides">Open AI Decides</a>`;
  return `<h2 id="heading-ai">What the model actually returned.</h2><p>${aiState === 'stale' ? '<strong>Stale saved slate. Historical context only.</strong>' : 'Synthetic saved Week 3 slate.'} Saved ${date(data.weekly.generatedAt,true)}. No generation occurs here.</p><div class="ai-list">${data.weekly.matchups.map(row => {
    const r = row.result;
    return `<article class="ai-row"><h3>${row.teamIds.map(teamLink).join(' / ')}</h3><p>Returned choice: <strong>${teamLink(r.choice)}</strong> (roster ${esc(r.choice)})</p><div class="distribution">${r.probabilities.map(p => `<p>${teamLink(p.choice)} <strong class="num">${percent(p.probability)}</strong></p>`).join('')}</div><p>Independent confidence <strong class="num">${percent(r.confidence)}</strong></p><details><summary>Saved source and input details</summary><dl class="metadata"><dt>Status</dt><dd>${esc(aiState === 'stale' ? 'stale' : row.status)} · ${esc(row.message)}</dd><dt>League / season / week</dt><dd>${esc(data.weekly.leagueId)} / ${esc(data.weekly.season)} / ${data.weekly.week}</dd><dt>Saved</dt><dd>${date(data.weekly.generatedAt,true)}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot || data.weekly.snapshot ? esc(JSON.stringify(r.snapshot ?? data.weekly.snapshot)) : 'Not supplied (null)'}</dd><dt>Evidence</dt><dd>${esc([...row.evidence,...r.evidence].join(' ') || 'Not supplied')}</dd><dt>Probability basis</dt><dd>${esc(r.probabilityLabel)}</dd><dt>Identity</dt><dd>Roster IDs ${row.teamIds.map(esc).join(', ')}. Team names are current display names.</dd></dl></details></article>`;
  }).join('')}</div><p class="small">The returned choice is preserved even when another option has a higher probability. Confidence is a separate returned field.</p><a class="text-action" href="/ai-decides">Open AI Decides</a>`;
}

function completedHTML() {
  const g = personal.playerGuide;
  const merged = new Map();
  for (const [key,label] of [['best','Best'],['rough','Rough']]) for (const p of g[key]) {
    if (!merged.has(p.id)) merged.set(p.id,{...p,labels:[]});
    merged.get(p.id).labels.push(label);
  }
  return `<h2 id="heading-completed">Week 2, with the receipts.</h2><p>${esc(g.period)}</p><p>Best ${g.best.length} / ${g.eligiblePlayed} eligible · Rough ${g.rough.length} / ${g.eligiblePlayed} eligible. These synthetic selections overlap.</p><ul class="completed-list">${[...merged.values()].sort((a,b) => b.value - a.value).map(p => `<li><div>${playerLink(p.id,p.name)}<span>${p.labels.join(' + ')}${p.labels.length > 1 ? ' · shared cohort selection' : ''}</span></div><strong class="num">${p.value.toFixed(1)} pts</strong><span>${p.games} GP</span></li>`).join('')}</ul><p class="small">${esc(g.coverage)}</p><details><summary>Recorded participation and source limits</summary><p>${esc(g.recapMessage)}</p><p>${esc(inventory.missing.recap)}</p></details>`;
}

function sourceHTML(sources) { return sources.map(s => `<p><a href="${esc(s.url)}">${esc(s.label)}</a><span class="meta">Checked ${esc(s.checkedAt)}</span></p>`).join(''); }
function draftHTML(edition, full) {
  const g = edition.game;
  return `<h2 id="heading-${full ? 'draft' : 'older'}">${esc(edition.title)}</h2><p>${esc(edition.dateLabel)} · ${esc(edition.status)} · not published</p><div class="draft-game"><div><h3>${esc(g.title)}</h3><p>${g.teamIds.map(teamLink).join(' / ')}</p><p>${esc(g.context)}</p><p class="small">${esc(g.note)}${g.leagueWeek == null ? '' : ` · source Week ${g.leagueWeek}`} · ${esc(g.state)}${g.scores ? ` · ${g.scores.map(score).join(' – ')}` : ' · scores not supplied'}</p></div><details><summary>Selection and issue dates</summary><p>${esc(g.selectionReason)}</p><p>Issue window ${date(edition.startsAt)} to ${date(edition.endsAt)} (end exclusive). This is separate from current Week 3.</p></details></div>${full ? `<div class="editorial-stories">${edition.playerSpotlights.map(p => `<article class="story"><div class="story-identity">${portrait(p.playerId,p.name)}<div><p class="eyebrow">${esc(p.periodLabel)}</p><h3>${playerLink(p.playerId,p.name)}</h3></div></div><h4>${esc(p.headline)}</h4><p>${esc(p.opinion)}</p><div class="stats">${p.stats.map(s => `<span><strong class="num">${esc(s.value)}</strong>${esc(s.label)}</span>`).join('')}</div><p>${esc(p.statPeriod)}</p><p class="small">${esc(p.position)} · current roster ${teamLink(p.teamId)}</p><details><summary>Editorial selection and source</summary><p>${esc(p.selectionReason)}</p>${sourceHTML([p.source])}</details></article>`).join('')}</div>` : ''}<div class="dated-happenings">${edition.happenings.map(h => `<article><h3>${esc(h.dateLabel)} · ${esc(h.title)}</h3><p>${esc(h.text)}</p><a href="${esc(h.href)}">Related profile</a></article>`).join('')}</div><details><summary>Issue sources</summary>${sourceHTML(edition.sources)}</details><a class="text-action" href="/weekly/${esc(edition.id)}">Read archived issue ${esc(edition.id)}</a>`;
}

function entries() {
  return [
    entry({id:'current',day:'12',month:'NOV',label:'Checked snapshot / 12 Nov 2026',types:'league personal',body:currentHTML()}),
    entry({id:'register',day:'12',month:'NOV',label:'The league register / same check date',types:'league market',body:registerHTML()}),
    ...(personal ? [entry({id:'market',day:'12',month:'NOV',label:'Your team / source checked 12 Nov 2026',types:'personal market',body:marketHTML()})] : []),
    entry({id:'moves',day:'12',month:'NOV',label:'Sample league activity / 12 Nov 2026',types:'league personal',body:movesHTML()}),
    entry({id:'ai',day:'10',month:'NOV',label:'Saved AI / 10 Nov 2026',source:'nov10',types:'league personal',body:aiHTML()}),
    ...(personal ? [entry({id:'completed',day:'2–9',month:'NOV',label:'Completed source week / end exclusive',source:'week2',types:'personal',body:completedHTML()})] : []),
    entry({id:'draft',day:'5–11',month:'OCT',label:'Dated editorial / October draft issue',source:'october',body:draftHTML(data.archive.find(e => e.id === '2026-W41'),true)}),
    entry({id:'older',day:'28–4',month:'SEP/OCT',label:'Earlier draft issue / 2025 final recap',source:'october',body:draftHTML(data.archive.find(e => e.id === '2026-W40'),false)})
  ];
}

function render() {
  const shown = entries().filter(e => (scope === 'all' || e.types.includes(scope)) && (period === 'all' || period === e.source));
  $('#thread').innerHTML = shown.map(e => e.html).join('') || '<section class="empty"><h2>No entries for this combination.</h2><p>The supplied fixture has no matching sources.</p><button type="button" data-reset>Return to complete wire</button></section>';
  document.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.scope === scope)));
  $('#source-period').value = period;
  const filtered = scope !== 'all' || period !== 'all';
  $('#view-status').textContent = filtered ? `${shown.length} matching dated sections` : '';
  $('.filter-status').hidden = !filtered;
  $('#reset-log').hidden = !filtered;
  if ($('#directory-sort')) $('#directory-sort').value = sort;
}
function updateRegister() {
  const results = registerResults();
  $('#directory-results').innerHTML = results.html || '<li class="empty">No teams or players match. Clear search to restore all ten franchises.</li>';
  $('#directory-count').textContent = `${results.rows.length} teams · ${results.count} roster references${query ? ' matched' : ` · ${uniquePlayers} unique players in the full register`}`;
}
function reset() { scope = 'all'; period = 'all'; render(); }

document.addEventListener('submit',e => { if (e.target.matches('#filters,#directory-form')) e.preventDefault(); });
document.addEventListener('click',e => {
  const filter = e.target.closest('[data-scope]');
  if (filter) { scope = filter.dataset.scope; render(); }
  if (e.target.closest('#reset-log,[data-reset]')) { reset(); $('#wire').focus({preventScroll:true}); }
  if (e.target.closest('#clear-search')) { query = ''; $('#directory-search').value = ''; updateRegister(); $('#directory-search').focus(); }
  if (e.target.closest('#register-jump')) {
    e.preventDefault();
    returnPoint = {element:$('#register-jump'),scroll:window.scrollY};
    if (!$('#register')) reset();
    $('#register').focus({preventScroll:true});
    $('#register').scrollIntoView({block:'start'});
  }
  if (e.target.closest('#return-wire')) {
    const origin = returnPoint?.element ?? $('#register-jump');
    origin.focus({preventScroll:true});
    window.scrollTo({top:returnPoint?.scroll ?? 0,behavior:'instant'});
  }
});
document.addEventListener('input',e => { if (e.target.id === 'directory-search') { query = e.target.value; updateRegister(); } });
document.addEventListener('change',e => {
  if (e.target.id === 'source-period') { period = e.target.value; render(); }
  if (e.target.id === 'directory-sort') { sort = e.target.value; updateRegister(); }
  if (e.target.id === 'pairing') { selectedPair = Number(e.target.value); $('#selected-matchup').innerHTML = selectedMatchup(); }
});
document.addEventListener('keydown',e => { if (e.key === 'Escape' && $('.tools').open) { $('.tools').open = false; $('.tools summary').focus(); } });
$('#edition-switch').textContent = mode === 'member' ? 'Public edition' : 'Member edition';
$('#edition-switch').href = `?view=${mode === 'member' ? 'public' : 'member'}${aiState === 'ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;
$('#personal-filter').hidden = !personal;
$('#member-action').textContent = personal ? 'My team' : 'Sign in';
$('#member-action').href = personal ? '/team' : '/login';
$('#footer-source').textContent = `Fixture checked ${date(home.checkedAt,true)}. Sample league data; no live refresh.`;
render();
document.body.dataset.homepageReady = '06';
