# Sky calendar — full art 15

Frozen first art submission at `qa/homepage-structures/polished/15/`. Root's complete state evidence, independent visual inspection and Muse review remain pending. This is a QA concept, not a released product or final user approval.

Files: `index.html`, `style.css`, `app.js`, `ART.md`. The corrected source under `structural-revisions/15/`, the original `wireframes/15/`, earlier images, shared assets/data, root infrastructure and production files remain untouched.

## Direction and contract

The homepage answers: **What belongs to this week, what came earlier, and what can I act on for my team?** Its primary action remains selecting a supplied source period and opening an item in the agenda attached to that calendar lane.

The sky field surrounds one working calendar. DM Sans date numerals lead the actual source periods. Ink carries names and readable working information. Rust marks the selected source and its agenda connection. Calendar boundaries describe actual date columns and matchup lanes; they are not generic section decoration. There is no hero illustration, court ornament, decorative numbered sequence, staged reveal, repeated card dashboard or invented game schedule.

Desktop retains the source-period matrix: two dated all-day editorial events, a visibly labelled unsupplied gap, the member's completed Week 2 source period, and five current Week 3 matchup lanes. Selecting an event opens its agenda immediately below its source lane. Team lookup, the member notebook and tools remain complete separate working views.

Phone retains a deliberate selected-period operation. The date/week selector, Agenda / Calendar control and strong selected date anchor stay together. Agenda shows that period's actionable entries; Calendar exposes that source column and its lanes. Toggling preserves the selected period and open item. It does not turn the homepage into a stack of independent dashboard cards.

## Typography, paint and spacing

The only authored typeface is the local variable **DM Sans**, served through the `Sky DM Sans` face declaration from `../../assets/fonts/dmsans/DMSans[opsz,wght].ttf`. It has SIL Open Font License 1.1 provenance in the approved catalog. The bytes were verified against that catalog: SHA-256 `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d`. No font download or installation was performed. System sans is the fallback.

Local `:root` roles govern the whole study:

| Role family | Application |
| --- | --- |
| `--font-body`, `--font-label`, `--font-small` | 16px primary reading and controls at the default root; secondary source metadata uses the smaller role. |
| `--font-page`, `--font-heading`, `--font-subheading` | Plain sentence-case working hierarchy with natural wrapping. No tracking adjustment or italic display accents. |
| `--font-date`, `--font-date-month`, `--font-date-end-month` | Actual supplied date numerals and month context; tabular numbers. |
| `--font-score`, `--font-value`, `--font-rank` | Scores, modeled values and actual standings ranks. |
| `--weight-normal`, `--weight-medium`, `--weight-strong`, `--weight-date` | Fine hierarchy without decorative ultra-bold labels. |
| `--paint-canvas` `#cce8f6` | Sky blue page and the explicitly unsupplied gap. |
| `--paint-ink` `#132e43`, `--paint-secondary` `#3c586b` | Primary and secondary reading. |
| `--paint-reading` `#ffffff`, `--paint-current` `#e2f2fb` | Calendar/agenda reading surface and current source field. |
| `--paint-accent` / `--paint-focus` `#a93e20`, `--paint-selected` `#ffe9da` | Rust selection, visible focus and selected event. Text and shape remain alongside color. |
| Control/grid/boundary/probability paint roles | Actual controls, schedule geometry and the labelled saved probability encoding. |
| `--space-tiny` through `--space-major`, control/page spacing roles | One local rhythm for source items, reader groups, calendar cells, controls and page gutters. |

Literal colors live in role declarations. Component font choices and principal spacing consume these local roles. No shared template or production token changed. The approved logo and ten roster portraits remain local and loaded; portraits have a contained crop and their identity is also printed as text.

## Actual dates and evidence

The large date treatment is built from supplied source bounds, not a newly constructed season calendar:

- W40 editorial: Sep 28–Oct 4, 2026. W41 editorial: Oct 5–11, 2026. Both remain unpublished draft samples.
- Completed Week 2: Nov 2 to Nov 9, end exclusive. The end-exclusive qualification remains visible.
- Current Week 3: **as of Nov 12**, the supplied check date. Its start/end bounds remain explicitly unavailable. The numeral 12 is an as-of marker, never a game date or inferred due event.
- The editorial gap and empty matchup cells state that the source is unsupplied. Column widths are explicitly not elapsed time.

The existing `data.archive` records continue to provide coherent dated narratives, avoiding the preserved `home.edition` team-ID/narrative conflict. Upcoming W41 uses teams 1/5; the historical final W40 uses 5/7 and 326.0–251.5. Current Week 3 remains independent from those dated narratives.

All five saved AI returns retain their actual choice, both probabilities, confidence and evidence/provenance disclosure. The first returned away choice remains Ware the Hoes At? at 35%, with the other side 65% and independent confidence 20%. Known 0.0 remains different from Pending; current matchups remain incomplete. Stale/missing modes assert no current probabilities. Recorded history and Lineup Power remain unavailable rather than invented.

All information families from the [accepted structure map](../../structural-revisions/15/STRUCTURE.md) remain reachable: ten teams/faces, all 228 player references, all 24 member roster values, complete supplied scouting and completed-week rows, dated news/moves, three editorial spotlights with exact stats/opinion/period/source qualifications, both archives, all standings and useful routes/search/sort. Internal benchmark identifiers moved out of visible product copy; provenance remains expandable.

