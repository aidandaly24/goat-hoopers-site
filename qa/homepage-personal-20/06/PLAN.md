# Concept 06 — A useful place to return

Discovery complete. This document is the only deliverable for this phase. No presentation code, peer prototype inspection, shared-file edit, dependency installation or publication has been performed. Build waits for the coordinator's followup after the early three-site gate.

## Product decision

Make GOAT a readable member reference website: the visitor first sees the most useful supported task for their team, then the evidence, roster and league context needed to judge it. Personality comes from the exact GOAT mark, generous readable type, deliberate contrasts between prose and quantities, and small approved player images. It does not require a giant headline, decorative athlete stage or dashboard of identical boxes.

The key question is: **What can I understand or inspect about my week with the evidence actually available?** The page must answer that question before the visitor scrolls. Complete sections remain in normal document flow. Supporting provenance can disclose inline; the main content never depends on opening a tab or drawer.

The obvious default rejected is one fixed hero with a big team value, followed by identical cards for each persona. It would make NeuralNets' incomplete subtotal appear stronger than Reaves' complete quote and push the useful missing-data task below the fold. Each state instead changes the opening task, heading, section emphasis and action wording.

## Visitor priorities and concrete states

### Reaves Dropper

1. Understand the Week 3 pairing: Reaves Dropper **184.5**, Ware the Hoes At? **171**. Label it a synthetic current score, not a final result or a live feed. The first fold includes both identities, season records and an inspect action.
2. Read the new completed Week 2 player evidence. Show all five verified sample players as a short visible list/table, with points, period and the **5 of 24** coverage statement. Damian Lillard's 42.5 is a sample player's counted-week value, never an implied current-week score.
3. Inspect the modeled roster quote: **1,095.25 FAAB**, **24 of 24** priced, sample quote rank **2** and checked time. Explain that modeled FAAB is a pricing unit rather than cash or a spendable balance.
4. Browse the complete 24-player roster and the public league. The saved estimate is secondary matchup context: Reaves 56%, Ware 44%, confidence 0.35, saved October 26. Preserve the returned choice and separate confidence from probabilities; the synthetic estimate is not calibrated odds.

Opening composition: team identity/record, a wide quiet matchup area and a narrower two-item "Changed in this sample" list. The next visible section begins the five-player evidence list. No poster-height introduction.

### NeuralNets

1. Review the six named unpriced players immediately: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The lead section is useful roster work, not a generic error panel.
2. Understand the pairing with papichooter: the opponent has a recorded **0**; NeuralNets has **Score unavailable**. Neither a tie nor a leader is inferred. A nearby inspect disclosure explains exactly this distinction.
3. Inspect the quote coverage: **16 of 22** priced and a **1,622.00 modeled FAAB subtotal**. The missing six remain visibly unpriced; no whole-team valuation rank or comparison is shown.
4. Read the three available completed Week 2 player rows, then browse all 22 roster players and the public league. "No saved estimate in this sample" replaces the probability treatment. There is no generation or refresh action.

Opening composition: identity/0–2 record, the six-player coverage list as the broad primary area and the pairing/status explanation alongside. Full roster follows before the smaller completed-week evidence section. The unavailable score is visible in the first fold and does not consume the rest of the website.

### Guest

1. Browse all five Week 3 pairings as a visible public schedule, with real null handling for m4.
2. Read the full 10-team table and identify managers/teams. No member roster quote, saved personal estimate, personal changes or "your team" claim is rendered.
3. Explore a public team summary locally, then discover league tools, archives and the actual playable game's existing site entry.
4. A clear "Sign in on GOAT" link goes to the existing site's login and is explicitly labelled as leaving the prototype. The demo persona select stays separate and cannot be mistaken for login.

Opening composition: "Week 3 around the league", all five compact pairing rows, and a short public-edition/account note. The standings section begins immediately afterward. Guest gets a substantial homepage, not a sign-in gate.

## Website architecture

**Shell.** A compact deep-ink masthead carries the unchanged approved white GOAT mark and a short primary menu: Home (current), Teams, Stocks, News and Arcade. Home is local. Production destinations are labelled with "Current GOAT site" in their accessible name and a visible section/link treatment explaining the exit. Account entry says "My Team on GOAT" for members or "Sign in on GOAT" for guest; it does not simulate authentication. A slim utility line contains the visible "Synthetic demo" label, fixture as-of time, source explanation link and explicitly labelled native "Demo persona" select.

