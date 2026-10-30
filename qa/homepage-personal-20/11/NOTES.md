# Concept 11 — frozen build notes

Built the accepted **league circuit** from the revised same-author plan. Two alternatives and selection are recorded in `PLAN.md`. Source is frozen for root capture and packaging; no publication or production change occurred.

## Open the three views

- `/qa/homepage-personal-20/11/?persona=reaves` — scored game, five supplied Week 2 performances, complete 24-player modeled quote.
- `/qa/homepage-personal-20/11/?persona=neural` — zero versus unavailable score, partial 16/22 quote, six named unpriced players, three supplied performances.
- `/qa/homepage-personal-20/11/?persona=guest` — public league circuit, five games, qualified historical context and current-site entry.

Default is Reaves. Add `&stage=structure` for neutral colors/images with identical content and geometry. `document.documentElement.dataset.persona` follows the demo query. `dataset.personalStudyReady` becomes `11` after fonts and eager identity/preview images settle. The selector is labelled Demo persona and does not claim real membership.

## Architecture actually built

The opening is a warm vermilion league field, ten unboxed ranked club positions and an ink central current game. All ten names, ranks, records and points-for are already readable HTML. The visual circuit is ordinal navigation; it does not claim measured distances, probabilities or a radar relation. Its HTML list remains in ranks 1–10, while desktop geometry reads clockwise.

Substantial normal-flow sections follow: member player evidence/quote context, exact supplied updates, five current games, source-derived selected-club history and the recorded 2025 final, then a current-site route directory with an existing Arcade preview. Supplemental inspectors do not replace the main page. All 15 fixture destinations remain reachable and visibly labelled Current site. The guest has no member roster/evidence summary or saved model result.

At 1440px and 1120px the circuit is four columns around the game. A text-relative container query reflows the game ahead of a two-column ranked list when text is enlarged; supporting sections stack as needed. Enlarged text grows; no font size is reduced to fit. Desktop controls use Barlow Condensed at 18px or more, normal mixed case. Reading text is DM Sans; quantities use IBM Plex Mono; Graduate is limited to the short week accent. Local existing font bytes and OFL notices are unchanged. The supplied GOAT logo is unchanged. Player portraits and the existing game preview are the only other media; absent portraits use readable initials.

## Actual source reads and effects

Read the complete assigned Hallmark redesign document from its raw primary file: [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md). Its preservation/inventory and app-screen distinctions led to an explicit destination inventory, retained source facts/logo and a working opening. No external theme, script or installation was used.

Read the assigned adapt page's context assessment, desktop adaptation, content-driven layout, input-method and verification sections: [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt). Its effects are simultaneous readable content, the text-relative game-first reflow, keyboard-complete inspectors and separately stated limits of browser evidence. Mobile-only advice was not added to this desktop assignment.

Read the complete assigned production homepage composition and personalization contracts, product inventory, brief and data-only fixture; relevant repository architecture, data/access/design rules; and the approved local font catalog. Production membership remains server-resolved. This prototype uses only synthetic personas and local fixture data. No peers, rejected prototype source, shared presentation helpers or old editorial drafts were inspected or reused.

## Verification completed on the frozen source

Commands:

```sh
node --check qa/homepage-personal-20/11/app.js
node qa/homepage-personal-20/11/verify.mjs
node qa/homepage-personal-20/11/check-details.mjs
```

Installed Playwright drove `/usr/bin/chromium` against the existing local static server. No dependency was installed. `verification.json` contains the complete final passing matrix, nine journeys, six structure comparisons and error/request records. `detail-verification.json` contains contrast pairs, keyboard containment, direct-link and enlarged-dialog checks.

- All three personas passed at 1440×1000 and 1120×1000, each at normal text and 200% CSS root text enlargement: 12 cases. Each retained ten club positions and five games. Evidence-row counts were 5, 3 and 0. No page or internal text overflow was detected.
- First three useful journeys passed for each persona, including real clicks, Escape/Close, browser Back/Forward and restored focus. The precise selectors and expected outcomes are below.
- All 15 current-site route labels/hrefs were checked. External destinations were not activated; this does not establish production behavior.
- Normal and structure mode had identical complete main text and identical main/circuit heights for all three personas at both widths: six cases.
- Persona selection Guest → NeuralNets changed the URL, dataset and visible member content.
- Seven consecutive Tab presses remained inside the modal inspector; explicit wrapping supplements native dialog behavior. Escape and Close restore the initiating control.
- Direct guest URL `?persona=guest#inspect=team:8` opens the correct inspector. Close removes the inspection hash and focuses `#home-title` when no originating control exists.
- At 1120px with 200% text, the game precedes the ranked list; the open matchup inspector has no horizontal overflow.
- Final browser runs recorded no JavaScript errors, failed local HTTP responses or requests outside the local server.