## Primary guidance actually read

Read selectively as source guidance, not installed or executed as global skills. Their conflicting template, palette, fixed spacing, tracking, texture, blanket entrance and script requirements yield to the explicit user brief.

| Exact primary reference | Specific application |
| --- | --- |
| [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), read through its [raw source](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md) | Let one subject-specific idea determine the whole experience. The real source calendar governs entry, evidence readers and phone operation; type and color carry the working object without a decorative court image or common marketing anatomy. |
| [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md), read through its [raw source](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md) | Preserve facts and wiring while changing the visual system. The corrected geometry, every route, native control, history and state hook were carried over and then checked. |
| [Elaya redesign](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md), read through its [raw source](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md) | Diagnose typography, excessive repeated boxes, symmetry and weak state distinctions. Applied a unified local font, tabular values, larger dates and an attached contextual reader. Kept the unboxed directory/notebook rather than adding a permanent dashboard sidebar. |
| [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt) | Adapt the operation to the screen rather than shrink a desktop matrix. Phone selects a source period and explicitly switches Agenda/Calendar, preserving context and touch access. |
| [Addy Osmani accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility) | Native named controls, keyboard operation, visible unobscured focus, color plus text/state shape, reflow checks and bounded evidence. Tests are reported as Chromium evidence, without claiming screen-reader or universal conformance. |

The art brief, only allocation entry 15, the supplied craft notes, own corrected source and existing project design/architecture guidance were used. No other art proposal was inspected before this submission. No installer, downloaded script, external runtime import, remote service, repository operation or production edit was used. Browsing was limited to the explicitly requested primary guidance.

## Interaction and motion

Frequent controls update immediately. This concept deliberately has no scene motion or authored animation. A changed event background, selected date rule and attached reader provide sufficient state feedback without delaying access or animating a long schedule.

Representative pointer path: select the current matchup in its actual calendar lane → selected event remains marked → the adjacent agenda opens with both scores, the saved pick and direct roster actions → Close returns to the source event. Representative keyboard path: focus the W41 editorial event → Enter opens and focuses its attached heading → Escape returns to the same event. Phone Calendar → choose W41 → Agenda preserves that source period and reader context. Back/Forward restores the actual prior item/period/view.

Reduced motion has the same immediate, complete state path. Live reduced-motion emulation reported zero document animations; no timers, score tweening, observer reveals or autonomous loops exist.

## Final local checks

Preinstalled Chromium/Playwright against root's local port 4207 server. These are synthetic local-fixture checks.

- JavaScript syntax passed.
- **252 representative render checks:** 8 member / 6 public API states × ready/stale/missing AI × 1440/390/320 CSS px × 100%/200% root text. No full-page horizontal overflow, browser page errors or failed requests.
- `studyReady='15'` and the existing 8/6-state `window.goatStudy` API remain. Original state IDs are unchanged. `sourcePeriod` is additionally exposed as a body dataset for inspection.
- Route inventory union across both modes and all states: **276 unique hrefs before, 276 after; none missing or added.**
- Ten team rows, 228 roster references, ten loaded portraits and 24 member values verified. Local font loading passed. All rendered images had nonzero intrinsic width. Search `Lillard` returned one team; alphabetical sort began with Huff n’ Puff.
- Every actual matchup agenda retained choice/35%/65%/20% and incomplete status. The first retained known 0.0 versus Pending. Member/public and stale/missing states were exercised in the full matrix above.
- At 390px: actual calendar/agenda toggle, W41 selection, reader opening, Back/Forward, Close and origin focus passed. Dated reader retained 27.7 PPG Jokić, 26.9 PPG Embiid, BYU college-period stats, draft state and the coherent historical team pairing.
- At 1440px: native event focus + Enter opened the archive agenda and focused its heading; Escape returned to that event. Notebook → current matchup → Close returned to the notebook action.
- Expanded league rosters, expanded 24-value disclosure, expanded concept provenance and expanded destination menu stayed within 320px at 200% root text. Menu Escape returned focus to All destinations.
- Reduced-motion preference retained the actual matchup reader and reported zero document animations. Public had no member notebook and its Home URL retained `view=public&ai=missing`.
- Desktop default/attached-agenda and phone calendar/attached-agenda renders were visually inspected locally. Root owns final evidence captures and review.

Opaque role pairs were checked using sRGB relative luminance; body and current-field colors were also confirmed from rendered computed styles:

| Rendered role pair | Contrast |
| --- | ---: |
| Ink on sky canvas | 10.96:1 |
| Secondary reading on sky | 5.87:1 |
| Secondary reading on current field | 6.54:1 |
| Rust on selected event | 5.28:1 |
| Rust focus on sky | 4.84:1 |
| Reading surface text on ink selected phone control | 14.00:1 |
| Control boundary on reading surface | 4.73:1 |

Limits: no physical-device, Safari or screen-reader pass; no production route/auth/provider validation; connected links were preserved but their external destination pages were not opened during UI testing. This is the supplied sparse source calendar, not a complete season schedule. No blocking action was denied, pending or uncertain; independent art review remains pending.
