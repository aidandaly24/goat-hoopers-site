# 17 — Week in context

Discovery only. This plan answers: **How can this week's useful team work carry the season and the league's actual memory with it?** The homepage will attach a little history to the people and games it explains. It will not ask a returning member to enter an archive before getting to work.

## Three architectures considered

These are independent sketches, made from the current product and this fixture. No peer implementations, plans, old studies or rejected prototypes were inspected.

1. **Week in context — selected.** A conventional website masthead opens into a broad current-game area, with a narrower season-context column alongside it. Current changes lead directly to open evidence and quote-coverage sections. All five league pairings follow as substantial horizontal fixture rows. Previous-season facts appear beside the relevant team, with deeper team history available locally. The page uses continuous sections rather than a grid of dashboard cards.
2. **The league as a directory.** All ten franchises form the main ordered directory; the viewer and opponent have expanded entries containing their game, roster work and past record. This gives the league's people strong presence, but makes a returning member find their task inside a directory and encourages the same roster/standings table solution the brief is trying to escape. Guest browsing would be good; member urgency would be weak.
3. **Three adjacent time horizons.** A wide desktop workspace holds This Week, This Season and Before This Season simultaneously, with tasks in the first column and linked historical receipts in the third. This makes the discovery question explicit, but grants history equal visual weight even when only one qualified prior-season record exists. At 1120px it also sacrifices reading measure or pushes important tasks into a narrow column. It would drift toward an archive poster.

The chosen architecture keeps historical context near its present consequence. It rejects both a giant champion/history feature and the obvious scoreboard → full roster table → full standings table default. The complete roster remains available as a useful inspection, not the homepage's main body.

## What the real product established

The actual root page is request-private and server-resolves membership. It composes `CourtsideHome` from existing domain projections; signed-out visitors retain public league access. Its useful capabilities include a matched current pairing, saved model context, limited player evidence, quote coverage, current standings, public team inspection and qualified previous-season records. There is no need to invent a new metric, transaction feed or authorization model for this study.

The demo cannot supply a team-value series or Lineup Power. A missing score, missing evidence and missing price are three different states. A completed-week player's points are neither this week's live contribution nor a modeled FAAB quote. Those distinctions affect placement and labels throughout this concept.

## Complete page architecture

### Identity and navigation

- Exact approved horizontal GOAT logo, a compact league/season identity, and a current Home link with `aria-current="page"`.
- Primary navigation: Home; This week's league (local anchor); Stocks; Arcade. The last two clearly say `GOAT site` beside their labels. They remain direct destinations.
- A native `More on GOAT` disclosure contains News, Teams, Transactions, Draft, Intel, The Table, AI Decides, Trade Analyzer, History and Weekly archive. Its introductory text visibly identifies those links as leaving the prototype. It is a normal-flow disclosure, not a modal megamenu.
- Member identity has a local `Inspect your team` action. The guest has `Sign in on GOAT site`. Real `/team` and `/login` exits remain separately available.
- A small, explicitly labelled `Demo persona` select provides Reaves, NeuralNets and Guest. It controls only `?persona=...`; Reaves is the default. The rendered state will set `document.documentElement.dataset.persona`. It makes no membership claim.
- One compact visible `Synthetic demo` label and `About these sources` disclosure show the fixed sample timestamp, 30 October 2026, 08:30 UTC. There is no running freshness clock.

### Reaves: inspect the new evidence, with the game still in view

1. **Your Week 3.** The first useful block names Reaves Dropper and Ware the Hoes At?, shows 184.5–171 current synthetic points and marks the game as in progress. Both names inspect locally. Two dated change entries sit immediately below: five players now have completed-week evidence; all 24 quotes are available. These link to the corresponding visible sections.
2. **Season context beside the game.** Current rank 1 of 10, 2–0, and 615.5 points for are labelled 2026 demo standings. A short adjacent note reads `2025: fourth; 16–5`. The opponent's 2026 record and 2025 fifth-place finish provide useful context without suggesting a head-to-head history that is absent. A saved-estimate line belongs with the matchup: Reaves 56%, Ware 44%; generated 26 October; synthetic saved model estimate, not calibrated odds. Confidence 0.35 appears only in the provenance expansion and remains distinct from the percentages.
3. **The evidence you can inspect.** All five available completed-Week-2 players are visible as compact readable rows, not oversized portrait cards: Damian Lillard 42.5 points, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5, Derrick White 22. The heading states `5 of 24 roster players` and the exact 19–25 October period. Each row has an explicit inspect control. No absent player becomes a poor performer, and these five rows never become a complete team recap.
4. **Current modeled quote.** A contrasting but open section shows 1,095.25 modeled FAAB, 24/24 priced, calculation time, and three priced roster anchors: Embiid, Anthony Edwards, Alperen Şengün. A local disclosure exposes every roster quote. The prose states that modeled FAAB is not a cash balance; no value rank is supplied. `No recorded value series in this demo` is a short line, not an empty chart panel.
5. **Around Week 3.** All five fixture rows are visible in normal flow. Each side shows its team name, current record and standing; the middle shows its known points or explicit unavailable state. The viewer's pairing is textually marked. Team inspection supplies deeper season/history context.
6. **Continue from here.** A modest tools band explains Stocks for individual quotes, Trade Analyzer for the real comparison tool, and Arcade for the existing game. Each exit is visibly labelled. It provides useful onward work without claiming a local trade submission or playable recreation.

