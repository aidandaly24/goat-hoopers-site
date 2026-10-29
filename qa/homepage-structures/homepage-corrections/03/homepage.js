import { inventory, data, mode, aiState, esc, money } from '../../data.js';

const directory = data.home.directory;
const teams = new Map(directory.map(e => [e.identity.id, e.identity]));
const personal = mode === 'member' ? data.personal.summary : null;
// The home-edition ids disagree with its prose. The coherent, dated archive
// edition is editorial only; the directory owns all current pairings.
const edition = data.archive[0];
const pairs = [...new Map(directory.filter(e => e.currentMatchup).map(e => {
  const m = e.currentMatchup;
  return [`${m.home.id}:${m.away.id}`, m];
})).values()];
const feature = pairs.find(m => personal && [m.home.id, m.away.id].includes(personal.team.id)) ?? pairs[0];
const record = t => `${t.wins}–${t.losses}${t.ties ? `–${t.ties}` : ''}`;
const teamName = id => teams.get(String(id))?.name ?? String(id);
const teamLink = (id, text) => `<a href="/teams/${esc(id)}">${esc(text ?? teamName(id))}</a>`;
const playerLink = (id, name) => `<a href="/player/${esc(id)}">${esc(name)}</a>`;
const pct = n => `${Math.round(n * 100)}%`;
const score = n => n == null ? '<span class="pending">Pending</span>' : n.toFixed(1);
const date = v => v == null ? 'Not supplied' : new Date(v).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';
const portrait = (id, name, cls = '') => inventory.portraits[id] ? `<img class="portrait ${cls}" src="${esc(inventory.portraits[id])}" alt="${esc(name)}" loading="lazy" width="220" height="160">` : '';
const contents = [{id:'week',label:'This week'}, ...(personal ? [{id:'club',label:'Your club'},{id:'scout',label:'Scoutbook'}] : []), {id:'league',label:'The league'},{id:'edition',label:'The edition'},{id:'archive',label:'The archive'},{id:'play',label:'Play & tools'}];
const chapterMark = (id, label) => `<div class="chapter-mark"><p>${String(contents.findIndex(c => c.id === id) + 1).padStart(2,'0')} / ${label}</p><a href="#contents">Contents</a></div>`;
const pickFor = m => data.weekly?.matchups.find(p => p.teamIds.includes(m.home.id) && p.teamIds.includes(m.away.id));

function evidence(pick) {
  const r = pick?.result;
  if (!r) return '<p>No saved result supplied for this pairing.</p>';
  return `<dl class="source-facts"><dt>Returned choice</dt><dd>${esc(teamName(r.choice))}</dd><dt>Probabilities</dt><dd>${r.probabilities.map(p => `${esc(teamName(p.choice))} ${pct(p.probability)}`).join(' · ')}</dd><dt>Confidence</dt><dd>${pct(r.confidence)}; independent of probability</dd><dt>Saved</dt><dd>${date(data.weekly.generatedAt)}</dd><dt>Model / prompt</dt><dd>${esc(r.model)} / ${esc(r.promptVersion)}</dd><dt>Snapshots</dt><dd>Input: ${r.snapshot ? esc(JSON.stringify(r.snapshot)) : 'Not supplied (null)'}. Slate: ${data.weekly.snapshot ? esc(JSON.stringify(data.weekly.snapshot)) : 'Not supplied (null)'}.</dd><dt>Evidence</dt><dd>${[...(pick.evidence ?? []), ...(r.evidence ?? [])].map(esc).join(' ') || 'No further evidence returned.'}</dd><dt>Basis</dt><dd>${esc(r.probabilityLabel)}. Saved ${esc(data.weekly.season)}, Week ${data.weekly.week}.</dd></dl>`;
}

