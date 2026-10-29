# 02 — Coach’s Clipboard

Independent blind first submission. Authored only `index.html` and this document in direction 02; no other direction or prior mock screenshot was inspected. Static fixture based on repository head `64b9971f88ad1f73f5bd00ac0fdef9019909561b`.

## Surface contract

- **User question:** What needs my attention this week, and where is the evidence behind it?
- **First action:** Member **My team**, beside the actual identity, roster count and synthetic standing. Public **Find a team** goes directly to the searchable team book.
- **States:** Public/member, known 0.0 versus Pending score, incomplete scoring, current synthetic Week 3 versus stale unpublished Oct 5–11 editorial, ready/stale/missing saved AI, portrait unavailable, empty directory search, unavailable statistics/Power/value history, and shared best/rough performer selection.
- **Narrow layout:** One reading column; the complete destination list uses a native disclosure. Stocks and My team/Teams remain exposed. Matchup precedes the bounded court diagram, then valuation and scouting. Faces use two columns. The full directory and standings stack. Roster, value and provenance disclosures stay native and accessible.
- **Forbidden patterns:** Invented game results, live status, form, trend lines or rankings; inferred model choice; repetitive dashboard cards; scene runtime; generated figures; invisible essential state; a decorative hero displacing the actual league pairing.

## Composition and typography

The page is a working sheet rather than a dashboard. Inter names and section titles provide human hierarchy; Geist Mono carries scores, valuation, periods, roster numbers and the numbered reference system. Rules divide major tasks while open columns align related evidence. Paper + Slate semantic tokens are imported unchanged.

The original arena is a bounded, darkened static image beneath a drawn court. Three 44px numbered positions are real in-page navigation links: matchup, scouting and complete rosters. Their plain-language key stays outside the image, so useful labels do not compete with the arena photograph. The court carries no fabricated basketball data or spatial inference.

The member identity leads into a two-column matchup/court sheet. The valuation ledger and scouting notebook then give distinct asset-price and observed-form evidence. Completed-week selections retain the supplied points, games and exact source period; Joel Embiid’s shared best/rough selection appears once. The five model rows print every probability beside the matching roster, and the returned choice remains separately explicit even when it differs from the largest probability.

Ten compact portrait entries identify the league’s top modeled assets. Dated editorial has its own source periods and selection-reason disclosures. The team book preserves all 228 roster player links behind ten native disclosures; previous-manager attribution accompanies the 2025 NeuralNets record. Standings, tools, practice preview, both weekly archive entries and editorial source desk complete the sheet.

Compared with a card-led presentation, the authored rows and varied columns make names, scores and controls easier to scan while keeping complete evidence reachable. Nothing requires an overlay or an animated reveal.

## Implemented interactions

- Public/member comparison links preserve a selected stale/missing AI query state.
- Mobile destination disclosure; desktop destination list opens automatically at the wider breakpoint.
- Court links jump to actual sections; all league/tool/team/player/archive links retain their real app route.
- Search matches team, manager or any roster player and expands the matching complete rosters. An unmatched query has an explicit state.
- Team sort: roster number, team name and roster size. Standings sort: league rank, PF and team name. Rank remains attached after reordering.
- Native roster, valuation, editorial basis and model-provenance disclosures. No dialog, animation, storage or saving.
- The ready hook is set after all image decoding has settled and fonts are ready, so full-page captures contain the local imagery.

## Verification performed

**Evidence type: authored static HTML fixture, Chromium via installed Playwright.** Local URL: `http://127.0.0.1:4198/qa/homepage-20/directions/02/index.html?view=member` (also `view=public`, `ai=stale` and `ai=missing`). No Next server, authentication or backend was exercised.

Final source was rendered in all **18 combinations**: member/public × 1440/390/320 CSS px × ready/stale/missing AI. Every combination had zero page errors, zero failed local images, zero broken `aria-labelledby` references and no page-width overflow. Each retained exactly ten directory containers, ten face hooks and 228 unique directory player routes. Member retained all 24 value rows. Ready/stale retained five saved pairs; missing showed an explicit unavailable message and no invented pair values. Stale labels were visible in the collapsed slate.

Additional actual checks:

- Search `Embiid`: one complete 24-player roster, automatically expanded. Search `NeuralNets`: roster 8 and its previous-manager attribution. Unmatched search: explicit empty result. Clearing restores all teams.
- Roster-size sort: 27-player roster 2 first. Standings team-name sort: Huff n’ Puff first, retaining its source rank 6 and PF 293.0.
- All ten roster disclosures, all 24 values and AI provenance expanded at 390 and 320px without page-width overflow.
- Phone navigation opens nine destinations and removes those children from visible traversal when closed. The following Tab target had an immediate solid focus outline.
- Space opens/closes a native roster disclosure. Enter opens AI provenance.
- Reduced-motion media emulation: zero running animations (the page has no auto animation).
- **200% text enlargement, separately from narrow reflow:** every element’s original computed font size, including html/body, was doubled in place at unchanged 1440 and 390 CSS px viewports; roster/value/provenance disclosures were expanded. Both retained their original page width. The rem-based ledger and face columns adapt to enlarged text; phone figures can wrap rather than clipping.
- Desktop and phone screenshots were visually inspected locally. Temporary evidence is in `/tmp/goat02-top-1440.png`, `/tmp/goat02-top-390.png`, with additional full-page checks in `/tmp/goat02-final-1440.png` and `/tmp/goat02-final-390.png`; root owns final bulk captures.

Opaque rendered token pairs checked by WCAG relative luminance: ink `#242d35` on paper `#f5f4ef` 12.70:1; secondary `#5f6870` on paper 5.15:1; slate `#345b77` on paper 6.56:1; white on slate 7.22:1; white on ink 13.98:1. Court-point text uses opaque slate, rather than the image, as its immediate background.

## Limits and blockers

No blockers remain for this static direction. No physical-device or screen-reader pass is claimed. CSS font doubling is an explicit text-only stress method, not a claim about Firefox’s native text-zoom implementation. Native links point at the app’s real routes; destination routing, free-throw gameplay, authentication and live data are outside this HTML fixture. No production files, branch state, installs, services or external writes were changed.
