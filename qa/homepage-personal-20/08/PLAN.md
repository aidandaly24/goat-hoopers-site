# Concept 08 — Understand your players at league home

Discovery complete. Presentation code has not been started. This directory is the only write scope. Await the coordinator's build followup.

## Product answer

A manager who already knows the score needs an explanation they can inspect: which of their players have completed-week evidence, what that evidence actually contains, and which other numbers are merely current modeled prices. The homepage will put a readable player study first, keep the rest of the roster in normal flow, and retain league position and the current opponent as compact context. It remains the league's home rather than becoming a separate player analytics application.

The organizing distinction is **observed sample / modeled quote / current matchup**. Each keeps its own period, units, coverage and action. A quote does not become form; a previous-week player sample does not become a breakdown of this week's score. There is no invented overall player rating.

I rejected the obvious score-first hero followed by large star portraits and a tabbed roster. It repeats information the visitor already knows, overweights three famous players, and puts the useful evidence behind another control. The first fold here contains actual player rows and the available sample.

## Three substantial homepages

| State | First useful work | Context kept nearby | What changes in the page |
| --- | --- | --- | --- |
| Reaves Dropper | Read the five supplied completed-Week-2 player rows; inspect Damian Lillard's 42.5 counted points or Joel Embiid's 38. | Current Week 3 pairing versus Ware the Hoes At?, 184.5–171; current record 2–0, table position 1. | Evidence leads. All 24 quotes are available, so quote coverage is a quiet complete state. The saved 56% / 44% model estimate is subordinate and separately qualified. |
| NeuralNets | Identify the six unpriced players, then read the three supplied completed-Week-2 observations, including Giannis Antetokounmpo's 45 points. | Pairing versus papichooter: opponent 0 is known; NeuralNets score is unavailable. Current record 0–2, table position 10. | A named quote-gap list precedes evidence. The primary action inspects those gaps. The modeled subtotal is visibly partial. No saved-model graphic or inferred leader appears. |
| Guest | Understand the ten-team league from its current table and all five pairings; inspect a public team summary. | Season 2026, synthetic Week 3, six playoff places, public team identities. | Public standings and pairings lead. No member roster, personal change feed, quote subtotal or private ownership claim renders. Real account entry is an explicitly marked exit. |

All current numbers above are synthetic design data, not current league reporting.

## Navigation and complete page architecture

The exact horizontal GOAT logo sits in a compact normal-flow header. Main navigation is Home (current), Teams (local league directory), Stocks and Arcade (labelled current-site exits). A separate account link is My Team for demo members or Sign in for guest; both explicitly leave the prototype. A clearly labelled **Demo persona** native select is distinct from account navigation. It supports `reaves`, `neural`, `guest`, defaults to Reaves, preserves `stage`, and will set `html.dataset.persona`.

Below the header a short location line reads Home / Reaves Dropper, Home / NeuralNets, or Home / League. A compact visible Synthetic demo label links to the source explanation. An in-page section navigation uses real anchors, with useful labels that match the state. This is navigation through a complete document, not tabs that replace its body.

### Member main document