function pairRow(m, index) {
  const pick = pickFor(m), r = pick?.result;
  const missing = aiState === 'missing' || !r;
  const stale = aiState === 'stale' || data.weekly?.status === 'stale';
  return `<article class="pair-row" aria-label="Pairing ${index + 1}"><p class="pair-status">W${m.week} · Incomplete${personal && [m.home.id,m.away.id].includes(personal.team.id) ? ' · Your pairing' : ''}</p><div class="pair-line"><strong>${teamLink(m.home.id)}</strong><span class="number">${score(m.homePoints)}</span></div><div class="pair-line"><strong>${teamLink(m.away.id)}</strong><span class="number">${score(m.awayPoints)}</span></div>${missing ? '<p class="saved-choice">Saved AI unavailable.</p><p class="fine">No probabilities supplied.</p>' : `<p class="saved-choice">${stale ? 'Stale saved choice' : 'Returned choice'}<br><strong>${esc(teamName(r.choice))}</strong></p><div class="probabilities">${r.probabilities.map(p => `<p><span>${esc(teamName(p.choice))}</span><strong>${pct(p.probability)}</strong></p>`).join('')}</div><p class="fine">Confidence ${pct(r.confidence)} · ${stale ? 'past saved context; not a current forecast' : 'separate from probability'}</p><details class="evidence"><summary>Saved evidence</summary>${evidence(pick)}</details>`}</article>`;
}

function cover() {
  const anchorFor = id => data.faces.find(f => f.team.id === id)?.player;
  const pairTeam = (t, n) => {
    const p = anchorFor(t.id);
    return `<div class="feature-team"><div class="team-identity"><p class="kicker">${personal?.team.id === t.id ? 'Your team' : 'Week 3 opponent'}</p><h2>${teamLink(t.id)}</h2><p>${esc(t.managerName)} · ${record(t)}</p></div><div class="feature-score number">${score(n)}</div>${p ? `<figure>${portrait(p.id,p.name)}<figcaption>${esc(p.name)}<br><span>Current roster anchor</span></figcaption></figure>` : ''}</div>`;
  };
  return `<section id="week" class="cover" aria-labelledby="cover-title" tabindex="-1"><div class="issue-line"><div class="page-width"><span>GOAT Hoopers / The programme</span><span>${mode === 'member' ? 'Member' : 'Public'} edition · fixture 12 Nov 2026</span></div></div><div class="page-width"><div class="cover-heading"><div><p class="kicker">Season 2026 / ${directory.length} franchises / Week ${feature.week}</p><h1 id="cover-title">The week<br>in play.</h1></div><div class="cover-intro"><p>${personal ? `The programme for <strong>${esc(personal.team.name)}</strong>.` : 'The whole league, from the opening pairing to the last word.'}</p><p>Five matchups to follow. A league to scout. A little history to settle.</p><a class="button orange" href="${personal ? '/team' : '/teams'}">${personal ? 'My team' : 'Meet the teams'}</a></div></div><nav class="contents" id="contents" aria-label="Programme contents">${contents.map((c,i) => `<a href="#${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.label}</a>`).join('')}</nav><div class="cover-spread"><div class="feature-match"><div class="match-heading"><p class="kicker">${personal ? 'Your pairing' : 'Opening pairing'} / Week ${feature.week}</p><p>Incomplete · no final result</p></div>${pairTeam(feature.home,feature.homePoints)}${pairTeam(feature.away,feature.awayPoints)}<p class="score-note">0.0 is a known zero. Pending means no score supplied.</p></div><aside class="cover-note"><p class="kicker">The slate</p><h2>Every game<br>is still open.</h2><p>All five fixture pairings are incomplete. The saved model slate sits alongside the scores below.</p><p class="fine">${aiState === 'missing' ? 'Saved AI unavailable. The matchups remain.' : aiState === 'stale' ? 'Stale saved context, 10 Nov 2026. These are not current forecasts.' : 'Saved 10 Nov 2026, 12:00 UTC. Model probabilities are not calibrated sports odds.'}</p><a class="text-link" href="#decisions">Read the five pairings</a><a class="text-link" href="/ai-decides">Open AI Decides</a></aside></div></div></section><section id="decisions" class="decisions page-width" aria-labelledby="decisions-title" tabindex="-1"><div class="spread-heading"><div><p class="kicker">Scores & saved model context</p><h2 id="decisions-title">Five pairings. One slate.</h2></div><p class="fine">Synthetic scores / 2026 Week 3<br>${aiState === 'stale' ? 'Stale saved choices; no current forecasts.' : aiState === 'missing' ? 'AI unavailable; no probabilities invented.' : 'Returned choices and probabilities preserved as supplied.'}</p></div><div class="slate-grid">${pairs.map(pairRow).join('')}</div></section>`;
}

