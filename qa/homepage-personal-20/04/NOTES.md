# Concept 04 — Compare your squad

Source-ready and frozen for root capture. This is the same independent author through discovery and revision. The accepted comparison-first architecture is implemented in own `index.html`, `style.css` and `app.js`, with the shared **data-only** `../fixture.js` import. No peer presentation, shared helper, production file, dependency, publication or backend was used or changed.

## The complete website

The wide shared-field comparison is the main task, not the entire homepage. Members have their own identity/record/standing, actual Week 3 opponent and score state above it; named player samples, a roster entry, substantial opponent facts and league discovery below it. Guest compares public teams and gets all five pairings in ordinary document flow, with real account entry. Every fixture destination is discoverable through the header, local views or semantic footer.

Default Reaves compares Joel Embiid / Damian Lillard, with 38 / 42.5 completed-Week-2 sample points and separate 137.50 / 74.00 modeled FAAB quotes. NeuralNets compares Giannis Antetokounmpo / Kevin Durant, with 45 / 33.5 and 135.50 / 130.25. Guest compares Reaves Dropper / Stephon Castle’s Back using current record, standing and points-for. Suggested comparison subjects are explicitly **not a starting lineup**. Differences remain neutral arithmetic; no winner, recommendation, player ranking or prediction is generated.

The copper/blue world is retained. Copper was tuned from the planned `#DF7048` to `#E57D55` after a contrast calculation. Final blue ink `#102F45` against copper is approximately **4.88:1**; against chalk `#FFF2D8`, **12.51:1**; against blue `#CEE4EB`, **10.51:1**. Secondary `#405867` on chalk is approximately **6.74:1**. These are explicit color-pair calculations, not a full automated contrast audit.

Archivo Black carries task/section headings; Space Grotesk carries body, controls, names and tabular numeric values. Body is 18px. The desktop comparison uses a wide shared centre field axis. At enlarged text / narrow content widths it stacks subjects, repeats the field labels visibly and keeps the same values/actions. It grows instead of fitting long names into smaller type. Images are existing approved portraits and the existing Arcade preview; supplied logo variants remain unchanged. Existing licensed local fonts/OFL files are referenced in place.

Local player, sample, roster, matchup, team, pairings and league views have direct URLs, clear current location, ordinary Back/Forward, departure-scroll restoration and focus return. Native selects and Swap update only local state. No storage, live API, authentication, AI, market, database, trade, lineup or notification calls occur.

## Fixture truth

Latest shared fixture was re-read at build start and imported directly rather than copied. No value rank is asserted. NeuralNets' modeled subtotal remains partial (16/22); Unpriced and unavailable points do not become zero. papichooter's actual sample zero remains `0` while NeuralNets remains `Score unavailable`. Only m1 has a supplied saved model estimate. Its probabilities, returned choice, time and separate confidence are kept separate from the current score, with explicit absence of further model revision metadata. No trend, Lineup Power, game log, injury designation or fabricated news fills an empty field.

The 2025 historical record is separately disclosed; NeuralNets retains **Under the previous manager as QBs Gremlins** beside that record. A visible Synthetic demo label and accessible full source explanation are present throughout. Public team views do not invent unsupplied opponent rosters.

## Source reads and actual applications

- [Emil Kowalski, Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): assigned page opened, followed by the complete raw SKILL.md (597 rendered lines) during original discovery. Selectively applied the frequency/purpose framework, predictable controls and immediate feedback: there is no entrance sequence delaying known results, and repeated selector/navigation actions are immediate. No source scripts, installation, decorative 3D, dragging or springs were used.
- [Addy Osmani, Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): complete displayed skill body read from Evidence-led audit workflow through Common issues by impact (lines 21–409). Linked subordinate pattern files were not read. Concrete applications are native labelled controls/links, subject-specific accessible comparison groups, skip-to-main focus, visible focus, readable state text, semantic headings/footer/tables in local depth, and deliberate Back/focus behavior. Source checks and headless tests are not claimed as screen-reader conformance.
- Local material read: assigned/common briefs and product inventory, all five required homepage contracts, complete fixture and later rank correction, AGENTS, relevant ARCHITECTURE data/access/personalization contracts, applicable DESIGN truth/access/ownership guidance and project navigation/accessibility reference, licensed font catalog, and actual approved arena/Embiid imagery in discovery. The final concept uses no arena hero. No peer/pilot/old prototype/rejected catalog source was inspected.

## Reproduce the first three actions

Base: `http://127.0.0.1:4207/qa/homepage-personal-20/04/`. Start each action from its fresh persona URL unless testing a return. Wait for `document.documentElement.dataset.personalStudyReady === '04'`. Each render clears readiness until current fonts/images have settled.

