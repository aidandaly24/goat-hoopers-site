# Concept 13 — corrected priority, source-ready and frozen

Local entry: `http://127.0.0.1:4207/qa/homepage-personal-20/13/?persona=reaves`

Other complete states: `?persona=neural`, `?persona=guest`. Structure: append `&stage=structure`. Ready: `html[data-personal-study-ready="13"]`; persona: `html[data-persona="reaves|neural|guest"]`.

## What changed after full-page review

The critic found that source availability displaced useful player/league reading. The corrected member document now moves forward from **completed Week 2 owned-player points (19–25 October)** to a **saved 26 October estimate when supplied**, then the **30 October current league check**. Guest begins with current public pairings. The opening retains current own-team/opponent context and the primary local actions. Source availability no longer leads any state.

NeuralNets now shows Giannis Antetokounmpo 45, Kevin Durant 33.5 and Rudy Gobert 29.5 in its first normal-text fold, explicitly completed Week 2. Reaves shows its five supplied completed-week results, led by Damian Lillard 42.5. These are the supplied sample rows, not complete-roster rankings; 3/22 and 5/24 coverage sits below the respective table. Older points are never described as current Week 3 performance.

All five public pairings lead guest’s main reading. The opening identifies current scores as the Week 3 sample checked 30 October at 08:30 UTC. NeuralNets’ missing score and papichooter’s recorded zero remain distinct. Reaves’ saved model estimate is explicitly saved 26 October at 08:00 UTC and is separate from the current score. No estimate is created or dated for NeuralNets; its absent estimate no longer gets a separate filler section.

The four original availability events remain in exact timestamp order inside the **closed supporting disclosure** `#source-update-log`, after useful main reading. They are source events, never human posts, transactions or newly invented league news. All quote coverage qualifications remain with their values in local inspection. Full quotes now open directly after the opening, outside the supporting disclosure, so an opening action never lands in hidden content.

The same date / subject / explanation geometry, restrained rules, Tahoma/Geneva/DejaVu reading voice, Arial controls, Consolas-family data and modest local Lora hierarchy remain. No theme restart, extra imagery, cards, rail or roster spine was introduced. Exact GOAT logo only.

## First frozen submission preserved honestly

Before any priority edit, copied the untouched `index.html`, `style.css`, `app.js`, original PLAN/NOTES/journeys and original source digests to `research/before-priority-review/`. Preserved app SHA is exactly the critic’s input:

`827eb28e95c8f0ae0ebe1f31a592a8df97c30700ba05668d6a90bd6cb3dc037c`

Those are exact archival source bytes, not a rewritten reconstruction. Relative imports retain their original location assumptions; root preserves the corresponding original compiled HTML and captures. Current presentation hashes are in `checks/source-digests.json`.

## Actual focused verification of this revision

Ran `node qa/homepage-personal-20/13/verify.cjs` using preinstalled Playwright and `/usr/bin/chromium` against the existing root-owned static server. **7 changed-first-fold/reflow cases and 10 task groups passed**, with **zero page or HTTP errors**. No unchanged exhaustive matrix was rerun. Final result: `checks/priority-results.json`.

The seven cases are all three personas at **1,440px and 1,120px**, plus **NeuralNets at 1,120px with 24px root text (150%)**, each at 1,000px viewport height. Each has no horizontal document overflow, current opening context in the first viewport, a useful actual player/pairing reading in the first viewport, and the four source events closed and later in the document. Inspected all three corrected 1,440px first-fold images. Final changed-fold evidence: `checks/priority-{persona}-{width}-{text}px.png`.

The task checks cover both members’ leading player inspection and return focus; relocated complete/partial quote inspection, search/reset and nested/parent focus; own matchup with browser Back; supporting source disclosure and its cross-document quote return. Guest checks cover the leading public pairing, zero/null detail, ten-team directory, previous-manager-qualified NeuralNets history, Escape focus and real sign-in href. The corrected priority also passed a structure-mode check.

The original nine-case layout/matrix evidence and prior captures remain historical evidence of the first submission, not verification of this revision. Current source is covered by the focused results above. Desktop headless Chromium only; no Safari, mobile/physical device, remote authentication or external tool flow is claimed. Root owns final captures and packaging.

## First three review tasks

Exact selectors/expected results are in `journeys.json`.

| State | First | Second | Third |
| --- | --- | --- | --- |
| Reaves | `#first-evidence-action`, then `[data-evidence-player="1444"]`: completed Week 2, 42.5 counted points | `.following [data-panel="quotes"]`: complete 1,095.25, 24/24; Joel 137.50 | `.opening-matchup [data-panel="opening-pair-detail"]`: 184.5 vs 171; Back restores focus |
| NeuralNets | `#first-evidence-action`, then `[data-evidence-player="1380"]`: completed Week 2, Giannis 45 | `.following [data-panel="quotes"]`: partial 1,622.00, 16/22; local search/reset | `.opening-matchup [data-panel="opening-pair-detail"]`: unavailable vs recorded 0; Back restores focus |
| Guest | `.following a[href="#league"]`, then first `[data-matchup="m4"]`: zero/null distinction | `#full-standings > summary`, then `[data-team="8"]`: ten teams, qualified history | `.site-links > a[href="https://goathoopers.com/login"]`: actual-site sign-in exit |

Source log: `#source-update-log > summary`. Custom close controls: `[data-close]`. Escape closes a focused inspection; close/Back restore its actual trigger. Quote search clearing restores all rows. No action persists, submits or calls a service.

## Sources and scope retained

Discovery read the actual production homepage/personalization contract, product inventory, fixture, AGENTS and relevant architecture/design sections. PLAN.md records the alternatives and refinement. No peer implementation or old prototype was read.

- [pbakaus / adapt](https://www.ui-skills.com/skills/pbakaus/adapt): rendered “Assess Adaptation Challenge” through “Verify Adaptations” and inline responsive reference read in discovery. Applied bounded width, simultaneous desktop context, content-based reflow and native non-hover controls. No install script or mobile scope.
- [Rauno Freiberg / Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): full textual essay read in discovery; embedded motion demos not played. Spatial Consistency, Frequency & Novelty, Scroll Landmarks, Fitts’s Law and Scrolling informed adjacent inspections, immediate actions and location/focus return. No gestures or nested scroll readers.

References were not reread wholesale for this refinement. Existing Lora license/OFL remains in its approved shared location; no downloads or dependencies. No shared helper/fixture/production, backend, git or publication change. Frozen for corrected root capture; no blockers.
