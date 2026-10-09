/* The preview composes existing domain-shaped draft data. It does not fetch
 * league data or touch accounts, market calculations, arcade code or rewards. */
(() => {
  'use strict';
  const {weeklyEditions: editions, snapshot, clubhouseDirectory: directoryEntries} = window.CLUBHOUSE_DATA;
  const teams = snapshot.teams;
  const main = document.getElementById('content');
  const notes = document.getElementById('notes-dialog');
  let selected = null;
  let view = '';
  let motionObserver = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
  const teamById = id => teams.find(team => team.id === id);
  const teamURL = id => `https://goathoopers.com/teams/${encodeURIComponent(id)}`;
  const playerURL = id => `https://goathoopers.com/player/${encodeURIComponent(id)}`;
  const avatar = team => `<img class="avatar" src="assets/team-${escape(team.id)}.jpg" alt="" width="80" height="80" loading="lazy">`;
  const ordinal = number => `${number}${number===1?'st':number===2?'nd':number===3?'rd':'th'}`;
  const roleLabel = role => ({'player-of-week':'Player of the Week',underperformer:'Underperformer of the Week','one-to-watch':'One to watch next week'}[role]);
  function dateState(edition) {
    if (edition!==editions[0]) return 'Archived sample';
    if (Date.now()>=Date.parse(edition.endsAt)) return 'Last edition';
    if (Date.now()<Date.parse(edition.startsAt)) return 'Upcoming draft';
    return edition.status==='draft'?'Sample edition':'This week';
  }
  function editorialSources(edition) {
    return `<details class="notes-sources"><summary>Editorial notes &amp; source checks</summary><p>${edition.status==='draft'?'Proposed editorial copy for review. Muse has not published this edition.':`Published ${escape(edition.publishedAt)}.`} The editorial calendar is separate from the league’s scoring week.</p><ul>${edition.sources.map(source=>`<li><a href="${escape(source.url)}">${escape(source.label)}</a> — checked ${escape(source.checkedAt)}</li>`).join('')}</ul></details>`;
  }
  function matchupTeam(team,score) {
    const pennant = team.id==='1'?'banner-roster-1-reaves-dropper.webp':team.id==='5'?'banner-roster-5-josh-diddys-roster.webp':null;
    return `<a class="match-team" href="${teamURL(team.id)}">${pennant?`<img class="pennant-image" src="assets/${pennant}" alt="${escape(team.name)}${team.id==='5'?', 2025 champion':''} embroidered pennant" width="512" height="896">`:avatar(team)}<div><strong>${escape(team.name)}</strong><small>${escape(team.managerName)}</small>${score!==null?`<span class="historical-score gh-num">${score.toFixed(1)}</span>`:''}</div></a>`;
  }
  function playerStats(player) {
    return `<dl class="player-stats">${player.stats.map(stat=>`<div><dt>${escape(stat.label)}</dt><dd>${escape(stat.value)}</dd></div>`).join('')}</dl>`;
  }
  function playerStory(player,lead=false) {
    const owner=teamById(player.teamId);
    return `<article class="${lead?'player-lead':'player-support'}"><a class="portrait" href="${playerURL(player.playerId)}" aria-label="Open ${escape(player.name)} player page"><img src="assets/player-${escape(player.playerId)}.png" alt="" width="300" height="200" loading="lazy"></a><div class="player-copy"><header class="player-header"><p class="player-role">${roleLabel(player.role)}</p><h3><a href="${playerURL(player.playerId)}">${escape(player.name)}</a></h3>${owner?`<a class="player-owner" href="${teamURL(owner.id)}">${escape(owner.name)} ${icon('arrow-up-right')}</a>`:''}</header><div class="player-take"><h4>${escape(player.headline)}</h4><p>${escape(player.opinion)}</p></div>${playerStats(player)}<p class="stat-period">${escape(player.statPeriod)}</p></div></article>`;
  }
  function weeklyPlayers(edition) {
    if(!edition.playerSpotlights.length) return '';
    const lead=edition.playerSpotlights.find(p=>p.role==='player-of-week');
    const supports=edition.playerSpotlights.filter(p=>p!==lead);
    return `<section id="watch" aria-labelledby="watch-title"><h2 id="watch-title">This week’s players</h2><p class="weekly-context">Opening edition: two 2025–26 lookbacks and one preseason watch. Sample editorial; no 2026 scoring week has been played.</p><div class="player-layout">${lead?playerStory(lead,true):''}<div class="supporting-picks">${supports.map(p=>playerStory(p)).join('')}</div></div><details class="shared-sources"><summary>Sources &amp; why these picks ${icon('chevron')}</summary><p>Current roster ownership is verified. These picks are sample opinions, not computed awards or a claim about a completed 2026 fantasy week. Jokić and Embiid use prior-season NBA averages; Dybantsa uses college averages.</p><ul>${edition.playerSpotlights.map(p=>`<li><strong>${escape(p.name)}</strong> — ${escape(p.selectionReason)} <a href="${escape(p.source.url)}">${escape(p.source.label)}</a> <span class="caption">Checked ${escape(p.source.checkedAt)}</span></li>`).join('')}</ul></details></section>`;
  }
  function happenings(edition) {
    return `<section class="happenings" aria-labelledby="wire-title"><div class="section-head"><h2 id="wire-title">Around the league</h2><a class="text-link" href="https://goathoopers.com/transactions">The full wire ${icon('arrow-up-right')}</a></div><div class="wire-items">${edition.happenings.length?edition.happenings.map(item=>`<article class="wire-item"><time>${escape(item.dateLabel)}</time><a href="${escape(item.href)}"><h3>${escape(item.title)} ${icon('arrow-up-right')}</h3><p>${escape(item.text)}</p></a></article>`).join(''):'<p class="empty">No league happenings were selected for this edition.</p>'}</div>${editorialSources(edition)}</section>`;
  }
  function directoryRows(entries,query='') {
    if(!entries.length) return '<p class="empty">No matching team, manager or roster player. Clear the search to show all ten teams.</p>';
    return entries.map(entry=>{
      const team=entry.identity;
      const prior=entry.previousSeason;
      const opponent=entry.opener?teamById(entry.opener.opponentId):null;
      const anchors=entry.featuredPlayerIds.map(id=>entry.players.find(p=>p.id===id)).filter(Boolean);
      const hits=query?entry.players.filter(p=>p.fullName.toLocaleLowerCase().includes(query)).map(p=>p.fullName):[];
      return `<details class="team-entry" data-team-id="${escape(team.id)}"><summary class="team-summary" aria-label="${escape(team.name)}, ${entry.players.length} players; expand roster"><div class="team-identity">${avatar(team)}<div><h3>${escape(team.name)}</h3><p>${escape(team.managerName)}${team.id==='5'?' · 2025 champion':''}</p></div></div><div class="team-record">${prior?`<strong>${prior.wins}–${prior.losses}</strong><small>2025 · ${ordinal(prior.finish)}</small>`:'<small>Record unavailable</small>'}</div><div class="team-opponent">${opponent?`<span>Week ${entry.opener.leagueWeek} vs ${escape(opponent.name)}</span>`:'Pairing pending'}</div><span class="roster-toggle">${entry.players.length} players ${icon('chevron')}</span></summary>${hits.length?`<p class="search-hit">On this roster: ${escape(hits.join(', '))}</p>`:''}<div class="roster-detail"><div class="roster-detail-heading"><p>Current roster · Oct 8</p><a class="text-link" href="${teamURL(team.id)}">Full team profile ${icon('arrow-up-right')}</a></div><div class="anchor-detail"><div class="anchor-faces">${anchors.map(p=>`<a href="${playerURL(p.id)}" aria-label="Open ${escape(p.fullName)} player page"><img src="assets/player-${escape(p.id)}.png" alt="" width="300" height="200" loading="lazy"></a>`).join('')}</div><p>Roster anchors: ${anchors.map(p=>`<a href="${playerURL(p.id)}">${escape(p.fullName)}</a>`).join(' / ')}</p></div><ul class="roster-list">${entry.players.map(p=>`<li><a href="${playerURL(p.id)}"><span>${escape(p.fullName)}</span><small>${escape(p.position||'—')} · ${escape(p.nbaTeam||'FA')}</small></a></li>`).join('')}</ul>${prior?.ownerNote?`<p class="owner-note">2025 context: ${escape(prior.ownerNote)}</p>`:''}${opponent?`<a class="text-link" href="${teamURL(opponent.id)}">Opening opponent: ${escape(opponent.name)} ${icon('arrow-up-right')}</a>`:''}${entry.recentMove?`<p class="roster-wire"><strong>Latest move · ${escape(entry.recentMove.dateLabel)}</strong> ${escape(entry.recentMove.text)}</p>`:''}</div></details>`;
    }).join('');
  }
  function directory() {
    return `<section class="teams-zone" id="teams" aria-labelledby="teams-title"><div class="wrap"><div class="directory-heading"><div><h2 id="teams-title">Know who you’re playing.</h2><p>Ten managers. Their rosters. The next matchup.</p><div class="directory-date">2026 preseason <span>Roster snapshot · Oct 8</span></div></div></div><form class="directory-tools" role="search"><label class="directory-search">${icon('search')}<span class="sr-only">Find a team, manager or roster player</span><input type="search" id="team-search" placeholder="Find a team, manager or roster player" autocomplete="off" aria-controls="directory-list"></label><label class="sort-label">Order<select id="team-sort" aria-controls="directory-list"><option value="league">League order</option><option value="finish">2025 finish</option></select></label><button class="clear-search" type="button" id="clear-search">Clear</button></form><div class="directory-labels" aria-hidden="true"><span>Team / manager</span><span>2025 record</span><span>Opening week · Upcoming</span><span>Full roster</span></div><div id="directory-list">${directoryRows(directoryEntries)}</div><p class="directory-count" id="directory-count" role="status" aria-live="polite">All 10 teams · 228 verified roster players</p><details class="directory-method"><summary>What these summaries show ${icon('chevron')}</summary><p>Current rosters and Week 1 pairings are verified from Sleeper. Record and finish refer to the completed 2025 season, not a current power ranking. All 2026 records are 0–0; no recent form exists yet. The three roster anchors per team are editorial selections, not a ranked list or declared starting lineup. Open a row to see every player, its current opponent and the team profile.</p></details></div></section>`;
  }
  function archivePreview() {
    return `<section class="archive-zone"><div class="wrap archive-preview"><div><h2>Every week has a story.</h2><p>Earlier sample editions stay available as the season moves on.</p></div><div><a class="text-link" href="#archive">Weekly archive ${icon('arrow-right')}</a><div class="archive-links">${editions.map(edition=>`<a href="#edition/${encodeURIComponent(edition.id)}"><time>${escape(edition.dateLabel)}</time>${escape(edition.title)}</a>`).join('')}</div></div></div></section><div class="arena-strip" aria-hidden="true"><img src="assets/arena.jpg" alt="" width="1440" height="810" loading="lazy"></div>`;
  }
  function renderEdition(edition) {
    selected=edition;
    const game=edition.game;
    const pair=game.teamIds?.map(teamById);
    const validPair=pair?.length===2&&pair.every(Boolean)&&game.state!=='unavailable';
    const scores=game.state==='final'&&game.scores?game.scores:[null,null];
    const previous=editions[editions.indexOf(edition)+1];
    const newer=editions[editions.indexOf(edition)-1];
    const state=game.state==='final'?'Historical final · 2025':game.state==='upcoming'?`Week ${game.leagueWeek} · Upcoming`:'Spotlight pending';
    const stale=edition===editions[0]&&Date.now()>=Date.parse(edition.endsAt);
    document.getElementById('edition-date').innerHTML=`<time>${escape(edition.dateLabel)}</time><span>${dateState(edition)}</span>`;
    main.innerHTML=`<section class="opening-zone" aria-labelledby="game-title"><div class="wrap">${stale?`<p class="stale-note">You’re reading the last edition, from ${escape(edition.dateLabel)}. The next weekly spotlight is pending.</p>`:''}<div class="opening-layout"><div class="arena-scene"><img src="assets/arena.jpg" alt="The league’s existing Blender basketball arena" width="1440" height="810" fetchpriority="high"></div><div class="game-story"><div class="game-meta"><strong>Game of the week</strong><span>${state}</span></div><h1 id="game-title">${escape(game.title)}</h1><p class="context">${escape(game.context)}</p><div class="board-actions"><button class="button" id="open-notes">Matchup notes ${icon('arrow-right')}</button><a class="text-link" href="https://goathoopers.com/intel">League intel ${icon('arrow-up-right')}</a></div><div class="edition-links">${previous?`<a href="#edition/${encodeURIComponent(previous.id)}">Previous edition</a>`:''}${newer?`<a href="#edition/${encodeURIComponent(newer.id)}">Newer edition</a>`:''}<a href="#archive">Weekly archive</a></div></div></div>${validPair?`<div class="matchup-rail" aria-label="Featured matchup">${matchupTeam(pair[0],scores[0])}<span class="versus-label">vs</span>${matchupTeam(pair[1],scores[1])}</div>`:'<p class="empty">A matchup hasn’t been selected for this edition yet.</p>'}</div></section><div class="weekly-zone"><span class="transition-mark" aria-hidden="true"><img src="assets/GOAT-HOOPERS-emblem-clay.svg" alt="" width="640" height="640"></span><div class="wrap">${weeklyPlayers(edition)}${happenings(edition)}</div></div>${directory()}${archivePreview()}`;
    document.title=`GOAT Hoopers · ${edition.title} · Courtside concept`;
    startDecorativeMoment();
  }
  function renderArchive() {
    motionObserver?.disconnect();
    document.getElementById('edition-date').innerHTML='<span>Weekly archive</span>';
    main.innerHTML=`<section class="archive-page"><div class="wrap"><h1>Every week has a story.</h1><p class="archive-intro">Game of the Week, players to watch, and the moves everybody’s talking about. Past editions stay here as the season moves on.</p><p class="caption">These entries are sample drafts for review, not previously published Muse editions.</p><div class="archive-list">${editions.map(edition=>`<a class="archive-row" href="#edition/${encodeURIComponent(edition.id)}"><time>${escape(edition.dateLabel)}</time><div><h2>${escape(edition.title)}</h2><p>${escape(edition.game.note)} · Sample draft</p></div>${icon('arrow-up-right')}</a>`).join('')}</div><a class="text-link" href="#">${icon('arrow-left')} Back to this week</a></div></section>`;
    document.title='GOAT Hoopers · Weekly archive · Courtside concept';
  }
  function updateDirectory() {
    const input=document.getElementById('team-search');
    if(!input)return;
    const query=input.value.trim().toLocaleLowerCase();
    const entries=directoryEntries.filter(entry=>[entry.identity.name,entry.identity.managerName,...entry.players.map(p=>p.fullName)].some(text=>text.toLocaleLowerCase().includes(query)));
    if(document.getElementById('team-sort').value==='finish')entries.sort((a,b)=>(a.previousSeason?.finish??Infinity)-(b.previousSeason?.finish??Infinity));
    document.getElementById('directory-list').innerHTML=directoryRows(entries,query);
    document.getElementById('directory-count').textContent=`${entries.length} of ${directoryEntries.length} teams${query?' match your search':' · Search covers every roster player'}`;
  }
  function startDecorativeMoment() {
    motionObserver?.disconnect();
    const mark=main.querySelector('.transition-mark');
    if(!mark||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
    motionObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        mark.dataset.inView=String(entry.isIntersecting);
        if(entry.isIntersecting)mark.classList.add('settle');
        mark.style.animationPlayState=entry.isIntersecting&&!document.hidden?'running':'paused';
      }
    },{threshold:.8});
    mark.addEventListener('animationend',()=>motionObserver?.disconnect(),{once:true});
    motionObserver.observe(mark);
  }
  function route() {
    const hash=location.hash;
    document.querySelector('[data-home]').setAttribute('aria-current',hash==='#archive'?'false':'page');
    if(hash==='#content'){main.focus();main.scrollIntoView();return;}
    if(hash==='#watch'||hash==='#teams'){
      if(!view.startsWith('edition/'))renderEdition(editions[0]);
      view=`edition/${selected.id}`;
      document.querySelector(hash)?.scrollIntoView();return;
    }
    if(hash==='#archive'){renderArchive();view='archive';}
    else {
      const key=hash.startsWith('#edition/')?decodeURIComponent(hash.slice(9)):null;
      const edition=key?editions.find(entry=>entry.id===key):editions[0];
      if(!edition){motionObserver?.disconnect();main.innerHTML='<section class="archive-page"><div class="wrap"><h1>Edition unavailable.</h1><p class="archive-intro">That weekly edition hasn’t been added yet.</p><a class="text-link" href="#archive">Browse the archive</a></div></section>';view='missing';}
      else{renderEdition(edition);view=`edition/${edition.id}`;}
    }
    scrollTo({top:0,behavior:'instant'});
  }
  main.addEventListener('click',event=>{
    if(event.target.closest('#clear-search')){
      const input=document.getElementById('team-search');input.value='';updateDirectory();input.focus();
    }
    if(event.target.closest('#open-notes')&&selected){
      document.getElementById('matchup-notes').innerHTML=`<p class="context-label">${escape(selected.game.note)}</p><h2 id="notes-title">Why this matchup?</h2><p>${escape(selected.game.selectionReason)}</p><p class="caption">${selected.status==='draft'?'Proposed editorial selection for review.':'Curated weekly selection.'} ${selected.game.state==='upcoming'?'No projected result or live score is implied.':''}</p><div class="notes-teams">${(selected.game.teamIds||[]).map(id=>{const team=teamById(id);return team?`<a class="text-link" href="${teamURL(id)}">${escape(team.name)} ${icon('arrow-up-right')}</a>`:'';}).join('')}</div>${editorialSources(selected)}`;
      notes.showModal();
    }
  });
  main.addEventListener('input',event=>{if(event.target.id==='team-search')updateDirectory();});
  main.addEventListener('change',event=>{if(event.target.id==='team-sort')updateDirectory();});
  main.addEventListener('submit',event=>event.preventDefault());
  for(const dialog of [notes]){
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  }
  document.addEventListener('visibilitychange',()=>{const mark=main.querySelector('.transition-mark');if(mark)mark.style.animationPlayState=document.hidden||mark.dataset.inView!=='true'?'paused':'running';});
  addEventListener('hashchange',route);
  route();
})();
