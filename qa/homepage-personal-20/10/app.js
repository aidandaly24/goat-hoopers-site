import { fixture } from '../fixture.js';

const params = new URLSearchParams(location.search);
const persona = ['reaves', 'neural', 'guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const person = fixture.personas[persona];
const member = person.kind === 'member';
const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
const positionNames = { PG: 'Point guards', SG: 'Shooting guards', SF: 'Small forwards', PF: 'Power forwards', C: 'Centers' };
const featuredPosition = persona === 'neural' ? 'PF' : 'C';
const order = [featuredPosition, ...positions.filter(position => position !== featuredPosition)];
const app = document.querySelector('#app');
document.documentElement.dataset.persona = persona;
if (params.get('stage') === 'structure') document.documentElement.dataset.stage = 'structure';
document.title = member ? `${person.team.name} — GOAT Hoopers` : 'Around the league — GOAT Hoopers';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const amount = value => value === null ? 'Unpriced' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const points = value => value === null ? 'Not returned' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const team = id => fixture.teams.find(row => row.id === id);
const teamMatchup = id => fixture.matchups.find(row => [row.home, row.away].includes(id));
const positionColor = position => `--position-color:var(--${position.toLowerCase()})`;
const homeUrl = () => `${location.pathname}${location.search}`;
const exit = (path, label, extra = '') => `<a class="exit ${extra}" href="https://goathoopers.com${esc(path)}">${esc(label)} on GOAT <span class="sr-only"> (leaves prototype)</span></a>`;
const initials = name => name.split(' ').map(word => word[0]).slice(0, 2).join('');
const avatar = player => `<span class="avatar" aria-hidden="true">${player.portrait ? `<img src="${esc(player.portrait)}" alt="" width="42" height="42" loading="lazy">` : esc(initials(player.name))}</span>`;
const quoted = player => player.modeledFaab !== null;
const groups = member ? Object.fromEntries(positions.map(position => {
  const rows = person.players.filter(player => player.position === position);
  const known = rows.filter(quoted).sort((a, b) => b.modeledFaab - a.modeledFaab || a.name.localeCompare(b.name));
  const cents = known.reduce((sum, player) => sum + Math.round(player.modeledFaab * 100), 0);
  return [position, { position, rows, known, missing: rows.filter(player => !quoted(player)), subtotal: cents / 100, cents, share: cents / Math.round(person.valuation.modeledFaabSubtotal * 100) * 100 }];
})) : {};

function header() {
  return `<header class="site-header" id="top"><div class="wrap masthead">
    <a class="brand" href="${esc(homeUrl())}" aria-label="GOAT Hoopers, local home"><img src="${esc(fixture.assets.logo)}" alt="GOAT Hoopers" width="156" height="57"></a>
    <nav class="nav" aria-label="Main"><a href="${esc(homeUrl())}" aria-current="page">Home</a><a href="#${member ? 'roster' : 'this-week'}">${member ? 'Your roster' : 'This week'}</a><a href="#league">League</a><a href="#explore">Around GOAT</a></nav>
    ${exit(member ? '/team' : '/login', member ? 'My Team' : 'Sign in', 'header-account')}
  </div></header>
  <div class="utility"><div class="wrap utility-inner"><div class="utility-left"><span class="control">2026 season <span aria-hidden="true">/</span> Week 3</span><span>Sample as of <time datetime="${fixture.asOf}">30 Oct, 08:30 UTC</time></span><a class="demo-badge" href="#sources">Synthetic demo</a></div>
  <div class="demo-control"><label for="demo-persona">Demo persona</label><select id="demo-persona"><option value="reaves" ${persona === 'reaves' ? 'selected' : ''}>Reaves Dropper</option><option value="neural" ${persona === 'neural' ? 'selected' : ''}>NeuralNets</option><option value="guest" ${persona === 'guest' ? 'selected' : ''}>Guest</option></select></div></div></div>`;
}

function holding(player, isLead = false) {
  return `<li class="holding"><button type="button" class="holding-button" ${isLead ? 'id="lead-player"' : ''} data-open="player-${esc(player.id)}" aria-label="Inspect ${esc(player.name)}">${avatar(player)}<span class="holding-name">${esc(player.name)}</span></button><span class="num quote">${amount(player.modeledFaab)}<span class="sr-only"> modeled FAAB</span></span></li>`;
}

function positionGroup(position) {
  const group = groups[position];
  const featured = position === featuredPosition;
  return `<section class="position ${featured ? 'featured' : ''}" style="${positionColor(position)}" aria-labelledby="position-label-${position}">
    <div><div class="position-heading"><h3 id="position-label-${position}">${positionNames[position]}</h3><span class="position-meta">${position} <span aria-hidden="true">·</span> ${group.rows.length} players</span></div>
    <p class="position-amount num">${amount(group.subtotal)}<span class="unit">modeled FAAB${group.missing.length ? ' · subtotal' : ''}</span></p>
    <p class="position-share"><span class="num">${group.share.toFixed(1)}%</span> of known modeled subtotal<br>${group.known.length} of ${group.rows.length} players priced</p>
    <button class="position-link" id="position-${position}" data-open="position-${position}" type="button">Inspect ${esc(positionNames[position].toLowerCase())} <span class="sr-only">holdings</span></button></div>
    <ul class="holdings" aria-label="Named ${positionNames[position].toLowerCase()} holdings; quotes in modeled FAAB">${group.known.slice(0, 2).map((player, index) => holding(player, featured && index === 0)).join('')}</ul>
    ${group.missing.length ? `<p class="unpriced-note"><strong>${group.missing.length} unpriced; no numeric allocation:</strong> ${group.missing.map(player => esc(player.name)).join(', ')}.</p>` : ''}
  </section>`;
}

function memberOverview() {
  const value = person.valuation;
  return `<section class="overview" id="roster" aria-labelledby="roster-title"><div class="section-heading"><div><p class="eyebrow"><span class="section-spacer" aria-hidden="true">&#8199;&#8199;</span>Roster composition</p><h2 id="roster-title" tabindex="-1">The shape of your roster.</h2></div><button type="button" class="button" id="primary-position" data-open="position-${featuredPosition}">${persona === 'neural' ? 'Explore your forwards' : 'Inspect your centers'}</button></div>
  <p class="section-intro">Start with a position. See the players behind its quoted share, then take a closer look.</p>
  <figure class="allocation" aria-labelledby="allocation-caption"><figcaption class="allocation-label" id="allocation-caption"><strong>Share of known modeled subtotal</strong><span>${value.priced} of ${value.roster} players priced</span></figcaption>
  <div class="allocation-ribbon" aria-hidden="true">${positions.map(position => `<span style="${positionColor(position)};flex-grow:${groups[position].cents}"></span>`).join('')}</div>
  <div class="allocation-legend">${positions.map(position => `<span class="legend-item" style="${positionColor(position)}"><span class="swatch" aria-hidden="true"></span><span>${position} <span class="num">${groups[position].share.toFixed(1)}%</span><span class="sr-only"> of known modeled subtotal</span></span></span>`).join('')}</div>
  <p class="scope-note">${value.complete ? `<strong>All ${value.roster} roster quotes are included.</strong> Shares describe modeled quotes, not player performance or a legal lineup.` : `<strong>${value.roster - value.priced} unpriced players have no numeric share.</strong> These shares cover the ${value.priced} known quotes only; they do not describe a complete roster value.`}</p></figure>
  <div class="position-grid">${order.map(positionGroup).join('')}</div>
  <p class="overview-foot"><strong>${value.complete ? 'Complete modeled quote' : 'Known-value subtotal'}: <span class="num">${amount(value.modeledFaabSubtotal)}</span> modeled FAAB.</strong> ${value.priced} of ${value.roster} priced. Computed <time datetime="${value.checkedAt}">30 Oct, 08:10 UTC</time>. An analysis unit, never a cash balance. No recorded history or comparable league value rank is supplied.</p></section>`;
}

function scoreLine(id, value, customName = null) {
  return `<p class="score-line"><span>${esc(customName || team(id).name)}</span>${value === null ? '<span class="missing">Not returned</span>' : `<span class="num">${points(value)}</span>`}</p>`;
}

function modelSummary() {
  if (person.savedAi.status !== 'ready') return `<div class="saved-estimate"><h3>Saved model context</h3><p>No saved model estimate supplied for this pairing.</p></div>`;
  const probability = person.savedAi.probabilities.find(row => row.teamId === person.teamId).probability;
  return `<div class="saved-estimate"><h3>Saved model context</h3><div class="estimate-split num">${Math.round(probability * 100)}% <span>/</span> ${Math.round((1 - probability) * 100)}%</div><p>${esc(person.team.name)} / ${esc(person.opponent.name)}. Saved 26 Oct. Synthetic estimate, not calibrated odds.</p><button type="button" class="text-button" data-open="matchup-${person.matchup.id}">Read the saved context</button></div>`;
}

function memberContext() {
  const ownScore = person.matchup.home === person.teamId ? person.matchup.homePoints : person.matchup.awayPoints;
  const opponentScore = person.matchup.home === person.teamId ? person.matchup.awayPoints : person.matchup.homePoints;
  return `<aside class="team-context" aria-labelledby="week-context-title"><div class="context-heading"><h2 id="week-context-title">Your week</h2><span>WEEK 03</span></div>
    <div class="team-standing"><p><span class="num big">${person.team.wins}–${person.team.losses}</span>2026 record</p><p><span class="num big">${person.standing.rank}<span style="font-size:.7em"> / 10</span></span>Standings position</p></div>
    <div class="matchup-mini"><h3>Week 3 matchup</h3>${scoreLine(person.teamId, ownScore, 'Your team')}${scoreLine(person.opponent.id, opponentScore)}<p class="mini-label">${ownScore === null || opponentScore === null ? 'Partial score · 0.0 is recorded; missing is not zero. No leader is inferred.' : 'Current sample score · synthetic, in progress'}</p><button class="button secondary" id="primary-matchup" type="button" data-open="matchup-${person.matchup.id}">Inspect your matchup</button></div>
    ${modelSummary()}
    <div class="team-notes"><h3>Demo update notes</h3><ul>${person.changes.map(change => `<li class="note-entry"><time datetime="${change.at}">${change.at.slice(11, 16)} UTC</time><a href="#${change.target === 'matchup' ? `matchup-${person.matchup.id}` : change.target === 'valuation' ? `position-${featuredPosition}` : `player-${person.players.find(player => player.completedWeekPoints !== null).id}`}" data-note="true">${esc(change.headline)}</a></li>`).join('')}</ul></div>
    <div class="context-links">${exit('/team', 'My Team')}${exit(`/teams/${person.teamId}`, 'Team profile')}</div></aside>`;
}

function gameRow(matchup, primary = false) {
  const yours = member && [matchup.home, matchup.away].includes(person.teamId);
  return `<li class="game-row ${yours ? 'is-yours' : ''}">${scoreLine(matchup.home, matchup.homePoints)}${scoreLine(matchup.away, matchup.awayPoints)}<div class="game-row-footer"><span class="mini-label">${yours ? 'Your matchup · ' : ''}${matchup.homePoints === null || matchup.awayPoints === null ? 'Partial score · no leader inferred' : 'Synthetic · in progress'}</span><button type="button" class="text-button" id="${primary ? 'primary-matchup' : `matchup-${matchup.id}`}" data-open="matchup-${matchup.id}" aria-label="Inspect ${esc(team(matchup.home).name)} versus ${esc(team(matchup.away).name)}">Inspect matchup</button></div></li>`;
}

function publicOverview() {
  return `<section class="overview public-overview" id="this-week" aria-labelledby="public-week-title"><div class="section-heading"><div><p class="eyebrow"><span class="section-spacer" aria-hidden="true">&#8199;&#8199;</span>League scoreboard</p><h2 id="public-week-title">Five games. One league.</h2></div><span class="eyebrow muted">Week 03</span></div><p class="section-intro">Follow the pairings, find a team, and see where everyone stands. These are fixed synthetic scores.</p><ol class="public-games">${fixture.matchups.map((matchup, index) => gameRow(matchup, index === 0)).join('')}</ol><p class="public-overview-foot">Papichooter has a recorded <span class="num">0.0</span>; NeuralNets has no returned score. A missing score is not a tie or a zero.</p></section>`;
}

function publicContext() {
  return `<aside class="team-context" aria-labelledby="public-guide-title"><div class="context-heading"><h2 id="public-guide-title">The league</h2><span>2026</span></div><div class="league-guide"><p><span class="num">10</span> teams, one season</p><p>Six teams reach the playoffs, beginning Week 20. Explore the current competition below.</p></div><div class="guest-signin"><p>Your actual team belongs to your account. Sign in on the current GOAT site for your personal home.</p><a class="button" href="https://goathoopers.com/login">Sign in on GOAT<span class="sr-only"> (leaves prototype)</span></a></div><div class="guest-league-note"><p class="eyebrow">Reading the league</p><p>Scores describe the weekly contest. Modeled FAAB quotes are a separate fantasy analysis unit. They are not cash, a performance rating or a lineup recommendation.</p></div><div class="context-links">${exit('/stocks', 'Stocks')}${exit('/teams', 'All teams')}</div></aside>`;
}

function standings() {
  return `<section aria-labelledby="competition-title"><h3 class="subheading" id="competition-title">The competition</h3><div class="standings-head" aria-hidden="true"><span>No.</span><span>Team / manager</span><span>W–L</span><span>Points for</span></div><ol class="standings" aria-label="2026 synthetic standings">${fixture.standings.map(entry => {
    const matchup = teamMatchup(entry.id);
    const opponent = team(matchup.home === entry.id ? matchup.away : matchup.home);
    const yours = member && entry.id === person.teamId;
    const old = entry.previousSeason;
    return `<li class="standing-item"><div class="standing-row"><span class="num" aria-label="Position ${entry.rank}">${entry.rank}</span><details class="team-disclosure" data-team-disclosure="${entry.id}"><summary>${esc(entry.name)}${yours ? '<span class="your-label">Your team</span>' : ''}<small>${esc(entry.manager)}</small></summary><div class="team-history"><p>Week 3 opponent: ${esc(opponent.name)}.</p><p><strong>${old.season}${old.ownerNote ? ' · previous manager' : ''}:</strong> ${old.wins}–${old.losses}, finish ${old.finish}.${old.ownerNote ? ` ${esc(old.ownerNote)}` : ''}</p>${exit(`/teams/${entry.id}`, 'Public team profile')}</div></details><span class="num" aria-label="${entry.wins} wins, ${entry.losses} losses">${entry.wins}–${entry.losses}</span><span class="num" aria-label="${entry.pointsFor} points for">${points(entry.pointsFor)}</span></div></li>`;
  }).join('')}</ol></section>`;
}

function league() {
  return `<section class="league-area" id="league" aria-labelledby="league-title"><div class="league-heading"><div><p class="eyebrow"><span class="section-spacer" aria-hidden="true">&#8199;&#8199;</span>Around the league</p><h2 id="league-title">The rest of the picture.</h2></div><p>2026 · Week 3<br>All current quantities are synthetic.</p></div><div class="league-grid">${member ? `<section aria-labelledby="pairings-title"><h3 class="subheading" id="pairings-title">This week's five pairings</h3><ol>${fixture.matchups.map(matchup => gameRow(matchup)).join('')}</ol></section>` : `<section><h3 class="subheading">A league worth getting to know.</h3><p class="section-intro">Ten teams, their managers, and the current standings. Open any team for its opponent and qualified previous-season context.</p><div class="guest-league-note"><p class="eyebrow">The numbers have different jobs</p><p>Points for and standings describe this synthetic season. A modeled roster quote is a separate view of currently priced players. No league value rank or price history is included here.</p></div><div class="guest-league-note"><p class="eyebrow">Follow a little further</p>${exit('/news', 'Read league news')}<br>${exit('/history', 'Explore league history')}<br>${exit('/arcade', 'Visit the Arcade')}</div></section>`}${standings()}</div></section>`;
}

function explore() {
  const groups = [ ['Read the league', [['/', 'Home'], ['/news', 'News'], ['/history', 'History'], ['/weekly', 'Weekly archive']]], ['Investigate', [['/stocks', 'Stocks'], ['/intel', 'Intel'], ['/ai-decides', 'AI Decides'], ['/trade-analyzer', 'Trade Analyzer']]], ['League tools', [['/teams', 'Teams'], ['/transactions', 'Transactions'], ['/draft', 'Draft'], ['/table', 'The Table']]] ];
  return `<section class="explore" id="explore" aria-labelledby="explore-title"><div class="wrap"><p class="eyebrow">On the current GOAT site · leaves this prototype</p><h2 id="explore-title">Keep your head in the league.</h2><nav class="explore-layout" aria-label="Current GOAT site destinations">${groups.map(([name, links]) => `<div><h3>${name}</h3><ul>${links.map(([path, label]) => `<li><a href="https://goathoopers.com${path}">${label} on GOAT</a></li>`).join('')}</ul></div>`).join('')}<div><h3>Take a shot</h3><ul><li><a href="https://goathoopers.com/arcade">Arcade on GOAT</a></li></ul><a href="https://goathoopers.com/arcade" aria-label="Arcade on GOAT, leaves prototype"><img class="arcade-preview" src="${fixture.assets.game}" alt="Free-throw game preview" width="288" height="126" loading="lazy"></a></div></nav></div></section>`;
}

function footer() {
  return `<footer class="footer" id="sources"><div class="wrap"><div class="footer-top"><div><h2>Synthetic demo. Real distinctions.</h2><p>Fixed sample as of 30 October 2026, 08:30 UTC. Current scores, standings, changes and modeled quantities were constructed for design, not reported league events. Identities and player references come from the authorized project fixture. Historical 2025 records retain their season and previous-manager qualifications.</p><p>Modeled FAAB is a fantasy analysis unit, never cash or real assets. Known-only shares exclude unpriced players; they say nothing about performance or a legal lineup. No recorded price history or league value rank is supplied. No live league, account, AI or backend connection.</p></div><nav class="footer-account" aria-label="Account and source navigation">${exit('/team', 'My Team')}${exit('/login', 'Sign in')}<a class="exit" href="#top">Back to top</a><a class="exit" href="../fixture.json">Read the synthetic fixture</a></nav></div><div class="footer-bottom"><a class="brand" href="${esc(homeUrl())}" aria-label="GOAT Hoopers, local home"><img src="${fixture.assets.logo}" alt="GOAT Hoopers" width="108" height="40" loading="lazy"></a><a href="#${member ? 'roster' : 'this-week'}">Back to ${member ? 'your roster' : 'this week'}</a></div></div></footer>`;
}

app.innerHTML = `${header()}<main id="main" tabindex="-1"><div class="wrap"><div class="page-heading"><div><p class="eyebrow">${member ? 'Your league. Your players.' : 'Welcome to GOAT Hoopers'}</p><h1>${member ? esc(person.team.name) : 'Around the league.'}</h1><p class="heading-description">${member ? `${esc(person.team.manager)} <span aria-hidden="true">/</span> ${person.players.length} roster players <span aria-hidden="true">/</span> A closer look at the team you follow.` : '2026 season. Ten teams. A shared obsession.'}</p></div><p class="edition">${member ? 'A personal view of a synthetic league' : 'Public league view'}<br>Friday, 30 October 2026</p></div><div class="workspace">${member ? memberOverview() + memberContext() : publicOverview() + publicContext()}</div><section class="inspector" id="inspection" aria-labelledby="inspection-title" hidden></section>${league()}</div></main>${explore()}${footer()}`;

// Screen-reader-only text keeps the visible display compact without losing units.
const hiddenStyle = document.createElement('style');
hiddenStyle.textContent = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}';
document.head.append(hiddenStyle);

