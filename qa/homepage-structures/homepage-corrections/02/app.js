import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// One open document. Court links move to the matching, already-rendered notes.
const $ = selector => document.querySelector(selector);
const home = data.home;
const member = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
const teams = home.hub.teams;
const team = id => teams.find(t => t.id === String(id));
const teamName = id => team(id)?.name ?? 'Unknown team';
const rec = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const teamLink = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const when = value => value == null ? 'Unavailable' : new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC');
const pct = value => `${Math.round(value * 100)}%`;
const points = value => value == null ? 'Pending' : Number(value).toFixed(1);
const currentPair = member?.matchup ?? home.directory[0].currentMatchup;
const pairs = home.directory.map(t => t.currentMatchup).filter((p, i, list) => p && list.findIndex(x => x && x.home.id === p.home.id && x.away.id === p.away.id) === i);
const positions = [
  ['matchup', 'Centre circle', `Week ${currentPair.week}`],
  ['roster', 'Left wing', member ? 'Your team' : 'Faces & values'],
  ['standings', 'Right wing', 'Standings'],
  ['edition', 'Left baseline', 'Weekly edition'],
  ['league', 'Right baseline', 'Teams & players'],
  ['wire', 'Sideline', 'League wire'],
];
const jump = (id, text) => `<a href="#${id}" data-jump>${text}</a>`;
const marker = (position, id) => `<div class="note-marker"><span>${position}</span>${jump('court', 'Court map')}</div>`;
const heading = (id, text, lead = '') => `<h2 id="${id}-title" tabindex="-1">${text}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}`;
const note = (id, position, text, body, lead = '') => `<section id="${id}" class="field-note note-${id}" aria-labelledby="${id}-title">${marker(position, id)}<div class="note-content">${heading(id, text, lead)}${body}</div></section>`;
const profileActions = `<div class="actions"><a href="/stocks#player-board">Stocks player board</a><a href="/trade-analyzer">Trade analyzer</a>${member ? '<a href="/team">Your team</a>' : '<a href="/teams">Compare teams</a>'}</div>`;

$('#compare').href = `?view=${member ? 'public' : 'member'}${aiState !== 'ready' ? `&ai=${esc(aiState)}` : ''}`;
$('#compare').textContent = member ? 'Public view' : 'Member view';
$('#routes').innerHTML = [
  ['/intel', 'News & intel'], ['/history', 'History'], ['/ai-decides', 'AI Decides'], ['/transactions', 'Transactions'], ['/trade-analyzer', 'Trade analyzer'], ['/weekly', 'Weekly archive'], ['/arcade/free-throw', 'Play Free Throw'], ...(member ? [['/team', 'Your team'], ['/teams/1#team-roster', 'Your full roster']] : []),
].map(([href, label]) => `<a href="${href}">${label}</a>`).join('');

function courtFact(id) {
  if (id === 'matchup') return `<span class="court-pair">${esc(currentPair.home.name)}<span>vs</span>${esc(currentPair.away.name)}</span><span class="court-score"><b>${points(currentPair.homePoints)}</b><span>/</span><b>${points(currentPair.awayPoints)}</b></span><small>Incomplete scoring</small>`;
  if (id === 'roster') return member ? `<span class="court-value">${money(member.valuation.total)}</span><span>Modeled FAAB ${member.valuation.complete ? 'total' : 'subtotal'}</span><small>${member.valuation.priced} priced / ${member.coverage.roster} rostered</small>` : '<span>Ten franchise players</span><small>Modeled FAAB values, public profiles</small>';
  if (id === 'standings') return `<span>${esc(home.hub.standings[0].team.name)}</span><span class="court-value">${rec(home.hub.standings[0])}</span><small>Rank 1 · ${home.hub.season.playoffTeams} playoff places</small>`;
  if (id === 'edition') return `<span>${esc(home.edition.title)}</span><small>${esc(home.edition.dateLabel)} · draft</small>`;
  if (id === 'league') return '<span>10 teams · 228 players</span><small>Roster previews & full profiles</small>';
  return `<span>${home.hub.transactions.length} sample roster moves</span><small>Week ${currentPair.week} · latest fixture activity</small>`;
}
$('#zones').innerHTML = positions.map(([id, position, label]) => `<a class="zone zone-${id}" href="#${id}" data-jump><span class="position">${position}</span><strong>${label}</strong>${courtFact(id)}<span class="zone-action">Read ${label === 'Your team' ? 'your team notes' : 'field notes'}</span></a>`).join('');

