# Author 12 — a homepage that teaches the league website through use

Discovery complete, 2026-10-30. **Plan only; awaiting root build followup.** No presentation code, production changes, dependencies or publication.

## Product question and answer

A member is new to this personal website: how can they learn where their league work lives while receiving a substantive homepage immediately?

Put a readable site guide alongside their actual work. Every important section pairs a useful fact with the name and purpose of the destination that continues it. A member learns that **My Team** is their private team area, **Teams** is the public directory, **Stocks** explains modeled player prices, **Intel** contains matchup research, and **The Table** is the league leaderboard by using those concepts in context. They do not need to dismiss a tour or guess what an unfamiliar product name means.

The primary action is **Inspect the evidence that matters to this team**. Reaves has new completed-week evidence worth reading. NeuralNets first needs to understand gaps in its score and quotes. The website map stays stable while these priorities change.

Rejected default: a large welcome headline followed by equal feature tiles for every route. It postpones the member's work and gives rare destinations the same weight as their current matchup. Also rejected: hiding the real homepage behind an introductory wizard or a selector.

## Product evidence and boundaries

Inspected checkout: `0d4564101af5a9267b152ccf08455e87a480ac33`. Read `AGENTS.md`, the relevant architecture sections on the homepage, personalized projection, data ownership, bounded surfaces, caching and accounts; `DESIGN.md` sections on view purpose, controls, content, navigation, acceptance and personalization; and the repository design skill plus its navigation/accessibility reference. The study brief deliberately frees this QA composition from the production palette, font, shell and section order. Production ownership stays untouched.

Read the complete requested source files:

- `src/app/page.tsx`: membership is resolved on the server; personal loads are member-only; the page composes one homepage surface.
- `src/surfaces/season-hub/CourtsideHome.tsx`: the real product retains team actions, directory, standings and tools even when its editorial edition is missing. Useful access is independent of a story being available.
- `src/domain/personalized-home.ts`: personal context combines identity, pairing, priced coverage, evidence and matched saved-model context. Value and performance are different concepts.
- `src/data/home-viewer.ts`: client state, a name or a URL never establishes ownership.
- `src/ui/siteDestinations.ts`: retained every destination, including the distinction between `/team` and `/teams`.

Also inspected the current header/footer and compatibility navigation components, plus the `/table`, `/intel`, `/draft` and `/history` page entrypoints to verify destination purposes. These establish source behavior, not a rendered-browser or live-account check.

Read `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, `fixture.json`, the data-only `fixture.js` export, and the approved local font catalog. Fixture SHA-256 at discovery: `7a1835933c4319c5e169c46c21197e350d39715101078358413295aad907e382`. No peer implementation, plan or old prototype content was read.

All current demo figures remain explicitly synthetic. Missing is never zero. No historic valuation line, Lineup Power, real news, fresh roster verification, transaction, injury claim or live clock will be invented. No API, auth, AI, market, storage or mutation calls are part of this prototype.

## Complete website architecture

### Identity, current location and navigation

A modest header carries the exact approved GOAT Hoopers logo, `2026 · Week 3`, the visible **Synthetic demo** label with a **Sources and limits** link, and a native select explicitly labelled **Demo persona**. The selector changes `?persona=reaves|neural|guest`; default is Reaves. It also sets `document.documentElement.dataset.persona`. The selected member is described as a demo member, never as a verified signed-in account.

Below the header, the desktop page has a normal-flow navigation column and a wider main reading column. This is a website with a visible destination map, not a fixed-height application workspace. The page has one ordinary document scrollbar. The guide has no internal scroller, hidden menu or forced sequence.

The guide's heading is **Find your way around**. Its three plain groups explain the website without turning every destination into a card:

| Group | Persistent destinations and useful meaning |
| --- | --- |
| Follow the league | **Home** (current, local prototype), **The Table** (league leaderboard), **Teams** (public profiles), **News** (league and player reporting) |
| Work on your team | **My Team** (private team area on GOAT), **Stocks** (modeled player prices), **Intel** (matchup research), **AI Decides** (saved picks and decision tools), **Trade Analyzer** (compare a proposed exchange) |
| Through the season | **Transactions** (the moves log), **Draft** (rookie draft board), **History** (past seasons), **Weekly archive** (previous editions), **Arcade** (play) |

Group descriptions carry most of the teaching; route names remain the real names. **Home** has `aria-current="page"`, with a visible current marker independent of color. On-page links beside working sections are visibly labelled **On this page**. Other destinations use explicit `https://goathoopers.com` links, an external-link indicator and the visible group explanation **Opens the current GOAT site**. Important account exits also say this in their link text. A compact **Sign in on GOAT** link remains available to every demo persona; the prototype never performs login or logout.

