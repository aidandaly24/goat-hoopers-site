# Concept 10 — Know the scope, then investigate

Discovery only. This plan owns `qa/homepage-personal-20/10/`. No presentation code, peer studies, old prototypes, production files, services or dependencies were used or changed. Await the root build followup before implementing.

## Product answer

A returning manager needs to judge what the roster quote covers before deciding which player to investigate. Put coverage, the modeled unit and the calculation time beside the number, then give the manager the actual roster rows. Keep the weekly matchup and league position close enough to establish why the roster matters. The result is a complete league home with an investigative center of gravity.

The page answers four questions in sequence: **Where does my team stand? What do these quotes cover? Which player has useful evidence to inspect? What else is happening in the league?** Current competition results, modeled prices and saved model estimates have separate labels, periods and explanations. None is a substitute for another.

The obvious default I reject is a portfolio dashboard: a large currency balance, gain/loss sparkline and league value rank followed by small asset cards. The fixture supplies neither a cash balance nor comparable league-wide valuations nor a history series. That composition would give unsupported facts more visual authority than the supplied evidence.

## Source-level product discovery

Read the assigned `AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md` and complete data-only `fixture.json`. Also read the production homepage composition and contracts in `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`.

Additional targeted reads: `src/domain/roster-value.ts`, `src/domain/current-team-quote.ts`, `RosterValueSection.tsx`, and the valuation disclosure/team-action portion of `CourtsideFeature.tsx`. Read root `AGENTS.md`, the architecture overview, homepage/personalization/current-quote/history sections, data flow, contracts, accounts and FAAB ledger guidance; read DESIGN's orient/next-decision guidance, tables and controls, content voice and personalized-edition sections. Architecture's unrelated game implementation details were outside this discovery read.

Consequences for this design:

- Production membership is resolved on the server and request-private. The clearly labeled demo persona selector changes only the synthetic view. Its query must never be presented as account identity or authorization.
- Current modeled quotes bind a roster, coverage and calculation time. A partial subtotal cannot become a total by omitting missing rows. The local table preserves every player and displays `Unpriced` explicitly.
- A value rank needs all compared rosters to be completely priced. Even Reaves has no supplied value rank. Standings rank is a different competition fact and remains useful.
- Recorded history is distinct from today's modeled quote. The fixture supplies no history; a short visible sentence explains that absence, without an empty chart frame or a trend inference.
- The saved AI estimate is dated context for a matching pair, not a score or betting odds. Reaves can inspect the saved result; Neural has no result to inspect or regenerate.
- Public league access survives absent editorial or private data. The page therefore retains open pairings, standings, team identity and route access for every persona.
- The actual FAAB reward ledger is a separate capability. No fixture cash or earned balance exists. Prices are written as `1,095.25 modeled FAAB`, without a dollar-sign balance treatment.

Read the local licensed-font catalog. The only planned local font file is the existing IBM Plex Mono regular face; retain its existing OFL notice and reference the existing bytes. No downloads are planned.

## Three complete homepage states

| Visitor | Opening work and facts | Investigation priority | Competition and model treatment |
| --- | --- | --- | --- |
| Reaves Dropper / aidandaly20 | Team name, 2–0, standings position 1 of 10; `All 24 players priced`; `1,095.25 modeled FAAB`; checked 30 Oct 2026, 08:10 UTC | First action: `Read the 5 player receipts`. Secondary: `Inspect all 24 quotes`. All roster rows are open below. Joel Embiid 137.50, Anthony Edwards 124.50 and Alperen Şengün 108.25 are named examples of quoted players, without invented buy/sell advice. | Week 3 versus Ware the Hoes At?, 184.5–171.0, synthetic in-progress state. A 13.5-point difference can be described only as the current sample margin. Saved model context: 56%/44%, generated 26 Oct, confidence 0.35, explicitly synthetic and not calibrated odds. |
| NeuralNets | Team name, 0–2, standings position 10 of 10; `6 players have no quote`; `1,622.00 known-value subtotal`; `16 of 22 players priced` | First action: `Inspect the 6 unpriced players`. The default all-player table orders these six first, then the priced players. Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson remain visible with missing-value text. | Week 3 versus papichooter: Neural score `Not returned`; papichooter score `0.0 — recorded`. No leader, deficit or tie is computed. A compact model-context sentence says no saved estimate is supplied. The three available completed-week receipts follow the missing-quote work. |
| Guest | Public `GOAT Hoopers · 2026 · Week 3`, all five pairings and the standings lead. Clear `Sign in on GOAT` exit, with a short explanation that actual team access happens there. | Inspect a public matchup or team identity locally. Explain modeled quote scope as a short league-reading note; show no personal quote, saved personal model, private update feed or assumed team. | Preserve the missing Neural score and papichooter's real sample zero in the public slate. No public claim that a missing score is a tie. |

