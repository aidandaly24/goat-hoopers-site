# League constellation — full-art freeze

Own study 12 only. Built from the corrected `structural-revisions/12` source into `polished/12`. The first and corrected versions remain untouched. This is a review artifact, not final user approval or production integration.

## Direction and retained architecture

The allocated direction is obsidian, silver and cyan, with restrained local Orbitron display and readable DM Sans detail. The user question remains: “How do these teams and players relate, while I keep both sides open?”

Two linked team territories still own their independent context/roster/member fields. Their current matchup and saved AI remain on the shared bridge. Pinning a third team changes the geometry to three retained entities; it is labelled as comparison, not as another opponent in the game. Player tracing attaches a current-owner relationship without evicting existing contexts. Directory, five saved-pick edges and dated owner-attached stories retain the corrected reveal models.

The art is carried by legible names, useful portraits, open comparison space and restrained relationship/control color. Decorative ellipse arcs, section numbers, “structure/revised” labels and visible internal team IDs were removed. Meaningful standings ranks, dates, input roster IDs in provenance and source units remain. Human player names now carry their profile links on the outer teams; repeated generic “Player profile” actions were removed. UI labels were simplified; supplied editorial prose, opinions, statistics, dates and source qualifications are unchanged.

Phone keeps A / Connection / B / Pinned jumps among independently retained contexts, with full team names in the controls' accessible labels. A native league-mode select replaces the desktop mode rail. The active pair and team territory now precede the other-team choices; “Add a team to compare” jumps to the readable named portrait controls. Selecting an outer team brings its new context into view. No information depends on hover or dragging.

## Own semantic system

`style.css` declares local paint, font, type, spacing, target, portrait and feedback roles. The original stylesheet's scattered literal paints are replaced: no literal colors occur outside role declarations. Component font usages consume the two font roles. Padding/gaps use the local spacing scale. No negative tracking, italic accent, gradient, full outlined card stack, ambient orbit or microscopic sci-fi label is used.

Paint roles distinguish canvas, team territory, hover/input surfaces, reading/secondary ink, cyan action/relation, rules, control boundaries and focus. Cyan is an actionable or relational signal; it does not encode a winner or probability certainty. Territory backgrounds group independently retained entities without surrounding border boxes. Rules are limited to useful data-row boundaries and actual selected relationships; the pinned comparison connector is dashed.

Local fonts:

- Orbitron: `../../assets/fonts/orbitron/Orbitron[wght].ttf`, used for the short page title and compact numeric scores.
- DM Sans: `../../assets/fonts/dmsans/DMSans[opsz,wght].ttf`, used for team names, controls, all reading, metadata and Pending text.

Both files' local SHA-256 values match `assets/fonts/catalog.json`; the catalog records SIL OFL 1.1 provenance. No font download or installer was run. Font readiness is included in the `studyReady` signal. Approved local team-face portraits retain natural color with a deliberate contained, bottom-aligned crop; the white approved GOAT logo serves the dark canvas. No other imagery is added.

Rendered/computed paint checks: primary territory text 14.19:1, input text 12.95:1 and control boundary against input surface 4.45:1. Supporting role calculation: secondary territory text 9.02:1, cyan against canvas 12.38:1. These establish the measured combinations, not universal accessibility certification.

## Exact primary guidance read and applied

Primary documents were opened selectively during this work. These are reference studies, not installed/global skills; their blanket palettes, scripts, timing recipes or page templates do not override the assigned direction and preserved architecture.