### Member page, normal reading order

1. **Team identity and this week.** One H1 is the team name. Manager, current record, standing and roster count sit beneath it. A wide matchup block shows the actual paired team names and score states. Its adjacent short explanation links the work to Intel. It contains immediately readable data, not a decorative hero or a large court image.
2. **What needs your attention.** Two dated, team-specific change rows from the fixture. Each includes the concrete consequence and an ordinary anchor into the relevant content. No notification count, unread state or subscription is implied.
3. **Players and evidence.** A completed-week evidence table is open in the document: player, position, counted points, period and Inspect action. It contains the five verified-demo rows for Reaves or three for NeuralNets, with the supplied eligible/roster coverage clearly stated. The period is **Synthetic completed Week 2**, October 19 through October 25 inclusive. There are no invented games-played counts or best/worst awards. A short contextual route sentence explains that player identity and modeled price research continues in Stocks.
4. **Roster quotes.** Current quote coverage, checked time and modeled FAAB basis appear above the complete roster list. All 24 or 22 names and known/unpriced values are visible in normal flow; inspection supplies secondary explanation. Player names use an explicit local Inspect control, with a separate, labelled current-site profile exit. A short paragraph explains that modeled FAAB is neither a cash balance nor completed-week performance. Recorded history is unavailable in this fixture, stated once without a blank chart.
5. **League context.** All five Week 3 pairings and all ten current standings rows remain visible. The member's own pairing and standings row receive a text **Your demo team** marker without reordering the standings. Teams are inspectable locally using supplied public identity/record fields. The Table and Teams links each say why one would continue there.
6. **Other league work.** A compact open list links Transactions, Draft, News and the Weekly archive to their purposes. A smaller Arcade preview uses the existing approved game image and an explicit **Open Arcade on GOAT** exit. This is a real destination, not an embedded playable game claim.
7. **Sources and footer.** See below.

The guide does not replace these sections, and selecting a route category does not hide them. Primary work remains readable without opening an inspector.

### Reaves Dropper: inspect new evidence

The opening shows **Reaves Dropper**, manager **aidandaly20**, **2–0**, **1st of 10**, and **24 players**. Week 3 is **184.5–171** against **Ware the Hoes At?**, a synthetic in-progress score. A calculated 13.5-point gap may be labelled **Current demo margin**, never a win, final result or live event.

The first attention row links to the five completed-week evidence rows. For example, Damian Lillard's **42.5** and Joel Embiid's **38** belong to the completed-week evidence period, not the current matchup. The second row links to roster quotes: **1,095.25 modeled FAAB, 24 of 24 priced**. There is no league value rank because comparable whole-league quotes are absent.

Below the matchup, a compact **Saved model context** line shows **56% Reaves / 44% Ware**, generated October 26 at 08:00 UTC. A local explanation retains the returned team choice and **0.35 confidence** as a separate field. It says **Synthetic saved model estimate; not calibrated odds**. This supports inspection of an existing sample, with no Run or Refresh control.

Primary opening action: **Inspect five player breakdowns**. Secondary: **Inspect matchup context**. The quote list is complete and useful, so it does not dominate the member's first task.

### NeuralNets: understand coverage before comparison

The opening shows **NeuralNets**, **0–2**, **10th of 10**, and **22 players**. The opponent is **papichooter**. Papichooter's supplied **0** is rendered as a recorded demo score; NeuralNets reads **Score unavailable**, with no leader, gap, tie, progress bar or implied 0–0.