The persona selector is labeled `Demo persona`, with Reaves, NeuralNets and Guest options, defaulting to Reaves. Preserve other query options when changing it. Set `document.documentElement.dataset.persona` to the resolved demo persona. A compact `Synthetic demo` label is always visible, beside the fixed as-of time rather than a live clock.

The completed-week evidence period reads `Synthetic completed Week 2 · 19–25 Oct 2026`. Reaves has evidence for five of 24 players: Damian Lillard 42.5, Tobias Harris 31.0, Joel Embiid 38.0, Myles Turner 24.5 and Derrick White 22.0. Neural has three of 22: Rudy Gobert 29.5, Giannis Antetokounmpo 45.0 and Kevin Durant 33.5. Missing evidence is `No counted-game evidence supplied`; it never means zero, a DNP, injury, poor performance or current availability.

## Whole website architecture

Use a quiet, persistent left navigation rail on desktop, about 190 CSS px, and a broad document to its right. The rail carries the exact GOAT logo, the league/season context, local section navigation, the demo selector and the synthetic label. It stays visually subordinate to the working document. It must become normal document flow when enlarged text or a short viewport makes a fixed rail obstructive.

The main document has roughly 44–56px outer breathing room at 1440px, smaller margins at 1120px, and an open two-column opening followed by full-width working sections. Sections use type, whitespace and a few tracking rules. There is no repeated card enclosure for every metric or sentence. The first screen already contains the team, coverage-qualified quote, weekly opponent, next action and the beginning of the roster work. There is no promotional hero.

### Member reading order

1. **Team orientation and current work.** One mixed-case h1 is the team name. A compact season line supplies manager, current record and standings place. The main opening column is the quote scope and its useful action; the narrower adjacent column is the weekly matchup. Two short, timestamped fixture changes sit directly beneath their related work: new receipts/complete quote for Reaves, missing quotes/missing score for Neural. They are labeled demo updates, not news stories or notifications.
2. **Roster, quotes and receipts.** One semantic all-player table, initially showing all 24 or 22 rows. Columns: player/position, modeled FAAB, completed Week 2 counted points, and an explicit `Inspect` action. The separate numeric column headers carry their periods/units. A visible labeled search input and sort select support finding a name; result count and `Clear search` prevent a lost-list state. Search and sorting affect this table only. Default Reaves order puts the five players with receipts first; default Neural order puts the six unpriced players first. Within groups use stable name order. The available `All players`, `With receipts`, and `Unpriced` filters are optional refinements; primary content is already open. A small text note at the section boundary states no history series and no league value rank are supplied.
3. **This week's league.** All five pairings appear in normal flow with team names, fixed sample score/status and local `Inspect matchup` links. The member's pairing has a textual `Your matchup` marker. A full ten-team standings table sits beside the slate at roomy desktop widths and beneath it when it needs the width. Columns are position, team/manager, W–L and points for; current positions use the fixture order, not valuation. No invented postseason forecast.
4. **League directory.** Ten compact team entries with manager, current record and current opponent. Each has a local public-context inspection action and a separately labeled current-site profile exit. Do not repeat standings numbers decoratively. Historical details live inside the specific team's public-context inspection, with the explicit year and previous-manager qualification.
5. **Continue around GOAT.** A useful short group of destinations organized by the work: read the league, investigate, league administration, and play. The Arcade can have one small approved free-throw preview with a real-site exit; no game is simulated. The page remains substantive if that image is absent.
6. **Semantic footer.** A compact source/scope explanation, fixed fixture as-of, current-site destination directory and return-to-top. Explain synthetic current quantities, authorized identity references and qualified retained history. Link the visible `Synthetic demo` label to this explanation. Footer help/scope placement remains consistent for all personas.