function aiRow(p) {
  const saved = data.weekly?.matchups.find(m => m.teamIds.includes(p.home.id) && m.teamIds.includes(p.away.id));
  const result = saved?.result;
  return `<article class="ai-row"><div class="ai-pair"><h3>${teamLink(p.home)} <span>vs</span> ${teamLink(p.away)}</h3><p class="small">${rec(p.home)} / ${rec(p.away)} current records</p><p class="pair-score"><span>${points(p.homePoints)}</span> / <span>${points(p.awayPoints)}</span></p><p class="small">Week ${p.week} · incomplete scoring</p></div><div class="ai-result">${result ? `<p class="ai-choice">Returned choice: <strong>${esc(teamName(result.choice))}</strong> (${pct(result.probabilities.find(p => p.choice === result.choice)?.probability ?? 0)})</p>${result.probabilities.map(prob => `<div class="probability"><label>${esc(teamName(prob.choice))}<b>${pct(prob.probability)}</b><meter min="0" max="1" value="${prob.probability}">${pct(prob.probability)}</meter></label></div>`).join('')}<p class="small">Independent confidence <strong>${pct(result.confidence)}</strong>. ${esc(result.probabilityLabel)}.</p><details class="evidence"><summary>Model & input notes</summary><p class="provenance">${esc(aiState === 'stale' ? 'Stale' : saved.status)} · ${esc(saved.message)}. Model ${esc(result.model)} / prompt ${esc(result.promptVersion)}. Input snapshot: ${result.snapshot ? esc(JSON.stringify(result.snapshot)) : 'unavailable'}. Baseline: ${saved.baseline ? esc(JSON.stringify(saved.baseline)) : 'unavailable'}. ${saved.evidence.map(esc).join(' ')} ${result.evidence.map(esc).join(' ') || 'No additional result evidence supplied.'}</p></details>` : '<p class="status">Saved pick unavailable. No probabilities or confidence supplied.</p>'}</div></article>`;
}
function matchup() {
  return note('matchup', 'Centre circle', 'The week, across the floor.',
    `<div class="week-context"><p>Known <strong class="num">0.0</strong> is a supplied score. <strong>Pending</strong> has no score yet. None of these pairings is final.</p><p class="small">${esc(home.hub.season.seasonYear)} fixture checked ${when(home.checkedAt)}.</p><a class="text-action" href="/ai-decides">Open AI Decides</a></div><div class="slate-heading"><h3>Saved AI slate</h3><p>${data.weekly ? `${aiState === 'stale' || data.weekly.status === 'stale' ? '<strong>Stale saved output.</strong> Historical slate retained; these are not current picks.' : 'Synthetic model output.'} Generated ${when(data.weekly.generatedAt)}.` : '<strong>Saved AI unavailable.</strong> No model output is supplied in this state.'}</p>${data.weekly ? `<p class="small">A returned choice can differ from the highest supplied probability. Both are preserved.</p>` : ''}</div><div class="ai-slate">${pairs.map(aiRow).join('')}</div>`,
    `Five Week ${currentPair.week} matchups. Scores and saved model output remain separate.`);
}

