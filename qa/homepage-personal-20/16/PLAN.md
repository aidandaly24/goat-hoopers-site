# Author 16 — personal league home

Discovery only. No presentation implementation has been written. Own scope: `qa/homepage-personal-20/16/`. Await the root's build followup.

## Product decision

The home should let a manager look after their team while remaining present in the league. I am choosing two substantial, continuous reading areas: **Your team** and **The league this week**. They sit beside one another on desktop and share one document scroll. The first contains the manager's actual work; the second contains the other people and contests that make that work matter. This is a website home with persistent navigation, readable primary content, useful inspection, and a complete destination footer.

The fixture contains identities and pairings but no friend graph, follows, messages, or social activity stream. Consequently, the community feature is **Keep in view for this visit**. A visitor can choose teams and get small return links to those teams' current contests. The page never claims those teams are friends or that a follow was saved. The current opponent is explicitly identified regardless of any choice. All ten teams and all five contests remain visible without making a selection.

### Three architectures considered privately

1. A chronological community feed beginning with team changes and followed-team events. This would make repeated visits familiar, but the available data has only four team-specific demo changes and no public social event stream. A feed would either be nearly empty or give those changes a false league-wide meaning.
2. A full team directory as the primary navigator, with the selected team occupying a work area. This makes it easy to explore friends, but it postpones the returning manager's own evidence and hides too much of the league behind selection.
3. The chosen parallel reading areas: useful personal work and the visible league compete for attention in a controlled way. The same homepage supports a quick own-team check and an unplanned look at someone else's game. The page does not depend on an invented social graph or a large selected-state workspace.

The obvious default I rejected is an oversized team headline followed by matchup, valuation, evidence, standings, and tools in one long sequence of open tables. Competition should be present while the manager reads personal evidence, not become a late destination after completing that sequence.

## What discovery established

- The actual homepage is one `CourtsideHome` surface. Its membership comes from `loadHomeViewer`, not a client-selected team, and its public fallback preserves access when the edition or optional inputs are absent.
- The production composition already offers public pairing/directory access, member roster information, valuation coverage, player evidence, and matched saved AI. The QA exercise can reorganize these capabilities without inventing a new backend.
- No value history, Lineup Power producer snapshot, player game-count breakdown, public news articles, transactions, or opponent rosters are supplied by this synthetic fixture. Those are not content sources for this plan.
- The fixture's as-of time is **30 October 2026, 08:30 UTC**, season 2026, Week 3. Current numbers are synthetic. Scores are current demo scores, never finals or a live service.
- A team inspector can show every team's public identity, current standing, current pairing, and qualified previous-season record. Member-only player and quote inspection uses the selected demo member's own roster. Guest does not receive that private roster work.

## Complete desktop architecture

### Identity and navigation

Use the exact supplied black GOAT Hoopers horizontal logo at a normal navigation scale. A compact masthead carries `Home`, season/week, and the as-of time. It is followed by a deliberate local navigation line: **Your team** for members, **This week**, **People**, and **Explore GOAT**. `Home` is the current location. These are ordinary in-page links with clear targets, not tabs that replace the homepage.

The right end has a labelled **Demo persona** native select, with Reaves / NeuralNets / Guest. It writes only the explicit `?persona=` demo state; default is Reaves. Unknown values fall back to the default, never to membership. During a later build the root element will expose `data-persona`. A visible **Synthetic demo** label links to the source explanation. Member account handoff says **My Team on GOAT**; guest says **Sign in on GOAT**. Both visibly leave this prototype and navigate to the existing site.

### Main reading and spatial hierarchy

At 1440px, use a roughly 1360px content frame: personal reading area approximately 44%, league area 56%, with a generous shared gutter and one clear separating rule. At 1120px, preserve readable type and allow the columns and long names to wrap within the reduced frame. They are ordinary document sections, never independent scroll readers. Their relationship stays recognizable through persistent section labels, not a field of repeated cards.

The member's first fold contains their identity, current record/rank, matchup or precise missing-score status, the new team changes, and real inspection actions. Beside this, the current opponent and all five Week 3 pairings begin immediately. A short page title establishes location; it does not occupy a promotional hero.

The personal area uses a pale apricot reading ground; the public league area uses a clear near-white ground. Near-black text, a restrained deep-blue link/focus role, and a dark rust action role give the homepage a recognizable GOAT character. The final build must measure the actual contrast pairs. Broad color areas, typography, and relationships do the organizing; borders are reserved for real grouping, not every paragraph. No court photograph is needed to fill the first fold. Approved player portraits can support the small known-evidence set; missing portraits use labelled initials. No mascot or figurine.

