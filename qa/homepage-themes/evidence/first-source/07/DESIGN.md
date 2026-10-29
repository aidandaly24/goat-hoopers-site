# 07 — Varsity Club

Source-ready isolated QA theme. Authored independently in this directory; no other direction or old mock was inspected, and no shared template, CSS or production token file is imported.

## Surface contract

- **User question:** What matters for my club this week, and where can I inspect the rest of the league?
- **Primary action:** Member **My team**, with **View roster** alongside it. Public visitors begin with **Meet the teams**.
- **Relevant states:** Member/public, known zero/Pending, incomplete matchup, complete/partial modeled pricing, ready/stale/missing/unmatched saved AI, missing recorded value history, missing Power/statistics, dated unpublished editorial, no search matches and expanded rosters/provenance.
- **Narrow composition:** Identity and gold standing pennant lead; arena and scoreboard follow. Section navigation wraps. Programme columns stack; all ten clubs retain their roster disclosures, search and sorting. Standings remain a readable five-column table. No fixed chrome, modal or internal scrolling panel.
- **Forbidden patterns:** Invented awards, jerseys assigned to players, fabricated history/rankings, live claims, fake controls, current-week framing of historical opinions, APIs on render, autonomous motion and decorative-only actions.

## Visual decisions

Forest `#123e30`, deep forest `#08291f`, athletic gold `#efc455` and snow `#f8faf7` define the whole programme. Alternating forest, snow and gold chapters carry the treatment through the footer. The selected white GOAT logo remains intact.

Local **Graduate** supplies collegiate headings, roster IDs, section numbers, scores and prices. Arial/Helvetica supplies long reading, names, controls and data. Section numbers are programme indices; club numbers are actual roster IDs. They do not imply player jersey numbers or honors.

The gold notched identity pennant introduces the club. The original arena sits in a gold-bordered athletics programme frame, followed by the actual current scoreboard. Member value anchors become three portrait/name/price entries on gold. Scouting reads as a staff notebook, saved AI as a fixture slate, the directory as a two-column club register, and standings as a forest table. On phones each remains the same useful section with its own data and actions.

All type derives from the root font size. Body is 1rem, secondary text generally .875rem and provenance no smaller than .75rem. Names and enlarged controls wrap. Top-value entries adapt to the space available. Opaque surfaces support every text block; there is no text over the arena image.

## Preserved inventory and truthfulness

- Current feature comes from `directory.currentMatchup`, using the member’s own pair in member view. Names, managers, 2026 records, Week 3, known 0.0, Pending and incomplete state remain explicit.
- Member identity, standing, 24-player count, My team and View roster survive. Modeled FAAB total, pricing basis/time, top three, all 24 player values, coverage, value rank and unavailable recorded-history state are present. Price change is labeled separately from form.
- Member watch rows retain EMA fantasy PPG and eight observed games; league anchors use modeled price and the dated editorial watch retains its separate college/preseason basis.
- Completed Week 2 rows retain points, GP, exact source period and five-player coverage. The overlapping best/rough selection shares a row; all supplied selections remain identified. Synthetic team news and recent moves are labeled.
- All three edition spotlights retain their opinions, statistics, periods, ownership links, selection reasons, source links and check dates. Dated happenings and all source records remain accessible.
- All five saved AI results retain the actual returned choice, both probabilities, independent 20% confidence, saved timestamp, roster IDs, model, prompt, input-unavailable state and evidence. The first returned choice remains the 35% away team. Stale is visible outside disclosures. Missing and unmatched results show Unavailable while all five current pairings remain visible.
- Ten modeled faces are integrated into the ten club entries, each with team, anchor, profile and Stocks price link. No fake deep-link query is invented; price links open the existing Stocks destination.
- Ten directory containers retain manager, current record, opponent, incomplete score context and all 228 unique roster references with position/NBA team. Prior-season records remain in expanded rosters with the previous-manager attribution for NeuralNets.
- Ten standings rows preserve rank, W, L and PF divided by 100. Power and unavailable producer statistics remain unavailable. Transactions, Stocks, trade analyzer, actual Arcade/Free Throw links and both dated archive routes remain present.
- Visible synthetic label and footer source disclosure link to the complete common fixture and local font catalogue. All public/member comparison and state links work as local QA navigation.