**Local navigation.** A small horizontal list links to the visible sections of this page. Its labels change with actual content: member Matchup / Player evidence / Roster / League; NeuralNets starts with Quote coverage / Matchup / Roster / League; guest Pairings / Table / Teams / Explore. These are anchors, not content-swapping tabs. The masthead and section menu do not stack into a large fixed block.

**Member main.** The persona-specific opening described above; two compact dated change items woven beside the relevant task; visible evidence and full roster sections in the order appropriate to that persona; then "The league this week" containing every pairing and the complete standings table. The member row is identified in text as well as by modest emphasis. A team directory follows as an unboxed two-column list, with team name, manager, record and a native summary disclosure for historical context. NeuralNets' 2025 entry always includes "Under the previous manager as QBs Gremlins."

**Guest main.** Public pairings; complete standings; all ten team summaries; a concise explanation of what member editions add, with the real sign-in destination; then Explore. Guest never inherits the member-only first two sections.

**Roster section.** Every member player appears in a semantic table: player/position, modeled FAAB quote or Unpriced, completed Week 2 evidence status, and Inspect. All rows are visible by default. A labelled optional player-name search may narrow this list, with result count and Clear; no internal scroll region, pagination or sort machinery is needed for 22–24 rows. Missing completed-week evidence says "Not included in sample", not DNP or zero.

**Explore section.** Three deliberate text-led destinations explain Stocks, league analysis, and Arcade. Arcade uses the approved real game preview at a modest size and a "Play on GOAT — leaves prototype" link. No invented local game or fake feature catalog. The absence of a recorded valuation series is a short honest note near the quote, not an empty chart section. No Lineup Power display.

**Footer.** A semantic footer repeats the exact mark at modest size and provides a real destination map, grouped by user purpose: League (Teams, The Table, Transactions, Draft); Research (News, Stocks, Intel, AI Decides, Trade Analyzer); Past weeks and play (History, Weekly archive, Arcade); Account (My Team, Sign in); Home. Every destination in the fixture remains discoverable. Each external group is visibly headed "On the current GOAT site". Footer source notes explain synthetic current numbers, authorized identity references, qualified 2025 history and the lack of backend connections. No fake social links, legal pages or newsletter form.

## Reading, controls and data typography

- **Reading and section headings: local Lora.** Narrative copy is 16px/1.6, weight 400, roughly 55–65 characters per line. Section heads are 27–30px/1.2 at 600; the team/page heading is about 36px/1.15 at 600 in mixed case. This creates an inviting reading voice without stretching a team name across the viewport. Copy remains short and useful rather than editorial filler.
- **Controls, table names and navigation: Verdana, with system sans fallback.** Use 14px for navigation/buttons and 14.5–15px for player/team rows at a comfortable 1.45 line height; normal 400 and selected/heading 700. Verdana's open forms and wide spacing help distinguish long names in a working table. "Giannis Antetokounmpo", "Kristaps Porziņģis" and "Stephon Castle’s Back" may wrap naturally; there is no all-caps label treatment or ellipsis hiding identity.
- **Quantities: local IBM Plex Mono.** Scores about 32–38px; row quantities 14px; timestamps 12.5–13px. Use tabular figures, right alignment and explicit units. Mono is restricted to numbers and compact provenance, not explanatory paragraphs. Unknown values use readable words in the control/body face.
- **Density.** Row padding targets approximately 46–52px total row height before wrapping, with wider name columns than numeric columns. Controls/disclosures get generous hit areas. The layout spends height on evidence, not decoration. No essential text is reduced to tiny terminal labels.

Use the existing licensed local Lora and IBM Plex Mono files from the approved catalog, retaining the existing OFL notices. There are no font downloads or new dependencies. The visual language will use a pale main canvas, ink masthead, one restrained action accent and explicit status wording. Numbers and statuses stay readable when color is neutralized.

## Primary local inspection flow

Reaves' first action is "Inspect this matchup" beside the always-visible score. A native inline disclosure expands immediately under the pairing, keeping both teams in view. It explains the sample's current-score status, shows both current season records, then the saved synthetic 56/44 distribution, returned choice, saved time and confidence in separate fields. Closing uses the same summary and retains keyboard focus. No route leaves the prototype for this inspection.

"Read the five player receipts" is an ordinary anchor to the already-visible evidence table. Each explicit Inspect disclosure adds the selected player's ID, position, counted-week points, covered period, current modeled quote and evidence limitations. The fixture has no actual per-game receipt or factor breakdown, so none is invented. The full row remains understandable while closed.