1. **Team introduction and what changed.** One mixed-case heading names the team and today's useful task. Two short timestamped changes link to the appropriate evidence, quote or pairing section. Reaves' first change points to the new completed-week sample. NeuralNets' first change names the six missing quotes, followed by the missing-score notice. No generic welcome slogan or decorative metric strip.
2. **Player study with team context alongside.** About two thirds of the desktop width holds a semantic evidence table, with name, position, supplied Week 2 counted points and Inspect. Reaves gets all five evidence-bearing players; NeuralNets gets all three. The period is visible: Synthetic completed Week 2, October 19–25, 2026. Coverage is visible before the rows: 5 of 24 or 3 of 22 roster players have supplied evidence. Unavailable records do not enter a high/low ranking. An adjacent narrow column holds the current pairing and the team's current table line. This column ends naturally; it is not an internal scrolling sidebar.
3. **NeuralNets' quote gaps, elevated before its player study.** Name all six players in a compact list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. Each says Unpriced. Inspect opens the supplied identity and two independently unavailable fields. Explain that no reason for the absent quote is supplied. This is useful inspection, not a retry button connected to nothing.
4. **Every player, with honest quote coverage.** A full roster table is visible in normal document flow: 24 Reaves rows or 22 NeuralNets rows. Columns are Player / Position / Modeled FAAB / Week 2 evidence / Inspect. Names wrap in full. A labelled search field, result count and optional native position filter help find a player; the initial state shows everyone. A labelled sort select supports name, modeled quote and supplied points; unavailable values stay last in either numeric direction with a stable name tiebreaker. Reset restores all rows. Reaves shows 1,095.25 modeled FAAB covering 24/24; NeuralNets shows 1,622.00 **partial modeled FAAB subtotal**, covering 16/22. Neither receives a league value rank because comparable complete league totals are absent. Quote calculation time is October 30, 08:10 UTC. History is a concise unavailable sentence, without a line or made-up change.
5. **League in view.** Full ten-team standings beside all five Week 3 pairings. Mark the viewer and opponent with text as well as emphasis; preserve supplied rank order. All pairing names and scores are visible. The known 0 and unknown score retain different labels. Team Inspect opens a local summary; public team-profile navigation is a separate labelled exit. Do not invent team rosters for the eight teams whose players are not supplied.
6. **Use GOAT.** Two differently sized practical destinations rather than repeated cards: a compact Stocks route for deeper quote context, and the approved free-throw preview with an explicit current-site Arcade link. A short reference line leads to the actual weekly archive and History. No dated unpublished story is repurposed as current news. News and Transactions remain available as real destinations, without fabricated feeds.

The Reaves pairing context includes a small saved-model sentence: Reaves 56%, opponent 44%; returned choice Reaves; separate confidence 0.35; saved October 26, 08:00 UTC. It says synthetic saved model estimate, not calibrated odds. A native source disclosure holds only these supplied fields. There is no invented model name, rationale or input snapshot. NeuralNets instead gets one clear unavailable sentence and an identified exit to AI Decides; nothing runs locally.

### Guest main document

1. A compact league introduction and primary **Inspect a team** anchor, with season, team count and the account-entry explanation.
2. The full current standings and five public pairings, already visible in the first broad section. Inspect controls reveal public identity, current record, pairing and qualified previous-season reference only.
3. A readable public directory with all ten managers and current records, plus the previous-season finish. NeuralNets' 2025 line visibly retains “previous manager, QBs Gremlins” even before expansion. A small historical reference can report the supplied 2025 final, explicitly dated and separate from the current standings.
4. Stocks, Arcade, history and archive destinations with the same useful explanatory content as the member homepage. No member-only data is borrowed from the other demo personas to fill guest space.

### Footer

A semantic footer contains GOAT identity, the demo timestamp and a short source/limits explanation. Two compact labelled link lists preserve every destination without a giant global header: **League** — Teams, The Table, Transactions, Draft, Intel, AI Decides; **Explore** — News, Stocks, Trade Analyzer, History, Arcade, Weekly archive. Home and account entry remain easy to find. Each outgoing route carries a visible “Current GOAT site” indication, explained consistently once next to the lists and in each action's accessible name. Do not invent legal destinations absent from the fixture.

## Typography, density and materials

The reading face is the existing local **Lora** variable font: 17px/27px at weight 400 for evidence explanations, with a 56–62 character measure. This gives uncertainty and source notes enough room to be read, rather than treating them as legal captions. Section titles use Lora 26px/34px at 600; the page heading is 36px/42px, mixed case, capped to about 24 characters per line rather than a viewport-sized display.

Controls, navigation, table names and column labels use the system UI sans stack (`system-ui`, `Segoe UI`, sans-serif), 15–16px/22px with 500–600 emphasis. This keeps long names such as Giannis Antetokounmpo and Kristaps Porziņģis readable and lets controls stay familiar. Use native labels, never display typography in buttons. Numeric cells use existing local **IBM Plex Mono**, 14px/22px, tabular figures, right aligned with explicit units in the heading. Only numeric fragments use mono; long player names remain proportional. Roster rows start around 52px tall and grow with content. Source text stays at least 14px/22px.

