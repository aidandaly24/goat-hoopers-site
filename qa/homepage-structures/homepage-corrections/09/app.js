import { inventory, data, mode, aiState, esc, money } from '../../data.js';

// Local fixture boundary: no producer, fetch, account, price or result mutation.
const $ = selector => document.querySelector(selector);
if (!Array.isArray(data.home?.directory) || !Array.isArray(data.archive) || !Array.isArray(data.home?.hub?.standings)) {
  throw new Error('The supplied homepage fixture is incomplete.');
}
const directory = data.home.directory;
const teams = new Map(directory.map(d => [String(d.identity.id), d.identity]));
if (teams.size !== directory.length) throw new Error('Duplicate fixture team identity.');
const member = mode === 'member' && data.personal.kind === 'member';
const summary = member ? data.personal.summary : null;
const currentPair = summary?.matchup ?? directory[0]?.currentMatchup;
if (!currentPair?.home || !currentPair?.away) throw new Error('Current fixture pairing missing.');
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamLink = t => `<a href="/teams/${esc(t.id)}">${esc(t.name)}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const pct = n => `${Math.round(n * 100)}%`;
const date = value => value == null ? 'Unavailable' : new Date(value).toLocaleString('en-US', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'}) + ' UTC';
const portrait = (id, size = '') => inventory.portraits[id] ? `<img class="portrait ${size}" src="${esc(inventory.portraits[id])}" alt="" loading="lazy">` : '';
const score = n => n == null ? '<span class="score pending">Pending</span>' : `<span class="score num">${Number(n).toFixed(1)}</span>`;
const opponent = (pair, id) => pair.home.id === id ? pair.away : pair.home;
const returned = pick => pick?.result?.probabilities.find(p => p.choice === pick.result.choice);

$('#account').innerHTML = member ? '<a href="/team">My team</a>' : '<a href="/login">Sign in</a><a href="/claim">Claim a team</a>';
$('#edition-switch').href = `?view=${member ? 'public' : 'member'}${aiState === 'ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;
$('#edition-switch').textContent = member ? 'Public edition' : 'Member fixture';
$('.brand').href = `?view=${mode}${aiState === 'ready' ? '' : `&ai=${encodeURIComponent(aiState)}`}`;

function currentMarkup() {
  const pick = data.weekly?.matchups.find(p => p.teamIds.includes(currentPair.home.id) && p.teamIds.includes(currentPair.away.id));
  const r = pick?.result;
  const selected = returned(pick);
  return `<p class="eyebrow">${member ? 'Your current pairing' : 'Current league pairing'} · 2026 season</p><h1 id="current-title" tabindex="-1">Week ${currentPair.week}</h1><p class="lead">The score is still open.<br>The evidence can sit together.</p><div class="matchup">${[[currentPair.home,currentPair.homePoints],[currentPair.away,currentPair.awayPoints]].map(([t,n]) => `<div class="competitor"><div><h2>${teamLink(t)}</h2><p>${esc(t.managerName)} · <span class="num">${record(t)}</span> current record${member && t.id === summary.team.id ? ' · Your team' : ''}</p></div>${score(n)}</div>`).join('')}</div><p class="small muted">Incomplete current scores. A known 0.0 stays zero; Pending means missing. Week 3 calendar bounds were not supplied.</p><div class="current-pick branch"><p class="eyebrow">${data.weekly?.status === 'stale' ? 'Stale saved model pick' : r ? 'Saved model pick' : 'Saved model unavailable'}</p>${r ? `<p class="choice">Returned choice: <b>${esc(teams.get(r.choice)?.name ?? r.choice)}</b> <span class="num">${selected ? pct(selected.probability) : 'Unavailable'}</span></p><p>${r.probabilities.filter(p => p.choice !== r.choice).map(p => `${esc(teams.get(p.choice)?.name ?? p.choice)} <span class="num">${pct(p.probability)}</span>`).join(' · ')} · Independent confidence <span class="num">${pct(r.confidence)}</span></p><p class="small muted">${data.weekly.status === 'stale' ? 'The saved freshness window has passed. ' : ''}Saved ${esc(date(data.weekly.generatedAt))}. A returned choice is shown as returned, even when the other probability is higher.</p>` : '<p>No saved probabilities are available. The pairing and the rest of the home remain readable.</p>'}<a class="action" href="#slate-title">Read all five pairings</a><a class="action" href="/ai-decides">Open AI Decides</a></div>`;
}
$('#current').innerHTML = currentMarkup();

function valueRow(p) {
  return `<li>${portrait(p.id)}<div>${playerLink(p.id,p.name)}<small>${esc(p.position)} · ${p.changePct == null ? 'Change unavailable' : `${p.changePct > 0 ? 'Up' : p.changePct < 0 ? 'Down' : 'Flat'} ${Math.abs(p.changePct).toFixed(1)}% modeled change`}</small></div><strong class="num">${money(p.value)}</strong></li>`;
}
function guideRows(rows, kind) {
  return `<ul class="guide-list">${rows.map(p => `<li><div>${playerLink(p.id,p.name)}<small>${kind === 'form' ? esc(p.note) : esc(p.label)}</small></div><span class="num">${p.value.toFixed(1)}<small>${kind === 'form' ? 'EMA FPPG' : 'fantasy pts'}</small></span><span class="num">${p.games}<small>GP</small></span></li>`).join('')}</ul>`;
}
function memberMarkup() {
  const g = summary.playerGuide;
  const completed = new Map();
  for (const [label,rows] of [['Best',g.best],['Rough',g.rough]]) for (const p of rows) {
    const prior = completed.get(p.id);
    completed.set(p.id, {...p,label:prior ? `${prior.label} / ${label.toLowerCase()} overlap` : label});
  }
  return `<p class="eyebrow">Member fixture · Your team</p><h2 id="team-title">${esc(summary.team.name)}</h2><p>${esc(summary.team.managerName)} · <span class="num">${summary.coverage.roster}</span> roster players · Standing <span class="num">${summary.standing.rank}/${summary.season.totalTeams}</span></p><div class="actions"><a class="primary" href="/team">My team</a><a class="action" href="/teams/${esc(summary.team.id)}#team-roster">View full roster</a></div><p class="eyebrow">Current modeled FAAB ${summary.valuation.complete ? 'total' : 'subtotal'}</p><p class="valuation num">${money(summary.valuation.total)}</p><p class="small muted">${summary.valuation.priced} of ${summary.coverage.roster} priced; ${summary.valuation.unpriced} unpriced. ${esc(summary.market.pricingBasis)} basis.${summary.valuation.complete && summary.valuation.rank ? ` Value rank ${summary.valuation.rank.rank} of ${summary.valuation.rank.teams}.` : ''}<br>Computed ${esc(date(summary.market.updatedAt))}. Asset value, not a FAAB balance.</p><ul class="top-values">${summary.players.map(valueRow).join('')}</ul><details class="secondary"><summary>All ${summary.rosterValues.length} roster values</summary><div><p class="small muted">Current modeled quotes, not a historical series.</p><ul class="all-values">${summary.rosterValues.map(p => `<li>${playerLink(p.id,p.name)}<span class="num">${money(p.value)}</span></li>`).join('')}</ul></div></details><section class="sub-branch"><h3>On form</h3><p class="small">${esc(g.watch.label)}</p>${guideRows(g.watch.rows,'form')}<p class="small muted">${esc(g.watch.message)} Availability is unknown.</p></section><section class="sub-branch"><h3>Week ${g.previousWeek}: the finished sample</h3><p class="small">Synthetic completed-week points · <span class="num">Nov 2–9, 2026</span>, end exclusive.</p>${guideRows([...completed.values()],'completed')}<p class="small muted">${g.best.length} best / ${g.rough.length} rough selections from ${g.eligiblePlayed} eligible players; overlap is shown once. ${esc(g.coverage)}</p></section><section class="sub-branch"><h3>From your team wire</h3><ul class="wire-list">${summary.news.map(n => `<li><a href="${esc(n.url)}">${esc(n.headline)}</a><small>${esc(n.outlet.name)} · ${esc(date(n.publishedAt))} · Synthetic</small></li>`).join('')}</ul></section>`;
}
function publicMarkup() {
  const faces = currentPair ? data.faces.filter(f => [currentPair.home.id,currentPair.away.id].includes(f.team.id)) : [];
  const next = data.archive.find(a => a.id === '2026-W41')?.playerSpotlights.find(p => p.role === 'one-to-watch');
  return `<p class="eyebrow">Public edition · The matchup desk</p><h2 id="team-title">Know the two sides.</h2><p>Start with each franchise’s supplied highest modeled-value player, then follow the full roster.</p><div class="public-anchors">${faces.map(f => `<article class="anchor">${portrait(f.player.id,'large')}<div><h3>${playerLink(f.player.id,f.player.name)}</h3><p>${teamLink(f.team)}<br>${esc(f.player.position)} · <span class="num">${money(f.player.value)}</span> modeled FAAB</p><a class="action" href="/teams/${esc(f.team.id)}#team-roster">Read this roster</a></div></article>`).join('')}</div><p class="small muted">Synthetic modeled asset values, not form or a FAAB balance. Personal valuation, form and team wire belong to the member edition.</p><section class="sub-branch"><h3>A draft pick to follow</h3>${next ? `<p class="lead">${playerLink(next.playerId,next.name)}</p><p>${esc(next.opinion)}</p><p class="small muted">From the Oct 5–11 unpublished sample draft. The college statistics and its preseason watch are fully labelled in the dated branch below.</p><a class="action" href="#editorial-title">Follow the dated story</a>` : '<p>The draft watch is unavailable.</p>'}</section><section class="sub-branch"><h3>Find your franchise.</h3><p>Ten current teams, managers and roster counts are open below. Search also finds names across all 228 supplied roster references.</p><a class="primary" href="#league-title">Go to the league register</a></section>`;
}
$('#team-evidence').innerHTML = member ? memberMarkup() : publicMarkup();

function renderRegister() {
  const query = $('#league-search').value.trim().toLocaleLowerCase();
  const ranks = new Map(data.home.hub.standings.map(s => [s.team.id,s]));
  const rows = directory.filter(d => [d.identity.name,d.identity.managerName,...d.players.map(p=>p.fullName)].some(x => x.toLocaleLowerCase().includes(query)));
  const order = $('#league-sort').value;
  rows.sort((a,b) => order === 'name' ? a.identity.name.localeCompare(b.identity.name) : order === 'roster' ? b.players.length-a.players.length || Number(a.identity.id)-Number(b.identity.id) : ranks.get(a.identity.id).rank-ranks.get(b.identity.id).rank);
  $('#result-count').textContent = `${rows.length} of ${directory.length} teams${query ? ` match “${$('#league-search').value}”` : ' · Search spans 228 unique roster references'}`;
  $('#register').innerHTML = rows.length ? `<div class="register-labels" aria-hidden="true"><span>#</span><span>Team / manager / roster</span><span>W–L</span><span>PF</span></div><ol class="register-list">${rows.map(d => {
    const s = ranks.get(d.identity.id);
    const matched = query && ![d.identity.name,d.identity.managerName].some(x=>x.toLocaleLowerCase().includes(query)) ? d.players.filter(p=>p.fullName.toLocaleLowerCase().includes(query)) : [];
    return `<li><span class="rank num">${s.rank}</span><div class="team-name">${teamLink(d.identity)}<small>${esc(d.identity.managerName)} · <a href="/teams/${esc(d.identity.id)}#team-roster">${d.players.length} roster players</a>${member && d.identity.id===summary.team.id ? ' · Your team' : ''}</small>${d.previousSeason.ownerNote ? `<small>2025: ${d.previousSeason.wins}–${d.previousSeason.losses}. ${esc(d.previousSeason.ownerNote)}</small>` : ''}${matched.length ? `<p class="matched">Matching players: ${matched.map(p=>playerLink(p.id,p.fullName)).join(', ')}</p>` : ''}</div><span class="record num"><small>W–L</small>${record(s)}</span><span class="pf num"><small>PF</small>${(s.pointsFor/100).toFixed(2)}</span></li>`;
  }).join('')}</ol>` : '<p>No match. Clear the search to return to all ten teams.</p>';
}
$('#league-search').addEventListener('input',renderRegister);
$('#league-sort').addEventListener('change',renderRegister);
renderRegister();

function modelEvidence(p) {
  const r = p.result;
  return `<details class="secondary"><summary>Saved source details</summary><div><p>${esc(r.probabilityLabel)}</p><dl><dt>Saved</dt><dd>${esc(date(data.weekly.generatedAt))}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Input snapshot</dt><dd>${r.snapshot ? esc(JSON.stringify(r.snapshot)) : 'Unavailable in fixture'}</dd><dt>Slate snapshot</dt><dd>${data.weekly.snapshot ? esc(JSON.stringify(data.weekly.snapshot)) : 'Unavailable in fixture'}</dd><dt>Evidence</dt><dd>${esc([...p.evidence,...r.evidence].join(' ') || 'No evidence supplied')}</dd><dt>Source message</dt><dd>${esc(p.message)}</dd></dl></div></details>`;
}
function slateMarkup() {
  const pairs = [...new Map(directory.filter(d=>d.currentMatchup).map(d=>[`${d.currentMatchup.home.id}/${d.currentMatchup.away.id}`,d.currentMatchup])).values()];
  return `<p class="small muted">${!data.weekly ? 'Saved model slate unavailable; current pairs remain.' : `${data.weekly.status === 'stale' ? 'STALE outputs; their freshness window has passed. ' : ''}Saved ${date(data.weekly.generatedAt)}. Five returned choices; confidence is independent.`} Model probabilities are not calibrated sports odds.</p><div class="pair-list">${pairs.map(pair => {
    const p = data.weekly?.matchups.find(p=>p.teamIds.includes(pair.home.id)&&p.teamIds.includes(pair.away.id));
    const r = p?.result, selected = returned(p);
    return `<article class="pair-row"><div class="pair-score"><div>${teamLink(pair.home)}<small>Current <span class="num">${pair.homePoints == null ? 'Pending' : Number(pair.homePoints).toFixed(1)}</span></small></div><div>${teamLink(pair.away)}<small>Current <span class="num">${pair.awayPoints == null ? 'Pending' : Number(pair.awayPoints).toFixed(1)}</span></small></div></div>${r ? `<p class="returned">Returned ${esc(teams.get(r.choice)?.name ?? r.choice)} <b class="num">${selected ? pct(selected.probability) : 'Unavailable'}</b></p><p class="small">${r.probabilities.filter(v=>v.choice!==r.choice).map(v=>`${esc(teams.get(v.choice)?.name ?? v.choice)} <span class="num">${pct(v.probability)}</span>`).join(' · ')} · Confidence <span class="num">${pct(r.confidence)}</span></p>${modelEvidence(p)}` : '<p class="small muted">Saved result unavailable; no probabilities inferred.</p>'}</article>`;
  }).join('')}</div><a class="action" href="/ai-decides">Read the full AI slate</a>`;
}
$('#slate-content').innerHTML = slateMarkup();
$('#current').append($('#slate')); // The shorter current arm carries the complete coexisting slate.
$('#moves-content').innerHTML = `<p class="small muted">Synthetic Week 3 fixture · ${esc(date(data.home.checkedAt))}. The add/drop legs are empty; these summaries do not identify any player movement.</p><ul class="wire-list">${data.home.hub.transactions.map(m=>`<li>${esc(m.summary)}<small>Week ${m.week} · ${esc(m.type.replaceAll('_',' '))} · ${esc(date(m.createdAt))}</small></li>`).join('')}</ul>`;

function gameMarkup(a) {
  return `<p class="eyebrow">${esc(a.id)} · ${esc(a.dateLabel)} · Unpublished sample draft</p><h3>${esc(a.game.title)}</h3><p class="small muted">${a.game.state === 'final' ? 'Verified 2025 final; game date not supplied here.' : `Upcoming Week ${a.game.leagueWeek} pairing inside this dated preview.`} Separate from current Week 3.</p><p>${esc(a.game.context)}</p><div class="archive-pair">${a.game.teamIds.map((id,i)=>`<div>${teamLink(teams.get(id))}${a.game.scores ? `<span class="num">${Number(a.game.scores[i]).toFixed(1)}</span>` : ''}</div>`).join('')}</div><details class="secondary"><summary>Selection and edition sources</summary><div><p>${esc(a.game.selectionReason)}</p><p class="small">Edition bounds: ${esc(a.startsAt)} through ${esc(a.endsAt)} (end exclusive). Publication: ${a.publishedAt ? esc(date(a.publishedAt)) : 'Not published'}.</p><ul class="source-list">${a.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><small>Checked ${esc(s.checkedAt)}</small></li>`).join('')}</ul></div></details><a class="action" href="/weekly/${esc(a.id)}">Open this edition</a>`;
}
function spotlightMarkup(p) {
  return `<article class="story sub-branch"><p class="eyebrow">${esc(p.periodLabel)}</p><div class="story-identity">${portrait(p.playerId)}<p>${playerLink(p.playerId,p.name)}<small>${esc(p.position)} · ${teamLink(teams.get(p.teamId))}</small></p></div><h3>${esc(p.headline)}</h3><p>${esc(p.opinion)}</p><div class="stats">${p.stats.map(s=>`<div><strong class="num">${esc(s.value)}</strong><small>${esc(s.label)}</small></div>`).join('')}</div><p class="small muted">${esc(p.statPeriod)}. Editorial opinion, not a computed current-week award.</p><details class="secondary"><summary>Why this pick / source</summary><div><p>${esc(p.selectionReason)}</p><a href="${esc(p.source.url)}">${esc(p.source.label)}</a><p class="small muted">Checked ${esc(p.source.checkedAt)}. Team link uses the supplied current roster identity.</p></div></details></article>`;
}
const opening = data.archive.find(a=>a.id==='2026-W41');
const older = data.archive.find(a=>a.id==='2026-W40');
$('#editorial-content').innerHTML = `<div class="dated-fork">${opening ? `<section class="branch dated-opening">${gameMarkup(opening)}</section>` : '<p>Opening draft unavailable.</p>'}${older ? `<section class="branch dated-final">${gameMarkup(older)}<ul class="wire-list">${older.happenings.map(h=>`<li><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p><small>${esc(h.dateLabel)}</small></li>`).join('')}</ul></section>` : '<p>Historical draft unavailable.</p>'}</div>${opening ? `<div class="story-fork">${opening.playerSpotlights.map(spotlightMarkup).join('')}</div><section class="branch dated-wire"><h3>The October wire</h3><p class="small muted">Happenings retained from the Oct 5–11 draft. These are separate from the synthetic November move summaries.</p><ul class="october-wire">${opening.happenings.map(h=>`<li><p class="eyebrow">${esc(h.dateLabel)}</p><a href="${esc(h.href)}">${esc(h.title)}</a><p>${esc(h.text)}</p></li>`).join('')}</ul></section>` : ''}`;

// Native disclosure depth stays at its own source; all primary branches stay open.
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const active = document.activeElement;
  const disclosure = active?.closest('details[open]') ?? document.querySelector('.menu[open]');
  if (disclosure) { disclosure.open = false; disclosure.querySelector('summary').focus(); }
});
document.querySelector('.menu nav').addEventListener('click',event=>{if(event.target.closest('a')) $('.menu').open=false;});
document.documentElement.dataset.homepageReady = '09';
