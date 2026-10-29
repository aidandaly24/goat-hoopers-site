# 15 — Geometric Motion

This is an independently authored, isolated QA homepage. It uses no shared CSS, section renderer or production components. Only the supplied fixture, selected GOAT mark, existing local portraits, Free Throw image and local font files are reused. No other direction or earlier mock was inspected.

## Design contract

- **User question:** What matters for my team this week, and where can I inspect the league context?
- **Primary action:** Member My team and View roster; public Browse all ten teams. Saved picks, Stocks, trade analysis and actual Free Throw practice remain direct destinations.
- **Relevant states:** Member/public, current known zero versus Pending, incomplete pairings, ready/stale/missing/unmatched saved output, complete or partial priced coverage, unavailable recorded value history, unavailable Power/league statistics, and dated draft editorial.
- **Narrow layout:** The offset home/away blocks stack, with their shared score plane below. Personal actions wrap. The portrait trio remains compact. Notebook lenses, recap columns, editorial stories, AI introduction, directory fields, league notes and tool areas stack in document order. Full player references remain in native disclosures. An inline-size query gives the standings labelled stacked fields when enlarged text makes columns unsuitable.
- **Forbidden patterns:** Autonomous animation, decorative game controls, inferred model winners, fabricated charts/rankings/awards, unknown values replaced with zero, lost roster links, and current-week claims attached to the dated editorial sample.

## Visual system and composition

Ultramarine `#1838D4` is the connecting field. Coral `#FF826D` and marigold `#FFC947` are large structural shapes. Ink `#16204D`, white and a pale blue reading surface keep controls and information quiet. Locally declared Archivo Black supplies the geometric athletic display voice; local DM Sans supplies long-form and data reading. Type uses root-relative units, with a 1rem body, .875rem secondary text and .75rem minimum metadata.

The current matchup is an interlocking pair: a marigold upper-left court corner and a coral lower-right court corner, vertically offset around an opaque white score plane. A partial court arc crosses the blue field. These are stationary CSS shapes; motion is expressed through alignment and sequence.

The rest of the page continues that geometry rather than reverting to a uniform card grid. The member value spread steps three portraits over a large marigold semicircle. The notebook has a left geometric marker and an open white working plane. The completed-week comparison and wire share a full coral field. The dated stories step down across ultramarine in white, yellow and coral. The AI slate is a single outlined reading plane on yellow, with a partial coral circle. The directory is a compact open list, integrating each team's modeled face with its current opponent and roster. A large white standings plane intersects the blue league section. Market and Arcade occupy adjoining yellow/coral blocks; the archive returns to an open blue list.

## Information and interaction

The fixture label is visible immediately. Footer disclosures retain benchmark, complete JSON access, checked dates, editorial source links, both archive contexts, publication state and local font/asset provenance.

The featured matchup comes from the current directory/personal pairing. Its dated editorial context is separately identified. Every current score remains incomplete, and 0.0 remains distinct from Pending. The member valuation preserves total, priced/unpriced coverage, computation time, rank, top three and all 24 player values. There is no invented history chart.

The notebook separates observed EMA form, modeled price and dated editorial. Completed-week best/rough lists retain points, GP, exact period and eligible-player coverage; overlapping small-cohort selections are explained. Team wire and all supplied recent transactions remain accessible.

All five saved picks retain their returned choices, both probabilities, independent confidence, saved time, model, prompt, league/season/week/roster IDs, evidence and unavailable input-snapshot status. The first returned choice deliberately remains Ware the Hoes At? at 35%, alongside Reaves Dropper at 65%. Stale status is visible outside disclosures. Missing/unmatched output prints Unavailable and keeps the current pair visible. No generation occurs.

All ten directory entries retain managers, current records/opponents, prior-season context, ten modeled faces, price-market links and all 228 unique player links with position/NBA team. NeuralNets' previous-manager attribution is visible before expansion. Search matches teams, managers and roster players; name, manager, roster count and standing sorts work. Standings retain all ten ranks, records and source pointsFor divided by 100, with four functional sorts.

Navigation uses native details with Enter activation and Escape close/focus restoration. Search, selects, disclosures and links are native controls. There is no modal or hidden information dependent on animation. Ordinary reading remains available under reduced-motion/save-data preferences. Market links use the actual `/stocks` destination; no unsupported player-selection query is invented.

## Verification performed

Local static fixture at port 4206, installed headless Chromium via Playwright, 2026-10-29:

- Member and public at 1440, 390 and 320 CSS pixels, closed and every disclosure open; no page-width overflow.
- Root font-size explicitly changed to 200% at each of those widths, with all disclosures including navigation open; body computes to 32px and no page-width overflow remains.
- Full-page desktop/phone visual inspection plus enlarged/expanded disclosure inspection. All 18 member images successfully decoded after scrolling through the page; no broken local images.
- Ten directory hooks, ten face hooks, five saved-pair hooks, 24 member value rows and 228 unique roster player links verified.
- Team, manager, player and no-result search; all four directory and all four standings sorts exercised.
- Navigation Enter opens; Escape closes and restores summary focus. All 23 member disclosures were opened through their summaries.
- Member/public stale and missing states exercised. Missing retains five current pairings and zero saved-row hooks; stale retains five visibly stale saved rows. Public has no personal hooks.
- No browser script errors or requests outside the local server.
- Opaque rendered text role pairs measured: ink/white 15.58:1, ink/coral 6.43:1, ink/marigold 10.16:1, ink/pale 14.07:1, secondary/white 6.93:1, white/ultramarine 8.22:1, white/deep blue 11.40:1, light-secondary/ultramarine 6.40:1. Light working planes explicitly restore dark focus rings and secondary text.

These are static fixture/browser checks, not production Next routing, live/auth data, physical-device, assistive-technology or full Arcade gameplay acceptance. Production files, data, configuration, Git and deployment were not changed. No installs, external runtime, services or credentials were used. Root owns final bulk captures and pairwise review.
