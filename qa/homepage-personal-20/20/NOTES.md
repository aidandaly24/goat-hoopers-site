# 20 — Discovery source log

Built and frozen for coordinator capture. The accepted design is the open personal action index with the right-hand route rail in PLAN.md; the earlier temporal architecture was replaced before coding. This author inspected no peer source and no previous prototype. The explicit independent QA direction takes precedence over production visual defaults.

## Assigned primary references actually read

### Elaya Design — Redesign Existing Projects

Assigned URL: <https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md>

Opened the exact GitHub file and then its raw primary document: <https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md>. **Partial read:** Design values introduction; How this works; Design audit sections Typography, Color and surfaces, Layout, Interactivity and states, Content, Component patterns, Iconography and imagery, Code quality and Strategic omissions; Fix priority; Rules; Design values through the icon specification. The trailing motion material and any linked external material were not read. No index was counted as a source.

**Concrete application:** choose open, differently proportioned content groups instead of equal cards; keep scope beside numbers; give Home a current-location state; add Back and focus restoration to local inspections; make every action lead somewhere useful. These principles changed the architecture and interaction contract. The brief explicitly permits independent typography and values, so the reference's fixed font/color list, hero gradient and blanket motion prescriptions are not adopted. No installation or reference script was run.

### Jakub Krehel — better-colors

Assigned and successfully opened URL: <https://www.ui-skills.com/skills/jakubkrehel/better-colors>.

**Read the complete inline skill body:** Colors; Match the project's color system; A system is ramps, not colors; Every step has a job; primitive/semantic naming; token roles; hue consistency; color meaning; primary action emphasis; rendered-pair measurement; gradient interpolation; Before you finish; Reporting. Linked playbooks and repository subfiles were not read.

**Concrete application:** one semantic action accent has a consistent job across the complete site. Only the persona's main inspection action receives the strongest fill; adjacent team/source exits remain readable links. Availability is stated in words. Period, secondary copy and boundaries get separate role tokens. Future contrast evidence must use the actual foreground/background pair. This source changed control hierarchy and the planned measurement method; no contrast result or final palette is asserted at discovery stage.

## Actual product and fixture applications

- `src/app/page.tsx`: real membership is request-private and server-resolved; the labelled demo selector is isolated from that contract. The production page has no reason to generate AI on render, and this QA page will not do so.
- `CourtsideHome.tsx`: the product offers matchup, quote, evidence, AI, directory and tool access even without a weekly edition. The independent homepage keeps that functional completeness through substantial open action branches; dates qualify facts within those branches.
- `domain/personalized-home.ts` and `data/home-viewer.ts`: null coverage, unavailable membership, matched saved AI and recorded-only history are meaningful states. The plan never turns them into numeric zero, a guessed team or a manufactured chart.
- `siteDestinations.ts` and PRODUCT-INVENTORY: retain every actual route with a useful hierarchy and label production exits. No invented Privacy, newsletter or notification destination.
- Full `fixture.json`: used the two different opponents and rosters, all five versus three supplied evidence rows, six exact missing-quote names, correct 24 / 24 and 16 / 22 coverage, the saved model timestamp and confidence, and the NeuralNets previous-manager qualification. No current real-world NBA labels or unsupported game counts were added.
- `AGENTS.md`, relevant `ARCHITECTURE.md` and DESIGN.md sections: preserve data/access ownership, partial-data usefulness, dated historical context, approved assets, readable keyboard navigation and evidence boundaries. No production source changes are proposed.
- Existing font catalog and local OFL headers: The implemented page loads only authorized local Space Grotesk (SIL OFL 1.1); FontTools confirmed `tnum` and `lnum`. The installed DejaVu Sans system face is the deliberate reading/control stack, with large clear counters at 17px reading size and 13px route entries. It also supplies the external-link arrow glyph. Broad Space Grotesk handles mixed-case headings, names and tabular numeric work. No condensed face, DM Sans, Georgia, Lora or IBM Plex numeric role. No font download.

## Final implementation and bounded verification

Files: `index.html`, `style.css`, `app.js`; data-only import from `../fixture.js`. No presentation import. The exact supplied GOAT logo is preserved. The approved free-throw preview appears once. The page uses no live/API/backend/storage request.

