# Concept 13 — A useful league update

Discovery only. No presentation code, production change, external mutation or dependency installation. Own scope: `qa/homepage-personal-20/13/`.

## Product decision

A returning member should be able to move from a change to its evidence, understand its limits, and keep their place. The homepage will therefore connect a small team-relevant update list to visible matchup, player and quote sections. It will also provide a complete public league overview. It is a website people can use to catch up, rather than a team profile with news decoration.

The obvious default rejected is a large athlete headline followed by unrelated news cards and separate dashboard tiles. It would give the two members the same experience and require them to interpret the relevance of every item. I also reject invented unread badges, “since your last visit,” injury stories and transaction summaries: the fixture does not supply those facts.

## What the actual product supports

Read the complete `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`; the author brief, product inventory and data fixture; repository `AGENTS.md`; and the architecture/design sections listed below.

The real page resolves membership on the server, then joins public league sources to a member-only projection. The current surface retains league access without an editorial edition, distinguishes missing from zero, keeps saved AI separate from results, and exposes roster inspection. These are capabilities to preserve, not a prescribed layout. This QA site uses only `fixture.js`; its labelled query selector is synthetic state, never membership verification.

The supplied four changes are the only current update/news items. No additional article copy, NBA team association, quote movement, health or availability story will be invented. Evidence is completed Week 2; matchups are synthetic Week 3. Those periods stay separate.

## Three complete experiences

### Reaves Dropper

The first useful information is “Two updates for your team,” with the actual 08:20 evidence update and 08:10 full-quote update, UTC on 30 October 2026. Each entry includes its supplied explanation, a plain-language next action and a coverage count. “Inspect five player results” leads directly to the visible completed-week evidence section. “Inspect all 24 quotes” leads to the roster quote table.

Beside the update list, a substantial Week 3 pairing shows Reaves Dropper 184.5 and Ware the Hoes At? 171, explicitly a synthetic in-progress sample, with current 2–0 / 1–1 records and a local matchup inspection. A derived 13.5-point difference may be labelled “sample score difference”; it is not a prediction or final result. Reaves’ current standing, first of ten, is shown with the table context.

The next section shows all five available player evidence rows, with points and period visible: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5, Derrick White 22. The count is 5 of 24 roster players; this is not a best/worst ranking for the full roster. The complete quote section shows 1,095.25 modeled FAAB with 24/24 coverage, a checked time and every player’s quote. No league valuation rank is available. The saved 56% / 44% synthetic model estimate is secondary to the observed sample score, with its 26 October saved time, returned choice and distinct 0.35 confidence explanation available locally. No chart appears without history.

### NeuralNets

The homepage begins with the two issues that affect interpretation: six missing player quotes, then the missing matchup score. The first action is “See the six unpriced players.” It leads to a visible named list before the complete roster table: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson.

The adjacent Week 3 pairing shows NeuralNets “Score unavailable” and papichooter 0, with an immediate explanation that one score is absent and the other is a recorded zero. No leader, tied state, difference or win bar is produced. A local inspection explains the two distinct states. NeuralNets is 0–2, tenth of ten; papichooter is 2–0, third. There is no saved AI result and no generate button.

The quote section labels 1,622.00 as the modeled subtotal for 16/22 players. Its typography is subordinate to the coverage statement, and no comparison with Reaves’ complete quote is offered. Three evidence rows remain useful: Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5 for synthetic completed Week 2, with 3/22 coverage. Missing participation is not interpreted as poor form. A historical team note, if opened from identity context, names the 2025 1–20 season as QBs Gremlins under the previous manager.

### Guest

The title is “GOAT Hoopers, Week 3” and the introduction explicitly offers public league browsing. The first fold contains all five pairings and a concise public update list; it does not borrow a private team or show a selected-team welcome. The full ten-team standings, all four synthetic changes, a public team directory and league tools provide a substantial homepage. Team rows open a local public summary with manager, current record, pairing and qualified historical record; a full-roster exit is identified as the current GOAT site. The account action is “Sign in on GOAT” and leaves this prototype for the existing `/login` route. Guest does not see the member roster quote sheet, private evidence projection or a simulated login form.

## Navigation and page architecture

The desktop header contains the exact GOAT horizontal logo, a clearly current Home item, and visible exits to News, Teams, Stocks and Arcade. Each exit carries readable “Current GOAT site” context; an icon alone does not communicate the boundary. The account area offers My Team for members or Sign in for guest, also explicitly external to the prototype. A compact “Synthetic demo” label and “About this data” disclosure sit beside the labelled Reaves / NeuralNets / Guest demo persona selector.

A second, compact in-page navigation links to actual section anchors: Updates, Your matchup, Player evidence, Roster quotes and League for members; Pairings, Updates, Standings and Teams for guest. These are navigation links, not mutually exclusive tabs. Core content remains in ordinary document flow.

Member page order:

1. Team/manager context and two relevant updates, alongside the matchup summary. A restrained identity line replaces a giant hero.
2. Completed-week evidence for Reaves; missing-quote coverage and the six names for NeuralNets. The second useful priority changes with the data.
3. The remaining roster/evidence section, including the complete 24- or 22-player roster quote table. Reading order is stable within each persona.
4. Around the league: the two other teams’ supplied updates, all five current sample pairings and the complete current standings. This is visible public context, not a hidden “more” area.
5. Ten-team directory, a short clearly historical 2025 final reference, and useful routes to league tools, archive and Arcade.
6. Semantic footer and data/source explanation.

The member roster table has Player, Position, Modeled FAAB and Completed Week 2 evidence columns. Missing fields say Unpriced / Not supplied, never zero or a dash with ambiguous meaning. No column implies live participation. A labelled name search and native sort selector assist inspection; by default the full roster appears. A clear-results control restores all rows. A simple “Unpriced only” control is available when relevant, with visible result count; it does not hide the entire primary section on entry.