let returnId = '';
let lastHash = '';
let lastOpen = '';
const inspection = document.querySelector('#inspection');

function openInspection(hash, trigger, parent = '') {
  if (trigger && !inspection.contains(trigger)) {
    if (!trigger.id) trigger.id = `return-${hash}`;
    returnId = trigger.id;
  }
  history.pushState({ qa10: true, returnId, parent }, '', `${homeUrl()}#${hash}`);
  renderInspection(true);
}

function closeInspection() {
  const oldReturn = history.state?.returnId || returnId;
  history.pushState({ qa10: true }, '', homeUrl());
  lastHash = '';
  inspection.hidden = true;
  inspection.innerHTML = '';
  document.getElementById(oldReturn || '')?.focus();
  if (!document.activeElement || document.activeElement === document.body) document.querySelector(member ? '#roster-title' : '#public-week-title').focus();
}

function panelTop(label, title) {
  return `<div class="inspector-top"><div><p class="eyebrow">${label}</p><h2 id="inspection-title" tabindex="-1">${title}</h2></div><button class="text-button" type="button" data-close>Close inspection</button></div>`;
}

function positionPanel(position) {
  const group = groups[position];
  if (!group) return '';
  const sorted = [...group.known, ...group.missing];
  return `${panelTop('Your roster · position inspection', esc(positionNames[position]))}<p class="inspector-meta"><span class="num">${amount(group.subtotal)}</span> ${group.missing.length ? 'known-value subtotal' : 'modeled FAAB'} · ${group.known.length} of ${group.rows.length} priced. <span class="num">${group.share.toFixed(1)}%</span> of the known modeled subtotal only. ${group.missing.length ? 'Unpriced players have no numeric allocation; this position is only partly measured.' : 'All players in this position have supplied quotes.'} Position labels do not assert a legal lineup.</p>
  <table class="inspection-table" data-position-inspector="${position}"><caption class="sr-only">${positionNames[position]} holdings, quotes and completed Week 2 evidence</caption><thead><tr><th scope="col">Player</th><th scope="col">Modeled FAAB</th><th scope="col">Completed Week 2 points</th></tr></thead><tbody>${sorted.map(player => `<tr><td><button type="button" data-open="player-${player.id}" data-parent="position-${position}">Inspect ${esc(player.name)}</button></td><td class="num" data-label="Modeled FAAB">${amount(player.modeledFaab)}</td><td class="num" data-label="Week 2 points">${player.completedWeekPoints === null ? 'No evidence supplied' : points(player.completedWeekPoints)}</td></tr>`).join('')}</tbody></table>
  <p class="inspector-meta">Quotes computed 30 Oct, 08:10 UTC. Counted-game evidence: Synthetic completed Week 2, 19–25 Oct 2026. Unknown evidence is not a zero or a DNP.</p><div class="inspection-foot"><button class="text-button" type="button" data-close>Back to positions</button>${exit(`/teams/${person.teamId}#team-roster`, 'Full roster')}</div>`;
}