Use a pale mineral neutral canvas, near-white reading surface, dark neutral ink and one deep violet accent reserved for actions, current location and focus. Unavailable states use words and a neutral symbol, never a heat map suggesting player quality. The page is built from open sections and row alignment. A bounded tinted region is reserved for the active inline inspector. There is no full-page card, giant decorative player cutout, or score-sized background text. The exact logo remains unchanged. Approved portraits are optional small identity aids only where supplied; initials cover the rest. No asset or font downloads are planned; existing OFL files remain intact.

## Useful local flows

- **Player evidence:** Activate Inspect in a player row. An inline region immediately after that row opens with a named heading, supplied counted points, the exact period and available evidence status. It explicitly states that per-game receipts, minutes, game counts and stat components are not provided by this fixture. The same region shows the independently labelled modeled quote and quote timestamp. This supports examining the available evidence without inventing deeper receipts. Inspect switches to Close; focus moves to the region heading. Close or Escape returns focus to its trigger. The region has normal document height and no focus trap.
- **Quote gaps:** NeuralNets' main action scrolls to the named gap list and focuses its heading. Selecting AJ Dybantsa opens his supplied identity, Unpriced status and unavailable weekly evidence. It does not calculate a zero, relative price, trend or injury explanation. A separate Open player on current GOAT site link leaves the prototype visibly.
- **Roster search/sort:** A native text input filters only the visible fixture list; a polite count announces results. Zero matches retains the query and exposes Clear search. Search and sorting do not mutate data, hide the rest of the homepage or claim a server save.
- **Team and pairing:** Team Inspect opens an in-flow public summary. Pairing Inspect reveals both identities, exact known/missing scores and the available saved-model state. Back to league closes local detail and restores the trigger. For any local history/hash state used in build, browser Back must close the active inspection without losing the selected persona or resetting document context.
- **Source explanation:** A native disclosure near the demo label and footer describes synthetic quantities, authorized identity references, historical qualifications and absent producers. It stays reachable by keyboard and does not imply live freshness.

One filled action per immediate context; secondary inspection links remain quiet. There is no fake login, submitted trade, lineup save, notification switch, AI generation, live refresh or data mutation.

## Desktop and accessibility contract for the later build

At 1440 CSS px use a bounded approximately 1264px canvas with generous external gutters and a 2:1 study/context split. At 1120 CSS px reduce gaps and use a roughly 1.6:1 split only if the side content still wraps comfortably; otherwise place pairing context directly after the evidence. Do not reduce type to fit. At enlarged text the header, columns and table cells must grow or stack in source order; no clipping, ellipsized team identities, fixed-height readers or forced equal card heights. This brief requests desktop work only; no phone composition or phone capture is planned.

Semantic landmarks, skip access, native table headings, visible focus, separate links and buttons, explicit disclosure state and 44px inspection/close targets are acceptance criteria. All content appears without scroll animation. Reduced-motion users receive the same page and tasks. Planned checks are both member personas and guest at 1440/1120, enlarged text, keyboard inspect/close/restoration, search zero results, missing versus zero scores, missing versus complete coverage and exit labelling. None is claimed performed during discovery.

## Actual product findings and source application

Product source inspected at `0d4564101af5a9267b152ccf08455e87a480ac33`. `src/app/page.tsx` and `src/data/home-viewer.ts` establish request-private membership; the demo selector therefore remains explicitly synthetic. `src/domain/personalized-home.ts` separates valuation, player guide, matchup, saved AI and nullable history; the proposed section labels preserve those boundaries. `CourtsideHome.tsx` keeps core directory/standings/tools available without an edition; this plan likewise does not let absent editorial remove useful league access. `src/ui/siteDestinations.ts` plus the experiment inventory supply the destination coverage above.

The repository's data/access/ownership instructions remain intact; this isolated experiment does not change production types, loaders, shell, tokens or auth. Its brief explicitly permits an independent visual system and section order. Detailed read scope and primary-reference effects are recorded in [NOTES.md](NOTES.md).

## Build boundary

Only PLAN.md and NOTES.md have been authored. No peer or rejected prototype implementation was inspected. No presentation source, dependencies, commits, publication, production change or live application call has been made. The independent architecture is ready for coordinator review; build remains pending the requested followup.