### NeuralNets: establish what is known before comparing

The same identity system hosts a materially different task order.

1. **Your Week 3 score is unavailable.** NeuralNets versus papichooter leads. Neural's points say `Unavailable`; papichooter's supplied score says `0 points`. There is no lead, deficit, win label or 0–0 scoreline. The recorded-zero explanation is visible without opening anything. `Inspect matchup data` is the primary local action.
2. **Review six missing quotes.** This is the first task section after the game, ahead of player evidence. All six unpriced names are visible: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The known 1,622.00 FAAB is subordinate and explicitly a **16/22 modeled subtotal**. It is not compared with Reaves' complete quote, ranked, or used to draw a value trend. Known quotes remain inspectable through the complete local roster disclosure.
3. **Your current season, in context.** Rank 10 of 10, 0–2 and 412.25 points for are current synthetic facts. Whenever the previous record is shown, the qualification travels with it: `2025: tenth, 1–20 — under the previous manager as QBs Gremlins.` This is not described as the current manager's performance. Papichooter's 2025 runner-up finish is concise opponent context.
4. **Three pieces of completed-week evidence.** Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5 are all visible with the same explicit period and `3 of 22` limit. An unavailable saved estimate is one honest matchup note; it does not become a blank model card or a disabled Generate button.
5. **Around Week 3 and onward tools** remain substantial and visible as on Reaves, with Neural's fixture and relevant context marked. History does not displace current gaps.

### Guest: a useful public league homepage

The guest begins with `Week 3 in GOAT Hoopers` and all five current synthetic pairings, with their ten team identities, standings and current records. The score-gap explanation appears on the papichooter–NeuralNets fixture. A side column explains the supplied league structure: ten teams, six playoff places, playoffs beginning Week 20. It makes no prediction.

Below the public fixtures, `Get to know these teams` explains local public profile inspection and offers compact factual league memory. The retained 2025 final, Josh Diddy’s Roster 326 versus papichooter 251.5, is a short dated reference attached to those teams, not a champion showcase. Neural's ownership qualification is already present wherever its prior result appears. Public team details contain current and previous records, not a borrowed private member desk. No personal change feed, saved member estimate, private quote total or claimed team appears in this state.

The useful onward band offers public News, Teams, Stocks, History and Arcade entry with honest destination descriptions, plus real sign-in on the existing site. It does not replace league content with a login landing page.

### Semantic footer

The footer identifies GOAT Hoopers, the 2026 synthetic design study, and the fact that current numerical data is constructed. It contains grouped links under the visible heading `Continue on the GOAT site — leaves this prototype`:

- League: Home, Teams, Transactions, The Table, Draft.
- Research and decisions: News, Stocks, Intel, AI Decides, Trade Analyzer.
- More of the league: History, Weekly archive, Arcade.
- Account: My Team and Sign in.

Thus all 15 fixture destinations remain discoverable without dominating the header. A local Back to top link and an accessible source explanation finish the page. No unsupported legal pages, newsletter signup or notification service are invented.

## Typography, identity and desktop behavior

- **Reading:** installed system `Noto Sans`, with Verdana and generic sans-serif fallbacks; 16px, weight 400, line-height 1.55, prose measure about 55–62 characters. Longer explanations use mixed case. Names remain at least 16px and wrap intrinsically. This readable, neutral face carries factual qualifications without making them look like ornamental footnotes. The workspace font inventory confirmed Noto Sans; the initially considered Trebuchet was not installed, so the plan does not rely on it.
- **Controls:** existing licensed local Space Grotesk, 14–15px, weight 600, normal mixed case and 44px minimum target height. It gives GOAT's working actions a consistent character distinct from reading text. The long labels `Giannis Antetokounmpo` and `Inspect completed-week evidence` must wrap or grow controls; they are not truncated to maintain a grid.
- **Data:** Noto Sans with tabular numerals, 16px/500 for rows and 40–48px/600 for the current score only. This is a proportional sans face with aligned digits, not a monospace terminal treatment. Units and availability words stay alongside the values. Ranks, records and scores receive different explicit labels; no naked large number is asked to explain itself.
- **Short headings:** existing local Barlow Condensed Regular, around 28–36px with tight but readable line-height. It provides a modest sporting rhythm for `Your Week 3` and section titles. It never carries paragraphs, controls, long rosters or a huge motivational statement. No tracking-heavy uppercase metadata system.
- **Identity:** preserve the exact approved logo. Use a deep evergreen identity band, warm neutral reading field and restrained citrus emphasis for actionable source gaps; status always has text. Small approved player portraits help recognize evidence rows. No decorative arena hero is needed: the league's names, exact logo, fixtures and purposeful type provide GOAT identity throughout the site. No jersey, ticket or poster metaphor.
- **Geometry:** maximum reading frame about 1260px. At 1440px, the first member section is approximately two-thirds current work and one-third season context; lower evidence and quote sections have deliberately different widths. At 1120px, side context moves below the current-game material before any type is reduced. Fixture rows can become two stacked team lines with the score still labelled. There are no fixed-height readers, clipped names, internal page scroll regions or viewport-height panels.
- The meaningful content is already in the document. Only secondary details disclose. Text enlargement grows the page; no CSS scaling. Keyboard focus is visible, landmarks and heading order are semantic, source disclosures use native controls, and motion is unnecessary. Reduced-motion users receive the complete same tasks. Desktop 1440 and 1120 are the build targets; no phone design/capture work is proposed.