| Persona / action | Stable selector or URL | Expected result |
| --- | --- | --- |
| Reaves 1: compare another player | `?persona=reaves`; select `1830` in `#left-select` | Left becomes Derrick White, 22 sample points and 61.00 FAAB; right stays Damian Lillard, 42.5 and 74.00. `#swap` exchanges sides and retains focus. |
| Reaves 2: read the five-player sample | `#read-samples` | Local `view=samples`, five `#sample-table tbody tr` rows and explicit October 19–25 period. `#back-to-comparison` returns to origin, its scroll and `#read-samples` focus. `#inspect-left` is an additional direct local Joel detail path. |
| Reaves 3: inspect actual matchup | `#open-matchup` | Local matchup has `[data-score-team="1"]` = `184.5`, team 2 = `171`; `#saved-estimate` carries 56% / 44%, separate confidence 0.35 and synthetic model label. |
| Neural 1: compare another player | `?persona=neural`; select `1350` in `#left-select` | Left becomes Rudy Gobert, 29.5 points / 140.75 FAAB; right stays Kevin Durant, 33.5 / 130.25. Native control focus is preserved. |
| Neural 2: read the three-player sample | `#read-samples` | Three sample rows: Rudy, Giannis and Kevin. Period/scope are explicit. Back restores the sample opener and departure position. `#inspect-left` also opens the default Giannis detail. |
| Neural 3: meet opponent / matchup | `#meet-opponent`, or `#open-matchup` | Public papichooter profile has current record/standing/points-for without invented roster. Matchup team 7 = `0`, team 8 = `Score unavailable`; saved estimate is unavailable. |
| Guest 1: compare public teams | `?persona=guest`; select `7` in `#left-select` | Left becomes papichooter, public team comparison only. Right stays Stephon Castle’s Back. `#inspect-left` opens public team facts; no private member state appears. |
| Guest 2: open a current pairing | `#pair-m4` | Five `.pairing` objects were already in home flow. Detail preserves papichooter `0` / NeuralNets `Score unavailable`, with no inferred leader. |
| Guest 3: real account entry | `#guest-account` | Explicit “On GOAT · leaves prototype” link to `https://goathoopers.com/login`. This was checked as a destination, not followed through real login. |

Additional direct checks:

- `?persona=neural&left=4866&right=1380`: AJ Dybantsa displays `Unpriced` / `Unavailable`; no comparison difference is minted.
- `?persona=neural&view=team&id=8`: open `.historical`; previous-manager qualification accompanies 2025 facts.
- `?persona=reaves&view=player&id=1511`: direct Joel detail works without prior navigation, and its fallback Back returns to home.
- `?persona=neural&stage=structure`: identical data/controls/geometry; image emphasis hidden and color neutralized. Stage and persona survive local navigation.
- Footer has 14 visibly identified production exits, including every fixture route other than local Home. `.source-note` has the complete provenance; `[data-source]` opens and focuses it.

## Actual bounded verification

`node --check qa/homepage-personal-20/04/app.js` passed.

`node qa/homepage-personal-20/04/verify.cjs` passed **30/30** checks in the final source state. The reproducible script uses the already-installed Playwright and `/usr/bin/chromium`, with the existing root server. It checks all persona defaults, actual comparison values/changes, Swap, browser Back, local inspection, heading focus, opener focus/scroll restoration, sample counts/periods, actual score/model states, full footer/source access, 1440/1120 document overflow, 1120 with root text doubled from 18px to 36px, missing quote/points, previous-manager history, direct detail URLs, structure/reduced-motion, and real keyboard Skip-to-content/native selector use. The final run recorded **no script errors and no external data requests**. Results are in `browser-evidence.json`.

I visually inspected `check-reaves.png` (1440 full page), `check-neural-1120.png`, `check-guest.png` (1440 full page), and the final `check-neural-enlarged-viewport.png` (1120, doubled root text, stacked comparison). Root owns the final capture/package; these are supporting local checks. The enlarged screenshot demonstrates visible repeated labels, large values and unchanged native controls rather than squeezed names.

No production build/typecheck was run because no application source was changed. No physical-device, real account, production navigation or screen-reader acceptance is claimed. No Lighthouse/axe audit or universal accessibility conformance is claimed.

## Frozen presentation checksums

These SHA-256 values identify the source that passed the final checks. No git operation or release action was performed.

| File | SHA-256 |
| --- | --- |
| `index.html` | `2a1e8e276b72e3607b6071394f648166240024385bb16a5a1394bb4ed0c4fade` |
| `style.css` | `25baa6026725ef16e78712a91dbf4e651e50348cd84792565b5566ea555fbeb0` |
| `app.js` | `2c612dbc090e6b9328d5ec5cfc48107dc692720962555a2b0469c6061ade8006` |
| `verify.cjs` | `3bbaf715315fa8835e4c4fc2bbca4dd45a974a0376d50680c61c07bfda48a510` |
| Shared data-only `../fixture.js` at verification | `880a8ecc5f978628589146742891802c4fdef48d9695d9085f66a81019344e42` |

No blockers. Source is frozen awaiting root capture/review.
