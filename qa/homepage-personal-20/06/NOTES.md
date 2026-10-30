# Concept 06 — Source-ready, frozen for capture

Same independent concept 06 author. This complete static website uses the accepted continuous court index: ten readable public club links across the baseline, the member pairing across the upper court, three direct local actions at center, and player samples plus other games together below. The arena is a shallow perimeter image, not a substitute for the website. Explore and the destination footer remain substantial ordinary HTML.

## Entry and state

- Base: `http://127.0.0.1:4207/qa/homepage-personal-20/06/`
- Reaves: `?persona=reaves` (also default).
- NeuralNets: `?persona=neural`.
- Guest: `?persona=guest`.
- Neutral structure: append `&stage=structure` to any persona URL.
- Ready signal: `document.documentElement.dataset.personalStudyReady === "06"`.
- Persona signal: `document.documentElement.dataset.persona` is `reaves`, `neural` or `guest`.

The shared fixture import is data only. All presentation and interaction code belongs to this directory. No production/shared source, dependencies, services, fixture, git action or publication was changed/performed. Existing licensed font bytes and approved assets are referenced locally; original OFL notices remain in the existing font directories.

## Stable first-three-action selectors

Each action enters a fixture-only URL view and focuses `[data-detail-heading]`. `#detail-back` returns to its origin through browser history and restores focus there. Direct-loaded details have a local Home fallback. Nested detail uses the label "Back to previous view" rather than claiming every Back goes home.

| Persona | Selector | Expected detail and result |
| --- | --- | --- |
| Reaves | `#act-matchup` / `[data-action="matchup"]` | Heading `Reaves Dropper vs Ware the Hoes At?`; 184.5 and 171 current synthetic scores; saved 56/44 estimate with returned choice, separate .35 confidence and saved date. |
| Reaves | `#act-team` / `[data-action="team"]` | Heading `Reaves Dropper · Club sheet`; 24 players, 24/24 priced, 1,095.25 modeled FAAB; league value rank unavailable. Name search `#roster-search`, Clear `#clear-search`. |
| Reaves | `#act-player` / `[data-action="player"]` | Heading `Joel Embiid`; 38 synthetic completed Week 2 counted points and 137.50 current modeled FAAB shown as separate facts. |
| NeuralNets | `#act-matchup` / `[data-action="matchup"]` | Heading `papichooter vs NeuralNets`; recorded opponent zero, own score unavailable; no inferred leader/tie or saved probabilities. |
| NeuralNets | `#act-team` / `[data-action="team"]` | Heading `NeuralNets · Club sheet`; 22 players, 16 priced, six Unpriced; 1,622.00 labeled subtotal and no league value rank. |
| NeuralNets | `#act-player` / `[data-action="player"]` | Heading `Giannis Antetokounmpo`; 45 synthetic completed Week 2 counted points and 135.50 modeled FAAB, with explicit period/limitations. |
| Guest | `#act-matchup` / `[data-action="matchup"]` | Public Reaves/Ware pairing detail, current scores, public records, no member saved-model block. |
| Guest | `#act-club` / `[data-action="club"]` | Public Reaves Dropper summary, manager, record, opponent and clearly dated 2025 reference. |
| Guest | `#act-directory` / `[data-action="directory"]` | Heading `The ten clubs.`; all ten public club entries with managers, current records and season points. |

Additional selectors: `#club-1` through `#club-10` are baseline club inspections; `#sample-1511` / `#sample-1380` identify the two portrait-linked sample players; `[data-score-team="8"]` reads `Score unavailable`, while `[data-score-team="7"]` reads `0` on Neural home. `#nav-games`, `#nav-explore`, `#nav-sources` and `#demo-persona` are working navigation controls. All 14 non-home fixture routes are in `.footer-group a`, under the visible current-site exit explanation. Home stays local.

## Actual bounded verification

Run: `node qa/homepage-personal-20/06/check.mjs`.

Used the existing Playwright module at `/opt/codex/cua_node/lib/node_modules/playwright/index.mjs` and `/usr/bin/chromium`, with no installation. Final results are in [evidence/browser-checks.json](evidence/browser-checks.json). The final run passed:

- All nine primary action flows across the three personas, detail heading focus and Back origin focus restoration.
- Correct 24/22 roster sizes, six Neural unpriced rows and working name search/Clear.
- Correct Reaves scores, Neural null versus opponent zero, five/three member sample rows and zero guest private sample rows.
- No horizontal page overflow at 1440 or 1120 for any persona.
- At 1120 with the root text size set to 200%, no horizontal page overflow or clipped club/action/score/sample/game content. This is an explicit CSS text-enlargement check, not a claim about every browser zoom mode.
- Structure mode retains the null state and hides images with their boxes preserved.
- Reduced-motion emulation retains all three actions and working player inspection.
- All 14 non-home fixture destinations remain discoverable in the labelled footer.
- Seven computed rendered text foreground/background samples meet 4.5:1; the lowest sampled pair is primary cream-on-red text at 5.92:1. This is sampled contrast evidence, not a full accessibility audit.
- Nested club sheet → player → Back restores the roster link; browser Forward returns to the player detail.
- A guest direct member-player URL yields an honest unavailable-detail view rather than a private sample.
- Zero page JavaScript errors and zero failed requests in this run.

Two bounded local screenshots were captured and visually inspected: [Reaves at 1440](evidence/reaves-1440.png) and [Neural at 1120](evidence/neural-1120.png). Root owns final captures/packages. No phone, external real-site login, external game play, backend or production behavior is claimed. A focused first run found long club names clipping at doubled text size; the baseline now chooses fewer columns as text grows, and the final run verifies the correction.

`node --input-type=module --check < qa/homepage-personal-20/06/app.js` also passed. No application production build was run: these are isolated static QA files and no Next/production source was edited.

## Sources and concrete application

The required actual homepage contracts and product/fixture brief were read, as recorded in PLAN. Production membership remains server-resolved; the demo select is explicitly synthetic. Both valuation ranks are null. Modeled quotes are coverage-bound; completed Week 2 samples and current Week 3 scores remain separate. NeuralNets' historical detail retains "Under the previous manager as QBs Gremlins." No missing score, quote or player sample becomes zero, DNP, a trend or an availability claim.

**Rauno Freiberg, [Contrasting Aesthetics](https://rauno.me/craft/contrasting-aesthetics):** complete retrieved article text read, including introduction, Inviting Curiosity, PP Foundry, Just Friends, Raw Materials, Spaces and Loïc Nottet. Linked sites and music were not visited. The application is a controlled intersection of athletic court rules, ordinary useful links and factual data. The exact GOAT mark and stable control system hold these materials together; no bitmap type, animated logo or 3D example was copied.

**iart-ai, [Accessible Animation](https://www.ui-skills.com/skills/iart-ai/accessible-animation):** full visible text from Accessible Animation through Gotchas read, including tiers, gating/live changes, WCAG mapping and verification. No install, linked patterns file or helper was run. This led to the static court/data, small non-spatial color feedback and URL/focus-based inspection. Reduced motion retains every task; no animation library, auto-motion or scroll reveal is used.

Typography is deliberate across roles: Archivo Black short headings, Barlow Condensed reading at 20px/1.45, Space Grotesk controls/names and small metadata, IBM Plex Mono quantities. Long names wrap naturally; there is no condensed microcopy or decorative display font used for long data. The actual approved arena image was inspected before choosing its shallow floor crop.

## Frozen source fingerprints

- `index.html`: `56f275abe0c5acdad2c7ae1cfd59098c03b15e6f3fc4e53a3c9fa062bf456155`
- `styles.css`: `08863d10211846a15f94649101871e043eaae2e8f0d35ec970b19c3d52db8b52`
- `app.js`: `6d4962a6c60e9825048f57cf83438ffa1ded8d47f9ca4419fc8158b66215bb07`
- Shared fixture read during final checks: `880a8ecc5f978628589146742891802c4fdef48d9695d9085f66a81019344e42` (`../fixture.js`, not authored or edited here).

No remaining blocker. Source is frozen for coordinator capture unless a concrete review fix is requested.