function playerPanel(id) {
  const player = member && person.players.find(row => row.id === id);
  if (!player) return '';
  const parent = history.state?.parent || `position-${player.position}`;
  return `${panelTop('Your roster · player inspection', `<span class="player-heading">${avatar(player)}<span>${esc(player.name)}<span class="player-position" style="display:block">${player.position} · ${esc(person.team.name)}</span></span></span>`)}<div data-player-inspector="${player.id}" class="detail-grid"><section class="detail-block"><h3>Current modeled quote</h3><p class="detail-value">${amount(player.modeledFaab)}</p><p>${player.modeledFaab === null ? 'Unpriced. No numeric value or allocation is inferred for this player.' : 'Modeled FAAB. A fantasy analysis unit, not cash, a sale price or a performance rating.'}</p><p>Computed 30 October 2026, 08:10 UTC. Roster coverage: ${person.valuation.priced} of ${person.valuation.roster} players priced.${!person.valuation.complete ? ' The team subtotal and allocation include only known quotes.' : ''}</p></section><section class="detail-block"><h3>Counted-game evidence</h3><p class="detail-value">${player.completedWeekPoints === null ? 'Not supplied' : `${points(player.completedWeekPoints)} <span style="font:500 .8rem StudyControls,Arial,sans-serif">points</span>`}</p><p>Synthetic completed Week 2 · 19–25 Oct 2026.</p><p>${player.completedWeekPoints === null ? 'No counted-game evidence was supplied. This is not a zero, a DNP, an injury or a current availability report.' : 'Counted points from the supplied synthetic sample. No individual game log or played-game count is included; no further breakdown is inferred.'} ${person.playerEvidence.verifiedPlayers} of ${person.playerEvidence.rosterPlayers} roster players have this evidence.</p></section></div><p class="inspector-meta">No recorded quote history or model factor breakdown is included in this fixture.</p><div class="inspection-foot"><button type="button" class="text-button" data-open="${parent}">Back to ${positionNames[player.position].toLowerCase()}</button><div>${exit(`/player/${player.id}`, 'Player profile')} &nbsp; ${exit('/stocks', 'Stocks')}</div></div>`;
}

