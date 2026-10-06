# GOAT Hoopers Redesign — Inspiration & Direction

Research compiled 2026-10-06. Aidan's bar: "don't use slop." This doc is the
design brief for the rebuild: real examples, stealable patterns, a point of
view, and concrete UI ideas ranked by impact.

---

## 1. Sites & Examples Worth Studying

### 1. Hoop Heads Dynasty Hub — the closest analog that exists
**https://mmcweeny95.github.io/hoop-heads** · repo: https://github.com/mmcweeny95/hoop-heads

A live 12-team NBA dynasty league dashboard on Sleeper data — basically our
site's twin. Auto-updates daily (rosters, trades, IR), pulls live NBA
per-game averages from balldontlie.io, and runs a **playoff predictor that
recalculates with fresh data**. That's the takeaway: the best league sites
don't just *display* Sleeper data, they *do something with it*. A "title
odds" or "power ranking" widget computed from live data would instantly make
our homepage feel alive in a way a static standings table never will.

### 2. The Dickheads League — personality as a design system
**https://thedickheadsfootballleague.com**

A 14-team league site (SvelteKit, live Sleeper sync) that treats league
*culture* as first-class content. The IA is: "Open now · your move" (active
surveys), then **Permanent boards** — The Rivalry Board, The Pot (buy-in
tracking), The Punishment (last-place forfeit, who/when/how), Draft Day
countdown, Standings. Takeaway: our nav shouldn't be generic
(Home/Transactions/Draft/Teams). It should read like *our league*: sections
with names that only make sense to the ten of us. The arcade, the FAAB
ledger, rivalry weeks — those are our "permanent boards." Name and frame
them that way instead of as database tables.

### 3. Sleeper's own app — the dark-mode-native reference
**https://sleeper.com** (app), design language documented across the ecosystem

Sleeper won by being dark-mode-native, chat-first, and fast. The visual
grammar: deep navy/near-black surfaces, one saturated accent (their teal),
**avatar rings everywhere** (every team, every player gets a face), matchup
cards with a VS badge and score-share bars, colored position badges
(PG/SG/SF/PF/C). Takeaway: we already live in Sleeper's data — we should
speak its visual dialect (avatars, position pills, VS matchups) so the site
feels like a natural extension of where managers already live, not a
spreadsheet stapled to a webpage.

### 4. ESPN Fantasy — information architecture done right
**https://fantasy.espn.com/basketball/**

ESPN's league IA is worth stealing structurally: League Home (commissioner
note + chat + recent activity), Rosters (every team's roster + record in one
view), Schedule, Message Board. The pattern: **one page per question a
manager asks** ("who do I play next?", "what did everyone do this week?").
Takeaway: our Transactions page answers "what happened" but nothing answers
"what's at stake this week." A matchup-centric homepage section (this week's
games, with records and stakes) is the highest-value IA addition we can make.

### 5. Yahoo Fantasy — the mobile-first mandate
**https://sports.yahoo.com/fantasy/**

Yahoo's own data: **85% of fantasy users are on mobile, two-thirds daily**.
Their design priority is "see your entire team on one screen" and the
smoothest live StatTracker in the industry. Takeaway: our redesign is
mobile-first or it's nothing. Every component gets designed at 390px first:
standings become swipeable team cards, roster tables become player rows with
big tap targets, the draft board becomes a vertical pick feed. Desktop is the
enhancement, not the default.

### 6. The "Broadcast Scoreboard" design system (sleeper-analytics-2025)
**https://github.com/trav563/sleeper-analytics-2025/blob/HEAD/CLAUDE.md**

A Sleeper analytics project that codified exactly the look we want:
dark-mode first, **bold tabular numerals** (so live-updating scores don't
jitter the layout), team-color pips, gold/amber accent, red-orange reserved
*exclusively* for LIVE signals. Typography: Geist for display/body, Geist
Mono for data. Rules: tabular-nums on every number, min 44px tap targets,
verdict colors never used decoratively. Takeaway: this is our token set.
Steal the discipline — a restricted palette where color *means* something
(win/loss, live, hot/cold) instead of decoration.

