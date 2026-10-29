# League almanac — direction 03

> Accessibility repair copy. The original design and author verification record below are retained for provenance. Those 200% checks did not establish the combined 390px/root-font-200% case. The corrected diagnosis, scope and actual repair results are in [QA-REPAIR.md](QA-REPAIR.md).

The question is “What is happening in my league, and where can I look it up?” The first action is to read the current Week 3 pairing and open My team (member) or explore the teams (public). Current information comes before the back issues.

This is a typographic reference edition: a compact contents rail, a large Inter title, open spreads, short folios and Geist Mono figures. A quiet ruled register replaces a collection of cards. The original arena is an illustration of the league's home, next to the actionable current pairing; the original free-throw preview has a real Play destination. The selected logo and existing portraits remain unchanged. All colors use the shared Paper + Slate semantic roles. There are no new fonts, scenes, generated images, decorative animations or external calls.

The eight chapters retain the entire common information inventory: current pairing and all five saved AI picks; member identity, complete valuation and player notebook; ten league faces; searchable/sortable complete team rosters; sortable standings and sample transactions; dated editorial with selection receipts and happenings; market/trade/Arcade destinations; and both retained weekly editions. Each probability is looked up by roster ID. Returned choice is independent of probability ordering and separate from confidence. Saved metadata and unavailable input/result evidence remain accessible through native details. Missing and stale AI states are visibly labeled before expansion. The dated October draft has its own back-issue chapter and never provides the current pairing or a current award.

At wide sizes the contents rail acts like a book's marginal index, while content uses varied one- and two-column compositions. Below 64rem the contents becomes an in-flow compact index. Below 40rem the paired spreads stack in the same reading order; rosters, filters, valuation lists and archive entries become one column. Names wrap; the current pending score stays distinct from the known 0.0. Member/public links are available in both layouts. Native disclosures preserve all roster values, player references and provenance, with visible focus and no modal interaction. Menu Escape closes and restores focus to its summary. Search matches teams, managers and every player, expands matching roster lists and announces the count; sorts work on actual fixture data.

Forbidden patterns: inferred results or rankings, imaginary price history, price disguised as form, unlabeled archive opinions, mismatched AI odds, repeated nested cards, image-background text, rejected figurines, and a separate page theme control. The current fixture can be dated later than the execution date; its as-of stamp is displayed as supplied and never presented as a fresh live observation.

This is a static HTML fixture, not production Next.js, authentication, live data or actual game execution evidence. Production destination links are preserved; the repository's static server is not expected to serve application routes. Physical-device, screen-reader and real backend checks are outside this mock's evidence.

## Actual verification

Source baseline: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`; only this assigned direction's HTML and design record were authored.

Exercised the written page through the coordinator's existing HTTP server with installed Playwright and `/usr/bin/chromium`; no installs or production runtime imports. Member and public views were rendered at 1440, 390 and 320 CSS px. Every one retained exactly ten directory containers, ten league faces, five saved pair rows, ten standings rows and 228 unique directory player links. Member additionally retained one personal region and all 24 player-value rows; public had neither. All 17 member and 19 public image elements loaded successfully. The court renders at its intended 16:9 ratio.

No page-width overflow occurred at any tested width, including every non-menu native disclosure expanded. A separate 1440px check with the root font set to 32px (200% text enlargement) and all disclosures expanded also had no overflow. The browser emitted no page errors. Local chapter anchors all resolve.

Opaque rendered foreground/background color pairs were read from Chromium computed styles and evaluated with the WCAG relative-luminance formula: body ink on paper 12.70:1, metadata on paper 5.15:1, accent text on paper 6.56:1, incomplete-status text on paper 5.51:1, and white primary-action text on slate 7.22:1. This bounded check is not a blanket accessibility certification.

Player search for Embiid returned one matching team and opened its roster; team search for NeuralNets returned one; an unknown query produced the explicit zero-results state. Clearing restored all ten. Sorting by points put roster 1 first; sorting standings alphabetically put Huff n’ Puff first. The complete valuation disclosure opened. Keyboard Enter opened Menu; Escape closed it and restored focus to its summary.

The ready, `?ai=stale` and `?ai=missing` variants were exercised. Stale is visible before any disclosure; missing shows Unavailable and no saved pair rows. The first ready pair correctly shows Reaves Dropper 65%, Ware the Hoes At? 35%, **returned choice Ware the Hoes At?**, and independent confidence 20%, preserving the deliberately non-majority fixture choice. Missing snapshots, baseline and result evidence are explicit.

Desktop top and full-page screenshots and a 390px top screenshot were visually inspected during authoring. Captures are temporary author checks under `/tmp/almanac-03-*`; the coordinator owns the final comparison captures. These are Chromium static-fixture results, not a claim of production navigation, physical-device, assistive-technology or live-data verification.