NeuralNets' first action is "Review six unpriced players", linking to the visible coverage list, then "See all 22 players" links to the full roster. Inspect explains a null quote without suggesting that it can be refreshed locally. Its pairing's inline disclosure is still usable and contains the zero-versus-missing explanation without a model panel.

Guest uses "Inspect pairing" on any visible public row; an inline disclosure supplies both team summaries and the score state. Public team summaries reveal manager and explicitly dated previous-season facts. Public profile/player links are separately labelled exits to the existing site. Native link history works normally; there is no modal, focus trap or internal reader requiring a special Back implementation.

All first-order content is present without disclosures: scores/status, all relevant evidence rows, quote coverage, member roster, standings and directory. Disclosures are only for source/context detail. A focus-only skip link, clear landmarks/headings, native labels and conspicuous focus outlines support the whole flow. There are no save, trade, login, notification or generation simulations.

## Desktop and motion behavior

Design for 1440 and 1120 CSS px first. Use a centered fluid content width, ordinary document scrolling, flexible two-column openings and full-width evidence/roster tables. At 1120, reduce outer gaps and let names/statuses wrap before changing font sizes. At enlarged text, the opening columns can stack intrinsically; no fixed-height panel clips text. This phase does not design or capture a phone layout.

Content appears statically on load. No entrance sequence, counter animation, moving court, marquee, auto-carousel or scroll reveal. Hover/focus can change color over a short interval; inspection uses native disclosure rather than sliding a large panel. A reduced-motion preference preserves all data, all actions and focus feedback. The structure stage later neutralizes colors/images while retaining the exact same content and geometry. Build will set the persona and readiness datasets only after content and fonts settle.

## Source reads and their actual effects

### Rauno Freiberg, Contrasting Aesthetics

URL: <https://rauno.me/craft/contrasting-aesthetics>. Read the complete retrieved article text: introduction; Inviting Curiosity; PP Foundry; Just Friends; Raw Materials; Spaces; Loïc Nottet (lines 1–71 of the retrieved page). The first fetch timed out; the second succeeded. I did not visit the linked example websites or play the embedded music.

The useful principle is that contrast should communicate unequal conceptual weight, and that productive work needs restraint. This changed the structure: only the current team's first task receives a distinct composition; later evidence uses quiet shared reading rows. The typography deliberately juxtaposes Lora reading with precise mono quantities while keeping control typography steady. I am not copying bitmap type, animated logos, 3D examples or any reference palette. The contrast identifies what deserves attention rather than giving every section the same emphatic treatment.

### iart-ai, Accessible Animation, on UI Skills

URL: <https://www.ui-skills.com/skills/iart-ai/accessible-animation>. Read the full visible skill text from Accessible Animation through Gotchas (retrieved lines 28–206), including tier definitions, CSS and JS gating, live preference changes, WCAG mapping, verification guidance and quick-reference table. I did not install the skill, read its linked patterns file or run its helper scripts.

The useful principle is to distinguish spatial motion from small orientation feedback. This changed the interaction plan: the inspector stays inline and does not slide over the page; all content starts visible; there is no automatic motion to pause. Short color/focus feedback may remain. Native disclosure, keyboard focus and source labels convey state even when motion is reduced or absent. The library-specific samples are unnecessary because this build will use no animation library.

## Production contracts inspected

Read the assigned `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, complete fixture JSON and the data-only JS export shape; `AGENTS.md`; relevant ARCHITECTURE sections for the homepage/weekly archive, personalized front page, domain/data/surface/UI boundaries and accounts; and DESIGN guidance for useful states, data, identity, navigation and accessible controls. Production visual prescriptions and fixed order are explicitly outside this QA brief.

Read all five required actual files: `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, and `src/ui/siteDestinations.ts`.

Their consequences are concrete: production membership is server-resolved and request-private; the local persona query is labelled synthetic only. A failed account/data source cannot imply a team. No edition is required to keep core league access. Saved AI belongs to a matching pairing, and null values remain null. Quotes are modeled and coverage-bound; historical series require recorded points. The prototype reads only the fixture and approved existing assets. It adds no data loader, session, market, storage or network mutation.

## Next phase and limits

When build is authorized, create only `06/index.html`, its own CSS/JS and `06/NOTES.md`, with a data-only import of `../fixture.js`. Implement the three complete states and structure mode. Perform focused local checks of persona content/null handling, inline inspection, keyboard focus, destination coverage and 1440/1120 layout. Root owns final captures. Record only checks actually run.

There is no remaining discovery blocker. No rendered, browser, contrast or device check is claimed at this phase because no presentation has been built.