function matchupPanel(id) {
  const matchup = fixture.matchups.find(row => row.id === id);
  if (!matchup) return '';
  const home = team(matchup.home), away = team(matchup.away);
  const saved = member && person.matchup.id === id && person.savedAi.status === 'ready' ? person.savedAi : null;
  return `${panelTop('Week 3 · matchup inspection', `${esc(home.name)} / ${esc(away.name)}`)}<div data-matchup-inspector="${id}" class="detail-grid"><section class="detail-block"><h3>Current sample score</h3>${scoreLine(home.id, matchup.homePoints)}${scoreLine(away.id, matchup.awayPoints)}<p>${matchup.homePoints === null || matchup.awayPoints === null ? 'Partial score: papichooter has a recorded zero; NeuralNets has no returned score. No leader, margin or tie can be inferred.' : 'Synthetic in-progress scores. No completed result is claimed.'}</p><p>Season records: ${esc(home.name)} ${home.wins}–${home.losses}; ${esc(away.name)} ${away.wins}–${away.losses}.</p></section><section class="detail-block"><h3>${member ? 'Saved model context' : 'Public league context'}</h3>${saved ? `<p>${esc(saved.label)}.</p><p>${saved.probabilities.map(row => `${esc(team(row.teamId).name)}: <span class="num">${Math.round(row.probability * 100)}%</span>`).join('<br>')}</p><p>Confidence: <span class="num">${saved.confidence.toFixed(2)}</span>, a separate field from the split. Generated 26 October 2026, 08:00 UTC.</p>` : `<p>${member ? 'No saved model estimate is supplied for this pairing in this view.' : 'Browse the teams and standings below. Sign in on the existing site for your actual team context.'}</p>`}<p>Fixed sample as of 30 October, 08:30 UTC. There is no live refresh or model generation.</p></section></div><div class="inspection-foot"><button type="button" class="text-button" data-close>Back to ${member ? 'your home' : 'the scoreboard'}</button><div>${exit(`/teams/${home.id}`, home.name)} &nbsp; ${exit(`/teams/${away.id}`, away.name)}</div></div>`;
}