| Exact reference | Applied decision |
| --- | --- |
| [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md) | The league's actual people and connections govern the entire workspace. Removed ornamental diagram material and generic section labels rather than adding a marketing anatomy. |
| [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md) | Kept the corrected content, control wiring, selectors, state hooks, focus/back behavior and destinations while changing the local art system. No adjacent source migration. |
| [Elaya redesign-existing-projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md) | Used its diagnosis of generic containers, weak control states and unclear labels. Territory grouping uses flat material and spacing; real names replace internal breadcrumbs. No prescribed gradient, grain, delayed reveal or external-image fallback. The repository-root SKILL URL returned 404; this linked skill path resolved and was read. |
| [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt) | Phone prioritizes the active comparison, retains every entity context and uses explicit native/jump controls. It does not shrink ten desktop labels into a diagram. Emulated browser evidence is identified separately from physical-device evidence. |
| [Emil design engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) | Applied the frequency/purpose gate: only occasional pointer pinning receives a short response. Keyboard, repeated field navigation, scores and content remain immediate. |
| [Emil Apple interaction guidance](https://www.ui-skills.com/skills/emilkowalski/apple-design) | Controls remain near their owning entity; pin feedback follows the causal action, stays interruptible and has an immediate reduced-motion equivalent. Focus/Back make the destination and return intelligible. |

The project's existing design references and `reference-notes/craft.md` were retained as context. No reference scripts, packages, copied markup, remote runtime modules or third-party assets were executed/imported.

## Content, states and input boundaries

Imports remain `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. Domain fixture data is unchanged. Content stays local to its owner:

- Current pair: both identities/managers/current records, Week 3 scores, known `0.0`, null `Pending` and incomplete status.
- Member-owned fields: standing/count/actions; modeled subtotal/basis/priced/unpriced coverage/time/rank; top three and all 24 values; form EMA FPPG versus completed-week recorded points/GP/period/coverage; news and moves. Public exposes none of those private fields or controls.
- League index: all ten teams/managers/current records/opponents, all 228 unique roster references with position/NBA, search/sort, prior-season record attribution and all ten rank/W/L/PF rows. PF remains `pointsFor / 100`.
- Five saved AI edges: first returned choice remains Ware the Hoes At? at 35%, opposing team 65%, independent confidence 20%. All returned probabilities, saved time/model/prompt/input/evidence remain reachable. Stale stays visibly stale; missing stays unavailable. Unsupplied metadata is not invented.
- Weekly archive: both dates/routes, coherent dated game, three exact spotlight statistics/opinions/periods/selection/source dates, happenings and sources. Current ownership is separate from dated statistics. Historical final remains 326.0–251.5.
- Actual Home, News, Stocks, History, Arcade/free throw, AI Decides, Teams, Transactions, trade analyzer, weekly and member destinations remain reachable. Synthetic provenance is compact in the header and complete in disclosures. Recorded value history and Power remain unavailable.

Known fixture conflict is handled as before: the conflicted `home.edition.game` is not asserted as a result. Dated content uses coherent `data.archive` W41 1/5 and W40 5/7; current Week 3 uses directory pairings. October draft editorial is not relabelled as a current Week 2 award.

The same eight member / six public capture states remain: `default`, `rosters`, `triad`, member-only `values` and `scouting`, `index`, `picks`, `editorial`. `window.goatStudy.activate` renders actual state; unknown IDs return false. Local team/pair/field selections are validated against the bounded directory, known pair range and member-owned field set. No generic detail consumer, live provider, new router, history rewrite or source-data correction is introduced.

Native entity disclosures preserve open state when another entity changes. Back from another mode restores the comparison. Removing a third team restores its face trigger; Escape folds only the focused entity and restores its roster trigger. A measured sticky-rail clearance preserves visible phone focus at enlarged root text.

## Motion path and actual evidence

`motion-demo.json` contains real desktop and phone paths, six steps each, with waits of 220ms. All selectors and the keyboard press were replayed successfully at normal and reduced motion.

Only a pointer-created third territory receives a 6px → 0 position cue, lasting 180ms with no opacity reveal or delayed content. Focus and content are committed first. Another render interrupts the cue; a live reduced-motion change cancels it. Keyboard pinning does not create an animation. There are no timers, autonomous loops, score tweens, scroll hijacks or entrance reveals. Idle animation count is zero.

Actual installed Playwright + `/usr/bin/chromium` checks against root's local 4207 server:

- **252 combinations:** eight member/six public states × ready/stale/missing AI × 1440/390/320 CSS px × 100%/200% root text. No document horizontal overflow, JavaScript errors or failed local responses.
- Both local fonts loaded, with matching local catalog hashes; sampled final images had no incomplete/zero-width assets.
- Independently opened paired rosters retained 24 and 27 rows. Pinning NeuralNets produced three entities while preserving both selected fields.
- Expanded all-24 member values remained open after changing the opponent's field. Tracing Damian Lillard showed PG/POR → Reaves Dropper without dropping the third context.
- Search `Lillard` returned one team/one reference; clearing showed all 228 references. All ten standings rows rendered. Returning from the index restored three contexts.
- Third-team removal restored `satellite-8` focus; Escape restored `roster-trigger-1`. At 320px/200% text, Team B's focus top remained below the measured sticky rail.
- Five AI edges retained the 35% returned choice / 65% alternative / 20% independent confidence contract. Three owner-attached spotlights and the second archive's historical score were checked.
- Public has six states and zero Values/Scouting/Wire controls; missing AI visibly says unavailable.
- Both motion paths: normal pointer pin created one 180ms animation; reduced pin created zero; idle count after each path was zero. Normal keyboard pin created zero. A live reduced-motion change cancelled the active cue.
- Semantic scan: zero color literals outside role declarations, no negative tracking; no dropped hrefs in source comparison. Relevant route destinations are retained.

Temporary final desktop, phone, third-team and editorial screenshots were used for bounded self-inspection. Root owns final capture infrastructure and delivery images.

## Limits and deliverables

No physical-device, Safari/Firefox, screen-reader, real authentication, live provider or production-route acceptance is claimed. Root-text enlargement is tested separately; it is not browser-zoom evidence. External destination pages remain their actual linked app routes, outside this isolated static preview. Existing corrected-stage bounds remain: deep player loaders, a connected historical-value producer and unused redundant/null DTO narration are not added.

Files: `index.html`, `style.css`, `app.js`, `motion-demo.json`, `ART.md`.

No blocker remains for root capture and independent full-art review. Only `polished/12/` was written. No Git, production, root infrastructure, Muse, shared source or earlier source was modified. No installs or subagents were used. External reads were limited to the requested primary guidance; no external runtime/service calls are added.
