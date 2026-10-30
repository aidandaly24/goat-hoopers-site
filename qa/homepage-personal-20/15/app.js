import { fixture } from '../fixture.js';

const params = new URLSearchParams(location.search);
const personaKey = ['reaves', 'neural', 'guest'].includes(params.get('persona')) ? params.get('persona') : 'reaves';
const person = fixture.personas[personaKey];
const member = person.kind === 'member';
const root = document.documentElement;
root.dataset.persona = personaKey;
root.dataset.stage = params.get('stage') === 'structure' ? 'structure' : 'finished';
document.title = `${member ? person.team.name : 'The league'} · GOAT open gym`;
document.querySelector('#persona-select').value = personaKey;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
const quote = value => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const team = id => fixture.teams.find(t => t.id === id);
const standing = id => fixture.standings.find(t => t.id === id);
const record = t => `${t.wins}–${t.losses}`;
const points = (m, id) => m.home === id ? m.homePoints : m.awayPoints;
const teamButton = (id, cls = 'team-name-button') => `<button type="button" class="${cls}" data-team="${esc(id)}">${esc(team(id).name)}${member && id === person.teamId ? '<span class="member-mark">Your team</span>' : ''}</button>`;
const initials = name => name.split(/\s+/).map(n => n[0]).slice(0, 2).join('');
const sourcePeriod = 'Synthetic completed Week 2 · October 19–25, 2026';
const outside = (path, label, cls = '') => `<a class="${cls}" href="https://goathoopers.com${path}">${label}</a>`;
const players = member ? person.players : [];
const evidence = players.filter(p => p.participation === 'verified_demo' && p.completedWeekPoints !== null).sort((a, b) => b.completedWeekPoints - a.completedWeekPoints);

function renderWall() {
  if (!member) {
    document.querySelector('#wall').innerHTML = `<p class="eyebrow welcome-kicker">2026 · Week 3 · The open gym</p><h1 id="home-title" tabindex="-1">Good company.<br>Better basketball.</h1><p class="guest-intro">Welcome to GOAT Hoopers. Meet the ten teams, check the week's pairings, and find your way around.</p><p class="tiny muted">Public league view · synthetic current records</p><div class="wall-rule" aria-hidden="true"></div><section id="your-players" tabindex="-1" aria-labelledby="directory-title"><p class="eyebrow welcome-kicker">The people make the league</p><h2 id="directory-title">Meet GOAT.</h2><p class="period-line">Team names open a local public-team inspection.</p><ul class="public-directory" id="league">${fixture.teams.map(t => `<li class="directory-team"><button type="button" data-team="${t.id}">${esc(t.name)}</button><p>${esc(t.manager)}</p><p class="directory-record num">${record(t)} · ${standing(t.id).rank} of 10</p></li>`).join('')}</ul></section>`;
    const account = document.querySelector('#account-link');
    account.href = 'https://goathoopers.com/login';
    account.innerHTML = 'Sign in <span>GOAT site · leaves demo</span>';
    document.querySelector('nav a[href="#your-players"]').textContent = 'Teams';
    return;
  }
  const newest = person.changes.find(c => c.kind === 'evidence');
  document.querySelector('#wall').innerHTML = `<p class="eyebrow welcome-kicker">2026 · Week 3 · The open gym</p><h1 id="home-title" tabindex="-1">Good to see you,<br>${esc(person.team.name)}.</h1><div class="identity-line"><span>${esc(person.team.manager)}</span><span class="record-label num">${record(person.team)} record</span><span class="num">${person.standing.rank} of 10</span></div><div class="wall-rule" aria-hidden="true"></div><section id="your-players" tabindex="-1" aria-labelledby="evidence-title"><p class="eyebrow welcome-kicker">A little time with your team</p><h2 id="evidence-title">Last week's counted points.</h2><p class="section-intro">${personaKey === 'reaves' ? 'Five familiar names, with a completed-week sample you can look into.' : 'Giannis, KD, Rudy. Start with the three players whose counted points are supplied.'}</p><p class="period-line">${sourcePeriod}<br><strong>${evidence.length} of ${players.length} roster players</strong> have supplied evidence. This is a partial sample.</p><ul class="evidence-list">${evidence.map(p => `<li class="evidence-person" data-evidence-player="${p.id}"><button class="person-button" type="button" data-player="${p.id}" aria-label="Inspect ${esc(p.name)} counted points">${p.portrait ? `<img class="person-image" src="${esc(p.portrait)}" alt="" width="44" height="44">` : `<span class="person-initials" aria-hidden="true">${esc(initials(p.name))}</span>`}<span class="person-name">${esc(p.name)}<span class="position">${esc(p.position)} · Inspect sample</span></span></button><p class="point-value num">${num(p.completedWeekPoints)}<span>counted points</span></p></li>`).join('')}</ul>${newest ? `<p class="change-note"><time datetime="${newest.at}">New sample · October 30, 08:20 UTC</time><strong>Player breakdown ready.</strong> These are the five supplied counted-game totals, not a complete roster recap.</p>` : `<p class="change-note">The other ${players.length - evidence.length} players have no completed-week evidence here. Missing evidence says nothing about how they played.</p>`}</section>`;
}