function club() {
  if (!personal) return '';
  const s = personal, v = s.valuation;
  return `<section class="club" id="club" aria-labelledby="club-title" tabindex="-1"><div class="page-width">${chapterMark('club','Your club')}<div class="club-spread"><div class="club-name"><p class="kicker">${esc(s.team.managerName)} / 2026</p><h2 id="club-title">${esc(s.team.name)}</h2><dl class="club-record"><div><dt>Record</dt><dd>${record(s.team)}</dd></div><div><dt>Standing</dt><dd>${s.standing.rank}<span> / ${directory.length}</span></dd></div><div><dt>Roster</dt><dd>${s.coverage.roster}</dd></div></dl><a class="button dark" href="/team">Go to my team</a><a class="text-link" href="/teams/${esc(s.team.id)}#team-roster">Full roster</a></div><div class="club-value"><p class="kicker">${v.complete ? 'Current modeled FAAB value' : 'Partial modeled FAAB subtotal'}</p><p class="value-total number">${money(v.total)}</p><p>${v.priced} priced · ${v.unpriced} unpriced · ${esc(s.market.pricingBasis)} basis${v.rank ? ` · Value rank ${v.rank.rank} of ${v.rank.teams}${v.rank.tied ? ', tied' : ''}` : ''}</p><p class="fine">Computed ${date(s.market.updatedAt)}. Model values are not a cash balance.</p><div class="value-anchors">${s.players.map(p => `<figure>${portrait(p.id,p.name)}<figcaption>${playerLink(p.id,p.name)}<strong class="number">${money(p.value)}</strong><span>${esc(p.position)} · Up ${p.changePct}% (fixture)</span></figcaption></figure>`).join('')}</div><details class="value-ledger"><summary>All ${s.rosterValues.length} roster values</summary><div class="value-grid">${s.rosterValues.map(p => `<div class="value-row">${playerLink(p.id,p.name)}<span>${esc(p.position)}</span><strong class="number">${money(p.value)}</strong></div>`).join('')}</div><p class="fine">${v.knownRoster ? 'Known roster' : 'Roster not fully known'}; ${v.priced}/${s.coverage.roster} priced. Source checked ${date(s.checkedAt)}.</p></details><div class="value-actions"><a class="text-link" href="/stocks#player-board">Player market</a><a class="text-link" href="/trade-analyzer">Analyze a trade</a></div><p class="fine history-note">${esc(inventory.missing.history)}</p></div></div></div></section>`;
}

function formRows(rows, unit) {
  return rows.map(p => `<div class="form-row"><div><strong>${playerLink(p.id,p.name)}</strong><p class="fine">${esc(p.note)}</p></div><p class="form-number"><strong class="number">${p.value}</strong><span>${unit}<br>${p.games} GP</span></p></div>`).join('');
}

function scout() {
  if (!personal) return '';
  const s = personal, g = s.playerGuide;
  return `<section class="scout page-width" id="scout" aria-labelledby="scout-title" tabindex="-1">${chapterMark('scout','Scoutbook')}<div class="scout-heading"><h2 id="scout-title">A closer<br>look.</h2><p>A notebook for ${esc(s.team.name)}.<br>Form, completed-week performance and the team wire each tell a different story.</p></div><div class="notebook"><div class="form-column"><p class="kicker">In-season form / 2026</p><h3>Players to watch</h3><p class="fine">EMA fantasy points per game</p>${formRows(g.watch.rows,'EMA FP/G')}<p class="fine">${esc(g.watch.message)}</p></div><div class="completed-column"><p class="kicker">The completed week</p><h3>What the scores say</h3><p class="fine">${esc(g.period)}</p><div class="completed-split"><div><h4>Your best</h4>${formRows(g.best,'FP')}</div><div><h4>The rough week</h4>${formRows(g.rough,'FP')}</div></div><p class="fine">${esc(g.coverage)}</p><p class="fine">${g.best.length} best and ${g.rough.length} rough from ${g.eligiblePlayed} eligible players. Lists can overlap. ${esc(g.recapMessage)}</p><p class="status-note">${esc(inventory.missing.recap)}</p></div></div><div class="team-wire"><div><p class="kicker">Team wire</p><h3>Keep an eye on it.</h3><a class="text-link" href="/intel">All news</a></div><div>${s.news.map(n => `<article><h4><a href="${esc(n.url)}">${esc(n.headline)}</a></h4><p class="fine">${esc(n.outlet.name)} · ${date(n.publishedAt)} · synthetic</p></article>`).join('')}</div><div><p class="kicker">Recent move / Week 3</p>${s.moves.map(m => `<p>${esc(m.summary)}</p><p class="fine">${esc(m.type.replaceAll('_',' '))} · ${date(m.createdAt)}<br>Synthetic move. No add/drop legs supplied.</p>`).join('')}<a class="text-link" href="/transactions">Transactions</a></div></div></section>`;
}

