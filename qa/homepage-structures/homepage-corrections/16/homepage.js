import {inventory, data, mode, aiState, esc, money} from '../../data.js';

const personal = mode === 'member' && data.personal.kind === 'member' ? data.personal.summary : null;
const teams = data.home.directory;
const face = id => data.faces.find(f => f.team.id === String(id));
const identity = id => teams.find(t => t.identity.id === String(id))?.identity;
const link = (href, text, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}">${esc(text)}</a>`;
const teamLink = team => link(`/teams/${team.id}`, team.name);
const score = value => value == null ? 'Pending' : Number(value).toFixed(1);
const record = team => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ''}`;
const pct = value => `${Math.round(value * 100)}%`;
const games = teams.map(t => t.currentMatchup).filter((game, i, all) => all.findIndex(g => g.home.id === game.home.id && g.away.id === game.away.id) === i);
const lead = personal?.matchup || games[0];
const latestEdition = data.archive[0];
const priorEdition = data.archive[1];
const portrait = (id, cls = '', alt = '') => inventory.portraits[id] ? `<img class="${cls}" src="${esc(inventory.portraits[id])}" width="240" height="240" alt="${esc(alt)}">` : '';
const savedFor = game => data.weekly?.matchups.find(p => p.teamIds.includes(game.home.id) && p.teamIds.includes(game.away.id));

function savedCall(game, prominent = false) {
  const pick = savedFor(game);
  if (!pick?.result) return `<p class="saved-call">Saved AI unavailable. ${link('/ai-decides', 'Open AI Decides ↗')}</p>`;
  const result = pick.result;
  const returned = result.probabilities.find(p => p.choice === result.choice);
  const alternate = result.probabilities.find(p => p.choice !== result.choice);
  return `<div class="saved-call ${prominent ? 'lead-call' : ''}"><span>${aiState === 'stale' ? 'Stale saved call' : 'Saved call · Nov 10'}</span><p>${teamLink(identity(result.choice))} <strong>${pct(returned.probability)}</strong></p><small>Alternate ${pct(alternate.probability)} · confidence ${pct(result.confidence)}. Experimental, not calibrated odds.</small>${prominent ? link('/ai-decides', 'Inspect all five calls ↗') : ''}</div>`;
}

function hero() {
  return `<section class="court-spread" aria-labelledby="lead-title" id="matchup">
    <div class="lead-copy"><p class="eyebrow">${personal ? 'Back in your league, aidandaly20.' : 'Ten franchises. One league.'}</p><h1 id="lead-title">Your league,<br><span>in play.</span></h1><p class="lead-deck">The week is open. The matchups are set.<br>Here’s what’s happening on our court.</p></div>
    <div class="lead-matchup"><p class="eyebrow">${personal ? 'Your matchup' : 'Around the court'} · Week ${lead.week}</p><div class="lead-scores">${[[lead.home, lead.homePoints], [lead.away, lead.awayPoints]].map(([team, value]) => `<div><h2>${teamLink(team)}</h2><p class="manager">${esc(team.managerName)} · ${record(team)}</p><strong class="score ${value == null ? 'pending' : ''}">${score(value)}</strong><span class="score-unit">${value == null ? 'No score supplied' : 'Fantasy points'}</span></div>`).join('')}</div><p class="score-status">Incomplete. A known 0.0 and a missing score are different states.</p><div class="hero-actions">${personal ? link('/team', 'Open my team ↗', 'action') : link('/teams', 'Find your franchise ↗', 'action')}${link('#games', 'See the other games ↓')}</div></div>
    <figure class="court-image"><img src="${esc(inventory.assets.court)}" width="1440" height="810" alt="The original GOAT Hoopers arena, with our league’s name above the hardwood"><figcaption>Home court. Same friends, another week.</figcaption></figure>
    <div class="franchise-pair" aria-label="Franchise anchors">${[lead.home, lead.away].map(t => {const f = face(t.id); return `<div>${portrait(f.player.id, 'anchor-cutout')}<p>${link(`/player/${f.player.id}`, f.player.name)}<span>${esc(t.name)}</span></p></div>`;}).join('')}</div>
  </section>`;
}

function desk() {
  if (!personal) return `<section class="public-context" id="desk" aria-labelledby="desk-title"><div><p class="eyebrow">The bar everyone’s chasing</p><h2 id="desk-title">The crown stays<br>in the conversation.</h2><p>${esc(priorEdition.game.context)}</p>${link('/history', 'Meet the league & its history ↗')}</div><div class="public-champion">${portrait('1085', 'champion-cutout')}<strong>17–4</strong><span>Josh Diddy’s Roster · 2025 season</span></div></section>`;
  const top = personal.players;
  return `<section class="team-desk" id="desk" aria-labelledby="desk-title"><header class="section-heading"><div><p class="eyebrow">Your team, at a glance</p><h2 id="desk-title">The Reaves desk.</h2></div><button type="button" id="pin-desk" aria-pressed="false">Keep this first ↑</button></header><div class="desk-layout"><div class="quote"><p class="quote-value">${money(personal.valuation.total)}</p><p>Current modeled roster value</p><div class="quote-meta"><strong>2<span>of 10 by modeled value</span></strong><strong>24/24<span>roster players priced</span></strong></div><p class="note">In-season modeled FAAB · sample Nov 12, 12:00 UTC.<br>Recorded value history and Lineup Power are unavailable.</p>${link('/stocks#player-board', 'Inspect prices ↗')}</div><div class="roster-headliners">${top.map(p => `<article>${portrait(p.id, 'desk-cutout')}<div><h3>${link(`/player/${p.id}`, p.name)}</h3><p>${esc(p.position)} · ${money(p.value)}</p><p class="change">+${p.changePct.toFixed(1)}% sample quote change</p></div></article>`).join('')}</div><div class="desk-note"><h3>A roster to work with.</h3><p>24 players. Your three highest modeled quotes are here; your full roster keeps every name and price.</p>${link('/teams/1#team-roster', 'Open all 24 players ↗')}<p class="note">Rank 1 in the sample standings is separate from modeled value rank 2.</p></div></div></section>`;
}

function league() {
  const others = games.filter(g => g !== lead && !(g.home.id === lead.home.id && g.away.id === lead.away.id));
  return `<section class="league-spread" id="league" aria-labelledby="league-title"><header class="section-heading"><div><p class="eyebrow">The whole league, in view</p><h2 id="league-title">Four more games.<br>Nine other opinions.</h2></div>${link('/teams', 'Explore all franchises ↗')}</header><div class="league-columns"><div id="games"><h3 class="subheading">Elsewhere this week</h3><p class="note">Week 3 scores are incomplete. All five pairings, including yours above, are represented.</p><ol class="other-games">${others.map(g => `<li><div class="game-teams"><p>${teamLink(g.home)}<strong>${score(g.homePoints)}</strong></p><p>${teamLink(g.away)}<strong>${score(g.awayPoints)}</strong></p></div>${savedCall(g)}</li>`).join('')}</ol></div><div class="standings"><h3 class="subheading">The table</h3><p class="note">Sample current records · PF in fantasy points</p><table><thead><tr><th scope="col" aria-label="Rank">#</th><th scope="col">Team</th><th scope="col">W–L</th><th scope="col">PF</th></tr></thead><tbody>${data.home.hub.standings.map(s => `<tr class="${personal?.team.id === s.team.id ? 'own-team' : ''}"><td>${s.rank}</td><th scope="row">${teamLink(s.team)}<span>${esc(s.team.managerName)}</span></th><td>${record(s)}</td><td>${(s.pointsFor / 100).toFixed(1)}</td></tr>`).join('')}</tbody></table>${link('/teams', 'Team profiles, rosters & last season ↗')}</div></div><div class="league-call">${savedCall(lead, true)}</div></section>`;
}