The first attention row says **Six player quotes are missing** and exposes those six names in a short visible list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. Its primary action, **Inspect quote coverage**, anchors to the roster quote explanation. The second row explains the absent matchup score and links to matchup context. For this persona, roster quotes appear before completed-week evidence; the page answers the immediate uncertainty before offering research.

The quote headline is **16 of 22 players priced**. **1,622.00 modeled FAAB subtotal** stays subordinate and explicitly incomplete. It cannot be compared with Reaves' complete total or turned into a value rank. NeuralNets has no saved model result: a short availability sentence replaces the model probabilities and retains an identified AI Decides exit. It does not invite a fake local model run.

The three available evidence rows remain substantive: Giannis Antetokounmpo **45**, Kevin Durant **33.5**, Rudy Gobert **29.5**. Nothing is inferred about the other 19 players' participation. Any prior-season detail reads **2025: 1–20, 10th — under the previous manager as QBs Gremlins**, including the qualification wherever the record appears.

### Guest: public league home

The H1 becomes **GOAT Hoopers · Week 3**. The first content is the five public pairings with exact known/unavailable score states, followed by the complete ten-team standings and inspectable public team identities. The site guide is retained. The member-only identity, attention rows, roster quotes, evidence and saved model context are absent.

A small adjacent paragraph says **Browse the league. Sign in on the current GOAT site for your actual team**, with a real labelled account exit. It does not obstruct the public content or claim a private team. Guest discovery continues through The Table, Teams, Intel, News, History and Arcade. There is no fabricated current news story or featured winner.

### Footer and source explanation

A semantic footer follows the full document. It contains the unchanged GOAT mark, season/week, the fan-made league description and non-affiliation text, short link groups for league record, team research and play/account access, and **Back to top**. Lower-frequency routes remain in the guide and footer, not in a tiny catchall icon menu.

The directly addressable **Sources and limits** section explains the synthetic current numbers, authorized project identity/player references, retained period-qualified historical references, as-of time **October 30, 2026, 08:30 UTC**, and absence of live accounts/backends. It explains what local inspectors can establish and identifies all current-site exits. The visible badge links here; the explanation is not available only on hover.

## Reading, control and data typography

The exact logo supplies brand identity; the page does not substitute a new wordmark. Use only existing local licensed fonts and system stacks, preserving the local OFL notices.

| Role | Choice | Size, measure and reason |
| --- | --- | --- |
| Section headings and explanatory reading | Local **Lora** variable, 400 body / 600 heading | Body **17px / 1.6**, usually **48–62ch**; H1 **38px / 1.15**, H2 **25px / 1.25**. Mixed-case paragraphs explain unfamiliar league terms with a readable rhythm; the title stays modest enough for first-fold work. |
| Navigation, controls, team/player identities | **Verdana, Geneva, sans-serif**, 400 / 700 | **14.5–16px / 1.4–1.5**. Wider forms distinguish labels and long names; explicit 44px action targets come from spacing rather than oversized text. No tracking-heavy all-caps labels. |
| Scores, quote values, standings figures and timestamps | Local **IBM Plex Mono**, regular, tabular numerals | Working figures **14.5–15px / 1.5**; lead scores **30px / 1.15**. Right-align comparable numbers, retain units, and keep labels in the reading/control face. No novelty display face in data. |

At 1440px, use an approximately 1320px page frame with a roughly 224px guide, a generous gap and the flexible main column. At 1120px, keep a roughly 200px guide and let the main column's internal splits stack. At enlarged text sizes, the guide can become a normal-flow full-width navigation block. No fixed heights, hard line clamps, shrinking font sizes or compressed names. **Giannis Antetokounmpo**, **Kristaps Porziņģis**, **Stephon Castle’s Back** and **Ware the Hoes At?** are explicit wrapping cases.

The visual direction is a pale lavender guide beside a white main canvas, near-black plum text and restrained aubergine emphasis. Open lists and table rows provide the structure; a solid pale highlight is reserved for the current member's work. One deliberate contrast separates the more conversational Lora explanations from exact numeric rows. Do not decorate every metric, invent a team badge, or use color to imply score certainty or complete pricing.