The footer groups all routes deliberately: League — Teams, The Table, Transactions, Draft, History; Analysis — Stocks, Intel, AI Decides, Trade Analyzer; Stories & play — News, Weekly archive, Arcade; Account — My Team, Sign in; Home returns locally to the top. All fixture destinations remain discoverable. The footer also explains the synthetic scenario, fixed as-of time, historical provenance and prototype exit convention. Unavailable history and absent Lineup Power do not become filler panels.

## Composition and typography

Use a bounded, open desktop composition: approximately 1,240px maximum reading area, a 7:5 opening split, strong section rules, and varied lists/tables rather than a repeated card grid. At 1,120px the opening columns can rebalance and the lower league table stack below pairings according to content width. There are no fixed-height readers or nested vertical scroll regions. A pale paper surface, dark blue-black ink and one restrained brick accent can support GOAT identity; color never carries coverage or score meaning alone. Small approved portraits are identity aids in evidence rows, with initials when unavailable. The logo remains exact. A large arena image is unnecessary for this task.

- Reading: `Georgia, Cambria, serif`, 17px, 1.55 line height, 58–64ch maximum prose measure. The familiar mixed-case serif gives update explanations a readable voice. Section headings use Georgia bold around 27px; the team/page title is around 38px and wraps naturally. There is no oversized slogan.
- Navigation, controls and player/team names: `Verdana, Geneva, sans-serif`, 14–15px, regular/700. Its large x-height and visibly different letterforms suit compact controls and long names. Targets are at least 40px tall, with adequate spacing and 44px for principal actions. “Giannis Antetokounmpo,” “Stephon Castle’s Back” and “Kristaps Porziņģis” must wrap without truncation.
- Numeric data and timestamps: existing local IBM Plex Mono Regular, 14px for table values, approximately 30px for the opening score, tabular aligned decimal columns. Use this only for short numeric facts, not prose or long names. Table rows begin at roughly 42px and grow with text. Column headers remain mixed-case sans serif at 13–14px.

These roles are intentional and distinct; no DM Sans default or novelty font is used. IBM Plex Mono is already licensed in the shared catalog, and its existing OFL notice stays intact. No downloads. Enlarged text expands rows/sections and may stack columns; font sizes never shrink to preserve a composition.

## Local action flows

The primary flow is update → relevant visible section → player/quote inspection → return to the originating update. Clicking an update sets a meaningful hash and focuses its destination heading; a nearby “Back to update” link restores the triggering location. Browser Back also works. No animated wait is introduced.

Player names open an adjacent readable detail row with name, supplied position, modeled quote state, completed-week points state, exact period and coverage limits. The row remains anchored to the player. Native buttons expose `aria-expanded`; closing returns focus to the trigger. Escape closes an active expansion when focus is within it. Nothing opens on hover. “Open player on GOAT” is a separately labelled exit, not the default action.

The matchup inspection is an in-flow disclosure below its source summary. It shows both teams, sample state, points/unknown distinction and saved estimate provenance where present. NeuralNets receives a concise absence explanation rather than an empty probability visualization. Team directory inspections similarly expand at their own rows. Essential matchup/evidence/quote facts are already readable when all disclosures are closed.

Persona changes use real query navigation (`?persona=reaves`, `neural`, `guest`) and set `document.documentElement.dataset.persona` during a later build. No storage, network, auth, notifications or pretend writes. `?stage=structure` will neutralize color/images while retaining geometry and all content. The build readiness marker will be `13` only once content/fonts settle.

## Primary references actually read and applied

- [pbakaus — adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read the rendered instruction text from “Assess Adaptation Challenge” through “Verify Adaptations,” and the inline responsive reference. Applied the desktop guidance to show evidence and context simultaneously, bound the page width and retain visible navigation. Applied content-driven breakpoints and input-method distinctions to the 1,440/1,120px brief: columns reflow before names or controls become cramped; no functionality depends on hover. The source’s mobile/print/email prescriptions do not expand this desktop-only assignment. No install command or script was run.
- [Rauno Freiberg — Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): read the full textual essay, including “Spatial Consistency,” “Frequency & Novelty,” “Scroll Landmarks,” “Fitts’s Law” and “Scrolling.” Embedded motion examples were not played. Applied source-to-detail spatial continuity through adjacent expansion rows, immediate repeated actions, nearby return controls, and preservation of reading position. This changed the proposed news-detail drawer into an in-flow inspection tied to its originating update/player. There are no custom gestures, repeated entrance animations or inner scroll readers.

Repository guidance actually used: `ARCHITECTURE.md` introduction, weekly evidence, modeled valuation timeline, Courtside homepage/archive, personalized team front page, data flow and contracts; `DESIGN.md` “Personalized team edition.” Their effects are explicit separation of evidence periods, fail-closed unknowns, complete-versus-partial quote coverage, distinct saved AI provenance, server-owned real membership, and preserved public access. The QA author brief expressly permits independent typography/palette/structure, so production visual primitives and fixed section sequence are not copied.

## Discovery completion and later checks

Only this plan is delivered. No peer directory or rejected prototype source was inspected. No browser/layout/device/interaction test is claimed. No remote service call, mutation, publication or production edit was made.

After an explicit build followup, verify the three independent persona URLs at 1,440 and 1,120 CSS px, enlarged text, keyboard/Back/focus flows, full table restoration, all 15 destinations, reduced motion, and structure mode. Check missing-versus-zero, partial totals and all period/source labels against the fixture. Root owns final captures. There is no discovery blocker; stop here awaiting build followup.