function stories() {
  return `<section class="stories" id="stories" aria-labelledby="stories-title"><header class="section-heading"><div><p class="eyebrow">Our league has a memory</p><h2 id="stories-title">More than a box score.</h2></div>${link('/weekly', 'The weekly archive ↗')}</header><div class="story-layout"><article class="lead-story"><p class="eyebrow">2025 final · archive</p><h3>The first crown.<br>The next target.</h3><p>Josh Diddy’s Roster finished 17–4 and beat papichooter in the inaugural final. Everyone else has a very clear number to chase.</p><div class="final-score"><div><strong>326.0</strong><span>Josh Diddy’s Roster</span></div><span class="versus">to</span><div><strong>251.5</strong><span>papichooter</span></div></div>${link('/history', 'Revisit the first season ↗')}</article><div class="story-notes"><article><p class="eyebrow">Oct 5–11 · draft weekly edition</p><h3>A target on the<br>champ’s back.</h3><p>${esc(latestEdition.game.context)}</p>${link(`/weekly/${latestEdition.id}`, 'Read the opening-week draft ↗')}</article><article><p class="eyebrow">Franchise history</p><h3>A rebuild to follow.</h3><p>${esc(priorEdition.happenings[0].text)}</p>${link('/teams/8', 'Meet NeuralNets ↗')}</article></div></div><div class="league-headlines"><h3 class="subheading">From the October league wire</h3>${latestEdition.happenings.map(h => `<article><time>${esc(h.dateLabel)}</time><h4>${link(h.href, h.title)}</h4><p>${esc(h.text)}</p></article>`).join('')}</div></section>`;
}

