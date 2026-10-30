# Concept 13 — source-ready and frozen

Built the accepted chronological ledger in this directory only. Local entry:
`http://127.0.0.1:4207/qa/homepage-personal-20/13/?persona=reaves`

Other complete states: `?persona=neural` and `?persona=guest`. Structure comparison: append `&stage=structure`. Ready contract: `html[data-personal-study-ready="13"]`; persona contract: `html[data-persona="reaves|neural|guest"]`.

## Final architecture

The time / subject / explanation geometry is the main composition, using the four supplied source updates in exact descending timestamp order. The opening already shows the member, current opponent, sample score state and useful evidence/quote/matchup actions. Relevant updates have attached source context; they are not posts or transactions. There is no giant roster spine, portrait wall, court, rail or repeated card dashboard.

The full five-pair league board remains visible, followed by focused standings (top three plus member/opponent where relevant). Full ten-team standings and public identity/history are local detail. The completed-week player table is visible for members; full 24/22-player quote tables are local inspection. This is the focused-detail choice allowed by the build followup. Guest receives public updates, pairings, current leaders, the full public directory disclosure, period guidance and history, with genuine account entry on the current site. No guest private team is claimed.

NeuralNets’ absent model output is labelled Week 3 context; it is not given a fabricated saved date. Its missing score stays distinct from papichooter’s recorded zero. Its quote is a 16/22 partial subtotal. Reaves has a complete 24/24 modeled quote and an explicitly saved 26 October model estimate. Completed player evidence is 19–25 October, separate from Week 3 scores. No total-value ranking, trend line, injury, availability story, notification service or write action was fabricated.

Typography: Tahoma/Geneva with explicit DejaVu Sans fallback for reading and names; Arial/Helvetica controls; Consolas/Liberation Mono/Courier New data. Lora at modest sizes supplies date/section hierarchy from the approved existing local font. System fallback depends on the viewer’s OS; no claim that Windows Tahoma or Consolas was installed in this Linux browser. The local Lora OFL notice remains in its original shared location. No font/asset downloads. Exact supplied logo only; no other imagery was needed.

## Sources actually read and applied

Original discovery read the actual homepage and personalization contract files specified in AUTHOR-BRIEF, product inventory, fixture, repo AGENTS and relevant ARCHITECTURE/DESIGN sections. PLAN.md retains the concrete application and two alternatives. No peer implementation or old prototype source was inspected.

- [pbakaus / adapt](https://www.ui-skills.com/skills/pbakaus/adapt): actual rendered sections “Assess Adaptation Challenge” through “Verify Adaptations,” plus the inline responsive reference were read in discovery. Applied desktop simultaneous context, bounded width and content-driven row reflow; all core facts remain in the document. Native controls do not require hover. No install command/script was run; no mobile scope was added.
- [Rauno Freiberg / Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): full textual essay read in discovery; embedded motion examples not played. Spatial Consistency, Frequency & Novelty, Scroll Landmarks, Fitts’s Law and Scrolling informed adjacent source inspections, immediate repeat actions, nearby close controls and return/focus behavior. No custom gesture or nested scroll reader.

These verified references were not reread wholesale for implementation. Their actual effects are preserved; neither supplied a page template.

## Actual browser evidence

Ran `node qa/homepage-personal-20/13/verify.cjs` with preinstalled Playwright and `/usr/bin/chromium` against the existing root-owned static server. No dependency install. The final run passed **9 layout cases and 9 journey groups**, with **zero page errors or HTTP errors**. Results are in `checks/browser-results.json`.

For each of Reaves, NeuralNets and guest: 1,440px / 16px root text; 1,120px / 16px; and 1,120px / 24px (150% enlarged text), each at 1,000px viewport height. All nine had document scroll width equal to viewport width and opening context/actions inside the first viewport. Activity rows, five pairings and all useful main content remained present. Final full-page local evidence is `checks/{persona}-{width}-{text}px.png`. The enlarged NeuralNets opening and standard guest opening were also visually inspected, together with the original full Reaves composition.

At 1,440px, exercised the first three member tasks: visible Week 2 evidence and player detail; full quote inspection, one-player search, reset and nested focus return (including NeuralNets’ six-unpriced filter); and own matchup inspection with browser Back returning focus. Guest checked source-entry public team detail, five pairings, partly unavailable pairing inspection, all ten standings, previous-manager-qualified history, Escape focus and the genuine sign-in href. Structure mode retained the same ledger width/height; reduced motion retained the four updates.

The checks exposed a history-traversal focus timing issue; restoration now runs on the next animation frame and the final journeys passed. They also verified the activity-row public receipt stays in its explanation column. No unresolved failure remains.

Scope of evidence: headless desktop Chromium only; enlarged text was applied as an actual 24px root font. No physical device, Safari, mobile, real authentication or remote tool flow is claimed. External destinations were checked as real hrefs without invoking those services. Root owns final captures and packaging; these are bounded local checks.

## First three tasks for capture/review

Exact selectors and expected results for each state are in `journeys.json`.

| State | First | Second | Third |
| --- | --- | --- | --- |
| Reaves | `#first-evidence-action`, then `[data-evidence-player="1444"]`: 42.5 counted points | `.following [data-panel="quotes"]`: 1,095.25, 24/24; search Joel: 137.50 | `.opening-matchup [data-panel="opening-pair-detail"]`: 184.5 vs 171; Back restores focus |
| NeuralNets | `#first-evidence-action`, then `[data-evidence-player="1350"]`: 29.5 counted points | `.following [data-panel="quotes"]`: partial 1,622.00, 16/22; `#unpriced-only`: six players | `.opening-matchup [data-panel="opening-pair-detail"]`: unavailable vs recorded 0; Back restores focus |
| Guest | `.following a[href="#league"]`, then first `[data-matchup="m4"]`: zero/null distinction | `#full-standings > summary`, then `[data-team="8"]`: ten teams, qualified history | `.site-links > a[href="https://goathoopers.com/login"]`: actual-site sign-in exit |

All custom inspection close controls use `[data-close]`. They restore the originating trigger; Escape closes when focus is within an inspection. Major document anchors focus their heading, and history navigation preserves meaningful local tasks. Search clearing restores the full roster and does not submit or persist anything.

Source files are `index.html`, `style.css`, `app.js`; `verify.cjs` is the bounded local checker. `checks/source-digests.json` records the frozen presentation-source bytes. No production/shared-helper/fixture edit, backend request, git, publication or dependency change. Frozen for root capture; no blockers.