function scoreMarkup(value, big = false) {
  return value === null ? `<p class="${big ? 'big-score' : 'small-score'} missing">Score not returned</p>` : `<p class="${big ? 'big-score' : 'small-score'} num">${num(value)}</p>`;
}

function mainGame(m) {
  const ids = member ? [person.teamId, person.opponent.id] : [m.home, m.away];
  return `<article class="matchup-main" data-primary-matchup="${m.id}" aria-label="${esc(ids.map(id => team(id).name).join(' versus '))}"><div class="pairing">${ids.map((id, i) => `${i ? '<span class="versus" aria-hidden="true">vs</span>' : ''}<div class="pair-team">${teamButton(id, '')}<p class="team-record num">${record(team(id))} record</p>${scoreMarkup(points(m, id), true)}<p class="score-note">${points(m, id) === null ? 'Not zero' : points(m, id) === 0 ? 'Zero recorded in this demo' : 'Synthetic current score'}</p></div>`).join('')}</div><p class="game-context">${m.homePoints !== null && m.awayPoints !== null ? `${esc(team(ids[0]).name)} is ${Math.abs(points(m, ids[0]) - points(m, ids[1])) === 0 ? 'level' : points(m, ids[0]) > points(m, ids[1]) ? 'ahead by ' + num(points(m, ids[0]) - points(m, ids[1])) : 'behind by ' + num(points(m, ids[1]) - points(m, ids[0]))}${points(m, ids[0]) !== points(m, ids[1]) ? ' points' : ''}. The demo game is in progress; this is not a final result.` : 'One score is missing, so there is no leader or margin to show. The opponent’s recorded zero stays separate.'}</p><button class="button" type="button" data-matchup="${m.id}" id="primary-matchup-action">Inspect this matchup</button>${member && person.savedAi.status === 'ready' ? `<div class="saved-model"><p><strong>Saved model context:</strong> ${Math.round(person.savedAi.probabilities.find(p => p.teamId === person.teamId).probability * 100)}% ${esc(person.team.name)} / ${Math.round(person.savedAi.probabilities.find(p => p.teamId === person.opponent.id).probability * 100)}% ${esc(person.opponent.name)}.</p><details><summary>Estimate and source notes</summary><p>Synthetic saved model estimate; not calibrated odds. Saved October 26, 2026, 08:00 UTC. Model confidence is a separate 0.35, not a win probability. No model runs in this demo.</p></details></div>` : member ? '<p class="saved-model">No saved model estimate is supplied for this matchup.</p>' : ''}</article>`;
}

function smallGame(m) {
  return `<article class="small-game" aria-label="${esc(team(m.home).name)} versus ${esc(team(m.away).name)}" data-game="${m.id}">${[m.home, m.away].map(id => `<div class="game-team-line">${teamButton(id)}${scoreMarkup(points(m, id))}</div>`).join('')}<button type="button" class="inspect-game" data-matchup="${m.id}">Inspect matchup</button></article>`;
}

function renderCourt() {
  const featured = member ? person.matchup : fixture.matchups[0];
  const others = fixture.matchups.filter(m => m.id !== featured.id);
  document.querySelector('#games').innerHTML = `<svg class="court-linework" viewBox="0 0 600 1200" preserveAspectRatio="none" aria-hidden="true"><path d="M30 125h540v1020H30zM30 370h540M180 125v130h240V125M235 150h130M300 125v32M270 157h60v20h-60z"/><circle cx="300" cy="370" r="79"/><path d="M30 1145h540M180 1145v-125h240v125M235 1115h130"/></svg><p class="eyebrow">On the floor · Week ${fixture.league.week}</p><h2 id="games-title">${member ? 'Your week, right here.' : 'Five games. Plenty to follow.'}</h2><p class="court-caption">Synthetic current scores · October 30, 08:30 UTC</p>${mainGame(featured)}<section class="other-games" ${member ? 'id="league"' : ''} tabindex="-1" aria-labelledby="other-games-title"><h2 id="other-games-title">${member ? 'The rest of the gym.' : 'Across the rest of the floor.'}</h2><p class="other-intro">Four more pairings. Every team name is yours to explore.</p>${others.map(smallGame).join('')}</section>`;
}