function renderInspection(focusHeading = false) {
  const hash = location.hash.slice(1);
  if (hash === lastHash && !focusHeading) return;
  const wasOpen = !inspection.hidden;
  lastHash = hash;
  let content = '';
  if (member && hash.startsWith('position-')) content = positionPanel(hash.slice(9));
  if (member && hash.startsWith('player-')) content = playerPanel(hash.slice(7));
  if (hash.startsWith('matchup-')) content = matchupPanel(hash.slice(8));
  inspection.hidden = !content;
  inspection.innerHTML = content;
  document.querySelectorAll('button[data-open]').forEach(button => {
    button.setAttribute('aria-controls', 'inspection');
    button.setAttribute('aria-expanded', String(Boolean(content) && button.dataset.open === hash));
  });
  if (content) {
    lastOpen = hash;
    if (focusHeading) requestAnimationFrame(() => document.querySelector('#inspection-title')?.focus());
  } else if (wasOpen && !hash && lastOpen) {
    const target = document.getElementById(returnId) || document.querySelector(member ? '#primary-position' : '#primary-matchup');
    target?.focus();
  }
}

app.addEventListener('click', event => {
  const button = event.target.closest('[data-open]');
  if (button) { event.preventDefault(); openInspection(button.dataset.open, button, button.dataset.parent || ''); }
  if (event.target.closest('[data-close]')) { event.preventDefault(); closeInspection(); }
  const note = event.target.closest('[data-note]');
  if (note) { event.preventDefault(); openInspection(note.hash.slice(1), note); }
});
window.addEventListener('popstate', () => {
  if (history.state?.returnId) returnId = history.state.returnId;
  renderInspection(true);
});
window.addEventListener('hashchange', () => renderInspection(false));
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !inspection.hidden) { event.preventDefault(); closeInspection(); } });
document.querySelector('#demo-persona').addEventListener('change', event => {
  const url = new URL(location.href);
  url.searchParams.set('persona', event.target.value);
  url.hash = '';
  location.href = url.href;
});
renderInspection(Boolean(location.hash.match(/^#(player|position|matchup)-/)));
await document.fonts.ready;
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.personalStudyReady = '10';
