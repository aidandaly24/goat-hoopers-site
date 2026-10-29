# Historical first-submission design record · Color Club 20

This is a history copy of the first submission's design record. Its original at `../../directions/20/DESIGN.md` and all original runtime/evidence files remain unchanged. The first verification checked 200% root text at 1440px; it did not establish 390px-plus-200% usability. Root subsequently reproduced 544px page overflow at 390px in both views. This runtime copy carries responsive-only CSS corrections; current findings and checks are in [QA-REWORK.md](./QA-REWORK.md). Screenshot references below describe the original submission, not current rework evidence.

This isolated homepage answers **“What matters for my team, and where do I go next?”** My team is the primary member action; the current matchup, roster value and scouting evidence make that action useful. Public visitors get the current featured pair and useful league context without inferred personal membership.

The visual contract is lilac `#E3D7FF`, teal `#CAEEE5`, coral `#FFB3A5` and clean white, with dark green ink `#20302E`. Local variable Space Grotesk supplies both the expressive team name and readable working rows. Large asymmetric curves belong to the joined team opening, long section transitions and occasional independent objects. Open valuation columns, editorial dividers and complete team rows avoid an equal-card dashboard. The original GOAT logo stays unchanged. Original static court fragments connect the lilac opening to basketball without becoming an illustrated scene. Actual approved player portraits support prices, scouting and team recognition.

## Composition and action paths

At 1440px the personal name and actions sit beside the current Week 3 matchup. Roster value follows as an open two-column composition with three selected portraits. Teal contains observed form, completed-week evidence and the team wire. Dated editorial returns to white; all five saved model rows occupy lilac. Ten full team rows integrate the league faces, profile/Stocks links and roster disclosures. Teal standings and league moves lead into market, trade, actual free-throw practice and both archives. Source notes finish the page.

At 390px and 320px the same order becomes one column. Names wrap, score labels remain readable, form retains units and sample size, roster rows retain position and NBA team, and standings retain rank/W–L/PF. Major navigation and disclosure controls have at least 44px phone targets. Inline source/profile links in prose retain their normal inline semantics. The Menu disclosure opens with Enter, closes with Escape and restores focus. Search matches team, manager or any roster player; sorting changes actual row order. No fixed chrome obscures focused content.

Concrete paths include My team → `/team`, View roster → `/teams/1#team-roster`, modeled team-face price → `/stocks#player-board`, profiles → `/player/{id}`, trade analyzer → `/trade-analyzer`, and Play Free Throw → `/arcade/free-throw`. The current Stocks implementation has no query-driven inspector, so the price action truthfully opens its player board rather than claiming to select a player automatically.

## Truthfulness and missing states

- The compact visible fixture label links to the complete warning, source dates, benchmark and full supplied source record.
- Current Week 3 pairing comes from `currentMatchup`; 0 is rendered as **0.0**, null as **Pending**, and the pair is explicitly incomplete. The October draft’s original matchup context is accessible in its own dated disclosure, not used to describe the current opponent.
- Modeled FAAB is a roster valuation, with complete/partial coverage, unpriced count, basis and computation timestamp. All 24 values are disclosed. Recorded value history is explicitly unavailable; no series is drawn.
- Observed EMA form, recorded completed-week fantasy points, current modeled prices and dated editorial opinions remain distinct. Completed Week 2 coverage includes 5 verified players, sample sizes and the supplied overlap caveat. Team news and recent moves are marked synthetic.
- Saved AI preserves all five actual returned choices, both probabilities, independent confidence and timestamp. The first actual choice is **Ware the Hoes At? at 35%**, despite Reaves Dropper’s 65%; confidence is **20%**. Each row has model/prompt, roster IDs, input/evidence and absence-of-snapshot details. Stale output has a visible section notice and row labels. Missing output and a mismatched saved season produce unavailable rows without fabricated zeros or bars.
- All ten faces and all 228 unique player links remain in the directory. NeuralNets’ previous record retains the previous-manager/QBs Gremlins attribution. Standings use PF divided by 100. League leader statistics and Lineup Power remain honestly unavailable.

Forbidden patterns: invented current results or awards, inferred AI winners, fabricated value charts, fake game controls, external runtime requests, shared theme styles, autonomous motion, hidden data behind animation, unreadable narrow tables, or a public view with member-only information.

## Actual verification

Checked with installed headless Chromium using Playwright, on the root-owned static server at `http://127.0.0.1:4206/qa/homepage-themes/directions/20/index.html`. These are browser-rendered fixture checks, not production routing or physical-device evidence.

| Check | Result |
| --- | --- |
| 1440 / 390 / 320px member, all native disclosures open | Document widths exactly 1440 / 390 / 320; no page overflow. Long provenance hash wraps. |
| 200% root enlargement at 1440px, all disclosures open | Body changes 16px → 32px, h1 96px; document remains 1440px wide. |
| Member inventory | 10 team hooks, 10 face hooks, 5 saved AI hooks, 24 value rows, 228 roster links and 228 unique player destinations. |
| Public | No `[data-personal]` content; 10 teams, 10 faces, 5 saved model rows. |
| Stale / missing AI | Stale notice visible with 5 saved rows. Missing has 0 saved hooks, 5 current pairing rows and explicit unavailable text. |
| Unmatched AI | Intercepted local data module to change only saved season to 2025; all 5 current pairs show Unavailable and no saved-row hooks. No source fixture edited. |
| Search and sorting | Jokić finds the correct single roster; unmatched query shows empty state. A–Z sort starts with Huff n’ Puff in both directory and standings. |
| Menu keyboard | Enter opens; Escape closes from a contained link and focus returns to summary. Open menu fits 390px. |
| Images / runtime | All approved images load after scrolling; no broken images, JavaScript errors or external runtime requests observed. |
| Reduced motion | All content, 10 directory rows and controls remain available. No autonomous animation exists. |
| Phone actions | All `.action` links meet the 44×44px target. |

Actual opaque contrast pairs, calculated with WCAG relative luminance: main ink on white/lilac/teal/coral **13.78 / 10.13 / 11.07 / 8.04:1**. Secondary ink on white/lilac/teal **6.57 / 4.83 / 5.28:1**. Coral archive metadata uses darker `#4B4B42`. White on primary action is **13.78:1**, footer secondary text **9.06:1**, focus against all four light surfaces **4.87:1 or greater**. Portrait pixels and decorative court lines do not carry essential text.

Rendered evidence in this folder: `check-1440.png`, `check-390.png`, `check-320-open.png`, `check-200.png`, `check-public.png`, `check-ai-open.png`, and `check-footer-mobile.png`. Wide/phone captures include the entire page and footer; narrow open-roster and AI captures inspect real expanded content.

Limits: no screen-reader session, physical iOS/Android check, production auth, live source verification, Next Back/Forward restoration, or actual game execution was performed. Application destinations are preserved and checked against repository routes; this static server does not run those application pages. No production file, shared token, fixture, API, Git, database, dependency, config or deployment changed.
