# 18 — Player finder home

Status: source-ready and frozen for root capture. Author work is confined to this directory. No peers, old prototypes, production/shared presentation code, dependencies, git operations or publication were used in the build.

## Open locally

- `http://127.0.0.1:4207/qa/homepage-personal-20/18/?persona=reaves`
- `http://127.0.0.1:4207/qa/homepage-personal-20/18/?persona=neural`
- `http://127.0.0.1:4207/qa/homepage-personal-20/18/?persona=guest`
- Add `&stage=structure` to retain full content/geometry with neutral colors and images.

Default and unknown persona values resolve to Reaves. Ready selector: `html[data-personal-study-ready="18"]`; persona is on `html[data-persona]`. Ready waits for `document.fonts.ready`. Shared `../fixture.js` is the sole data import; all presentation files are owned here.

## What was built

The accepted revision replaces the original navigation rail/review with a broad single-player finder workbench. Reaves starts with Joel Embiid; NeuralNets with Giannis Antetokounmpo. Their counted points and modeled FAAB have distinct labels and periods. Their current pairing is integrated into the base. Search, all available completed-week players, real current-game context, other league pairings, ten public club links, practical destinations and the complete footer make a populated page before any selection.

Guest receives a populated public club finder, public current pairings/club directory and the qualified 2025 final. It never receives a private-team claim, personal roster quotes or a saved personal estimate. Every real-site exit is visibly identified; the fixture's full destination inventory remains discoverable.

Righteous supplies rounded short home headings; Space Grotesk supplies body, controls, long names and tabular lining data. Detail-page player/club headings also use Space Grotesk. The saturated ultramarine workspace and orange task control carry the concept's identity. Exact logo/approved fixture portraits and small game preview are reused. Local licensed font files/OFL notices remain untouched. Text enlargement reflows the workbench; currency amounts stay intact.

Local query pages cover player, matchup, quotes and public club inspection. They support direct entry, explicit Back, browser Back, scroll/focus restoration and useful unavailable routes. Search matches accents optionally: `sengun` finds Alperen Şengün. Quote inspection has native name/coverage filtering and deterministic unpriced-first/value/name ordering. No backend, auth, AI, pricing, storage or mutation requests occur.

## Bounded actual verification

Run from the worktree: `node qa/homepage-personal-20/18/verify.cjs`.

Browser verification result before the copy-only wording correction below: **passed**, using installed Playwright with existing `/usr/bin/chromium`, headless desktop. Requests were restricted to localhost. No runtime page errors, external requests or broken images occurred. Full machine-readable evidence is `checks/results.json`; exact frozen source hashes are in `checks/source-sha256.txt`.

All three home states were checked at **1440 × 1000** and **1120 × 1000** CSS px, at default text and **200% CSS root-font enlargement**. All twelve combinations had document scroll width equal to viewport width. This is text enlargement, not browser zoom or a phone test. Enlarged numeric quicklook values remained unbroken and inside their own boxes. A direct enlarged Neural quote inspector at 1120 also had no whole-page overflow.

The three persona journeys actually exercised:

1. **Reaves:** search Lillard → Damian Lillard detail (42.5 points / $74.00) → explicit Back with restored result focus, query and scroll; empty/no-match/reset/accent-insensitive search; default Joel inspection → browser Back; matchup (184.5 / 171 and separate 56%/44%, 35% confidence) → Back; 24 quotes → zero unpriced filter → Back.
2. **NeuralNets:** search AJ → AJ Dybantsa detail with unavailable counted evidence and Unpriced quote → Back; matchup inspection retains unknown Neural score and papichooter's recorded zero, with no saved model; 22 quotes → six Unpriced entries → Peterson name filter → Back.
3. **Guest:** populated public default → search Neural → public profile with adjacent previous-manager-as-QBs-Gremlins historical qualification → Back; public m4 inspection retains null/zero and no private estimate → Back; default public club detail → Back; labelled persona change to Neural clears the old detail.

Direct valid player URLs and direct Back worked. A guest attempt to open a private player route rendered unavailable/recovery. Structure mode retained the workbench's exact width/height. Reduced-motion content was retained. Keyboard Tab exposed the skip link with visible focus; Enter moved focus to main. Source disclosure opened. Every supplied production destination other than local Home was found as an explicit real-site URL.

Calculated authored text/background pairs range from **5.98:1** (game muted text) through **15.39:1** (outer body); button text is **8.70:1**, blue supporting text **7.28:1**, white workbench data **9.06:1**. Tested focus/background pairs are **5.64:1–6.54:1**. These are bounded palette-pair measurements, not a universal accessibility certification. No physical-device, phone, live-service, Next-router or screen-reader testing is claimed. Root owns final matching captures and packaging.

## Stable selectors

| Purpose | Selector |
| --- | --- |
| Persona | `#demo-persona` / `[data-testid="persona-select"]` |
| Home / detail | `[data-testid="home"]` / `[data-testid="detail"]` |
| Finder | `#finder-form`, `#finder-input`, `[data-testid="finder-submit"]` |
| Search result / reset | `#search-results`, `#result-<id>`, `#finder-reset` |
| Default player or public club | `#primary-inspect` |
| Current game | `[data-testid="current-game"]`, `#matchup-inspect` |
| Player evidence links | `#evidence-<playerId>` |
| Pairings / public club links | `#pair-<matchupId>`, `#club-<teamId>` |
| Exhaustive quotes | `#quotes-inspect`, `#quote-search`, `#quote-coverage`, `#quote-count`, `#quote-list` |
| Inspection return / heading | `#back-home`, `#detail-title` |
| Sources | `#sources`, `#sources summary` |

Example direct routes: `?persona=reaves&view=player&id=1511`, `?persona=neural&view=matchup&id=m4`, `?persona=neural&view=quotes`, `?persona=guest&view=club&id=8`.

## Source applications

Product source and repository guidance reads are recorded in PLAN.md, bound to `0d4564101af5a9267b152ccf08455e87a480ac33`. Membership remains server-owned in the real product; this concept's query state is explicitly a synthetic demo. Minimal list versus local inspection, model provenance, exact source periods and truthful coverage follow those contracts.

[Contrasting Aesthetics](https://rauno.me/craft/contrasting-aesthetics) was read in full as article text, without inspecting linked examples/media. The concrete effect is contrast between the saturated single-object workspace and open compact continuation, with rounded headings against stable reading/data type. It does not supply the art direction.

[Accessible Animation](https://www.ui-skills.com/skills/iart-ai/accessible-animation) was read through the complete embedded skill body, including tiering/gating, verification and gotchas. No installation or script use. Its concrete effect is static immediately available content, ordinary page inspection and focus restoration, without sliding inspectors, scroll effects or entrance choreography. Reduced-motion users receive all tasks.

No remaining author blocker. Frozen for root review/capture.

## Root pixel-QA wording correction

Changed the member headings from “Five/Three counted games” to “Five/Three player results.” The adjacent copy now counts roster players with a supplied completed-week result and explicitly says the remaining players have no result supplied. This avoids asserting a distinct game count or a complete log. One detail sentence now refers to a supplied player result rather than a counted game. Architecture, data, periods, controls and behavior are unchanged.

Validation for this bounded wording edit: `node --check qa/homepage-personal-20/18/app.js` passed. The full unchanged browser journeys were not rerun; `checks/results.json` retains their preceding passing run. Source hashes are refreshed. Frozen again for root recapture/recompile.