function renderBench() {
  if (!member) {
    const champion = team(fixture.historicalFinal.winner);
    const runnerUp = team(fixture.historicalFinal.runnerUp);
    document.querySelector('#bench').innerHTML = `<p class="eyebrow">Stay a while</p><h2>There's more to GOAT.</h2><p class="guest-bench-copy">The league is open to browse. For your own team and account, sign in on the existing GOAT site.</p>${outside('/login', 'Sign in on GOAT <span>leaves demo</span>', 'bench-link')}<div class="history-line"><strong>A page from 2025</strong>${esc(champion.name)} won the recorded 2025 final, ${num(fixture.historicalFinal.winnerPoints)}–${num(fixture.historicalFinal.runnerUpPoints)}, against ${esc(runnerUp.name)}. This is historical context, not a current result.</div>${outside('/history', 'Explore History <span>GOAT site · leaves demo</span>', 'bench-link')}<p class="guest-bench-copy">A few shots before you go? The practice court is in Arcade.</p>${outside('/arcade', 'Visit Arcade <span>GOAT site · leaves demo</span>', 'bench-link')}`;
    return;
  }
  const value = person.valuation;
  const unpriced = players.filter(p => p.modeledFaab === null);
  document.querySelector('#bench').innerHTML = `<p class="eyebrow">A seat with your roster</p><h2>Your roster, in perspective.</h2><p class="quote-label">${value.complete ? 'Complete modeled roster quote' : 'Modeled subtotal · 16 priced players'}</p><p class="quote-amount num ${value.complete ? '' : 'partial'}" data-quote-total>${quote(value.modeledFaabSubtotal)} <span>modeled FAAB</span></p><p class="quote-explainer"><strong>${value.priced} of ${value.roster} players priced.</strong> ${value.complete ? 'Every player in your sample roster has a quote. This is a model value, not a cash balance or a measure of weekly performance.' : 'Six players are unpriced. This subtotal is not a complete team value and cannot be compared with a fully priced roster.'}</p><p class="quote-meta">Calculated October 30, 2026 · 08:10 UTC</p>${unpriced.length ? `<p class="missing-names"><strong>Unpriced:</strong> ${unpriced.map(p => esc(p.name)).join(', ')}.</p>` : ''}<details class="quote-details" id="roster-quotes"><summary id="quote-summary">Inspect all ${players.length} roster quotes</summary><div class="controls"><label for="quote-filter">Find a player<input id="quote-filter" type="search" placeholder="Player name" autocomplete="off"></label><label for="quote-sort">Order by<select id="quote-sort"><option value="name">Player name</option><option value="value">Highest known quote</option></select></label></div><p class="quote-count" id="quote-count" aria-live="polite"></p><ul id="quote-list"></ul><p class="quote-bottom">Unpriced values always stay unpriced. Quotes are synthetic model estimates, not completed transactions.</p></details><p class="no-history">No league value rank or recorded team-value series is supplied. No trend is inferred.</p>${outside('/stocks', 'Explore player prices <span>GOAT site · leaves demo</span>', 'bench-link')}`;
  renderQuotes();
  document.querySelector('#quote-filter').addEventListener('input', renderQuotes);
  document.querySelector('#quote-sort').addEventListener('change', renderQuotes);
}

function renderQuotes() {
  const search = (document.querySelector('#quote-filter')?.value || '').trim().toLocaleLowerCase();
  const order = document.querySelector('#quote-sort')?.value || 'name';
  const shown = players.filter(p => p.name.toLocaleLowerCase().includes(search)).sort((a, b) => {
    if (a.modeledFaab === null && b.modeledFaab !== null) return 1;
    if (b.modeledFaab === null && a.modeledFaab !== null) return -1;
    return order === 'value' && a.modeledFaab !== b.modeledFaab ? b.modeledFaab - a.modeledFaab : a.name.localeCompare(b.name);
  });
  document.querySelector('#quote-list').innerHTML = shown.map(p => `<li class="quote-row" data-quote-player="${p.id}"><span class="quote-name">${esc(p.name)}<span class="position">${esc(p.position)}</span><button type="button" data-player="${p.id}">Inspect player</button></span><span class="quote-number num ${p.modeledFaab === null ? 'unpriced' : ''}">${p.modeledFaab === null ? 'Unpriced' : quote(p.modeledFaab)}</span></li>`).join('');
  document.querySelector('#quote-count').textContent = `${shown.length} of ${players.length} players shown · modeled FAAB`;
}

