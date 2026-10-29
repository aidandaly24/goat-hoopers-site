# 15 — Split studio / team rail

## Surface contract

- **Question:** What needs my attention in this matchup, and where can I inspect the team behind it?
- **First action:** Member My team / View roster in the narrow desk; the current pair has its own Inspect the roster link. Public visitors start with the featured current pairing and Meet the teams.
- **States:** Member and public are independent shared-fixture views. Known 0.0 and missing Pending stay distinct. Incomplete scoring is explicit. The dated draft edition is visibly stale. All five saved AI rows show probabilities by roster ID, their actual returned choice, separate confidence and expandable provenance. Stale AI is visible on every row; missing AI contains no invented result. Valuation history, statistics and Power remain explicitly unavailable.
- **Narrow layout:** At 760px the rail enters normal document flow. Its valuation becomes a native disclosure with the total, coverage and history-unavailable state in the summary. Identity and primary actions stay visible. There is no fixed or sticky phone chrome. The league menu is a native disclosure; Escape closes it and restores summary focus. Names wrap, directory columns reduce, and all phone control targets checked are at least 44px high.
- **Forbidden patterns:** No nested dashboard panels, generic hero copy displacing the league, fabricated history lines, inferred winners, current awards made from old editorial, scene runtime, new fonts or external data.

## Composition

The left desk is 230px at wide desktop. It holds identity, standing, team actions and the member's modeled valuation, with all 24 roster values retained inside native details. In public mode it becomes a useful league orientation and login path.

The wide canvas follows a different rhythm: an italic Inter Week 03 marker, stacked team identities and aligned known/pending scores, a bounded original arena image, five open saved-call rows, a two-column scouting notebook, three dated editorial columns, ten player faces, then the full directory and dense standings. The rail, quiet rules and type establish hierarchy; there are no enclosing cards or decorative probability bars.

Geist Mono carries scores, records, prices, probabilities and ranks. Existing Paper + Slate semantic roles supply the entire UI. The source arena, logo and portraits are reused unchanged. Small portraits crop their transparent side margins through CSS; the full face grid uses contain. The small arrow is drawn with CSS borders to avoid an unsupported font glyph.

## Retained inventory and interactions

Both views include all 10 faces, 10 directory teams, all 228 unique player links, all 10 standings rows, both weekly archive entries, dated league happenings and editorial sources. Every directory roster uses a native disclosure. Searching team, manager or player filters the teams; a player-only match automatically opens its roster. Directory sorting supports name, points for and roster size. Standings sorting supports rank, points for and name. NeuralNets' previous-manager attribution is visible wherever its 2025 record appears.

Members additionally retain top-three modeled players, all 24 values, coverage and the computation timestamp, observed form with sample size, all best/rough completed-week performers with periods and coverage, sample team news and recent moves. League transactions remain available separately. Public scouting uses league-player price context and dated editorial rather than member-only data.

Persistent document navigation includes Home, News, Stocks, History, Arcade, AI Decides, Teams, Transactions and the weekly archive. The page also keeps the My team, roster, Trade Analyzer, free-throw practice and source destinations. Member/public links preserve the AI-state query.

## Verification

Local Chromium via installed Playwright against the supplied server at 127.0.0.1:4198:

- Member and public at 1440px: ready hook, 10 directory hooks, 10 face hooks, five saved-pair hooks and 228 unique roster player URLs. Member has 24 valuation rows and personal content; public has neither.
- 1440, 390 and 320px: no document-width overflow. All native disclosures expanded at each width: no page overflow; all roster values remain visible.
- Phone control height scan at 390/320px: minimum 44px across visible summaries, inputs, selects, primary actions and comparison links.
- Search “Embiid”: one matching team and its roster opens. Roster-size sort puts team 2 first; points sort puts team 1 first. Standings name sort puts Huff n’ Puff first.
- AI ready/stale/missing: five ready pairs; five visibly stale saved rows; missing state has no probabilities. Current pair displays 0.0 and Pending, with incomplete status.
- Independent 200% text enlargement at 1440px, with all disclosures open: no page or sampled local text overflow after wrapping long names and the value total.
- Keyboard: Enter opens the phone league menu; Escape closes it and restores focus to its summary. Immediate shared focus styling and a working focus-only skip link remain.
- Rendered member desktop, phone and lower editorial flow inspected. No JavaScript page errors; no broken completed image loads in the initial member/public passes.

Measured computed color pairs on rendered surfaces: secondary text/canvas 5.15:1; slate label/canvas 6.56:1; white primary-action label/slate 7.22:1; status/canvas 5.51:1; team-marker ink/yellow 7.52:1. These opaque pairs use the unchanged semantic tokens.

## Scope and limits

Only this direction's index.html and DESIGN.md are authored. Source fixture benchmark: 64b9971f88ad1f73f5bd00ac0fdef9019909561b. No other direction or prior prototype screenshot was inspected.

This is a static composition, not authentication, Next routing, saved generation or backend verification. App/source links preserve their actual destinations but were not followed to production. No screen-reader or physical-device pass was performed. Root owns bulk captures and comparison. No commits, branch changes, installs, live data calls or production changes were made.