### Personal reading area — Reaves

1. **Your team:** Reaves Dropper / aidandaly20, 2–0, first in the supplied standings, 615.5 season points for. The primary local action is **Inspect your team**. The external account handoff remains separate.
2. **Your matchup:** Reaves Dropper 184.5 vs Ware the Hoes At? 171, explicitly current synthetic Week 3 scores. It is reasonable to state a 13.5-point current margin, with no final-result claim. Show the opponent's manager Aedan23 and 1–1 record, with local team inspection and a visit-only keep control.
3. **New for your team:** the two supplied changes, dated 08:20 and 08:10 UTC, link directly to player evidence and quotes. Do not call these unread notifications or claim a last visit.
4. **Counted-game evidence:** five known player rows for synthetic completed Week 2, 19–25 October. Lillard 42.5, Embiid 38, Harris 31, Turner 24.5, White 22. Each has position, explicit points unit, and an Inspect action. Say **5 of 24 roster players have supplied evidence**. No count of games or current-week participation is inferred; the other players are not called poor performers.
5. **Your roster quotes:** $1,095.25 modeled FAAB, coverage 24/24, checked 08:10 UTC. All 24 player names, positions, and supplied quotes remain available in a compact visible roster list. The total is a modeled quote, not spending money. Player inspection explains the supplied quote and evidence fields without adding price factors or a history chart. The absence of a comparable league-wide set explains why there is no value rank.
6. **Saved estimate:** place a small labelled model context directly beside/below the matchup, rather than promoting it to a second match result. Returned choice Reaves, both probabilities 56% / 44%, independent confidence 35%, generated 26 October 08:00 UTC. The label is the fixture's synthetic saved estimate, not calibrated odds. A disclosure contains provenance. No Generate/Refresh control.

### Personal reading area — NeuralNets

This state changes the order of work and the emphasis, not only the identity.

1. **Your team:** NeuralNets / NeuralNets, 0–2, tenth in the supplied standings, 412.25 season points for.
2. **Your matchup needs a score:** own score is **Not returned**; papichooter's supplied zero remains **0**. Show papichooter's 2–0 record and current-opponent identity. Do not name a leader, calculate a margin, or render a false 0–0 draw. The first action is **Inspect score coverage**.
3. **Quotes to check:** surface all six unpriced names immediately: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler, Darryn Peterson. Their state is Unpriced. The supplied coverage change is visible here. Their omission is a concrete reason to inspect, not a lineup recommendation.
4. **What is available:** show the three completed Week 2 evidence rows — Giannis Antetokounmpo 45, Kevin Durant 33.5, Rudy Gobert 29.5 — with **3 of 22** roster players covered and the exact sample period.
5. **Your roster quotes:** $1,622.00 **priced subtotal**, 16/22 priced, six unpriced. The full list retains all 22 players and their honest states. Never present $1,622 as a complete team value or compare it as greater than Reaves' total. No value rank.
6. There is no saved model estimate. Use one quiet sentence at the matchup: **No saved estimate is supplied for this pairing.** Do not put an empty probability chart or a generation button in the space.

If previous-season information is opened in team inspection, NeuralNets' 2025 1–20 / tenth record always carries **Under the previous manager as QBs Gremlins**, including the collapsed summary. It is never the current manager's career record.

### The public league area — both member states

- **People in view:** always identify the current opponent first. Optional visit-only choices appear as compact team-name / record / current-contest links. Initially there are no invented friend choices. Removing a choice restores the ordinary label and leaves every public contest in place. A plain visible explanation says choices last only while this page is open.
- **Week 3 across the league:** an ordered set of five paired contest groups, not a standings table and not a carousel. Each uses full team names, manager handles, records, current score labels, and separate Inspect team controls. Preserve fixture pairing order so “your matchup” is a visible label, not an implicit new rank. Both missing and recorded-zero states in m4 remain visible to everyone. The selected member's pair receives a text label, not only a tint. The other four pairings are already normal-flow content.
- **People, in league order:** all ten teams, ordered by the supplied standing rank. A readable roster-style list combines the directory and standings rather than repeating two copies. Each entry prints team, manager, W–L, points for, rank, local Inspect, and Keep in view. Long names wrap. Mark **Your team** and **Your opponent** in words for members. Explain the existing six-team playoff qualification and Week 20 start without predicting qualification. A boundary after sixth place is labelled rather than interpreted as current elimination.
- **More time with the league:** a small 2025 final reference, Josh Diddy's Roster 326 / papichooter 251.5, explicitly historical, followed by a History site exit. One restrained Arcade preview uses the existing approved game image and a real external launch. Stocks has a concise external entry explaining that it offers deeper player valuation on GOAT. No fresh news or move stories are invented for these areas.