function league() {
  return `<section class="league" id="league" aria-labelledby="league-title" tabindex="-1"><div class="page-width">${chapterMark('league','The league')}<div class="spread-heading"><h2 id="league-title">Ten franchises.<br>All accounted for.</h2><p>2026 fixture standings and every roster.<br>Six playoff places. Playoffs start Week ${data.home.hub.season.playoffWeekStart}.</p></div><div class="league-standings"><div><p class="kicker">2026 standings / synthetic</p><table class="standing-table"><caption class="sr-only">Current fixture standings, fantasy points for</caption><thead><tr><th scope="col">Rank</th><th scope="col">Team / manager</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s => `<tr${personal?.team.id === s.team.id ? ' class="your-standing"' : ''}><td>${s.rank}</td><th scope="row">${teamLink(s.team.id)}<span class="fine">${esc(s.team.managerName)}${personal?.team.id === s.team.id ? ' · Your team' : ''}</span></th><td>${record(s)}</td><td>${(s.pointsFor/100).toFixed(1)}</td></tr>`).join('')}</tbody></table></div><aside class="league-margin"><p class="kicker">Around the league</p><h3>The move ledger</h3>${data.home.hub.transactions.map(t => `<article><p>${esc(t.summary)}</p><p class="fine">Week ${t.week} · ${date(t.createdAt)}<br>Synthetic; no add/drop legs supplied.</p></article>`).join('')}<a class="text-link" href="/transactions">See transactions</a><div class="power-note"><h4>Lineup Power</h4><p class="fine">${esc(inventory.missing.power)}</p><p class="fine">No Power rank is inferred from standings or market values.</p></div></aside></div><div class="register-heading"><div><p class="kicker">The franchise register</p><h3>Know the opposition.</h3><p class="fine">One current modeled-value anchor per team. All ${new Set(directory.flatMap(e=>e.players.map(p=>p.id))).size} unique player references remain in the roster details.</p></div><label>Find a team or player<input type="search" id="roster-search" placeholder="Name, manager, position or NBA team" autocomplete="off"></label></div><p class="fine" id="roster-count" aria-live="polite">${directory.length} franchises shown</p><div class="franchise-register">${directory.map(e => {
    const t=e.identity, f=data.faces.find(f=>f.team.id===t.id), m=e.currentMatchup;
    const search=`${t.name} ${t.managerName} ${e.players.map(p=>`${p.fullName} ${p.position} ${p.nbaTeam}`).join(' ')}`.toLowerCase();
    return `<article class="franchise" data-search="${esc(search)}"><div class="franchise-summary">${f?.player ? portrait(f.player.id,f.player.name) : ''}<div><h4>${teamLink(t.id)}</h4><p class="fine">${esc(t.managerName)}${f?.champion ? ' · 2025 champion' : ''}</p>${f?.player ? `<p>${playerLink(f.player.id,f.player.name)}<br><span class="fine">${money(f.player.value)} modeled FAAB · ${esc(f.player.position)}</span></p>` : '<p>Anchor unavailable</p>'}<p class="fine">${m ? `W${m.week} vs ${esc(m.home.id===t.id ? m.away.name : m.home.name)} · incomplete` : 'Opponent unavailable'}</p></div></div><details class="roster-details"><summary>${e.players.length} players / Full roster references</summary><p><a href="/teams/${esc(t.id)}#team-roster">Open team roster</a></p><ul class="roster-list">${e.players.map(p=>`<li>${playerLink(p.id,p.fullName)}<span class="fine">${esc(p.position)} · ${esc(p.nbaTeam)}</span></li>`).join('')}</ul><p class="fine">2025: ${e.previousSeason.wins}–${e.previousSeason.losses}, finish ${e.previousSeason.finish}. ${esc(e.previousSeason.ownerNote ?? 'Previous-season franchise record.')}</p></details></article>`;
  }).join('')}</div><p id="roster-empty" hidden>No matching franchises. Try another name, position or NBA team.</p><a class="text-link" href="/teams">All team profiles</a></div></section>`;
}

