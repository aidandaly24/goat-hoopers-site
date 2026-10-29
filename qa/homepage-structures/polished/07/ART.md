# 07 · Hardwood clubhouse

Full-art implementation of the approved working clubhouse, created only in `polished/07/`. Original wireframe, structural revision, shared data and captures are unchanged. Independent review and user approval remain separate gates.

## Direction and implementation

Walnut is the room structure; cream is the reading material; copper marks useful actions; near-black carries the score wall. These materials continue through the working states. The back wall and floor are original flat SVG planes, with the side wall, floor seams, bench edge/legs and archive shelf explaining depth. There are no gradients, grain overlays, new 3D assets or Muse runtime.

The room never disappears. Score slate, several physical locker doors, bench value/form/wire leaves and archive folder can remain open together. Selected score pairs still open their actual two lockers, and the named roster jumps move within the cabinet. Desktop retains the two-column locker cabinet, broad foreground notebook and independent archive shelf. Phone retains the persistent score context, pair-specific roster jumps and the same local objects; its room guide is compact and expandable. At 200% root text, scenery relaxes and interiors expand naturally.

Lora gives the notebook and dated stories a measured editorial voice. DM Sans carries controls, prices, scores, rosters and dense data, with tabular numeric values. No italics, negative tracking or display text forced onto one line. Decorative station numbering and structural-review labels are removed. The compact Synthetic concept disclosure retains the complete warning and fixture date; incomplete/Pending, draft, missing/stale and source-period qualifiers stay in context.

All CSS paint and font literals are declared as local roles at the top of `room.css`; selectors consume those roles. Spacing, type sizes, weights, line widths, control target, shadows and motion timing use the same local role system. The previous scattered grayscale paint declarations were replaced rather than layered underneath a new skin. Physical edges belong to the room objects; source/evidence rows use quiet rules and spacing rather than nested outlined cards.

The original arena and game pixels were inspected before use. The arena is cropped to its lower court/crowd area, excluding its oversized title, and linked to Arcade as an actual court-view destination on the games crate. The free-throw screenshot remains the distinct actual game preview inside the lid, beside `/arcade/free-throw`. Neither image is used behind essential text. Approved local portraits identify all ten franchise faces and the dated player notes.

## Exact primary guidance read and applied

These were read as reference material. No linked scripts, installers, scaffold, hooks or remote code were executed.