function renderFooter() {
  const groups = [
    ['Follow the league', ['/news', '/teams', '/transactions', '/table']],
    ['Explore', ['/stocks', '/draft', '/intel', '/ai-decides', '/trade-analyzer', '/arcade']],
    ['Record & account', ['/history', '/weekly', '/team', '/login']],
  ];
  document.querySelector('#site-footer').innerHTML = `<div class="footer-opening"><div><h2>See you around the gym.</h2><p>Keep exploring the GOAT site. The links below leave this local demo; they don't imitate its tools or account services.</p></div><img src="${fixture.assets.logo}" alt="GOAT Hoopers" width="180" height="48"></div><nav class="footer-nav" aria-label="GOAT site destinations — links leave this demo">${groups.map(([label, paths]) => `<div class="footer-group"><h3>${label}</h3><ul>${paths.map(path => `<li>${outside(path, fixture.destinations.find(d => d.href === path).label)}</li>`).join('')}</ul></div>`).join('')}</nav><details class="source-notes" id="source-notes"><summary>About these numbers and sources</summary><p>${esc(fixture.notice)} The scenario is fixed at October 30, 2026, 08:30 UTC. Current scores, standings, quotes, changes, and saved model outputs were constructed for design purposes. They are not reported league events.</p><p>Team identities, player references, and approved images come from the authorized project fixture; this is not a fresh roster verification. Guest sees public league fields, not a claimed private team. Demo persona selection never establishes membership.</p><p>Counted-player samples cover Synthetic completed Week 2, October 19 through October 25, with an exclusive October 26 boundary. Only five Reaves players and three NeuralNets players have supplied evidence; no game counts, injury status, or conclusions about missing players are invented. Quotes are checked October 30 at 08:10 UTC. No recorded value history or comparable league value rank is supplied.</p><p>Only previous-season records and the 2025 final are historical project references. NeuralNets' 2025 record belongs to the previous manager, as QBs Gremlins. All profile, account, market, archive, and tool links explicitly leave for the existing GOAT site. No API, auth, pricing, AI generation, database, or mutation service runs here.</p></details><div class="footer-end"><a href="#home-title" data-section-link>Back to the entrance</a><span>GOAT Hoopers · Independent open-gym study 15</span></div>`;
}

renderWall();
renderCourt();
renderBench();
renderFooter();

const dialog = document.querySelector('#inspector');
let returnFocus = null;
let closingFromRoute = false;