The arithmetic discovery checks also passed: fixture JSON equals the JavaScript data export; supplied priced rows sum to 1,095.25 for Reaves and 1,622.00 for NeuralNets. The latter remains a subtotal. There is no league value rank or recorded value-history line.

### Selectors and expected local journeys

| Persona | Action/selectors | Expected and observed |
| --- | --- | --- |
| Reaves | `#primary-matchup` → `#inspector` → Escape | 184.5 / 171, saved 56% / 44%, confidence 0.35 and synthetic uncalibrated label; closes and restores primary focus. |
| Reaves | `.club-name[data-id="8"]` → browser Back → Forward → `#close-inspector` | NeuralNets club context explicitly says previous manager as QBs Gremlins; state closes/reopens/closes and restores the team trigger. |
| Reaves | `#evidence [data-id="1444"]` → `#close-inspector` | Damian Lillard 42.5 points with October 19–25 period and a separate modeled quote; restores player focus. |
| Neural | `#primary-matchup` → Escape | papichooter 0, NeuralNets Unavailable, no leader inferred, no saved model supplied; restores primary focus. |
| Neural | `.club-name[data-id="8"]` → Back → Forward → Close | Same qualified public club history; no stale Reaves identity or model. |
| Neural | `#evidence [data-id="1380"]` → Close | Giannis Antetokounmpo 45 Week 2 points, separate 135.50 modeled quote, exact source period; restores player focus. |
| Guest | `.guest-center .action` | Normal `#games` anchor navigation reaches all five public pairings. |
| Guest | `.club-name[data-id="8"]` → Back | Public club context only, previous-manager qualification; closes with restored trigger. |
| Guest | `.game-row[data-matchup="m4"] button` → Escape | Known zero and missing score remain distinct; no leader or private model; restores game trigger. |

Additional checks: `#all-quotes summary` reveals 24 or 22 local rows; `.missing-names [data-id="4866"]` inspects AJ Dybantsa as Unpriced; `a[href="#demo-sources"]` opens the accessible source explanation; `#persona` is the native selector.

### Contrast and visual evidence

Computed Chromium text colors were composited with their rendered ancestor backgrounds and opacity before WCAG luminance calculation. Sampled core text pairs range from **5.41:1** (ink on orange circuit) to **15.98:1**. Muted copy on paper is **7.08:1**, game captions **11.53:1**, quote text **12.60:1**, and current-site exit text on ink **12.59:1**. Implemented focus blue against the computed orange field is **3.93:1**; focus yellow against the ink panel is **12.61:1**. These are sampled rendered pairs, not a claim that every possible browser/assistive-technology state is certified.

Local visual checks were inspected using `check-1440.png`, `check-neural-1120-100.png`, `check-reaves-1120-200.png` and `check-enlarged-fold.png`. Root owns final captures. The initial checks prompted three concrete corrections: a properly full-width demo row in the masthead, a darker focus color on orange, and text-relative sizing/reflow for enlarged initials and dense geometry. No broad critique loop was performed.

## Frozen runtime file hashes

```text
d76afd0f77d797c19856d7c842552751175e8829b70fad49d0b1492948fc9070  index.html
9cba18891b1ec543591d92fd74ce06b4eff533132feaf8bd4aea50d57ab5d873  style.css
a33d75cc9cf12695d0e40097ea919ac35132127626d85fab502ee41fafac91ea  app.js
```

Only this author's directory was written. No live API/auth/AI/market/database/storage/mutation call, publication, git mutation, production file change or new dependency occurred. No production build was needed for this isolated static page. Physical devices, Safari/Firefox, screen readers, real browser zoom and real account journeys were not tested; CSS text enlargement and Chromium browser interaction are the evidence performed. No remaining build blocker.
