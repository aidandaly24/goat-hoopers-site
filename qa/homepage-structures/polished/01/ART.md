# 01 — Open almanac

QA-only full-art submission, 2026-10-29. Frozen for root capture and independent audit. The independent corrected-structure gate was reported complete before this work started. This is not production integration or final user acceptance.

## Idea and art decisions

The league is an open almanac: people, incomplete scores, saved choices and dated opinions share one reading canvas. Typography and contextual notes carry the hierarchy. The corrected structure remains recognizable throughout; no separate marketing hero, panel system or artificial dashboard was introduced.

- **Ground and ink:** pure white `--color-paper`, dark `--color-ink`, readable gray `--color-muted`; vermilion `--color-accent` identifies reading links, disclosure markers, the compact synthetic label and returned-choice annotation. Scores and prices do not turn red to imply loss or risk. Color does not replace status words.
- **Reading:** local variable Lora, upright 400 for prose and 500 for headings. Narrative passages use 1.125rem/1.65 or 1.5rem/1.6 for a short lead. Reading measure is capped at 65ch where the composition permits. The opening headline now states the actual fixture week: “Week 3 is unfinished.”
- **Operations:** local variable DM Sans for navigation, source notes, managers, controls, roster values, scores and tables. Numeric information uses tabular numerals. Weights 400/500/600 distinguish secondary copy, labels and choices. No italic emphasis or negative tracking is authored.
- **Portraits:** existing approved head-and-shoulder images remain grayscale and unframed. Named dated stories receive deliberate 8rem crops, with 9rem for the lead, contained to retain the supplied shoulders/head. The phone presents the image before the named take rather than squeezing its heading beside a float. The reachable ten-player foldout retains small named identity references. No court image or photo ornament was added to the opening.
- **Desktop:** headline, open matchup sentence, marginal personal quote and unequal editorial columns retain the continuous spread. The two navigations share a compact open contents passage; comparison and complete provenance sit on one line when space permits.
- **Phone:** one native `Read or explore` disclosure contains contents, every destination, edition comparison and provenance. The compact `Synthetic concept` remains visible. Team identity and score use separate lines; the roll call starts folded, search stays nearby, and standings retain the corrected labelled phone composition. The normal 390 header ends at 172.42px and its headline starts at 234.02px.

Semantic paint, font, size, measure and spacing roles live in this study's stylesheet. Literal colors are confined to those role declarations; font-family literals occur only in `@font-face` registration and role declarations. Selectors consume roles. No common stylesheet, layout template, external module, new dependency, texture, gradient, clipping repair or opacity effect was added.

## Sources actually read

Read the actual complete primary documents via read-only web during the authorized preparation step, not just reference names:

1. [Hallmark custom direction](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md): the subject-specific idea must run through the whole experience; typography may carry a body of words. Applied to the complete open canvas, source notes, roster and archive, not only the opening.
2. [Hallmark redesign](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md): preserve content and wiring, compare the resulting page with the source, distinguish app work from marketing composition. Applied by retaining all IDs, native controls, routes, facts and capture hooks and comparing their browser-rendered signatures.
3. [Elaya redesign](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md): diagnose symmetry, use unequal measures and inline expansion, respect reading width and numeric alignment, retain existing stack and functional states. Applied to the unequal editorial flow, direct source notes and tabular numeric operations.

Also read local `ART-BRIEF.md`, only allocation `01` in `art-allocation.json`, the font catalog and the project/reference material recorded in `STRUCTURE.md`. This study's explicit brief supplies Lora/DM Sans, white/ink/vermilion, normal tracking, native navigation and no reveal effects; it takes precedence over conflicting preset palettes/fonts/timing or scaffold suggestions in reference documents. No downloaded scripts were executed or installed. No other author's design was inspected.

### Font provenance

Only the two existing local OFL font files are loaded, with `font-display: swap`; no remote font request:

| Role | File | SHA-256 verified against catalog |
| --- | --- | --- |
| Reading/display | `../../assets/fonts/lora/Lora[wght].ttf` | `822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7` |
| Operations | `../../assets/fonts/dmsans/DMSans[opsz,wght].ttf` | `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d` |

## Content and interaction preservation

All fixtures still come from `../../data.js`. The November date is explicitly a fixture timestamp. October editorial is the coherent dated archive draft, separate from current synthetic Week 3. All requested families remain as mapped in the copied structural record.

Browser signature comparison against `structural-revisions/01` confirmed identical IDs, destination lists (normalizing the QA folder for the edition-comparison URL), state IDs, 24 member value IDs, all 228 directory reference IDs, 10 representative faces, 5 ready model rows and 10 standing rows. The public render omits the personal passage. Stale and missing AI queries retain their visible qualifiers and unavailable behavior. A known 0.0 remains different from Pending. First model choice remains the returned away team at 35%, other side 65%, confidence separately 20%. No history line or power ranking was invented.