function sources(items) {
  return `<ul class="source-list">${items.map(s=>`<li><a href="${esc(s.url)}">${esc(s.label)}</a><span class="fine">Checked ${esc(s.checkedAt)}</span></li>`).join('')}</ul>`;
}

function story(p, i) {
  return `<article class="player-story story-${i}"><div class="story-image">${portrait(p.playerId,p.name)}</div><div class="story-copy"><p class="kicker">${esc(p.periodLabel)}</p><h3>${playerLink(p.playerId,p.name)}</h3><p class="fine">${esc(p.position)} / ${teamLink(p.teamId)}</p><h4>${esc(p.headline)}</h4><p>${esc(p.opinion)}</p><div class="story-stats">${p.stats.map(s=>`<p><strong class="number">${esc(s.value)}</strong><span>${esc(s.label)}</span></p>`).join('')}</div><p class="fine">${esc(p.statPeriod)}</p><details><summary>Why this pick & source</summary><p>${esc(p.selectionReason)}</p><p><a href="${esc(p.source.url)}">${esc(p.source.label)}</a><br>Checked ${esc(p.source.checkedAt)}</p></details></div></article>`;
}

function editorial() {
  return `<section class="edition page-width" id="edition" aria-labelledby="edition-title" tabindex="-1">${chapterMark('edition','The edition')}<div class="edition-opening"><div><p class="kicker">${esc(edition.dateLabel)} / ${esc(edition.status)} / Opening-week editorial</p><h2 id="edition-title">${esc(edition.title)}.</h2><h3>${esc(edition.game.title)}</h3><p class="editorial-deck">${esc(edition.game.context)}</p><p class="fine">${esc(edition.game.note)} · Week ${edition.game.leagueWeek} · Upcoming<br>${edition.game.teamIds.map(id=>teamLink(id)).join(' / ')} · scores not supplied</p><p class="status-note">Dated opening-week draft. This is separate from the current Week 3 fixture and is not an official current-week award.</p><details><summary>Selection & edition sources</summary><p>${esc(edition.game.selectionReason)}</p><p class="fine">${esc(edition.startsAt)} through ${esc(edition.endsAt)} (end exclusive). Not published.</p>${sources(edition.sources)}</details><a class="text-link" href="/weekly/${esc(edition.id)}">Read this dated edition</a></div><aside class="dated-wire"><p class="kicker">Dated October happenings</p>${edition.happenings.map(h=>`<article><p class="fine">${esc(h.dateLabel)}</p><h4><a href="${esc(h.href)}">${esc(h.title)}</a></h4><p>${esc(h.text)}</p></article>`).join('')}</aside></div><div class="story-spread">${edition.playerSpotlights.map(story).join('')}</div><p class="fine edition-note">Three editorial opinions with their supplied periods. NBA and college averages are not fantasy-week scores.</p></section>`;
}

