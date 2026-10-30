# 14 — The race for six

Frozen desktop homepage study. Entry: `http://localhost:4207/qa/homepage-browser-20/14/index.html`. Neutral entry: the same URL with `?stage=structure`.

## Idea and geometry

Six playoff places provide the page's shape. Four connected terraces begin at progressively smaller left offsets: the first two teams share the narrow upper terrace, the next pairing widens it, the defending champion widens it again, and sixth place reaches the full available width. This is ordinal position, never a points scale. The same organizing idea continues below the sixth-place boundary, where last season's runner-up has a distinct emphasis alongside the other three teams.

The page is a useful league front door: actual supplied Week 3 pairings and returned score states, all ten clickable clubs and managers, selected roster players, a separately labelled 2025 championship result, and direct access to team/standings/player values/intel/trade analysis/Arcade. These are selected because they help explain the race and offer a next action; no complete data-family inventory or dated editorial draft was added. There is no shared footer pattern, inner scrolling reader, carousel, selector or hidden primary content.

Design contract: the visitor asks “where does everyone stand, who are they facing, and what can I do next?” The primary path is the ordered clubs → a team profile or roster; the sixth-place jump offers immediate orientation. States are synthetic current fixture, known zero, Pending/null, and historical final. Desktop at 1440 and 1120 plus text enlargement is in scope. Phone work is deferred. Forbidden patterns include forecasts, numeric gaps inferred from the terrace geometry, fake quotes, concealed standings, transit/maps/radar/blueprints and ten equally weighted team boxes.

## Sources read and applied

- `AGENTS.md`, `ARCHITECTURE.md` (repository map, data/domain/surface boundaries, homepage source and period contracts), `qa/homepage-browser-20/AUTHOR-CONTRACT.md`, and this directory's `FACTS.json`. Production palette/section sequence/primitives do not constrain these independent QA files under the author contract. No production file was edited.
- `.agents/skills/goat-hoopers-design/SKILL.md`, `DESIGN.md` through composition and product/data rules, and its `references/visual-hierarchy.md` and `references/navigation-accessibility.md`. Applied useful clickable identities, clear period/state distinctions, focus visibility, and honest evidence limits. No shared-shell ownership or production behavior change is claimed.
- `qa/homepage-structures/reference-notes/craft.md`, used to resolve primary sources rather than as a visual recipe.
- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), primary text “Yours, all of it” and “Before the first line of code.” Applied one client-specific idea through the complete page, content-led structure, and exact edges. Its section counts, palette/font bans, scripts, gates, catalog and template machinery were not adopted; the explicit experimental contract controls.
- [Elaya redesign guidance](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), primary layout diagnosis and interaction/state guidance. Applied unequal emphasis and offsets, no equal-card grid, direct links, and visible focus. Its fixed values, sales anatomy, floating navigation and blanket entrance effects were not adopted.
- `qa/homepage-structures/assets/fonts/catalog.json`. Uses existing local OFL DM Sans and Lora font bytes only. Approved local GOAT logo and portraits only. No asset, dependency, external code or service was downloaded or installed.
- Managed cloud runtime skill and current environment-status observation. This page makes no API, credential, auth, database or AI calls.

## Content and interaction decisions

The compact top label explicitly identifies a synthetic 2026 fixture as of Nov 12. Native source details explain its future date relative to the Oct 30 review. Reaves is paired with Ware in Week 3. Reaves' returned `0` and Castle's `105.5` are distinct from their opponents' Pending states. 2025 records and final scores carry their historical period; NeuralNets' prior-manager history names QBs Gremlins. No saved AI probabilities or draft editorial are used.

All substantial content renders in normal flow before interaction. Native details contain only provenance. Real destination paths were checked against the repository's route inventory; no external route execution or live/auth state was tested. The jump link has a real target. There is one main and h1; team names remain HTML text. Player portraits are supplementary to visible names, so have empty alt text.

No motion is necessary for the ordinal composition or frequent-use navigation. The page is still for both ordinary and reduced-motion preferences. The structure query changes color and image treatment only. JS waits for local fonts before setting `document.documentElement.dataset.browserStudyReady = '14'`.

## Bounded verification — final source

Chromium via the existing Playwright installation, local static server on 4207. No package installs, production app build, backend requests, remote navigation, screen-reader acceptance, physical-device check or mobile work.

| Check | Observed result |
| --- | --- |
| 1440 × 1000 | Document width 1440, height 1878; no out-of-viewport main elements |
| 1120 × 1000 | Document width 1120, height 1857; no out-of-viewport main elements |
| 1120, every computed element font size doubled from a snapshot | Document width 1120, height 4778; no horizontal overflow/outliers; natural wrapping |
| Designed vs structure, 1440 | Exact equality of measured main text, figure, terrace and main-region rectangles |
| Fonts/assets/runtime | Fonts loaded, every image loaded, ready marker `14`, no page errors or HTTP failures |
| Keyboard | 28 sequential Tab stops from skip link through the provenance summary; 3px focused outlines on both endpoints; Enter opened native details |
| Skip link | Enter changed the target to `#main` in the initial bounded pass |

`check-results.json` contains the final measurements. `inspection-1440.png`, `inspection-lower.png`, and `inspection-enlarged.png` are three bounded viewport inspections, visually examined by the author. Root owns the comprehensive full-page designed/neutral captures. No blockers remain; source is frozen pending concrete review findings.