function fact(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function inspection(type, id) {
  if (type === 'player') {
    const p = players.find(p => p.id === id);
    if (!p) return null;
    const knownEvidence = p.completedWeekPoints !== null && p.participation === 'verified_demo';
    return `<p class="eyebrow welcome-kicker">Your roster · ${esc(p.position)}</p><h2 id="inspector-title" tabindex="-1">${esc(p.name)}</h2><dl class="inspection-facts">${fact('Modeled FAAB quote', p.modeledFaab === null ? 'Unpriced' : `<span class="num">${quote(p.modeledFaab)}</span>`)}${fact('Completed-week counted points', knownEvidence ? `<span class="num">${num(p.completedWeekPoints)}</span>` : 'Evidence not supplied')}</dl><p class="inspection-period">${sourcePeriod}. ${knownEvidence ? 'This player has supplied counted-game evidence in the synthetic sample. Game count and a detailed box score are not supplied.' : 'No completed-week evidence is supplied for this player. Missing evidence is not zero and is not classified as poor play.'}</p><p class="dialog-source">${evidence.length} of ${players.length} roster players have completed-week evidence. Quote calculation: October 30, 2026, 08:10 UTC. Synthetic values; no live player availability or current NBA team is asserted.</p>${outside(`/player/${p.id}`, 'Open actual player profile on GOAT · leaves demo', 'dialog-exit')}`;
  }
  if (type === 'team') {
    const t = team(id);
    if (!t) return null;
    const s = standing(id);
    const m = fixture.matchups.find(m => [m.home, m.away].includes(id));
    const opponent = team(m.home === id ? m.away : m.home);
    return `<p class="eyebrow welcome-kicker">Public team context</p><h2 id="inspector-title" tabindex="-1">${esc(t.name)}</h2><p>Managed by ${esc(t.manager)}.</p><dl class="inspection-facts">${fact('Synthetic 2026 record', `<span class="num">${record(t)}</span>`)}${fact('Synthetic standing', `${s.rank} of 10`)}${fact('Synthetic points for', `<span class="num">${num(t.pointsFor)}</span>`)}${fact('Week 3 opponent', esc(opponent.name))}</dl><p class="inspection-period"><strong>${t.previousSeason.season} historical reference:</strong> ${record(t.previousSeason)}, finish ${t.previousSeason.finish}.${t.previousSeason.ownerNote ? ` <strong>${esc(t.previousSeason.ownerNote)}</strong>` : ''}</p><p class="dialog-source">Current fields are synthetic, checked October 30, 08:30 UTC. This public team inspection does not invent a full opponent roster, private quote, or saved model estimate.</p>${outside(`/teams/${t.id}`, 'Open actual team page on GOAT · leaves demo', 'dialog-exit')}`;
  }
  if (type === 'matchup') {
    const m = fixture.matchups.find(m => m.id === id);
    if (!m) return null;
    const complete = m.homePoints !== null && m.awayPoints !== null;
    const ai = member && m.id === person.matchup.id && person.savedAi.status === 'ready' ? person.savedAi : null;
    return `<p class="eyebrow welcome-kicker">Synthetic current Week 3 matchup</p><h2 id="inspector-title" tabindex="-1">${esc(team(m.home).name)} vs ${esc(team(m.away).name)}</h2><dl class="inspection-facts">${[m.home, m.away].map(tid => fact(esc(team(tid).name), points(m, tid) === null ? 'Score not returned' : `<span class="num">${num(points(m, tid))}</span> ${points(m, tid) === 0 ? 'recorded' : 'points'}`)).join('')}</dl><p class="inspection-period">${complete ? 'These are synthetic current scores for an in-progress demo game, not a completed result.' : 'Papichooter has a recorded zero. NeuralNets has no returned score. The missing value is not zero; no leader or margin is inferred.'}</p>${ai ? `<p><strong>Saved model estimate:</strong> ${ai.probabilities.map(row => `${esc(team(row.teamId).name)} ${Math.round(row.probability * 100)}%`).join(' / ')}.</p><p class="dialog-source">Synthetic saved model estimate; not calibrated odds. Saved October 26, 2026, 08:00 UTC. Returned choice: ${esc(team(ai.returnedChoice).name)}. Model confidence: ${ai.confidence}, separate from the probabilities. No model runs here.</p>` : '<p class="dialog-source">No saved model estimate is supplied for this view.</p>'}<p class="dialog-source">Fixed source instant: October 30, 2026, 08:30 UTC. No live clock, polling, or final-result claim.</p>`;
  }
  return null;
}

function syncRoute() {
  const match = location.hash.match(/^#(player|team|matchup)-([a-zA-Z0-9]+)$/);
  const content = match ? inspection(match[1], match[2]) : null;
  if (content) {
    document.querySelector('#inspector-content').innerHTML = content;
    if (!dialog.open) dialog.showModal();
    document.querySelector('#inspector-title').focus({ preventScroll: true });
  } else if (dialog.open) {
    closingFromRoute = true;
    dialog.close();
    const target = returnFocus?.isConnected ? returnFocus : document.querySelector('#home-title');
    target.focus({ preventScroll: true });
    closingFromRoute = false;
  }
}

function openInspection(type, id, trigger) {
  if (!inspection(type, id)) return;
  returnFocus = trigger;
  history.pushState({ goatStudy15: true }, '', `${location.pathname}${location.search}#${type}-${id}`);
  syncRoute();
}

function closeInspection() {
  if (history.state?.goatStudy15) history.back();
  else {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    syncRoute();
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-player],button[data-team],button[data-matchup]');
  if (button) {
    const type = button.hasAttribute('data-player') ? 'player' : button.hasAttribute('data-team') ? 'team' : 'matchup';
    openInspection(type, button.dataset[type], button);
  }
  const link = event.target.closest('[data-section-link]');
  if (link) {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      if (target.tagName === 'DETAILS') target.open = true;
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  }
});
document.querySelector('#close-inspector').addEventListener('click', closeInspection);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeInspection(); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeInspection(); } });
window.addEventListener('popstate', syncRoute);
window.addEventListener('hashchange', syncRoute);
document.querySelector('#persona-select').addEventListener('change', event => {
  const next = new URL(location.href);
  next.searchParams.set('persona', event.target.value);
  next.hash = '';
  location.assign(next);
});
document.querySelector('#home').setAttribute('aria-busy', 'false');
syncRoute();
await document.fonts.ready;
await Promise.allSettled([...document.images].map(image => image.decode()));
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
root.dataset.personalStudyReady = '15';
