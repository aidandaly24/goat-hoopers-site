# Sports programme — full-art study 03

Source-ready and frozen for root capture, independent critique and Muse review. This is a local QA proposal, not final user acceptance or a production change.

## Direction and retained structure

Own allocation 03 specifies deep navy, bright orange, snow, Barlow Condensed display and DM Sans reading. I started from my frozen `structural-revisions/03/` source. The full-width horizontal chapter viewport, different internal compositions, independent vertical chapter scroll, direct navigation, native touch movement, URL/history paths, inert exclusion and capture API remain.

The programme uses navy for the current score spread and historical archive. The saved decisions read on a snow sheet beside the score reader. My club is a broad value spread with orange-backed actual player anchors and a complete ledger. Scoutbook uses an orange form column, open completed-week evidence and a navy wire. The searchable index, dated editorial and destination register retain their different reading structures. This treatment follows the approved architecture across every chapter.

The phone keeps a deliberate bottom chapter picker between Previous/Next controls. Current chapter names replace decorative numbers. The masthead holds the actual GOAT mark and compact Synthetic concept disclosure; provenance and public/member comparison expand from that label. There is no added global menu, repeating card grid, decorative court, italic accent word, gradient or entrance reveal.

## Exact primary references read

Read 29 Oct 2026, as guidance within the authorized art brief. No reference installer, scaffold, linter or script was executed.

- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), including the [actual raw document](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md). Applied the principle that a specific idea must govern the complete experience. The programme treatment therefore follows the score reader, roster, notebook, index and archive rather than stopping at the opening screen.
- [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md), including the [actual raw document](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md). Applied preservation of content and wiring: facts, routes, data references, handlers and state hooks remain. The user-authorized art allocation governs this QA copy; no repository cleanup, Git operation or scaffold was inferred from the reference.
- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt). Applied task adaptation, retained functionality and explicit input testing. The phone keeps whole-chapter navigation with thumb-reachable controls, readable roster records and native swipe; it does not inherit the desktop masthead navigation.
- [Emil animate](https://www.ui-skills.com/skills/emilkowalski/animate). Applied the frequency/purpose gate, immediate keyboard behavior, transform-only movement, a short standard duration, interruption and live reduced-motion handling. One adjacent page turn explains side-by-side chapters; routine contextual reads do not animate.

The supplied [craft notes](../../reference-notes/craft.md), [art brief](../../ART-BRIEF.md), project design skill and earlier structural content contract remain the local context. No other author's art or layout was inspected.

## Type, paint and images

The local stylesheet declares semantic font, paint, spacing and motion roles. Selector declarations reference these roles; the final audit found zero literal paint/font values outside custom-property or font-face declarations. Inline data styling remains only the real probability width. No shared production tokens were changed.

| Role | Decision |
| --- | --- |
| Display | Local Barlow Condensed Regular, declared as Programme Display; actual regular weight, no synthetic italic/bold |
| Reading, controls and tabular figures | Local variable DM Sans, declared as Programme Reading; body and core metadata remain 16px at normal text size |
| Navy | `#10283f`; primary reading ink, programme masthead/rail, score and archive surfaces |
| Snow | `#f7fbff`; reading ground and text on navy |
| Bright orange | `#ff762f`; selected chapter, actual score status, player-anchor backgrounds, contextual rules |
| Dark orange ink | `#a4370d`; readable selected text/meter accents on snow |
| Reading-muted ink | `#526779` on snow; `#bacddb` on navy |
| Layout rhythm | Local inline/group/spread/gutter/phone spacing roles |
| Chapter turn | 200ms, local strong ease-in-out role |

Both font files and their local OFL licenses matched the source hashes in `assets/fonts/catalog.json`. No font was downloaded or installed. Font readiness is awaited before setting `data-study-ready="03"`.

The approved local white logo serves the navy masthead. Actual supplied player portraits identify the top-value anchors, Faces and editorial subjects; they retain natural color and contained crops. The real Free Throw preview supports its existing destination. No new picture, honor, result or scene was invented.

Computed rendered-pair checks after visual inspection: snow/navy 14.45:1; muted-on-snow 5.65:1; muted-on-navy 9.19:1; navy-on-bright-orange 5.64:1. Focus uses navy on light surfaces and orange on navy. These are bounded samples of actual rendered roles, not universal accessibility certification.

## Copy changes and preserved facts

- The repeated home/away matchup headline becomes the factual `Week 3` heading. Both actual team names, profile links, managers, records and scores remain in the score reader.
- “Five pairings. One saved slate.” becomes “Saved decisions.” All five pairings and their actual returned choices remain.
- Decorative chapter numbers are removed from desktop buttons and phone options. Real ranks, dates, scores, state labels and spoken chapter position remain.
- No fixture fact, source period, roster reference, AI evidence, history limitation or destination was removed. The compact synthetic provenance warning is preserved.

The current fixture remains separate from coherent dated archive records. Known 0.0 is not Pending, incomplete is not final, the returned away choice remains 35% while the other team is 65%, and confidence remains independently 20%. Stale saves are explicitly old context without current meters; missing AI retains all five unavailable rows. Member club/scout chapters are absent from public rendering. History and Power retain honest unavailable states. Full inventory mapping and capture IDs are in `STRUCTURE.md`.

## Real motion path for recording

`motion-demo.json` contains the three actual supported steps:

1. Pointer click `#next`; wait 500ms.
2. Press Enter on `#next`; wait 500ms.
3. Pointer click `#previous`; wait 500ms.

From the default member view this is This week → My club → Scoutbook → My club. The same controls work in public mode with that mode's available chapters. The path works at desktop and phone widths.

For a fine pointer with normal motion, an adjacent button turn moves the actual chapter panes together for 200ms. It is not a screenshot substitution. Native scroll snapping is suspended during this transform and restored on finish/cancel so transformed snap geometry cannot skip a chapter. Content and target chapter state are available immediately.

Keyboard actions, the phone picker, history, non-adjacent direct jumps, capture API and reduced-motion actions are immediate. Coarse-touch button navigation is also immediate; physical chapter movement remains the native direct swipe. Rapid repeated control input cancels the existing turn and resolves to the latest target without a queue. Reader pointer input, any keyboard input, hidden-document state and live reduced-motion changes cancel a running turn.

Actual Chromium sampling of the demo at 1440 and 390 with fine-pointer input found seven running pane transforms during the first normal pointer turn, zero on the Enter step, and zero after settling. Reduced mode had zero running animations throughout. The path also completed in an emulated coarse-touch phone context in normal/reduced settings; that context correctly had no authored button-turn animation. A CDP native touch swipe completed This week → My club. Live reduced-motion change canceled an active turn within the tested next 40ms; rapid two-Next input settled on Scoutbook without a queued animation.

Root owns actual clip recording. Still screenshots alone are not motion evidence.

## Actual checks

Installed Playwright with local `/usr/bin/chromium`, root-owned server on port 4207:

- Final 84 ready-state reflow combinations passed: member/public capture states at 1440×1000, 390×844, 320×844 and 100%/200% root text. Document, body and active chapter widths were measured, with exactly one non-inert chapter.
- Final 24 additional stale/missing combinations passed across both modes, all three widths and both text sizes: five rows, zero probability meters, no personal chapters in public, no document overflow.
- Actual League → Standings → Edition controls passed all eight member/public × 390/320 × 100%/200% combinations. Document width stayed equal to viewport. Browser Back returned to League. The hidden table header retains its positioned containing block.
- Clicked all ten team selectors: 24/27/22/22/22/23/23/22/21/22 roster rows, 228 unique player hrefs. Ten Faces and all 24 member value rows were present.
- Player search returned the actual AJ Dybantsa reference; unmatched search had an explicit empty state. Name sorting placed Huff n’ Puff first.
- Independent chapter scroll restored 346px → 346px after selecting Edition and returning. Provenance Escape returned focus to its footer opener.
- All ready/stale/missing member/public fixtures retained a known 0.0 and Pending distinction. The opened first pick evidence showed the actual 35%/65%, 20% confidence, saved timestamp, model, prompt, null snapshots and supplied evidence.
- The exact three-step member demo completed at 1440 and 390 in normal/reduced settings, plus an emulated coarse-touch phone context. Native CDP touch movement also completed.
- Visual inspection covered the desktop default spread, desktop Scoutbook and phone My club. This caught and corrected a chapter-surface inheritance error before the final 108 reflow checks.
- Keyboard-focused selected chapter, team and archive controls matched :focus-visible and rendered contrasting navy/orange outlines against their actual selected backgrounds.
- Local fonts loaded; no failed local responses or page errors occurred in the final pass. Font/license hashes matched. Paint/font literal audit passed. `node --check study.js` passed.
- All five frozen structural source hashes still match the pre-art values. Earlier wireframes and images were untouched.

## Targeted keyboard boundary follow-up

Reviewer B reproduced a missed case in the original pass: returning to Week with Enter on the focused Previous arrow disabled that arrow and left focus on BODY. The symmetrical final-chapter Next boundary had the same risk.

Only the invoking Previous/Next control is now passed as a focus origin. If that exact control still owns focus when it becomes disabled, focus moves to the opposite, enabled arrow with `preventScroll`. Ordinary loads, capture API calls, native chapter movement and unrelated focused controls do not trigger a focus handoff. There is no visual or motion redesign.

Actual Chromium follow-up checks:

- Exact initial → click Next → focus Previous → Enter repro passed in member/public × 1440/390 × normal/reduced motion: Week returned, Next owned focus, and it was enabled, on screen and `:focus-visible` with a solid 3px outline.
- The symmetrical Archive → focus Next → Enter case passed the same eight combinations: Play & tools returned, Previous owned focus, and the same visible/enabled assertions passed. This is 16 boundary checks across eight flows.
- Initial loads retained BODY focus. A deliberately focused provenance summary retained focus through capture-hook navigation in all eight flows.
- The independent Week scroll position remained 180px before and after the arrow round trip. Keyboard boundary navigation had zero running animations.
- The final source passed the full 108 member/public ready/stale/missing reflow combinations at 1440/390/320 and 100%/200% root text, including exactly one non-inert chapter. No page errors occurred. The actual League → Standings → Edition → browser Back path still returned to League.
- `node --check study.js` passed. Only `polished/03/study.js` and this art record changed for the fix; previous folders, styling and the motion demo remain unchanged.

Frozen again for root recapture and reviewer recheck. Physical-device and screen-reader limits below still apply.

## Limits and handoff

Root full-document/pane capture, actual clip recording, independent critique and Muse review remain pending. Physical iOS/Android, Safari, screen readers, external live routes and authentication were not tested. The local fixture is not an authentication boundary. No production build is claimed for this isolated static study.

Only own `polished/03/` files were written. No production, shared assets/tokens, root infrastructure, Muse lanes, other author, Git, provider or new dependency was changed. Primary references were read on the web as requested; no live league/service calls were made.

Frozen deliverables: `index.html`, `study.css`, `study.js`, `STRUCTURE.md`, `ART.md`, `motion-demo.json`.