function roster() {
  if (!member) return note('roster', 'Left wing', 'The names behind the teams.', `<p>Each team’s highest supplied modeled-value player appears in the open franchise index below. Prices describe the model; they do not describe form or completed trades.</p>${jump('league', 'All ten franchise players & rosters')}<p class="status">${esc(inventory.missing.history)}</p><p class="small">${esc(inventory.missing.power)}</p>${profileActions}`, 'A public league view. Personal roster value and member scouting belong to the member comparison.');
  const v = member.valuation, guide = member.playerGuide;
  const recap = new Map();
  for (const [label, rows] of [['Best', guide.best], ['Rough', guide.rough]]) for (const p of rows) {
    const previous = recap.get(p.id);
    if (previous) previous.labels.push(label); else recap.set(p.id,{...p,labels:[label]});
  }
  return note('roster','Left wing',esc(member.team.name),
    `<div class="team-desk"><div><p>Current modeled FAAB ${v.complete ? 'total' : 'subtotal'}</p><p class="metric">${money(v.total)}</p><p>${v.priced} priced / ${member.coverage.roster} rostered · ${v.unpriced} unpriced</p><p class="small">${esc(member.market.pricingBasis)} pricing basis. Computed ${when(member.market.updatedAt)}. ${v.rank ? `Supplied model value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied ? ' (tied)' : ''}.` : 'League value rank unavailable.'}</p><p class="status">${esc(inventory.missing.history)}</p></div><div><h3>Highest modeled values</h3><ol class="top-values">${member.players.map(p => `<li>${playerLink(p.id,p.name)}<b class="num">${money(p.value)}</b><small>${esc(p.position)} · known price change ${p.changePct > 0 ? '+' : ''}${p.changePct}%, not form</small></li>`).join('')}</ol>${profileActions}</div></div><div class="scouting"><div><h3>Players to watch</h3><p>${esc(guide.watch.label)}</p><details class="evidence"><summary>Form method</summary><p class="small">${esc(guide.watch.message)}</p></details>${guide.watch.rows.map(p=>`<div class="form-row"><div>${playerLink(p.id,p.name)}<small>${p.games} observed games · ${esc(p.note)}</small></div><b class="num">${p.value} EMA FP/G</b></div>`).join('')}</div><div><h3>Best / rough completed week</h3><p class="small">${esc(guide.period)}. ${esc(inventory.missing.recap)}</p>${[...recap.values()].sort((a,b)=>b.value-a.value).map(p=>`<div class="form-row"><div>${playerLink(p.id,p.name)}<small>${p.labels.join(' + ')}${p.labels.length > 1 ? ' · shared selection shown once' : ''} · ${p.games} GP · ${esc(p.note)}</small></div><b class="num">${p.value} FP</b></div>`).join('')}<p class="small">${recap.size} unique shown / ${guide.eligiblePlayed} eligible. DNP, no-game and unknown records excluded.</p><details class="evidence"><summary>Completed-week method</summary><p class="provenance">${esc(guide.coverage)} ${guide.best.length} best and ${guide.rough.length} rough selections. ${esc(guide.recapMessage)}</p></details></div></div><p class="roster-action"><a class="text-action" href="/teams/1#team-roster">All ${member.coverage.roster} players in your full roster</a></p><div class="team-wire"><h3>Your team wire</h3>${member.news.map(n=>`<p><a href="${esc(n.url)}">${esc(n.headline)}</a><small>${esc(n.outlet.name)} · ${when(n.publishedAt)} · synthetic</small></p>`).join('')}<p class="small">${esc(inventory.missing.power)}</p></div>`,
    `Your team · managed by ${esc(member.team.managerName)}. ${member.coverage.roster} players · standing ${member.standing.rank} of ${teams.length} · ${rec(member.team)} current record.`);
}
function standings() {
  return note('standings', 'Right wing', 'The current order.', `<table class="standings"><caption>${esc(home.hub.season.seasonYear)} synthetic standings. PF = fantasy points.</caption><thead><tr><th scope="col">Rank</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${home.hub.standings.map(s=>`<tr${member?.team.id === s.team.id ? ' class="your-standing"' : ''}><td class="num">${s.rank}</td><td>${teamLink(s.team)}${member?.team.id === s.team.id ? '<span class="your-label">Your team</span>' : ''}<small>${esc(s.team.managerName)}</small></td><td class="num" data-label="Record">${rec(s)}</td><td class="num" data-label="PF">${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table><p class="small">${home.hub.season.playoffTeams} playoff places · playoffs begin Week ${home.hub.season.playoffWeekStart}. No projection is inferred.</p><p class="status">${esc(inventory.missing.power)}</p><a class="text-action" href="/history">Prior-season history</a>`);
}
function portrait(id, size = 88) {
  return inventory.portraits[id] ? `<img src="${esc(inventory.portraits[id])}" width="${size}" height="${size}" alt="" loading="lazy">` : '';
}
function sourceList(sources) {
  return `<ul class="source-list">${sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><small>Checked ${esc(s.checkedAt)}</small></li>`).join('')}</ul>`;
}
function spotlight(s, i) {
  return `<article class="story ${i === 0 ? 'lead-story' : ''}"><div class="story-ident">${portrait(s.playerId, i === 0 ? 144 : 88)}<div><p class="eyebrow">${esc(s.periodLabel)}</p><h3>${esc(s.headline)}</h3><p>${playerLink(s.playerId,s.name)} · ${esc(s.position)}</p><p class="small">${teamLink(team(s.teamId))}</p></div></div><p class="take">${esc(s.opinion)}</p><div class="stats">${s.stats.map(stat=>`<p><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></p>`).join('')}</div><p class="stat-period">${esc(s.statPeriod)}</p><details class="evidence"><summary>Selection & source</summary><p class="provenance">${esc(s.selectionReason)}</p>${sourceList([s.source])}</details></article>`;
}
function edition() {
  const e = home.edition;
  return note('edition', 'Left baseline', esc(e.title), `<div class="edition-game"><p class="eyebrow">${esc(e.game.note)} · Week ${e.game.leagueWeek} · ${esc(e.game.state)} · ${e.game.scores ? e.game.scores.map(points).join(' / ') : 'No scores'}</p><h3>${esc(e.game.title)}</h3><p>${esc(e.game.context)}</p><details class="evidence"><summary>Editorial game notes</summary><p class="provenance">${esc(e.game.selectionReason)} Edition ${esc(e.id)} · ${esc(e.startsAt)} to ${esc(e.endsAt)} · publication ${e.publishedAt ? esc(e.publishedAt) : 'not published'}.</p></details></div><div class="stories">${e.playerSpotlights.map(spotlight).join('')}</div><div class="edition-happenings"><h3>Around that edition</h3>${e.happenings.map(h=>`<p><a href="${esc(h.href)}">${esc(h.title)}</a><span>${esc(h.text)}</span><small>${esc(h.dateLabel)} · dated editorial</small></p>`).join('')}</div>`, `${esc(e.dateLabel)} · ${esc(e.status)} editorial. This dated opening-week edition is separate from the Week ${currentPair.week} fixture above.`);
}
function wire() {
  return note('wire', 'Sideline', 'Moves at the margin.', `<div class="moves">${home.hub.transactions.map(m=>`<article><h3>${esc(teamName(m.teamIds[0]))}</h3><p>${esc(m.summary)}</p><p class="small">Week ${m.week} · ${esc(m.type)} · ${when(m.createdAt)} · synthetic</p><p class="provenance">${m.adds.length ? `${m.adds.length} added` : 'No player-level add supplied'}; ${m.drops.length ? `${m.drops.length} dropped` : 'no player-level drop supplied'}.</p></article>`).join('')}</div><div class="actions"><a href="/transactions">All transactions</a><a href="/intel">News & intel</a><a href="/trade-analyzer">Analyze a trade</a></div>`, 'Latest sample moves from the current fixture. The dated editorial moves above belong to their stated edition.');
}
function directoryShell() {
  const featured = ['1','5','8'].map(id=>home.directory.find(t=>t.identity.id===id));
  return note('league', 'Right baseline', 'Ten teams. One league.', `<div class="featured-clubs">${featured.map(t=>{
    const f=data.faces.find(f=>f.team.id===t.identity.id), old=t.previousSeason;
    return `<article class="club-preview"><div class="franchise-head">${portrait(f.player.id)}<div><h3>${teamLink(t.identity)}</h3><p class="small">${esc(t.identity.managerName)} · ${t.players.length} rostered</p></div></div><p>${playerLink(f.player.id,f.player.name)}<small>${money(f.player.value)} modeled FAAB${f.champion ? ' · defending champion' : ''}</small></p><p class="previous">${old.season}: ${old.wins}–${old.losses} · finish ${old.finish}. ${esc(old.ownerNote || '')}</p><a class="text-action" href="/teams/${esc(t.identity.id)}#team-roster">Full roster</a></article>`;
  }).join('')}</div><div class="filters"><label>Search all 228 roster names<input id="directory-search" type="search" placeholder="Team, manager or player" autocomplete="off"></label><label>Sort teams<select id="directory-sort"><option value="rank">Standing</option><option value="name">Team name</option><option value="roster">Roster count</option></select></label></div><p id="directory-count" class="small" aria-live="polite"></p><div id="directory-results" class="directory compact-index"></div><a class="text-action" href="/teams">All team profiles</a>`, 'A member’s club, the defending champion, and a franchise with a new manager. Modeled-value faces give each a way in.');
}
function updateDirectory() {
  const q = $('#directory-search').value.trim().toLocaleLowerCase();
  const sort = $('#directory-sort').value;
  const entries = home.directory.filter(t=>[t.identity.name,t.identity.managerName,...t.players.map(p=>p.fullName)].some(text=>text.toLocaleLowerCase().includes(q)));
  entries.sort((a,b)=>sort === 'name' ? a.identity.name.localeCompare(b.identity.name) : sort === 'roster' ? b.players.length-a.players.length || a.identity.name.localeCompare(b.identity.name) : home.hub.standings.find(s=>s.team.id===a.identity.id).rank-home.hub.standings.find(s=>s.team.id===b.identity.id).rank);
  let playerCount = 0;
  $('#directory-results').innerHTML = entries.map(t=>{
    const matches = q ? t.players.filter(p=>p.fullName.toLocaleLowerCase().includes(q)) : [];
    playerCount += matches.length;
    const rank=home.hub.standings.find(s=>s.team.id===t.identity.id).rank;
    return `<div class="team-index-row" data-team="${esc(t.identity.id)}"><span class="num">${rank}</span><div>${teamLink(t.identity)}<small>${esc(t.identity.managerName)} · ${t.players.length} rostered${t.previousSeason?.ownerNote ? ` · ${esc(t.previousSeason.ownerNote)}` : ''}</small>${matches.length ? `<p class="matching-players">${matches.map(p=>playerLink(p.id,p.fullName)).join(', ')}</p>` : ''}</div><a class="text-action" href="/teams/${esc(t.identity.id)}#team-roster">Roster</a></div>`;
  }).join('') || '<p class="empty">No matches. Clear the search to restore all ten teams.</p>';
  $('#directory-count').textContent = `${entries.length} of ${home.directory.length} teams${q ? ` · ${playerCount} matching player ${playerCount===1 ? 'name' : 'names'}` : ' · 228 unique roster names searchable'}.`;
}
function archive() {
  return `<section class="archive" aria-labelledby="archive-title"><div><p class="eyebrow">After the final whistle</p>${heading('archive','Keep the receipts.')}<p>Earlier editions retain their dates and draft status. Historical scores are separate from the incomplete current slate.</p><div class="actions"><a href="/weekly">Weekly archive</a><a href="/history">League history</a><a href="/arcade/free-throw">Play Free Throw</a></div></div><div>${data.archive.map(a=>`<article class="archive-entry"><p class="small">${esc(a.dateLabel)} · ${esc(a.status)}</p><h3><a href="/weekly/${esc(a.id)}">${esc(a.title)}</a></h3><p>${esc(a.game.title)}</p><p class="small">${esc(a.game.note)} · ${esc(a.game.state)} · ${a.game.scores ? a.game.scores.map(points).join(' / ') : 'No scores'}</p><details class="evidence"><summary>Edition notes & sources</summary><p>${esc(a.game.context)}</p><p class="provenance">${esc(a.game.selectionReason)}</p>${a.happenings.map(h=>`<p class="small"><a href="${esc(h.href)}">${esc(h.title)}</a> · ${esc(h.text)} ${esc(h.dateLabel)}</p>`).join('')}${sourceList(a.sources)}</details></article>`).join('')}</div></section><section class="source-register" aria-labelledby="source-title"><details class="evidence"><summary id="source-title">Source notes & boundaries</summary><p>${esc(inventory.warning)} Fixture checked ${when(home.checkedAt)}.</p><p>${esc(inventory.missing.history)} ${esc(inventory.missing.power)}</p><p>The member/public switch is a local design comparison. It does not authenticate a visitor. No live provider, AI generation or remote data request runs on this page.</p>${sourceList(home.edition.sources)}</details></section>`;
}

$('#field-book').innerHTML = matchup() + `<div class="wings">${roster()}${standings()}</div>` + edition() + wire() + directoryShell() + archive();
updateDirectory();
$('#directory-search').addEventListener('input', updateDirectory);
$('#directory-sort').addEventListener('change', updateDirectory);
document.addEventListener('click', event=>{
  const link = event.target.closest('a[data-jump], .skip');
  if (!link) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  const heading = target.querySelector('h1, h2') ?? target;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  history.pushState(null, '', link.hash);
  heading.focus({preventScroll:true});
  target.scrollIntoView({block:'start', behavior:'instant'});
});
document.addEventListener('keydown', event=>{
  if(event.key!=='Escape') return;
  const detail=event.target.closest('details[open]');
  if(detail){ detail.open=false; detail.querySelector('summary').focus(); }
});
document.fonts.ready.then(()=>{ document.body.dataset.homepageReady = '02'; });