## Verification — actual Chromium static-fixture rendering

Route: `http://127.0.0.1:4206/qa/homepage-themes/directions/07/index.html`.

Verified with installed Playwright and `/usr/bin/chromium`, without installation or an external runtime request:

| Check | Evidence |
| --- | --- |
| Member and public | Rendered at 1440, 390 and 320 CSS px. Public has zero `data-personal` elements. |
| Root enlargement | Set `html.style.fontSize = '200%'`; root and body computed as 32px, versus 16px normally. Rechecked both views at all three widths. |
| Expanded content | Opened every native `details` element in all 12 view/width/text combinations. Document width equals viewport width; no element extended beyond the right edge. |
| Full page and images | Scrolled each normal-size view through the footer; every local image completed with a nonzero natural width. Inspected own wide/phone top, full-page and opened-register captures. |
| Audit hooks | Member ready: 10 `data-team-id`, 10 `data-face`, 5 `data-ai-pair`, 24 roster-value rows, 228 unique roster links and 10 standings rows. |
| Menu | Focused trigger; Enter opens. Focused a menu link; Escape closes and restores focus to `nav-button`. Hidden menu leaves navigation flow. |
| Search | Player “Labaron Philon” and manager/team “NeuralNets” each return one club. A nonmatching string shows the empty state. Clear restores all ten and focuses the input. |
| Sorting | Directory and standings A–Z sort put Huff n’ Puff first; other sorts use supplied rank, PF, wins and roster size with stable ties. |
| Saved states | Stale keeps five saved hooks and a visible stale banner. Missing keeps five current pairings, no saved hooks and an Unavailable banner. |
| Unmatched state | Browser-only response interception changed the saved week, without editing the fixture. Five current pairings remained; zero saved hooks; matching failure was explicitly Unavailable. |
| Runtime | `node --check varsity.js` passed. Browser checks reported no page errors or failed local resource responses. |

Opaque CSS foreground/background contrast calculations:

| Actual pair | Ratio |
| --- | --- |
| Snow / forest | 11.39:1 |
| Gold / deep forest | 9.42:1 |
| Main ink / snow | 12.37:1 |
| Secondary ink / snow | 6.88:1 |
| Pale secondary text / forest | 8.84:1 |
| Main ink / gold | 7.85:1 |
| Rust focus / snow | 6.10:1 |

Pennant text explicitly uses deep forest on gold. The white standings select explicitly uses main ink. Forest/header/footer focus uses gold. Native controls and phone navigation/actions/disclosures have a 44px minimum height; ordinary inline prose links use the inline-link exception. No animation or hidden-on-observer information is present; reduced motion does not remove content.

## Evidence limits

This is a static offline QA fixture, not a real Next route or proof of authenticated navigation, API behavior, physical-device use or screen-reader output. Destination anchors were preserved and inspected; production route journeys were not exercised. Reduced-motion behavior is established by static source and the absence of animation, rather than a separate assistive-technology session. No builds, commits, releases, installs, API calls or production changes were made.

## Frozen source fingerprint

SHA-256 of the exact concatenated bytes of `index.html`, `varsity.css`, then `varsity.js` (in that order; excludes this record):

`63dae3e78e8fb22cdeb8e5deb31275f4f8a5820745073cce18d801335b095331`

Individual source SHA-256 values:

- `index.html`: `5fce1d64ff8e2ee84b66311b8b735284b1140978474eed19e283c5c384f1efb9`
- `varsity.css`: `2cd277e97dff22562bf8e2c0c1a2000420895454711d98001d90cd8693185aae`
- `varsity.js`: `e355cf5790a3bfe68bbf961126d5f5b975778c26b5696cc9b9dcf8e816923e22`

No unresolved implementation blockers. Root owns complete comparative captures and the pairwise visual gate. Source is frozen for review.
