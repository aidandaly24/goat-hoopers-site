# Concept 14 — Keep the context

Discovery only. No presentation code has been written. Await the root author's build followup.

## Product answer

A careful manager needs a dependable reading place: see what changed, inspect an owned player, compare that player with another, and still know which team, matchup and period the numbers belong to. The homepage will therefore be one continuous document with a useful global header, a small on-page index, open league coverage, and local comparisons inserted beside the source material. It should feel like returning to a familiar league website rather than opening a detached analysis tool.

The primary member question is **“What deserves my attention, and what evidence supports it?”** The primary action is inspecting the relevant player or quote in place. The opening area already contains the member's current matchup, record, coverage and recent changes. There is no promotional hero or introductory empty viewport.

The obvious default I rejected is a large comparison dashboard with player cards, a tabbed detail reader and a persistent selected-player tray. That gives comparison mechanics the whole page, hides league content, and repeatedly displaces the reader. Here, comparison is a useful action inside a complete homepage.

## What I inspected

- `AGENTS.md`; `ARCHITECTURE.md`, particularly the personalized team front page, contracts, data ownership, recorded valuation and player-guide sections.
- The complete `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, and `src/ui/siteDestinations.ts`.
- The pure personal projection in `src/data/personalized-home.ts`; the player-guide source contract and valuation policies for the relevant provenance and coverage behavior.
- `DESIGN.md` sections about view purposes, density, controls, content voice and personalized states. Its production palette, fixed composition and font choices do not prescribe this experiment.
- The complete author brief, concept 14 brief, product inventory and data-only `fixture.json`, including both full member rosters, guest state, destinations, historical qualification and asset references. The shared font catalog and approved asset filenames were also inspected.

Product inspection was through the authorized application source. I did not run the production application or make a live account, market, AI, database or Sleeper request. The provided port 4207 answers as a static Python file server; it is not evidence of a running production homepage. No peer directory, prior prototype, old catalog or reference index was inspected.

## Three substantial homepage states

### Reaves Dropper: read the new evidence

The greeting is the actual team name with manager `aidandaly20`, 2026 record 2–0 and current standing 1 of 10. Week 3 shows Reaves Dropper 184.5 and Ware the Hoes At? 171, explicitly labelled a synthetic in-progress score sample. A 13.5-point difference may be calculated from those known scores and labelled as the current sample margin, never a result or forecast.

The opening changes list leads with the completed-week breakdown, followed by complete quote coverage. **Inspect the Week 2 evidence** is the main filled action. It moves to the open evidence table, where all five verified rows are visible: Damian Lillard 42.5, Tobias Harris 31, Joel Embiid 38, Myles Turner 24.5 and Derrick White 22. The period is “Synthetic completed Week 2,” October 19 to before October 26. Coverage reads 5 of 24 roster players; the other 19 are not assigned zero points, poor form or DNP status.

The modeled quote is $1,095.25 FAAB with 24 of 24 priced. It is labelled a modeled roster value, not a spendable balance. The full roster quote list is available locally. No league value rank appears because comparable complete quotes for every team are absent.

The matchup chapter separately shows the saved synthetic model estimate, 56% Reaves / 44% opponent, saved October 26 at 08:00 UTC. “Not calibrated odds” remains visible; the 0.35 model confidence is a separate labelled field in provenance, not a third probability or certainty score. The source does not provide model identity, input hash or prompt version, so these are not invented.

### NeuralNets: establish what is actually known

The identity is NeuralNets, manager NeuralNets, 2026 record 0–2 and current standing 10 of 10. The opening notice names both real gaps: six missing quotes and an unavailable own score. The main action is **Inspect six missing quotes**, ahead of the player evidence action.

The score strip shows papichooter 0 and NeuralNets “Unavailable.” It states that no leader can be determined. It never renders 0–0, an even matchup or a deficit. There is no probability bar: the saved estimate is unavailable, with a clear explanation and an optional labelled exit to AI Decides on the current site.

The roster chapter begins with the six unpriced names in a readable open list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The quote reads **$1,622.00 modeled subtotal · 16 of 22 priced**. The missing six remain in every full-roster inspection with “Unpriced.” A larger subtotal than Reaves is never treated as evidence that NeuralNets is more valuable.

The open evidence section contains the three verified rows: Rudy Gobert 29.5, Giannis Antetokounmpo 45 and Kevin Durant 33.5. It states 3 of 22 players with supplied completed-week evidence and provides the same period labels. Comparison remains useful despite incomplete evidence; unavailable cells stay explicit.

The 2025 history appears only in the down-page franchise context and always says it was under the previous manager as QBs Gremlins. The inherited 1–20 record never becomes the current manager's record or an invented current-season story.

### Guest: a useful public league entrance

The title is “GOAT Hoopers, Week 3.” The first content area has all five synthetic pairings with their supplied scores, followed by an open standings table and a compact explanation of the 10-team league and six playoff places. The partly unavailable pairing uses the same honest zero-versus-unknown treatment.

Guests receive a public team index, the historical 2025 final with its season label, league navigation and an accessible source explanation. A small account invitation says that personal team context is available after signing in on the existing GOAT site. The Sign in action is a real external destination, visibly labelled as leaving this prototype. No member roster, personalized changes, saved personal model result or claimed guest team is shown.

Public team names open a local summary assembled only from public `teams`, `standings` and `matchups` fields: manager, current record, current pairing and qualified previous season. Full public roster/profile links leave for the existing site; no unsupplied opponent roster is generated.

## Complete website architecture

### Header and wayfinding

Use the exact approved horizontal GOAT Hoopers logo, at an ordinary website masthead size. The top line contains Home (current), Teams, News, Stocks and Arcade. Members also get a distinct “My Team — current site” link; guests get “Sign in — current site.” Every nonlocal destination is visibly marked “Current GOAT site” in the link or its immediate group label, with an accessible link name that includes that fact. Home returns to this local homepage and preserves the demo persona.

Below the header, a narrow, clearly labelled **Demo persona** native select offers Reaves Dropper, NeuralNets and Guest. It is beside a compact visible **Synthetic demo** label and **About these sources** link. The query controls only demo state, defaults to Reaves, and will set `document.documentElement.dataset.persona`. It is never represented as membership or login.

For members, a small sticky on-page index lists Overview, Your players, This matchup, The league and Sources. The index uses real fragment links and a current-location treatment; it is separate from global site navigation. For guest it becomes Week 3, Standings, Teams, League history and Sources. It must not become an internally scrolling navigation pane. There is a skip link to main content.

### Member reading order and content

1. **Overview.** Compact team identity, current season/standing, scored or unavailable matchup, and the two supplied changes with their original sample timestamps. Change links lead to the relevant open section, not a general inbox.
2. **Your players.** Reaves opens with the five completed-week evidence rows and nearby quote coverage. NeuralNets opens with the six missing quotes, subtotal and the three evidence rows. Position, name, points, period/coverage and modeled quote are distinct columns or labelled fields. Full quotes for all 24/22 players sit in an ordinary secondary disclosure; the main evidence, gaps and coverage are already visible without opening it. A filter on that quote list may select All / Priced / Unpriced, with a labelled result count and Clear action.
3. **This matchup.** The two team's current record and points-for context, current sample scores, and saved estimate state. Show the model output in a compact comparison table rather than a decorative prediction hero. Public opponent summary and full real-site profile are separate actions. No unsupplied opponent player comparison is offered.
4. **The league.** All 10 standings rows, all five pairings and a compact team/manager index remain open. Mark the member and opponent with text labels while retaining the supplied standings order. Standing position and points for are distinct from modeled roster value. Include the stated six playoff places as a rule, without fabricating qualification odds.
5. **League history and useful paths.** The 2025 final, season-labelled and separate from the present. Include a modest approved free-throw preview image and Arcade practice link, plus direct Stocks and Trade Analyzer destinations. No giant photo break or repeated card scaffold.
6. **Sources and footer.** A readable provenance section followed by a useful semantic footer.

There is no synthetic transaction feed or news article list: neither is supplied. News and Transactions remain clear real-site destinations. Recorded valuation history and Lineup Power are explicitly unavailable if discussed; no chart, metric or fake call to generate them appears.

### Footer and route completeness

Use a quiet two-column footer: a short GOAT identity/source paragraph and grouped inline destination lists that wrap naturally. This is a working index, not a four-column promotional link farm.

- **Follow the league:** Teams, The Table, Transactions, News, Weekly archive, History.
- **Explore and decide:** Stocks, Intel, AI Decides, Trade Analyzer, Draft, Arcade.
- **Your account:** My Team and Sign in, both marked as current-site exits.
- Home and Back to top return locally. Source notes link locally to the explanation and name `fixture.json` as the synthetic data source. No invented Terms, Privacy, support or subscription route is added.

All 15 supplied destinations are therefore discoverable. Player and team profile links use their actual IDs and distinguish local inspection from a real-site exit.

## Local actions that preserve place

### Inspect and compare owned players

Each evidence row has a named **Inspect [player]** button and a native labelled comparison checkbox. Inspection expands a semantic row immediately after the player: identity, position, the supplied completed-week points or “Evidence unavailable,” exact period, participation source status, modeled quote or “Unpriced,” and quote time. There are no invented games played, game logs, injury labels, current NBA affiliations, quote movements or model factors.

The first selection opens a small comparison region directly below the evidence table with one player and a prompt to choose a second. The second fills the other column. The comparison displays the same two labelled metrics with independent evidence statuses; it does not collapse them into a points-per-dollar recommendation. Selecting another player requires an explicit Replace action or unchecking a selected player. A polite count message reports selection changes. The table and rest of the homepage stay visible.

**Close inspection** restores focus to the row's trigger; **Clear comparison** clears only the local comparison. No modal, focus trap, viewport takeover or automatic jump follows a checkbox. Any source row opened by a change link receives a stable hash and heading target. Browser Back restores the prior local expansion/fragment state without clearing selected players or resetting document position. Persona changes intentionally clear comparisons and inspections and render the newly selected complete page.

At wide widths a compact team context margin beside the players repeats only the team name, opponent, relevant coverage and a link back to Overview. It provides orientation during a long quote inspection. At smaller desktop widths it sits in normal flow above the table. It never claims new facts, grows into a second dashboard, or has its own scrollbar.

### Inspect team or matchup context

A clearly named **Inspect matchup** link goes to its full local chapter and sets a fragment. A team-name inspection opens an in-flow public summary beside the triggering standings/pairing row. That summary has a heading, Close, qualified historical record and a separate real-site profile link. Closing returns focus to the named team trigger. Fragment Back returns to the invoking row; global navigation remains available throughout.

### Sources

The compact Synthetic demo label is always visible. Its source action leads to a full, normal-flow explanation: all current quantities are constructed; identities and player references came from the authorized fixture, not a new production roster check; 2025 fields are historical project references; modeled values are not cash; no live data or backend connection exists. Local inspection and comparison never submit trades, save lineups, log in, notify, refresh quotes or generate AI.

## Typography, density and visual language

Reading typography is **local Lora**, regular 400 at 17px with about 1.6 line height and a 58–64 character paragraph measure. It makes the source explanations and short editorial connective paragraphs comfortable to read. Section headings use Lora 600, 24px/32px; team/page headings use 34–38px with natural mixed case, never oversized slogans. One short sentence connects each chapter's data to its question.

Controls, table names, labels, navigation and explanatory microcopy use the **system UI stack**, at 15–16px and weights 400/600. This makes repeated controls easy to recognize and long names compact without condensing them. Giannis Antetokounmpo and Stephon Castle’s Back are deliberate wrap cases: rows grow, names wrap at spaces, and no text is scaled down or replaced by ellipses. Buttons have readable text and approximately 44px minimum targets.

Data uses **local IBM Plex Mono** regular 400 at 14–15px with tabular figures. Numeric columns align at the right; the unit sits in the column heading and important quote labels. Monetary values retain two decimals, score precision follows the source, and unavailable values are words rather than ambiguous dashes. This role is reserved for numbers/times; prose and long player names are not monospaced.

The Lora and IBM Plex Mono files already exist in the approved catalog under SIL OFL 1.1. Build may reference those local files and existing license notices; it requires no download, dependency or license change. The prototype's footer source text can acknowledge those fonts without inventing a new public licensing destination.

The page will use a calm light neutral reading surface, dark neutral text and one restrained accent for actions/current location. Team identity and score meaning come from names and labels, not unrelated competing accent colors. Missing and partial states are plainly labelled. Borders primarily aid row tracking and section transitions; shadows and repeated elevated cards are unnecessary. GOAT identity comes from the exact logo, consistent small league identifiers and approved basketball imagery in a useful Arcade feature.

Use a constrained desktop frame with generous outside margins. At 1440px, the on-page index occupies about 160px and the reading body takes the remaining width, with a modest context margin where space permits. At 1120px the context returns to normal flow and the reading body remains the priority. No large fixed heights, internal reading scrollbars, clipped name columns or tiny type make the page fit. Enlarged text increases row and section height. Motion is unnecessary; any anchor scrolling respects reduced motion and all content is visible without entrance animation.

## Assigned primary references actually read

### Redesign Existing Projects

[Rendered primary SKILL.md](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md): read the complete rendered skill body, including Typography, Layout, Interactivity and states, Content, Component patterns, Strategic omissions, Fix priority and Design values. The Raw download link failed in the browser tool, but the actual rendered source was available; no substitute index was used.

Concrete effects: I kept numeric alignment and bounded prose measure; made current location and return paths explicit; put inspections next to their trigger; and used open sections rather than an equal-card feature grid. I did not adopt its prescribed fonts, hero treatment, decorative effects or mandatory animation: the author brief asks for independent product architecture and permits no new assets or dependencies. This reference was read as source material, not installed or used to run an audit workflow.

### Better Colors

[Primary skill body on UI Skills](https://www.ui-skills.com/skills/jakubkrehel/better-colors): read the complete embedded skill from Colors through Reporting, including role naming, consistent meaning, primary emphasis and rendered-pair measurement. The linked supplemental files and related skills were not read or claimed as reads.

Concrete effects: action color gets one consistent role, missing values retain text labels, and semantic tokens will distinguish text, rules, fills and focus. The first action changes by persona while other actions stay quieter. Exact colors and contrast results are deferred to build measurement; no contrast pass is claimed from a planned palette.

## Build handoff and verification scope

On authorization for the build phase, create only concept 14's `index.html`, CSS, JS and `NOTES.md`. Import only shared data, with independent presentation. Preserve all production files and shared fixtures. Apply `data-personal-study-ready="14"` only after the full content and local fonts are settled, via `document.documentElement.dataset.personalStudyReady = "14"`. Implement `?stage=structure` without changing content, flow or geometry.

Useful local checks will cover all three persona queries, complete route discoverability, both missing-versus-zero score states, exact quote coverage and totals, unpriced comparison cells, long names at 1120/1440, keyboard inspection/close and focus return, local Back behavior, and source disclosure. Root owns captures. Discovery produced a source-backed architecture and verified fixture arithmetic, not a browser-tested implementation.

No blockers remain for the discovery phase. Build is deliberately pending the root followup required by the assigned phase.