### Guest reading order

Keep the same identity/navigation system and scope labels, but start the document with public league orientation and the real-site sign-in entry. The open five-pairing slate and full standings are the guest's first substantive work. Follow with the ten-team directory, the short modeled-value reading note, the grouped destination section and the same footer. Do not replace the homepage with a login splash or expose a selected member's personalized data in a guest container.

### Destination hierarchy

The rail's local anchors are `Home` (current page), `Roster` for members, `This week`, `Teams`, and `Around GOAT`. Guest omits the private roster anchor. These are prototype navigation, not production route claims.

| Current GOAT destination | Where it stays discoverable |
| --- | --- |
| Home `/` | Footer's current-site directory; logo returns to this local home |
| News `/news`, History `/history`, Weekly archive `/weekly` | `Read the league` group |
| Stocks `/stocks`, Intel `/intel`, AI Decides `/ai-decides`, Trade Analyzer `/trade-analyzer` | `Investigate` group, with Stocks also beside local quote detail |
| Teams `/teams`, Transactions `/transactions`, Draft `/draft`, The Table `/table` | `League` group; public profile exits beside team context |
| Arcade `/arcade` | `Play` group and optional approved game preview |
| My Team `/team`, Sign in `/login` | Explicit account exits in rail/footer; member gets a My Team exit near identity, guest gets Sign in near the opening |
| `/teams/:id`, `/player/:id` | Distinct current-site profile exits in the corresponding local inspector |

Group labels explicitly say `On the current GOAT site`; exit links also visibly say `on GOAT`. Use `https://goathoopers.com` routes. Local inspection never quietly redirects into production. No invented contact, newsletter, notification, auth or submission control is added.

## Local action flows

**Quote/receipt investigation.** The opening action navigates to the visible roster section and focuses its heading; an unpriced or receipt-specific action applies the clearly labeled table filter. The row's `Inspect [player]` button expands a readable full-width detail row immediately after that player. The expanded row includes the player's quote or `Unpriced`, the quote calculation time, priced/roster coverage, the explicit modeled-unit explanation, completed-week points and period when present, and honest missing-source text. No unavailable factor breakdown or game log is fabricated. The detail has `Close player detail` and `Back to roster` controls. Close restores focus to the exact row button; Back clears any inspection hash and returns to the section. If inspection uses a hash, Back/Forward must restore or close that state coherently. The rest of the table remains in document flow. Profile and Stocks exits are separate links.

**Matchup investigation.** `Inspect matchup` opens an inline matchup detail after its slate row, with both identities, their records and precise score states. Reaves's saved model disclosure includes its timestamp, both named probabilities and confidence as separate fields. Neural's detail states the score gap and unavailable saved model; it offers no fake retry or generation. Close/focus behavior mirrors player details. Team names can navigate to the local public-context section without losing the page.

**Team inspection.** A native disclosure in the directory supplies current record/opponent, public manager identity and any 2025 record. For Neural, the historical summary itself says `2025 · previous manager`; expanded text retains `Under the previous manager as QBs Gremlins.` Guest inspectors never assert ownership or promise a complete local roster not supplied for that team.

**Source explanation.** The compact synthetic label is an ordinary link to an always-readable footer explanation. A native disclosure can hold longer implementation/source caveats, but the synthetic claim, no-cash distinction, partial coverage and missing-score semantics are visible at their points of use. Users do not need a tooltip to interpret a number.

## Typography, density and identity