| Primary reference | Selective reading and concrete application |
| --- | --- |
| [Hallmark direction.md](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), also read from its [raw source](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md) | “Yours,” content-led structure, whole-experience idea, pictures and specificity. The physical room governs working surfaces throughout, rather than becoming a decorated cover. The assigned walnut/sand/Lora direction remains authoritative over the source's generic palette/font bans. |
| [Hallmark redesign.md](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md), also read from its [raw source](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md) | Content/wiring preservation, change depth and screenshot inspection before judging. Existing IDs, handlers, states, URLs, history and facts remain; art is in a new folder. No structural reset or generic reader was introduced. |
| [Elaya redesign-existing-projects/SKILL.md](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), read through the [resolved raw source](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md) | Typography, surfaces, layout, interaction states, content, components and code-quality sections. Applied coherent font/spacing roles, mixed material proportions, useful depth, inline expansion, real people, explicit empty states and focus. Its prescribed palette/timing, universal reveal and floating-nav rules were not applied to this allocated room model. The initially tried repository-root SKILL path was 404; the exact `skills/redesign-existing-projects/` path above resolved. |
| [Emil design engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), read from [raw source](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md) | Animation decision framework, frequency/purpose, keyboard immediacy, easing and sub-300ms response. One occasional 180ms pointer door opening explains the door's physical origin. Routine controls, programmatic pair opening and keyboard actions remain immediate. |
| [Emil Apple design](https://www.ui-skills.com/skills/emilkowalski/apple-design) | Response, interruptibility, materials/depth, reduced motion, typography, foundations and wayfinding. Source and destination stay visible together; material hierarchy separates parallel work without a scrim. Real rem-based enlargement, named local Close, pair mapping and Back paths remain. No Apple branding or gesture library was added. |

## Fonts and local assets

- DM Sans: `/qa/homepage-structures/assets/fonts/dmsans/DMSans[opsz,wght].ttf`.
- Lora: `/qa/homepage-structures/assets/fonts/lora/Lora[wght].ttf`.
- Both were selected from the authorized local OFL catalog. Actual SHA-256 hashes matched the catalog: DM Sans `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d`; Lora `822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7`. Both fonts loaded in Chromium. No font download/install was performed.
- Arena: `/public/courtside/arena.jpg`; game preview: `/public/arcade/free-throw-preview.jpg`; face/editorial portraits: supplied `/public/courtside/portraits/` paths. No asset bytes were edited.

## Preserved information and state model

`body.dataset.studyReady='07'` and the eight `goatStudy` IDs are unchanged: `room`, `week`, `locker`, `league`, `scout`, `press`, `games`, `workroom`. Hook activation selects deterministic real disclosure combinations. Local interiors retain their `data-scroll-pane` names for full interior evidence: saved-slate, team-lockers, roster-values, scouting/public-scout, team-wire, archive and standings. Whole-page images show the bounded windows; scroll those actual interiors to inspect every row.

The five AI returns retain their actual away choice 35%, other 65%, separate confidence 20%, saved timestamps/model/prompt/null input/evidence. All 24 member values, coverage/time/basis, top three, rank, news/moves and distinct form/completed-week guides remain. Ten teams/faces, 228 unique roster references with position/NBA, search/sort and full standings remain. All supplied product destinations are retained, including member team/roster, stock board, trade analyzer, free throw, history and both dated archive routes. The known conflicting `home.edition.game` remains unused; coherent archive W41 1/5 and W40 5/7 records supply the dated narratives. No current result, history line or Power rank was fabricated.

Public mode renders no member valuation, team wire, personal guide or `/team` action. Public scouting uses dated editorial. Source selection reasons and dates remain available locally. Minor interface copy was tightened: room title is “The clubhouse,” score title is “Week 3,” locker title is “The ten franchises,” archive title is “Weekly editions,” and structural tags are gone. Editorial words/statistics are unchanged. Technical editorial role labels moved into their selection/source disclosures to reduce visible tag clutter.

## Motion and capture path

Only direct pointer opening of an individual locker runs a 180ms translation/opacity change on that door's already-visible interior. It starts at the physical door, opens content immediately, never blocks input and cancels on close/reopen, hidden-page or a live reduced-motion change. Keyboard opening has no animation. CSS also forces a still interior under reduced motion. No global entrance, autonomous timer, loop, scroll reveal, score tween or animation dependency exists.

`motion-demo.json` contains literal `desktop` and `phone` step arrays using `action`, `selector` and `waitMs`. The desktop path has seven steps and the phone path eight; waits are 100–240ms. Both were actually executed. They open a real pair, close/reopen one physical door, work concurrently at the bench and shelf, then put the archive folder back. The equivalent keyboard path focuses a door summary, presses Enter and uses Escape; content and focus match the pointer result without motion.

## Actual checks

Installed Playwright with `/usr/bin/chromium`, local root-owned server on port 4207:

- `node --check room.js` passed.
- **288 state/render combinations:** eight states × 1440/390/320 × normal/200% root text × member/public × AI ready/stale/missing. No horizontal page overflow, zero-height room station, page JS error or failed local asset response.
- Content checks: five saved AI rows; 24 member value rows; ten physical doors; 228 player references; no duplicate DOM IDs. Font loading and font-file hashes passed. Public missing-state check found no member value leaf, wire or team action.
- Actual score→two-locker comparison, named second-roster jump, concurrent score/doors/value/archive, local Close and focus restoration passed at desktop and phone sizes. Closing the archive left both doors and member values open; phone final demo also kept the score slate open.
- Browser Back restored value-open/archive-closed; Forward restored both; room-action Back restored the preceding folder/date/disclosure combination. AJ Dybantsa search opened one actual roster; global standing sort began with `door-1`. Scrolling the full value roll reached Bruce Thornton / PG / $4.00 at its real bottom.
- Phone value Close returned its summary to approximately y=80, below the 52px sticky score context. Archive Close had the same clearance. Escape returned focus to the physical door summary.
- Pointer motion was observed running at 180ms. A live reduced-motion change canceled it after approximately 19ms, leaving zero active animations. Keyboard/reduced opening had zero active animations.
- Static audit: no hex paint literals outside root role declarations, no literal selector font families, no inline paint/font styling and no gradient.
- Inspected desktop room/concurrent-state and phone paired-locker images with actual loaded fonts and images. Checked the original arena/game pixels before choosing crops.

Representative computed, opaque text/background contrast pairs were measured using WCAG relative luminance: header **13.15:1**, score qualifier **8.35:1**, cream-plane muted text **at least 6.47:1**, copper control **5.87:1**, wood caption **4.80:1**, closed-door text **10.78:1**, selected archive folder **14.89:1**, page caption after correction **4.63:1**. The room caption's first measured 4.48:1 pair was corrected through the shared muted role. SVG wall background was measured from the actual wall fill role; essential headings remain over that opaque plane. This is a representative pair audit, not universal accessibility certification.

### Targeted guide contrast correction after root audit

The phone “Move around the room” summary used copper `rgb(151,76,41)` over actual sand `rgb(226,207,173)`, approximately 4.07:1. Added the semantic `--guide-link:#854323` role and used it for that summary and the room-route link hover. Its rendered `rgb(133,67,35)` on the same sand now measures **4.87:1**. No structure, copy, behavior, other palette role or locker foreground changed.

Targeted Chromium checks at 390 and 320 CSS px, each at normal/200% root text, confirmed the new 14px/28px guide text, no page overflow, a target height of at least 44px, Enter opening and Escape closing. Broad state tests were not repeated for this paint-only correction.

The six locker flags were checked against actual rendered pixels rather than a transparent element's nearest CSS ancestor. Their backdrop is the original SVG `.room-set .back-wall`, whose CSS fill is `var(--walnut)`, **rgb(117,77,53)**. In 30 screenshot text-region samples—six labels × 390/320 at normal/200%, plus desktop 1440 normal—the dominant background pixel matched that walnut exactly. The locker caption and result count use sand **rgb(226,207,173)** at **4.80:1**; the heading, explanatory note, search label and sort label use cream **rgb(255,241,216)** at **6.56:1**. Transparent element backgrounds resolve visually to this SVG wall, not the body sand. Their existing light foregrounds are retained. Temporary native-pixel evidence and sample metadata are in `/tmp/07-targeted-contrast.json` and its named `/tmp/07-target-*.png` screenshots; root owns the new formal captures.

### Targeted undo-boundary focus correction

The confirmed sequence—default room → score-wall comparison → focus Undo → Enter—previously disabled the focused Undo button at the initial boundary, leaving focus on BODY. Only `room.js` and this record changed for the correction. Each local room action now retains its originating control selector in a WeakMap keyed by the existing in-memory snapshot; serialized room history remains exactly `game`, `edition`, `comparison`, `open`. When a focused Undo is about to disable, focus moves first to the undone action's restored enabled control. A control inside a now-closed disclosure resolves to that disclosure's visible summary; the score-wall comparison button is the stable fallback. Ordinary actions, initial loads and API activation receive no new focus transfer. The same focused-button boundary protection applies to browser Back.

Targeted Chromium verification at **1440×1000 and 390×844**, normal and reduced motion, with pointer and keyboard comparison activation: **eight exact reproductions passed**. After Enter, both lockers were closed, Undo was disabled, and the active element was the enabled score-wall comparison trigger. Page scroll remained **0 → 0** in every exact reproduction. The trigger remained visibly within each viewport.

At both widths, browser Back with Undo focused returned to that comparison trigger. Two-action undo preserved focus on enabled Undo after the first step, then returned to the original value-leaf summary at the disabled boundary. Undoing a comparison from an already-open workroom retained the score slate, value receipt and archive folder while closing the pair's lockers. Ordinary load and hook activation retained BODY focus rather than receiving a new automatic focus target. Zero page JS errors; `node --check room.js` passed. No broad art/layout tests were repeated for this focus-only change.

Prior JS hash was verified as `f8f75207345e13ae53b89804b10588829189ca4c231988391b74a76d55ad2b44`. CSS remains byte-identical at `b5026b6748414ee8793c4d3f0007cbc2aea2b72e03a666fe9d467d77d80c0002`, including the guide contrast correction. No structure, content, existing snapshot rendering, API state, motion, CSS or earlier-study file was changed. Root owns the replacement captures and independent keyboard recheck.

## Remaining limits / freeze

Physical-device and screen-reader testing, every possible contrast/hover pair, and execution of the existing product destinations remain unverified. These links point to supplied routes; the static concept server does not implement those applications. Interior scroll positions and search/sort filters are not undo snapshots, as documented in the approved structure. Independent art review and final user selection remain pending.

Files are frozen for root capture: `index.html`, `room.css`, `room.js`, `motion-demo.json`, `ART.md`. No Git, remote write, shared/root infrastructure, production, Muse or earlier-study edit was performed.
