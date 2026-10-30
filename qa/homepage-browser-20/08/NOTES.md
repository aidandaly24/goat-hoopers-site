# 08 — Pennant assembly

Frozen desktop source: `http://localhost:4207/qa/homepage-browser-20/08/`

Neutral treatment: `http://localhost:4207/qa/homepage-browser-20/08/?stage=structure`

The page is an asymmetrical assembly of original cloth silhouettes: a deep championship swallowtail, a narrower gold season tail, a wide interrupted matchup streamer, and a joined two-color cloth for club faces. Their different proportions and seams carry different information. The dark finishing hem holds useful onward paths; there is no appended directory or standard footer inventory.

The main priorities are the verified 2025 champion and final, the supplied synthetic Week 3 Castle/Fun Guys pairing, and the two clubs’ players and previous-season context. The season tail provides playoff orientation and the Reaves/Ware pairing while preserving known zero versus missing score. The entire substantive home is present in normal document flow. Only provenance uses a native disclosure.

## Design and implementation contract

- Visitor question: who won the first title, who is paired now, and where can I follow those clubs?
- Primary path: read the title cloth, follow a named club or the matchup preview path, then continue to a roster or player profile.
- States: historical 2025 final; synthetic 2026 Week 3 fixture; modeled player FAAB; explicit Pending for null scores. These periods and units remain separate.
- Desktop: authored for 1440 and 1120 CSS px. Long names wrap; fabric safe areas grow with enlarged text. Phone work is intentionally deferred per assignment.
- Forbidden patterns avoided: repeated flag cards, uniform club grid, side-view gym scene, invented club logos, fake live results, interaction-gated main content, inner scroll reader.
- No animation is used. Links and native disclosure act immediately, and reduced-motion receives the same content.
- `study.js` only sets `document.documentElement.dataset.browserStudyReady = '08'` after `document.fonts.ready`. The page does not fetch data, authenticate, generate AI, poll, or persist a preference.
- Structure mode applies grayscale to the same DOM and geometry, including the approved images.

## Exact guidance read and application

Repository reads: `AGENTS.md`; `ARCHITECTURE.md` (especially homepage/weekly data contracts, domain/data boundaries, UI contracts, and environment limits); `.agents/skills/goat-hoopers-design/SKILL.md`; its `references/navigation-accessibility.md`; relevant `DESIGN.md` data, destination, control, and accessibility guidance; `../AUTHOR-CONTRACT.md`; own `FACTS.json`; and `qa/homepage-structures/reference-notes/craft.md`. The desktop exploration override supplies this study’s independent presentation and defers mobile.

Actual primary craft reads, opened from that reference index:

- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), also read as its raw primary file. Applied the client-specific whole-page idea and content-led structure: fabrics continue through every main content area. No section quota, scaffold, scripts, catalog, palette bans, or font bans were adopted.
- [Hallmark responsive](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/responsive.md). Applied room for longer names and wrapping content. Desktop safe areas follow growing content. Its phone program and prescribed breakpoints are outside this assignment.
- [Elaya redesign-existing-projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), also read as its complete raw primary file. Applied the diagnosis of equal-card symmetry and forced equal heights. Its fixed values, sales anatomy, installer workflow, and automatic entrance reveals were not adopted.

No peer, pilot, or old prototype implementation was inspected. Shared production navigation was read only to confirm existing destinations; an initially assumed `/matchups` and `/standings` path was corrected before freeze to `/intel` and `/table`.

## Assets and scope

Unchanged approved local GOAT horizontal black SVG, and local portraits for Stephen Curry (`1085`), Shai Gilgeous-Alexander (`1957`), and Jalen Brunson (`1967`). Existing local OFL fonts: DM Sans and Graduate, using the catalog paths. Cloth paths, stitch outlines, folds, and silhouettes are original inline SVG/CSS. None is a team identity mark. No asset downloads, new dependencies, services, scripts from craft sources, or generated team logos.

Writes are confined to `08/`: `index.html`, `style.css`, `study.js`, and this note. No production, shared asset, configuration, credentials, data, Muse, or 3D files were modified. No subagents, commits, push, PR, comment, merge, or deployment.

## Bounded local evidence

System Chromium through the already available Playwright module was used against the existing local static server. No browser install was performed.

- Initial rendered views at 1440×1000 and 1120×900 were visually inspected. Approved logo and all three portraits loaded, readiness was `08`, and no JavaScript page errors occurred.
- Final source at 1440: document scroll width 1440, page height 2240 CSS px. At 1120: document scroll width 1120, page height 2171 CSS px.
- At both final desktop widths, normal versus `?stage=structure` had identical main text and exact bounding boxes for the opening, every cloth, and finishing hem.
- The explicit text-only 2× check took a snapshot of computed HTML element font sizes and doubled each. At 1120, the h1 grew from 32.8px to 65.6px and document scroll width remained 1120. Its final 4014px-high rendering was visually inspected after increasing proportional cloth safe areas. Text remained readable and no main content was clipped.
- A bounded keyboard check confirmed the first Tab reaches the visible outlined skip link, and Enter opens the native source disclosure. This is not a screen-reader or full keyboard audit.
- Existing route definitions were checked for the linked public page families. External live navigation, auth, production data, AT, and physical devices were not tested. Root owns final designed/grayscale captures and the broader bounded keyboard/reflow review.

Frozen after these checks. No remaining source blocker identified.
