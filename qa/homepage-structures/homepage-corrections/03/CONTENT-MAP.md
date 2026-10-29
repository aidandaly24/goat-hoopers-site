# Concept 03 — the open programme

Frozen local correction. Entry: `/qa/homepage-structures/homepage-corrections/03/` on the existing localhost:4207 server. The default is the synthetic member edition; `?view=public` renders the public edition. No production surface, shared data/helper, polished source, peer concept or existing evidence was edited.

The former fixed horizontal chapter reader has become one ordinary, vertically readable document. There are eight member sections and six public sections, all present and visible from load. The contents links, per-chapter Contents return links and final cover link use native anchors and browser history. There are no internal reading viewports, tabs, inert chapters, fixed chapter controls, scroll-snap panels or chapter replacement. `document.documentElement.dataset.homepageReady === '03'` is set after the local fonts are ready.

## Surface contract

User question → what is happening across my league, and what should I read or do next? Primary action → follow the actual current pairing, then reach My team or the relevant league destination. States → member/public, ready/stale/missing saved AI, known zero/unknown score, incomplete current fixture, dated upcoming editorial and historical final. Narrow layout → the whole programme remains in page flow; scores become paired rows, standings become labelled records, and the notebook/edition preserve their reading order. Forbidden patterns → one-piece chapter readers, tabs hiding most of home, invented live results or awards, model prices presented as performance, uniform feature-card stacks and hidden essential content awaiting animation.

## Visible content map

| Open spread | Visible before interaction | Secondary local detail / destination |
| --- | --- | --- |
| Cover / This week | League identity, season, Week 3, ten franchises, member/public edition, member team context and My team action, both paired team names/managers/records, known 0.0 versus Pending, incomplete status, actual supplied roster anchors | Programme contents anchors; team profiles; My team or Teams; AI Decides |
| Five pairings | Every pairing with both current scores, incomplete status, returned saved choice, both supplied probabilities and independently labelled confidence | Each native Saved evidence disclosure retains model, prompt, saved time, returned choice, probabilities, confidence, null input/slate snapshots, source evidence and probability label |
| Your club — member | Reaves Dropper, manager, record, standing, 24-player roster, current modeled FAAB total, priced/unpriced coverage, computation time/basis/value rank and all three actual top-value anchors | All 24 roster-value rows in one native disclosure; My team, full roster, Stocks and trade analyzer. Recorded value history stays unavailable |
| Scoutbook — member | All three watch players with EMA FP/G, observed GP and availability notes; all three best and rough recorded-performer rows; exact completed-week period, five-player eligibility, overlap/exclusions and synthetic recap qualification | Full supplied team news and recent move are open beneath the notebook. News and Transactions destinations remain explicit |
| The league | All ten standings with rank, team/manager, W–L and PF; all three supplied moves; honest Power-unavailable state; all ten franchise identities, modeled-value player anchors, managers, current opponents and roster counts | Search across team/manager/player/position/NBA; all 228 unique player references with position/NBA remain in ten independent roster disclosures. Previous-season records retain their attribution, including NeuralNets under the previous manager as QBs Gremlins. Profile and full-roster links stay distinct |
| The edition | Coherent archive edition `2026-W41`: date/draft label, opening-week pairing, upcoming/null scores, original context, all three dated happenings and all three editorial opinions with stats and their distinct NBA/college periods | Each pick's selection reason and checked source; full edition selection, source list and exclusive date bounds. The draft remains separate from current Week 3 |
| The archive | Both dated unpublished draft entries, their routes and context; older 2025 title story and actual 326.0–251.5 historical final | Complete older selection, happening, checked source/date bounds; History and Weekly archive destinations |
| Play & tools | Actual Free Throw preview and practice launch; all eight league destinations with useful descriptions | News, Stocks, AI Decides, Teams, Transactions, trade analyzer, History, Weekly archive and Arcade. No invented game or reward |
| Colophon / provenance | Compact Synthetic concept disclosure in masthead, persistent local fixture qualification in colophon | Public/member comparison and explicit ready/stale/missing AI fixture links |

