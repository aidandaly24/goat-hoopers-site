# 11 — Open league account

Source-ready and frozen. Preview: `http://127.0.0.1:4207/qa/homepage-browser-20/11/`
Neutral geometry: `http://127.0.0.1:4207/qa/homepage-browser-20/11/?stage=structure`

## Composition and use

The page is a broad, borderless account rather than a dashboard of containers. A ten-club table carries the left two thirds, and a shorter open margin interrupts it with selected matchups, a handwritten roster note and a single Sabonis cutout. The verified inaugural final changes scale beneath the table; small dated move receipts and useful league routes then finish the account without a repeated card or footer scaffold.

The user question is “Where does every club stand, and where do I go next?” The primary actions are club profile and full standings links. Club-name ordering is a native select; it preserves every row. Relevant states are clearly synthetic 2026 totals, Week 3 matchup points (recorded 0 versus Pending), verified 2025 final, and an unpublished Oct 5–11, 2026 opener draft. Source details are optional native disclosure; all primary content is initially in document flow. No live, auth, data, stock or AI calls execute.

Desktop scope only, per the author contract. The 1440 and 1120 compositions retain a broad table and right margin. Intrinsic wrapping accommodates text enlargement: the final score and its name metadata wrap as units; portrait and note wrap when their flex bases cannot fit. There are no fixed-height text containers, no inner scroll area, and no hidden primary-content tabs. No animation is used; ordinary navigation and sorting are immediate. Reduced-motion CSS also removes any future motion added through shared browser behavior.

## Reads and selective application

- `AGENTS.md`; `ARCHITECTURE.md` (repo map, Courtside homepage and weekly archive, data/surface/UI contracts, responsive approach); `.agents/skills/goat-hoopers-design/SKILL.md`; its `references/navigation-accessibility.md`; relevant `DESIGN.md` identity, states, composition, controls and content sections. Applied the data membrane, explicit state/period labels, real routes, semantic headings/table, native controls, skip link and visible focus. Production composition, primitives and palette are explicitly waived for this isolated study by `../AUTHOR-CONTRACT.md`; no production file was changed.
- `../AUTHOR-CONTRACT.md`, own `FACTS.json`, `qa/homepage-structures/assets/fonts/catalog.json`, and the supplied link index `qa/homepage-structures/reference-notes/craft.md`.
- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), actual primary document opened through the web tool. Applied the idea that the client's content determines the whole page: league order is its structure, player identity interrupts it, and the final score provides its second scale. Its scaffolding scripts, stamp mechanics, fixed catalog checks and section quotas were not used.
- [Elaya redesign-existing-projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), actual primary document, particularly Layout and Interactivity sections. Applied the diagnosis of equal-card symmetry, unnecessary left sidebars, dead destinations, and absent focus. Its prescribed values, hero gradient, blanket reveal animations, marketing funnel and required palette/font rules were not adopted.
- `cloud-environment-runtime` skill and current environment status. No external network assets, installation, credentials or services were used for the page.

## Local materials

Existing authorized OFL fonts: DM Sans for the working account, Lora for editorial and historical score hierarchy, and Kalam for two informal margin notes. Existing approved horizontal black GOAT logo and local Domantas Sabonis portrait only. Palette roles are cream paper, deep green ink, muted green context, and plum Pending/draft labels. Stage structure changes those color roles and makes the portrait grayscale while preserving geometry and content. No downloaded code, shared renderer, peer/pilot inspection or copied work-dashboard motif.

## Bounded browser evidence

Used the installed Python Playwright with local `/usr/bin/chromium` and the existing port 4207 static server. No dependency was installed.

- Initial 1440×1000: HTTP 200, ready flag `11`, both local images loaded, no page errors, document width 1440 with no horizontal overflow. Full document height 1601 before the intrinsic final-score wrap correction.
- Final 1120×900: visually inspected full page. Normal document width 1120; all ten clubs, pairings, portrait, final, receipts and route list are present. Corrected the historical metadata grouping after the first enlargement pass exposed vertical word fragmentation.
- Final explicit 200% text stress at 1120: snapshotted computed sizes for all HTML elements and doubled them. No elements extended past the viewport right edge; document scroll width remained 1120. Visually inspected the enlarged result: labels wrap, scores and metadata remain readable, primary content stays in normal flow.
- Native select: Club name sorts first to Huff n’ Puff; restoring Fixture order restores the source order. Result text updates through `role=status`.
- Keyboard: first Tab reaches the skip link with a solid visible outline. Native source disclosure opens and closes. This is a bounded keyboard check, not a full traversal or screen-reader claim.
- At 1120, designed and `?stage=structure` main-content text and exact main height matched with disclosure closed and default order. Ready flag is set after `document.fonts.ready` in both modes.

Root owns the final designed/grayscale captures and broader keyboard/reflow checks. Live destinations, screen readers, physical devices and mobile layouts were not tested. No release, deployment or production integration was attempted. No remaining source blocker.

## Input-unit correction and refreeze

Root clarified `FACTS.json.fieldUnits`: identity `pointsFor` is stored in integer hundredths, so 32050 is 320.50 fantasy points. All ten displayed season totals now divide the stored value by 100 and retain two decimals (320.50 through 271.00); the visible column says “Fantasy pts,” and caption/provenance explicitly label fantasy points. Supplied fixture order, ranks and current records remain unchanged. A direct source check compared every displayed total to the clarified fixture and confirmed all ten records remain 1–0. No layout changes, new browser suite, screenshots, publication or other files were involved. Previous browser evidence describes the composition before this small unit/label correction; root owns the corrected recapture. Source is refrozen with no remaining blocker.