### Guest is a complete public homepage

Guest uses **This week** as the larger left reading area and **League people** as the right. A brief signed-out introduction offers actual account entry and explains that the prototype is public synthetic context. Five games, all ten identities, league standings, playoff format, qualified history, Stocks, and Arcade remain useful without sign-in.

Guest can locally inspect public teams or keep a team in view for the visit. There is no **Your team**, personal changes feed, private roster, own valuation, private completed-week evidence, or model result borrowed from a member persona. Sign-in is an identified external navigation, not a locally successful account state.

### Semantic footer and all destinations

The footer is a real site map and source handoff, not a copyright-only ending. Its heading and each external link visibly identify **GOAT site — leaves prototype**. Group destinations by visitor purpose:

- **Follow the league:** News `/news`, Teams `/teams`, Transactions `/transactions`, The Table `/table`, Intel `/intel`.
- **Manage and inspect:** Stocks `/stocks`, My Team `/team`, AI Decides `/ai-decides`, Trade Analyzer `/trade-analyzer`, Draft `/draft`.
- **Keep exploring:** Arcade `/arcade`, History `/history`, Weekly archive `/weekly`.
- **Account and home:** Sign in `/login`, a local Back to top/Home link, and a labelled GOAT Home `/` external link.

Individual team/player site exits use `/teams/:id` and `/player/:id` and say they open the GOAT site. An always-available source disclosure explains synthetic current numbers, authorized identity references, qualified historical fields, no backend connection, and the fixture's unavailable history/Lineup Power states. It does not advertise a feature as working because its real destination is linked.

## Typography as a working system

Use only the existing licensed local font bytes and preserve their OFL notices.

| Role | Choice | Size and purpose |
| --- | --- | --- |
| Main title and short section titles | Archivo Black, actual regular file | About 30–34px for the page title, 22–26px for major titles. Its broad, strong forms give GOAT character without making every number shout. Mixed case, no giant outlined team name. |
| Reading paragraphs and source explanation | Lora variable, 400; 500 for emphasis | 16–17px, roughly 1.5–1.6 line height, mostly 45–65 characters per line. Plain mixed-case sentences retain their rhythm alongside the busier paired games. Do not use it for dense scores or tiny labels. |
| Navigation, controls, team/player identities | Space Grotesk variable, 500/600 | 15–16px controls; 17–19px identities; 23–27px for the member name. Good differentiation between short controls, manager handles, and long names. Minimum targets remain 44px even when label text is small. |
| Scores, records, points, quotes, coverage and dates | Space Grotesk, lining tabular figures | 18–22px for ordinary game scores, about 38–44px for the personal score; 15–16px for list data. Decimal alignment comes from tabular figures and layout, not a monospace face. Units and states remain readable text. |

I inspected the local font tables using installed FontTools: Lora and Space Grotesk both include a `tnum` feature; Space Grotesk also includes `lnum`. Their default digits are proportional, so the later CSS must explicitly enable lining tabular figures for numeric roles. Archivo Black's default numeral advances are equal, but it is still reserved for headings. No Georgia/Verdana/IBM Plex fallback system is being adopted.

The layout must accept **Giannis Antetokounmpo**, **Stephon Castle’s Back**, **Ware the Hoes At?**, **Kristaps Porziņģis**, and **$1,622.00 priced subtotal** at ordinary text sizes. Names may take two lines. At 1120px, reduce excess gutters before changing content structure; do not scale type down to keep a single line. Enlarged text may stack the two reading areas in semantic order. There is no fixed-height content clipping or internal horizontal reader.

## Useful local actions and state behavior