Small UI wording changes for this art pass:

| Before | After and reason |
| --- | --- |
| “The week is unfinished.” plus repeated current/week eyebrow | “Week 3 is unfinished.” plus “2026 season”: specific period without duplicate week metadata |
| “current synthetic record” after every manager | “Current record: 1–0”: global synthetic concept and complete provenance stay visible/reachable |
| “Read model note 1…5” | “Model details”: all distinct control IDs and inline context remain; no decorative numbering |
| “Your roster in the margin.” | “Your roster.”: remove implementation/composition language from the product |
| Repeated synthetic tags on three member guide headings | One clear global label and the retained explicit synthetic recap qualification, with actual period headings |
| “The continuous spread” masthead note | “The league almanac”: named art treatment; hidden on phones |
| “GOAT Hoopers · Structure study 01.” footer | “GOAT Hoopers. Open almanac.”; complete fixture warning remains |

No data value, supplied quote, source URL, form field, option value, route, disclosure ID or hook was removed.

## Motion thesis and representative path

**No authored scene motion.** This is a frequently used reading/reference surface; native expansion already connects the additional content to its origin. No animation is needed to explain the relationship, and typography is never delayed or revealed in stages. No timers, observers, smooth-scroll override, score tween, loop or animation dependency exists.

Representative capture path: pointer-click `#value-fold > summary` to reveal all 24 member values directly below their subtotal; click again to close. Keyboard focus on that same summary, then Enter, produces the same immediate open/close state and leaves focus at the trigger. `prefers-reduced-motion: reduce` uses the identical view, data, focus and controls. Live preference changes were exercised; there are zero running authored animations in either mode. Equivalent source-note and archive paths stay native. `goatStudy.activate('roster')` selects the actual expanded content for root capture.

## Actual checks

Installed headless Chromium through Playwright against root's existing port 4207 server. Fonts were awaited before layout checks. This is browser-fixture evidence, not a real Next route, physical-device or screen-reader pass.

- **162 combinations:** member/public/member-stale/member-missing × 1440/390/320 CSS px × normal/`html { font-size: 200% !important }` × every available state. Zero horizontal document overflow and zero page errors. The 200% method computes root text at 32px; no `overflow-x: hidden/clip` masks content.
- Expanded contents, full provenance and ten-player roll call together also fit at 390 and 320 with 200% root text in both editions.
- Both local font faces reported loaded; computed heading family is Almanac Lora and body/operations family Almanac DM Sans. Normal body is 16px. Desktop opening/editorial and normal/enlarged phone openings were visually inspected from actual browser renders.
- Keyboard Enter opens contents, provenance and the first model's source note. Its returned choice, model/prompt, timestamp, unavailable input snapshot/baseline and supplied evidence remained readable. Actual anchor activation set `#model-notes`; native browser Back returned the empty hash.
- Pointer and keyboard both opened the full member values. `Embiid` returned one matching club, an unmatched phrase produced the specific empty state, and PF sort placed club 1 first. Search count retains `aria-live="polite"`.
- All rendered phone links, summaries, inputs, selects and buttons in the populated interaction check were at least 44px high. Visible keyboard outline computed to the vermilion focus role. No hover-only path exists.
- All **14 image instances** loaded after visiting lazy assets: logo, 3 named editorial portraits and 10 league identities. No new image bytes or remote image request was introduced.
- Paint-role calculations on the actual solid white background: ink **17.58:1**, muted **7.46:1**, vermilion text/focus **5.97:1**. White background and role values were checked in source and browser rendering. This bounded text-role result is not a universal contrast/accessibility audit.
- Source inspection found no negative tracking, italic emphasis, gradient, opacity effect or horizontal-overflow suppression. All hex colors are in semantic role declarations. Earlier source hashes were preserved; no file in `wireframes/01` or `structural-revisions/01` was edited.

No Git, root infrastructure, shared data, production, Muse lane, other author's source, install, sub-agent, external asset or remote write was used. Primary references were read in the preparation step; no external call was needed during implementation.

## Deliverables and remaining limits

Own files only: `index.html`, `style.css`, `app.js`, historical `STRUCTURE.md` and this `ART.md` under `polished/01/`.

`document.body.dataset.studyReady='01'` and the existing `window.goatStudy` API remain. Root owns independent capture, comparison and critique. Production route content/Next history, actual authentication/live data, physical devices, browser zoom, assistive technology and Arcade gameplay are not verified here. Null transport/unused aggregate fields retain the stated structural abridgements. No release or final visual acceptance is claimed.