### 7. Retro Sports Card direction (dynasty-tool)
**https://github.com/austinjenk2/dynasty-tool**

Went the opposite way from dark-mode-everyone: warm cream paper background,
**Anton** (condensed, jersey-number energy) for display, thick navy borders,
hard offset shadows — a sticker/trading-card feel. Takeaway: this is the
road-not-taken that proves the point — *commit to a lane*. Dark broadcast
terminal or vintage cardstock both work; what doesn't work is the mushy
middle (soft gray SaaS cards on white). Pick one and push it hard.

### 8. The Athletic — editorial typography
**https://theathletic.com**

Dark background, white minimalist typography, restrained and confident. The
lesson isn't "copy their theme," it's **typographic hierarchy as the design**:
one great display face, generous whitespace, and letting headlines carry the
page instead of chrome. Takeaway: our homepage's "Explore the league" links
and stat strips would hit harder as editorial headlines ("Reaves Dropper
can't stop scoring") than as dashboard widgets.

---

## 2. Design Patterns Worth Stealing

- **Matchup hero cards** (Sleeper-style): team avatar vs team avatar, big
  tabular score, thin score-share bar underneath, record + streak under each
  name. This is the single highest-density pattern in fantasy UI — one card
  answers who/who won/by how much.
- **Position pills**: tiny colored badges (PG/SG/SF/PF/C) on every player
  name, everywhere. Color-coded by position group. Instantly scannable
  rosters.
- **Avatar rings**: every team and every player gets a face. Sleeper CDN
  headshots for NBA players (`sleepercdn.com/content/nba/players/{id}.jpg`);
  team avatars we already have. No faceless rows — a row without an image is
  a bug.
- **Tabular numerals everywhere**: `font-variant-numeric: tabular-nums` on
  all stats/scores/records. Non-negotiable for anything that updates.
- **Fixed team colors**: assign each of the ten teams a permanent color,
  used consistently in charts, matchup cards, and standings. (Borrowed from
  sleeper-power-rankings.)
- **Weekly awards as big cards**: "Blowout of the week," "Closest game,"
  "Top scorer" — our homepage already has the stats; present them as
  *awards*, not widgets.
- **Sticky mobile nav / bottom tab bar**: at 390px, primary nav becomes a
  bottom tab bar (Home / Arcade / Team). Thumb-zone, app-like.
- **Expandable rows over new pages**: on mobile, tapping a standings row
  expands the roster inline instead of navigating away.
- **"Your move" pattern** (Dickheads): any action the logged-in manager
  needs to take (claim team, pending arcade entry) gets a persistent,
  impossible-to-miss banner — not buried in nav.

---

## 3. Typography & Color Direction

**Recommendation: "Dark broadcast" lane.** Rationale: Sleeper-native
audience, night-time usage, stats-forward content, and it differentiates
from every generic light-mode dashboard. The retro-cardstock lane is great
but fights the arcade's neon energy; dark broadcast unifies the whole site.

- **Display**: a condensed, high-impact face for headlines, scores, and
  section titles — **Anton** or **League Gothic** (both open-source; League
  Gothic is literally arena-signage DNA). Uppercase, tight tracking
  (-0.02em), used sparingly for maximum punch.
- **UI/body**: **Inter** or **Geist** — neutral, excellent at small sizes.
- **Data**: **Geist Mono** or system mono with `tabular-nums` — scores,
  records, timestamps, FAAB dollars. Never proportional digits in stats.
- **Palette** (dark-first):
  - Background: deep navy-black `#0A0E1A`, surfaces `#111827` / `#1A2332`
  - Ink: `#F2F5FA`, secondary `#9BA8BC`
  - Accent: **gold/amber** `#E8A13C` (championship energy, ownable — nobody
    else in our managers' app rotation uses gold as primary)
  - Live/urgent: red-orange, reserved *only* for live states
  - Win/loss: green/red, reserved *only* for outcomes
  - Each team keeps a fixed identity color for charts and matchup cards
- **Rules**: color is never decoration — every color encodes meaning.
  Display type never appears in body copy. Numbers never use proportional
  figures.

---

## 4. Anti-Patterns (What Reads as "Fifth Grader Designed")

1. **Gray cards on white background with no point of view.** The default
   AI-generated look. If a screenshot could be any SaaS product, it's slop.
2. **Two nav items, one destination.** (Our current bug: "My Team" + display
   name both → /team.) Every nav item must earn its place.
3. **Text-only player rows.** No headshot, no position pill, no team
   color — just a name in a table. This is what makes it feel like a
   spreadsheet.
4. **Inconsistent number formatting.** "103.5" next to "103.46", records as
   "3-0" in one place and "3W-0L" in another. Pick formats, enforce them.
5. **Dead-end pages.** A page with no actions and no links out is a
   cul-de-sac. Every page should answer "what do I do next?"
6. **Desktop tables squeezed onto mobile.** If you're horizontal-scrolling
   a table on a phone, the design failed — restructure, don't shrink.
7. **Placeholder tone.** "Coming soon" without a date, empty states that
   say "No data." Empty states are design surface: give them voice.
8. **Redundant headers.** Page title + section header + card title all
   saying the same thing. One clear headline per view.

---

## 5. Concrete UI Ideas for the Redesign (Prioritized)

1. **Kill the nav duplication.** Logged in, the header shows *one* team
   entry point: the manager's display name (with avatar ring) → /team.
   "My Team" disappears when logged in. Logged out, "My Team" stays as the
   login nudge. One destination, one button, always.
2. **Player headshots everywhere.** Sleeper CDN NBA headshots on every
   player row (roster, draft board, transactions, arcade). Fallback:
   initials in a team-colored disc. No faceless rows, ever.
3. **Clickable players → player pages.** `/player/[sleeperId]`: headshot,
   position pill, NBA team, season stats, which GOAT Hoopers roster holds
   them (or FA), recent transactions involving them. This turns the site
   from a bulletin board into a place you *browse*.
4. **Matchup hero on the homepage.** This week's (or most recent week's)
   five matchups as Sleeper-style VS cards: avatars, tabular scores,
   score-share bars, stakes line ("Winner takes sole possession of 1st").
   Replaces the generic stat strip as the homepage's center of gravity.
5. **Team identity system.** Fixed color + avatar per team, applied in
   standings (color pip), matchup cards, draft board, and charts. Ten
   colors, assigned once, used everywhere.
6. **Standings as power-ranked cards (mobile) / table (desktop).**
   Mobile: each team is a card — avatar, name, record in huge tabular
   numerals, PF, streak flame for 3+. Desktop keeps the table but with
   pips, pills, and hover-expanding rosters.
7. **Weekly awards section.** "Blowout of the week / Closest game / Top
   scorer / Chud of the week" as big cards with the relevant faces. Our
   data already supports this; it just needs presentation with attitude.
8. **Transaction feed that reads like a timeline.** Team avatar + actor,
   plain-English sentence ("Reaves Dropper dropped X"), relative time,
   player headshot on the moved player. Filter pills that look like
   Sleeper's, not dropdowns.
9. **Draft board as a vertical pick feed.** Round dividers with big
   condensed numerals, each pick a row: pick #, team avatar, player
   headshot + name + position pill, "R1 P4" style pick badge. The current
   grid is fine on desktop; the feed wins on mobile and feels draft-like.
10. **Arcade hub with stakes.** Each game card shows: prize (10 FAAB),
    this week's leader + score, your entry status ("Your move" banner if
    you haven't played). Games you can't enter yet say *why* and *when*,
    not "coming soon."
11. **Empty states with voice.** "No transactions yet — the wire is
    quiet... too quiet." "Nobody's won the arcade this week. Cowards."
    Write them like the group chat talks.
12. **Bottom tab bar on mobile.** Home / Arcade / Team as a sticky bottom
    bar with icons. The desktop header nav stays for desktop.

---

## 6. Suggested Build Order

1. Tokens + type system (fonts, colors, tabular-nums) — everything else
   sits on this.
2. Header/nav fix + player headshot pipeline (unblocks 1–3 above).
3. Team identity colors.
4. Homepage: matchup hero + awards.
5. Player pages.
6. Transactions timeline, draft feed, arcade hub.
7. Mobile tab bar + responsive pass.
8. Empty-state copy pass.