Only full rosters, full value ledgers and detailed source receipts disclose. They supplement an openly readable homepage rather than replacing its content with an interaction demo. The input's inconsistent `home.edition.game.teamIds` are not reinterpreted: the dated editorial uses the coherent `data.archive[0]`, while current scores use only directory/personal matchups. Every fact comes from `../../data.js`; there are no provider requests or generated facts.

## Composition and local art

The navy cover is a programme opening with its actual pairing and a contrasting orange slate margin. Five saved decisions form an open score register on snow. The member club is a broad orange identity/value spread; the scout notebook uses an orange form margin, an open completed-week comparison and a navy wire. Standings and roster register use white, plain rows and compact portraits. The dated edition gives the lead opinion a large orange image/copy area while two subordinate opinions share a separate column. The navy historical spread pairs chronology with the final score. The orange closing spread pairs the actual game preview with a destination register. These do not repeat one card anatomy.

Local Barlow Condensed Regular and variable DM Sans retain their supplied local font paths. The original approved logo, player images and actual Free Throw preview are reused. No new assets or dependencies were installed. Semantic `--programme-*` roles own navy ink/surfaces, snow reading ground, bright orange actions/material, readable secondary ink, boundaries and focus. They do not alter production tokens.

Craft guidance was read through the project's `goat-hoopers-design` skill, its visual-hierarchy/navigation references and `reference-notes/craft.md`. Applied principles: the direction governs the full document; different information gets different composition; phone layout adapts the task; state/source labels stay with the fact; routine anchors and keyboard actions are immediate. No animation is authored because this correction's primary job is frequent reading and navigation. Normal and reduced-motion settings share the same readable content.

## Final local evidence

Run `node qa/homepage-structures/homepage-corrections/03/verify.mjs` from the repository root with the existing server on 4207. `verification.json` records the passing result and SHA-256 hashes of the tested HTML, JS, CSS and verification script.

- 36 combinations passed: member/public × ready/stale/missing × 1440/390/320 CSS px × 100%/200% root text. Each retained all expected sections, five pairings, ten standings, ten franchises and three editorial subjects. Public omitted club/scout. There was no document horizontal overflow, internal vertical reader or inert content.
- 12 ready-state combinations also passed with every main disclosure expanded, including all 228 roster references and all 24 member value rows. No width masking or overflow-hidden page workaround was used.
- Keyboard Enter followed League anchors at all three widths in both modes, focused the destination section and exposed visible focus on the next link. Contents return and browser Back restored the League anchor with the expected 32px combined scroll clearance.
- Six member/public × width flows passed AJ Dybantsa search, explicit no-results/reset, native roster disclosure and Escape/focus restoration. Provenance Escape restored its own summary. Public/member direct `#archive` URLs passed.
- Actual saved evidence retained 35%/65%, separate 20% confidence, fixture model/prompt and null snapshots. The 2025 326.0–251.5 final and previous-manager qualification were checked. Both local fonts loaded. No page error or failed response occurred in the final test run.
- Bounded rendered color samples: cover text on navy 14.45:1; secondary reading on snow 5.65:1; navy on orange 5.64:1; secondary text on navy 9.19:1; selected team text on white 6.71:1. These are measured samples, not universal accessibility certification.
- Visual inspection covered the desktop cover, club, league and edition plus phone cover and league. `check-desktop-cover.png` and `check-phone-cover.png` are early, bounded viewport checks before the final enlargement adjustments; they are not the parent's final full-page captures. Additional bounded inspection images are in `/tmp/home03-*.png`. No full-document image was generated by this lane.
- `node --check homepage.js` passed. No production build is claimed for this isolated static proposal.

Parent owns the four final full-page captures. Physical phones, Safari, screen readers, real authentication and destination route behavior remain untested. The local fixture is not an authentication boundary. No external writes, Git operations, installs, uploads, PRs, merges or deployments occurred. No local blocker remains.

## Exact lane files

`index.html`, `homepage.js`, `homepage.css`, `CONTENT-MAP.md`, `verify.mjs`, `verification.json`, `check-desktop-cover.png`, `check-phone-cover.png`.