function archive() {
  const old=data.archive[1], g=old.game;
  return `<section class="archive" id="archive" aria-labelledby="archive-title" tabindex="-1"><div class="page-width">${chapterMark('archive','The archive')}<div class="archive-spread"><div><p class="kicker">A league with a past</p><h2 id="archive-title">Before<br>this week.</h2><div class="archive-entry"><p class="fine">${esc(edition.dateLabel)} · Draft</p><h3>${esc(edition.title)}</h3><p>${esc(edition.game.title)}</p><a class="text-link" href="/weekly/${esc(edition.id)}">Opening-week edition</a></div><div class="archive-entry"><p class="fine">${esc(old.dateLabel)} · Draft</p><h3>${esc(old.title)}</h3><p>${esc(old.happenings[0].text)}</p><a class="text-link" href="/weekly/${esc(old.id)}">The title edition</a></div><p class="fine">Both archive entries are unpublished drafts. Historical results are separate from recorded team-value history.</p></div><article class="championship"><p class="kicker">2025 / Inaugural final / Historical result</p><h3>${esc(g.title)}</h3><div class="final-score">${g.teamIds.map((id,i)=>`<div><strong class="number">${g.scores[i].toFixed(1)}</strong><p>${teamLink(id)}</p></div>`).join('')}</div><p>${esc(g.context)}</p><details><summary>Historical context & sources</summary><p>${esc(g.selectionReason)}</p><p class="fine">${esc(old.startsAt)} through ${esc(old.endsAt)} (end exclusive). Not published.</p>${old.happenings.map(h=>`<p><a href="${esc(h.href)}">${esc(h.title)}</a> · ${esc(h.dateLabel)}<br>${esc(h.text)}</p>`).join('')}${sources(old.sources)}</details><div class="archive-actions"><a class="text-link" href="/history">Explore league history</a><a class="text-link" href="/weekly">All weekly editions</a></div></article></div></div></section>`;
}

function play() {
  const tools=[['/intel','News','League intelligence'],['/stocks#player-board','Stocks','Modeled player values'],['/ai-decides','AI Decides','Saved picks & experiments'],['/teams','Teams','Every franchise'],['/transactions','Transactions','The move ledger'],['/trade-analyzer','Trade analyzer','Compare a proposed deal'],['/history','History','Past league seasons'],['/weekly','Weekly archive','Dated editorial']];
  return `<section class="play" id="play" aria-labelledby="play-title" tabindex="-1"><div class="page-width">${chapterMark('play','Play & tools')}<div class="play-spread"><div><p class="kicker">Between matchups</p><h2 id="play-title">Take a few<br>free throws.</h2><p>The existing practice game. No fantasy standings or invented rewards attached.</p><a class="button dark" href="/arcade/free-throw">Play Free Throw</a><a class="text-link" href="/arcade">More from the arcade</a></div><a class="game-image" href="/arcade/free-throw" aria-label="Open Free Throw practice"><img src="${esc(inventory.assets.game)}" alt="Free Throw practice preview" width="800" height="450" loading="lazy"></a></div><div class="tool-register"><h3>Where next?</h3><div>${tools.map(([href,label,description])=>`<a href="${href}"><strong>${label}</strong><span>${description}</span></a>`).join('')}</div></div></div></section>`;
}

document.querySelector('#programme').innerHTML = cover()+club()+scout()+league()+editorial()+archive()+play();
document.querySelector('#comparison').href=`?view=${mode==='member'?'public':'member'}&ai=${esc(aiState)}`;
document.querySelector('#comparison').textContent=mode==='member'?'Read the public edition':'Read the member edition';
document.querySelector('#fixture-states').innerHTML = `AI fixture states: <a href="?view=${mode}&ai=ready">Saved</a> / <a href="?view=${mode}&ai=stale">Stale</a> / <a href="?view=${mode}&ai=missing">Unavailable</a>`;

document.querySelector('#roster-search').addEventListener('input', e => {
  const q=e.target.value.trim().toLowerCase();
  let count=0;
  document.querySelectorAll('.franchise').forEach(row => {
    row.hidden=!row.dataset.search.includes(q);
    if (!row.hidden) count++;
  });
  document.querySelector('#roster-count').textContent=`${count} of ${directory.length} franchises shown`;
  document.querySelector('#roster-empty').hidden=count>0;
});
// Native anchors keep the full document, direct URLs and browser history.
// Native details own optional evidence; no chapter is swapped or made inert.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open=e.target.closest('details[open]');
  if (open) { open.open=false; open.querySelector('summary').focus({preventScroll:true}); }
});
const markAnchor = () => document.querySelectorAll('.contents a').forEach(a => {
  if (a.hash === location.hash) a.setAttribute('aria-current','location');
  else a.removeAttribute('aria-current');
});
window.addEventListener('hashchange',markAnchor);
markAnchor();
await document.fonts.ready;
document.documentElement.dataset.homepageReady='03';