## Local action paths

- **Evidence:** attention link → native anchor to visible completed-week table → Inspect beside a player → named in-flow detail showing supplied points, period, participation status and source limitation → Close → focus returns to that player's Inspect control. Unknown evidence says unavailable. No invented box score or game count is added.
- **Quotes:** coverage action → visible quote list and coverage explanation → Inspect a quote → player identity, modeled value or Unpriced, the shared checked time and source basis. NeuralNets' six missing quotes remain visible without first filtering. Optional labelled search can narrow the complete list, with a visible count and Clear; initial content is the complete roster.
- **Matchup:** Inspect matchup context → local region beneath the score → both teams' supplied current records, exact score states, and Reaves' saved-model provenance when supplied. Opponent roster detail is not fabricated. An explicit external team-profile link continues on GOAT.
- **Public team:** a standings team-name link opens a local public summary with manager/current record, the supplied pairing and qualified prior-season record. It never borrows private member content. A separate exit opens that team's current GOAT profile.
- **Navigation learning:** a contextual sentence identifies its destination by both name and task, such as **Stocks — inspect modeled player prices**. All route exits work as ordinary links, while local inspections remain in this document.

Local inspection regions are hash-addressable and use ordinary history: opening adds the selected detail hash; Back closes/restores the previous selection; a direct detail URL opens the relevant region. Close returns to the section and restores trigger focus when present, otherwise its stable heading. Links navigate; buttons expand state. No modal focus trap is used for these in-flow regions. Expanded state, control names and relationships are programmatic. A keyboard skip link reaches main content, focus remains plainly visible, and native links/selects retain expected behavior.

## Assigned sources actually read and applied

1. [Rauno Freiberg, **Contrasting Aesthetics**](https://rauno.me/craft/contrasting-aesthetics): read the complete article text, including **Inviting Curiosity**, **PP Foundry**, **Just Friends**, **Raw Materials**, **Spaces** and **Loïc Nottet**. Image descriptions were available; linked case-study sites and the embedded music were not examined. The useful principle was purposeful contrast with consistency around it. This changed the structure: a distinct teaching guide sits beside restrained working data, while identity, position and destination labels stay stable across personas. Typographic contrast is limited to reading versus controls/data; it is not an excuse for novelty in every section.
2. [iart-ai, **accessible-animation**](https://www.ui-skills.com/skills/iart-ai/accessible-animation): read its complete embedded skill body, not merely the catalog description. Also read the complete [author's primary SKILL.md](https://raw.githubusercontent.com/iart-ai/web-animation-skills/main/skills/accessible-animation/SKILL.md), including motion tiers, CSS/JS gating, WCAG mapping, verification and gotchas. The GitHub rendered-path fetch was robots-denied; the primary raw file opened successfully. No installation or referenced scripts were used. This changed behavior: static content is immediately present; inspection feedback may use only a short opacity/color change; no animated page travel, score counters, ticker or carousel. Reduced-motion users retain focus and state cues. No action waits for animation completion. Verify normal and reduced settings if built.

These are design principles applied to this product, not imported layouts. Source reading does not establish rendered accessibility, color contrast or browser behavior.

## Build followup and checks still pending

When root authorizes the build phase, implement only in `qa/homepage-personal-20/12/`, using the shared fixture as a data-only import. Add the source/provenance record to `NOTES.md` then. Preserve identical content and geometry under `?stage=structure`; neutralize color/images there. Set `document.documentElement.dataset.personalStudyReady = "12"` only after content/fonts settle.

Planned focused checks: all three persona URLs and unknown-persona fallback; all fixture routes discoverable with labelled exits; 1440px and 1120px whole-page usability; long-name wrapping and enlarged text; keyboard inspection/Close/Back/direct hash; reduced-motion parity; complete versus partial quote wording; known zero versus unknown score; source explanation and guest privacy. Root owns final captures. No browser, accessibility, live-site, account or performance verification is claimed in this discovery phase.

**Status: stopped after discovery. No blockers to the plan; presentation implementation awaits root followup.**