- **Reading text:** system Georgia, 17px/1.55 for short explanations and 18px/1.55 for the opening context. Longer paragraphs stay around 58–66 characters. Georgia gives explanations and long player names a deliberate reading voice, rather than making the entire site look like a control panel. Player-name cells use 17px Georgia and wrap naturally; no ellipsis on Giannis Antetokounmpo or Kristaps Porziņģis.
- **Controls/navigation:** Verdana, then a system sans-serif fallback, 13–14px/1.4, regular and bold real weights. Labels are mixed-case and explicit. Rail links and table actions have at least 44px usable height. Controls may wrap and grow; no compressed labels or letter-spaced all-caps control vocabulary.
- **Numerical data:** existing IBM Plex Mono regular, 14–15px/1.45 for table values, scores, timestamps and coverage counts. Right-align comparable figures and use tabular numerals. The scoped quote can be 30–34px, with `modeled FAAB` immediately adjacent in readable 14px control type. It never becomes an oversized cash display.
- **Headings:** Georgia bold, roughly 34px/1.15 h1 and 24px/1.25 section headings. They use normal capitalization and grow into multiple lines when needed. The logo supplies the distinctive GOAT mark without novelty type in long data.
- **Visual language:** pale warm reading surface, dark evergreen navigation/ink, one restrained rust emphasis for active location and useful actions. Missing data has the words `Unpriced`/`Not returned` and a patterned or ruled treatment if needed, not warning color alone. No traffic-light score for player health or quote reliability is invented. Use the supplied exact SVG logo; small approved player portraits are optional identity aids inside detail, never the information architecture.
- **Width/text growth:** at 1120px, collapse opening and league columns whenever their real contents need it. Keep the roster's name column generous, allow multi-line cells and put inspection under the identity if the numeric columns cannot fit. Preserve 100% text size, readable units and every action. At 200% zoom the rail moves into normal flow, the page becomes one column and table records may reflow with explicit labels. No internal vertical scroll reader.

## Assigned primary references: actual reads and applications

These were source studies, not installed/executed skills. Both assigned URLs opened successfully on 30 Oct 2026. No index was counted as a primary read.

1. [Emil Kowalski, Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), also read through its [raw primary file](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md). **Partial read:** Core Philosophy / Unseen details compound; Animation Decision Framework (frequency, purpose, timing); Component Building Principles (responsive buttons, popover origins, interruptible transitions). **Concrete effect:** no entrance reveal or animated score/quote counters; navigation and inspection respond immediately. Reading a new player is frequent work, so expansion stays spatially adjacent to its row and Close restores the original trigger. Any pointer feedback is brief and does not delay content; keyboard work has no animation. No motion library or spring dependency is justified.

2. [Addy Osmani, Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility). **Partial read:** Evidence-led audit workflow; text alternatives; contrast/non-color cues; keyboard/native controls; focus visibility and obstruction; skip links; target sizes; reduced motion; navigation, labels and live regions; testing checklist. **Concrete effect:** a real skip link and landmarks, native disclosures/buttons, explicit table/search labels, visible focus, textual missing states and polite result-count announcements. Avoid a sticky panel covering focused rows. The full roster begins open, with one coherent document order. Plan keyboard and 200% text-growth checks before capture. Use the repository's correctly stated WCAG large-text thresholds when checking contrast; the source's shorthand px thresholds are not adopted.

The hierarchy, serif reading typography and value-focused architecture are independent product decisions. Neither reference supplied a visual shell or a page sequence.

## Build boundary and verification handoff

Discovery produced this plan only. A read-only fixture reconciliation confirmed both supplied subtotals exactly match the priced rows: Reaves 24/24 = 1,095.25 and Neural 16/22 = 1,622.00. No browser, device, production, performance or accessibility pass is claimed.

On build followup, implement only in `10/`, importing data only from `../fixture.js`; add the required readiness dataset only after fonts/content settle. Keep `?stage=structure` content and geometry identical while neutralizing images/color. Verify the three persona URLs, all primary local inspection/close/Back flows, search zero-results/Clear, null-versus-zero, 1440px and 1120px width, enlarged text, keyboard focus and reduced motion. Root owns final captures. Record actual source reads and checks in NOTES.md at that phase. No live fetch, auth, pricing, AI, storage or mutation calls are needed or allowed.