Preview: `http://127.0.0.1:4207/qa/homepage-personal-20/20/` with `?persona=reaves`, `?persona=neural` or `?persona=guest`; default Reaves. `?stage=structure` neutralizes colors/images while preserving geometry. Ready selector: `html[data-personal-study-ready="20"]`. Persona selector: `html[data-persona="reaves|neural|guest"]`. Demo control is a native radio fieldset; labels wrap under text enlargement.

The right rail is 240px at 1440 and 208px at 1120, in normal document flow with optional sticky positioning. It has no clipped internal reader. The main action headings hang beside their substantive content and use unequal widths/indents. At enlarged text, a main-container query stacks each branch so the content grows instead of becoming very narrow columns. It remains an open reading page before any inspection.

Run: `node qa/homepage-personal-20/20/verify.cjs` from the repository root. This uses the already-installed Playwright package and `/usr/bin/chromium`; the initially attempted bundled Playwright executable was absent, so system Chromium was used without installation. `verification.json` records the final successful run.

| Check | Exact method and result |
| --- | --- |
| Three personas, two desktop widths | Headless system Chromium at 1440×1000 and 1120×1000, waiting for the ready selector. All six states passed; no horizontal document overflow. Actual member identity/current opponent and public guest context were in the first fold. |
| Enlarged text | Set root font size to 200% (computed 32px), separately from viewport reflow. All six states passed with no horizontal overflow. Branches changed to block flow and the page grew vertically. Native persona labels wrap. This is CSS text enlargement, not a physical-device or browser-zoom claim. |
| Journey 1 | Reaves `#review-evidence` → `#detail-player-1444` → browser Back → `#back-home`. The exact 42.5 completed-week sample points remained visible. Focus returned first to `#detail-player-1444`, then `#review-evidence`. |
| Journey 2 | Neural `#open-roster` → `#roster-player-4866` (AJ Dybantsa) → browser Back → `#back-home`. Unpriced was preserved, without 0.00. Both focus targets restored. |
| Journey 3 | Neural `#inspect-matchup` → `#match-team-7-detail` → browser Back → `#back-home`. Unavailable Neural score and recorded papichooter zero stayed distinct; focus returned to the opponent link, then the inspection trigger. |
| Guest public inspection | `#team-8-club` opens NeuralNets' public facts with the visible previous-manager/QBs Gremlins qualification and no private roster. Guest home has five games and ten clubs, with neither member's modeled subtotal. |
| Keyboard | Tab reveals `.skip` at top 16px; Enter activates the skip route. Enter on `#review-evidence` opens the local inspection, and browser Back restores that trigger with a computed 3px solid focus outline. Native links/fieldsets/disclosures remain keyboard controls. |
| Demo/source/navigation | 14 existing-site exits plus local Home are discoverable. Native guest radio changes query and persona while preserving `stage=structure`. `.demo-tag` opens `#sources`. No external requests occurred during local checks. Actual-site destinations were not visited. |
| Structure | Same Reaves `#home-view` text and exact bounding box before/after `stage=structure` at 1440. |
| Runtime | JS syntax check passed. No page errors in the final browser run. No live API/auth/AI/market calls. |

Final rendered solid-color pairs were measured from computed Chromium styles: body/canvas 17.25:1; scope text/canvas 6.74:1; primary action text/fill 6.70:1; rail text/fill 13.87:1. This reports those four inspected pairs only, not a whole-site accessibility certification.

Local diagnostic full-page images for Reaves 1440, Neural 1440 and Guest 1120 were visually inspected. An enlarged-text viewport was also inspected; its clipped native select label was replaced with wrapping radio labels, and the final bounded checks reran successfully. Root owns final capture and packaging; diagnostic images remain in `/tmp`, outside the deliverable.

## Limits and freeze

No production route, actual device, screen-reader session, browser zoom, external destination behavior, real login, game interaction or backend was verified. No production build was needed for these self-contained static files. No peer/shared/fixture/production edits, dependency install, git action or publication. No blockers remain in the owned static prototype. Runtime files are frozen after the final recorded checks; coordinator owns captures and packaging.