function players() {
  const spotlights = latestEdition.playerSpotlights;
  return `<section class="players-section" id="players" aria-labelledby="players-title"><header class="section-heading"><div><p class="eyebrow">Faces of the league</p><h2 id="players-title">The players.<br>The group chat.</h2></div>${link('/stocks#player-board', 'Find a player ↗')}</header><div class="editorial-players">${spotlights.map((p, i) => `<article>${portrait(p.playerId, 'editorial-cutout')}<div><p class="eyebrow">${esc(p.periodLabel)}</p><h3>${esc(p.headline)}</h3><p class="player-byline">${link(`/player/${p.playerId}`, p.name)} · ${teamLink(identity(p.teamId))}</p><p>${esc(p.opinion)}</p><dl class="player-stats">${p.stats.map(s => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join('')}</dl><p class="note">${esc(p.statPeriod)}. Draft editorial; not a current fantasy-week award.</p></div></article>`).join('')}</div>${personal ? form() : '<p class="public-invitation">Follow a franchise to make this part of the homepage yours. '+link('/account', 'Connect your team ↗')+'</p>'}</section>`;
}

function form() {
  const guide = personal.playerGuide;
  const rows = (list, unit) => `<ol>${list.map(p => `<li><span>${link(`/player/${p.id}`, p.name)}<small>${p.games} observed games</small></span><strong>${p.value.toFixed(1)}<small>${unit}</small></strong></li>`).join('')}</ol>`;
  return `<div class="form-spread"><div><h3>On your roster.<br>On our radar.</h3><p>In-season EMA fantasy points per game, across the shown games. Availability and schedule adjustment are unknown.</p>${rows(guide.watch.rows, 'EMA FP/G')}</div><div><h3>Last week’s high notes.</h3><p>Week 2 · Nov 2–9 · sample recorded fantasy points</p>${rows(guide.best, 'FP')}</div><div><h3>And the rough ones.</h3><p>Three lowest among five current-roster players with counted games.</p>${rows(guide.rough, 'FP')}</div></div><p class="note form-note">Week 2 is a completed sample period; it is separate from the incomplete Week 3 scores. DNP, no-game and unknown records are excluded. These are current-roster summaries, not an official league-wide award.</p>`;
}

function activity() {
  return `<section class="activity-section" id="activity" aria-labelledby="activity-title"><div class="activity-heading"><p class="eyebrow">The roster never sleeps</p><h2 id="activity-title">Around the wire.</h2><p>Three roster updates in the sample November 12 receipt. The source does not name individual adds or drops.</p>${link('/transactions', 'Open the transaction log ↗')}</div><ol class="activity-list">${data.home.hub.transactions.map(t => `<li><div class="activity-date"><span>12</span>Nov</div><div><p class="eyebrow">Week ${t.week} · roster move</p><h3>${teamLink(identity(t.teamIds[0]))}</h3><p>${esc(t.summary)}</p><p class="note">12:00 UTC · individual move legs unavailable</p></div></li>`).join('')}</ol></section>`;
}

function arcade() {
  return `<section class="arcade-section" id="arcade" aria-labelledby="arcade-title"><div><p class="eyebrow">Between matchups</p><h2 id="arcade-title">Take it<br>to the line.</h2><p>A little less roster talk.<br>A few more free throws.</p>${link('/arcade/free-throw', 'Play local free-throw practice ↗', 'action')}${link('/arcade', 'Explore the arcade ↗')}</div><a class="game-preview" href="/arcade/free-throw" aria-label="Open local free-throw practice"><img src="${esc(inventory.assets.game)}" width="1248" height="697" alt="GOAT free-throw practice: hoop, ball and aim controls on the original court"></a></section>`;
}

document.querySelector('#home').innerHTML = hero() + desk() + league() + stories() + players() + activity() + arcade();
document.querySelector('#edition-switch').href = `index.html?view=${personal ? 'public' : 'member'}`;
document.querySelector('#edition-switch').textContent = personal ? 'Public edition ↗' : 'Personalized edition ↗';
document.querySelector('#pin-desk')?.addEventListener('click', event => {
  const button = event.currentTarget;
  const desk = document.querySelector('#desk');
  const hero = document.querySelector('#matchup');
  const kept = button.getAttribute('aria-pressed') !== 'true';
  if (kept) hero.before(desk); else hero.after(desk);
  button.setAttribute('aria-pressed', String(kept));
  button.textContent = kept ? 'Restore court first ↓' : 'Keep this first ↑';
  button.focus({preventScroll: true});
  desk.scrollIntoView({behavior: 'instant', block: 'start'});
});
document.querySelector('.more-nav').addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.currentTarget.open = false;
  event.currentTarget.querySelector('summary').focus();
});
document.documentElement.dataset.homepageReady = '16';