## Local action contract

1. A change entry navigates to its existing evidence or quote-coverage section and focuses the destination heading. The target remains visible in document flow.
2. A team name opens an adjacent, in-flow local profile section containing its identity, current season, current pairing and explicitly qualified previous season. Own-team inspection additionally exposes the supplied roster names and relevant quote coverage. Other teams never receive an invented roster. `Close team details` returns focus to the exact opener. Fragment state allows Back/Forward to restore or close the inspection without changing the persona query.
3. A player Inspect button expands a readable receipt beneath that evidence row: identity, position, supplied points, exact completed-week period, participation status and coverage limit. Its current quote, if present, is separately labelled with its own time/basis. No box-score components, injury assertions, games-played values or unsupported weekly totals are generated. Close restores focus; Back restores the prior fragment state.
4. `Inspect all roster quotes` is a native disclosure containing every supplied player and quote/unpriced state, with visible count, units and source explanation. It has an explicit close route back to its summary. Neural can jump directly to the six unpriced rows. This is secondary depth; the meaningful pricing limit and missing names were already visible.
5. `Inspect matchup data` exposes the fixed sample's two score values and their states, plus the saved estimate only where supplied. Model choice, confidence and probabilities remain distinct. It performs no refresh or generation.

All inspection is local and data-only. Links to `https://goathoopers.com` are explicit exits. Login, lineup editing, notifications, trade submission, market computation, API fetches, auth, databases and storage are outside this prototype's behavior. Any future implementation will preserve `?stage=structure` content/geometry while neutralizing decoration, and set `dataset.personalStudyReady="17"` only after fonts and content settle.

## Sources actually read and their effect

### Assigned primary references

- [Hallmark — Redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md), read in full from the [official raw file](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md), 76 raw lines, including **What a redesign keeps**, **Depth**, **Before**, **The plan**, **Build**, and **After**. The useful principle was preserving facts, destinations and brand while recomposing. It changed this plan into a route-complete website and made source/period limits part of the structure. Its distinction between an app screen and a hero also supports a useful first fold. No scaffold, linter, scripts or theme deal was run; this is an isolated new QA authoring task, not a Hallmark production redesign.
- [pbakaus — Adapt](https://www.ui-skills.com/skills/pbakaus/adapt), read the complete displayed skill body, **Assess Adaptation Challenge** through **Verify Adaptations**, and the inline **Responsive Design** reference through its final Avoid guidance. Applied **Desktop Adaptation** by keeping more useful material simultaneously visible; applied content-driven breakpoints and input-method guidance by retaining native controls and reflowing the side column at 1120px. The narrow-desktop strategy changes layout before font size and never makes hover the only inspection route. Phone/print/email strategies were read but are outside this desktop-only assignment. No package was installed.

Both assigned references opened successfully. No index is claimed as a source read. They supplied principles, not a common art direction, font scheme or section template.

### Product and local source inspection

Read `briefs/17.md`, `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, the full data-only fixture JSON, its JavaScript export, and the local licensed-font catalog. Read the actual `src/app/page.tsx`, all of `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`.

Read root `AGENTS.md`; the architecture introduction, weekly evidence, recorded-only value-history and roster replay sections, courtside/weekly archive and personalized home sections, shared shell/identity directory, data-flow contracts, caching and account ownership sections in `ARCHITECTURE.md`; and the relevant ownership, truthful content, controls, sources, accessibility and personalized-state guidance in `DESIGN.md`. Production visual prescriptions are deliberately not adopted by this QA plan. Production and shared files remain unchanged.

Evidence at this stage is **source inspection and a written architecture**, not a rendered-page, device, live-data or interaction test. No browser behavior has been claimed. Build and targeted keyboard/layout verification await the coordinator's followup.

## Discovery handoff

Only `qa/homepage-personal-20/17/PLAN.md` is authored. No presentation code, dependencies, production changes, publication, commits or remote actions. No blockers. Stop here for the complete-website review and explicit build followup.
