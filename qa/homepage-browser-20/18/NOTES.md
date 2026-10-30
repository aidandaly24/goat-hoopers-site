# 18 — One shot, whole league

Source ready and frozen for coordinator captures. Own files: `index.html`, `style.css`, `script.js`, this note. The supplied `FACTS.json` is unchanged.

Preview: `http://127.0.0.1:4207/qa/homepage-browser-20/18/`

Neutral structure: `http://127.0.0.1:4207/qa/homepage-browser-20/18/?stage=structure`

The composition is one basketball shot. A broad, continuous trajectory rises from the champion's portrait, encloses the league introduction, crosses the original basketball, and drops into the hoop above the tall current pairing. The champion and historical final make the release point substantial; the incompletely scored pairing has a different vertical silhouette. The ending offers three actual next actions rather than an appended information inventory. The page selects league orientation, three clubs and their roster faces, the current pairing, and the verified final; it omits other optional fact families.

All substantial content is readable HTML in normal flow. The shot, ball and hoop are original decorative SVG. The script measures already-flowing content to connect those landmarks; it does not position or hide primary content. There is no animation, game, canvas, backend call, model execution, authentication, dependency or service. The native provenance disclosure contains secondary explanation only. All destination links name actual existing GOAT routes. The approved logo is unchanged, and the three supplied portrait assets identify real roster references. Local OFL Bebas Neue and DM Sans supply the type.

The 2026 fixture and its future date are stated at the opening. The 2025 regular season and final carry their period and final state. The Fun Guys score is Pending and explicitly unreported, never zero. Curry's association with the club is labelled as the 2026 study roster rather than historical ownership evidence.

## Contract and actual reads

Read the assignment's `../AUTHOR-CONTRACT.md` and own `FACTS.json`; repository `AGENTS.md`; the architecture map and the relevant courtside/data membrane, source-period, navigation, static asset and arcade-practice descriptions in `ARCHITECTURE.md`; `.agents/skills/goat-hoopers-design/SKILL.md`, its `references/navigation-accessibility.md`, and the relevant controls, source-state and destination guidance in `DESIGN.md`. The desktop-only experimental contract overrides production visual layout and mobile requirements here. Production files and shared presentation are untouched. No peer, pilot or old prototype implementation was inspected.

Read `qa/homepage-structures/reference-notes/craft.md` as a resolved link index, then the actual primary [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md) and the layout/interactivity diagnosis in [Elaya redesign-existing-projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md). Hallmark informed letting one client-specific idea determine the whole composition and letting each kind of content take its own form. Elaya informed unequal visual masses, purposeful overlap of decorative elements, semantic native links and visible focus. Their scripts, templates, fixed values, palette/font prescriptions, section counts, animations and sales anatomy were not adopted or installed.

Also read the managed cloud runtime skill and its networking reference; checked current environment status and the nonsecret network policy. No credentials or external runtime were used. Craft documents were read through the web tool; assets were not downloaded.

## Surface contract

User question: What is happening in my league, and where do I go next? Primary action: meet the clubs or open the current pairing's matchup desk. States: synthetic/future-dated 2026 fixture; incomplete score; final 2025 history. Narrow desktop: the same unequal columns and shot remain at 1120px; intrinsic text wrapping expands the document. Mobile is deliberately deferred. Forbidden patterns: inner scrolling, hidden primary content, simulated live status, score null as zero, generic repeated panels, technical diagrams, and game controls.

## Bounded local evidence

Chromium via the existing local Playwright installation and `/usr/bin/chromium`, against the existing server on port 4207:

- 1440px and 1120px desktop were rendered and their full-page images inspected. All four image assets loaded; no page errors were observed.
- At both widths the document width matched the viewport, with no horizontal page overflow.
- At 1120px, every element's computed font size was snapshotted and doubled explicitly. Document width remained 1120px, and all substantial text remained in flow. The year has an intrinsic break opportunity and the opening actions wrap. No test flag, clipping, or text-size reduction is used.
- Designed and neutral 1440px renders had zero differences across every element's bounding rectangle. The structure state changes color and image treatment only.
- Keyboard Tab reached the visible skip link with a solid outline; activating it and continuing reached the primary league link with a visible outline. The native source disclosure was opened successfully. This was a bounded keyboard check, not a full keyboard or screen-reader audit.

Coordinator owns the final designed/neutral capture set and broader bounded reflow review. No live destination navigation, assistive-technology, mobile, production integration or deployment verification is claimed.