1. **Inspect team:** explicit buttons in the personal heading, matchup, kept-team list, and people directory open one native named dialog. It contains that team's supplied public identity, record/rank, current pairing/score coverage, and qualified 2025 history. The selected member additionally has a local jump to its own roster. Other teams do not acquire fabricated roster data. A clear external public-profile link remains separate.
2. **Inspect score coverage:** opens a readable local source view of the exact two score fields, matchup state, week, and as-of timestamp. NeuralNets reads Not returned next to papichooter 0. Reaves gets the two actual demo fields and current margin, never a claimed final.
3. **Inspect player/quote:** opens a named native dialog with the selected own-roster player's identity, position, modeled quote or Unpriced state, supplied Week 2 points or Evidence not supplied, sample period/coverage, and source notice. No factor model, game log, injury, NBA team, or history is invented. Full roster totals stay visible on the underlying page.
4. **Keep in view:** a real labelled toggle maintains a small in-memory set. Buttons expose their pressed state. The list of selected teams and return links updates politely; focus stays on the initiating control. No saved subscription, notification, storage, or server mutation is claimed. Clear choices works locally. All contests/teams remain visible.
5. **Read new evidence:** the supplied team-change links jump to their already-visible section, focus its heading, and use ordinary browser anchor history. There is no “mark all read” fiction.

For each inspector, opening stores the trigger; Close and Escape return focus to it. A local history state with the current persona supports Back to close and Forward to reopen the same inspector. A direct inspector URL must have a usable Close fallback to the same persona's home, with focus on the relevant section heading. Dialog content grows with text; no animated travel from a team row, no hidden page dependencies. Only an actual modal gets containment.

Navigation and keyboard feedback are immediate. No motion is necessary for this returning-use product. Optional hover color/underline feedback will not gate content; reduced-motion/still behavior gets all content and tasks. Use a skip link, meaningful landmarks/headings, visible focus, native controls, descriptive names, and explicit labels for numeric unknowns. Avoid whole-row click targets that contain unrelated controls.

## Actual source reading and concrete applications

### Assigned primary references

- [Emil Kowalski — Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), also read from the [raw primary file](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md). **Partial read:** Core Philosophy; Animation Decision Framework; button response and popover-origin parts of Component Building Principles; Accessibility; Sonner Principles/cohesion; Review Checklist. Applied the frequency/purpose test to remove animated list navigation, count-up scores, scrolling reveals, and animated inspector travel. Applied the cohesion principle to one consistent interaction language across both reading areas. This reference did not prescribe the architecture or typography; those are the product decision above. Not installed and no reference scripts run.
- [Addy Osmani — accessibility, rendered UI Skills page](https://www.ui-skills.com/skills/addyosmani/accessibility). **Read the substantive skill guidance in full**, including evidence-led workflow, Perceivable, Operable, Understandable, Robust, testing checklist, and impact priorities; page index/related links are not claimed as source reads. Applied native controls and clear names to the separate Inspect/Keep actions; focus visibility and obscuration principles to anchor targets and close restoration; consistent navigation to a stable footer; and zoom checks to intrinsic wrapping. The project’s stronger 44px target and correct CSS-pixel large-text threshold govern later verification. Automated results alone will not be called screen-reader evidence or conformance. No installer commands run.

### Product and repository sources read

Read `AGENTS.md`, `ARCHITECTURE.md`, `qa/homepage-personal-20/AUTHOR-BRIEF.md`, assigned `briefs/16.md`, `PRODUCT-INVENTORY.md`, and the complete `fixture.json`. Read the actual `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, and `src/ui/siteDestinations.ts`. Read the font catalog and inspected the three selected local fonts. Relevant production design reading: `DESIGN.md` controls/accessibility and personalized-team sections, the repository design skill and its navigation/accessibility reference. The QA brief explicitly owns palette, type, section sequence, and composition; those production visual prescriptions were not copied. Managed-runtime skill/network context was inspected for this workspace. No peers, rejected catalog, old prototype source, or unrelated dashboard images were inspected.

## Later build verification and present boundary

Once explicitly followed up to build, verify all three persona URLs at 1440 and 1120 CSS px; verify 200% text/zoom growth, long names, explicit null versus zero, coverage totals, all destinations, keyboard open/close/Back/Forward, focus restoration, and visit-only choices. Check `?stage=structure` preserves full geometry/content with neutral treatment, and set `data-personal-study-ready="16"` through the required JavaScript dataset property only after fonts/content settle. Root owns final captures.

Present evidence is source and font inspection plus this architecture plan. No browser, contrast, visual, accessibility audit, or live behavior pass has been performed; none is claimed. No application files, shared assets, dependencies, auth, API, storage, production, publication, or release state changed. No blockers to the planning deliverable.
