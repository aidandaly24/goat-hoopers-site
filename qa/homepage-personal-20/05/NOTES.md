# Author 05 — Your players, your place

Built the accepted 7:5 player/competition composition, full-width current game, and reversed 5:7 continuation. Same author 05 throughout. Only this directory was changed; no shared presentation imports, dependencies, live services, production changes or publication.

## Product and composition

The home starts with a team, manager, current record/position and a direct opponent link. The upper page gives actual players and nearby clubs substantial readable space. It uses open player readings rather than a home roster table, a broad mint standings companion, a contrasting horizontal game surface and a lower reversal of proportions. Public managers are visible alongside club identities. All core home content is in document flow.

Reaves has five supplied completed Week 2 player readings, current first-place competition, its scored Week 3 game, and a saved synthetic estimate available on the matchup page. NeuralNets has three larger player readings, different neighboring clubs, a different opponent, a genuinely absent score and no saved estimate. Its missing quotes stay supporting valuation context on the local team/player pages. Guest gets public leaders, format facts, all ten clubs, five pairings and real account entry, with no personal team claimed.

The marigold/pine/mint world and alternating geometry were preserved. The proposed Righteous/Verdana pairing was replaced before implementation: local **Barlow Condensed** supplies short sporting headings, **Trebuchet MS/DejaVu Sans** supplies 18px reading and 16px controls, and local **Lora** supplies short prominent numeric statements. Names wrap and text grows. The two local font assets are already licensed under OFL; their existing license files were not changed. This is neither the initial rail/table plan nor the second sports-hero proposal.

Images serve useful identity/destination roles: exact supplied GOAT marks, small approved Joel/Giannis headshots, existing free-throw preview. There is no arena hero, generated imagery or invented player body. The approved arena and the two portrait files were inspected during discovery to decide their appropriate use.

## Source readings and applied principles

Both assigned primary pages were opened directly on 2026-10-30. No source tool or script was installed.

- [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): read the full rendered **Redesign** through **After**, including **What a redesign keeps**, **Depth**, **Before**, **The plan** and **Build**. Applied preservation of supplied facts, chosen brand and discoverable actions while changing composition. The exact logo and complete destination reach remain; this reference supplied no common art direction or code.
- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): read **Assess Adaptation Challenge**, **Desktop Adaptation**, **Implement Adaptations**, **Verify Adaptations** and the content-driven breakpoint/input/testing material. Applied upfront useful context, task preservation through reflow and checks of actual input/navigation. Container queries let enlarged text stack the accepted split composition when it needs room. Side-navigation suggestions were not adopted.

Actual homepage/domain/viewer/destination contracts, common product/data briefs and repository architecture/accessibility guidance were read. Shared fixture is imported as data only. No peer presentation source or earlier prototype implementation was opened or reused. Tooling discovery identified the already installed Playwright/Chromium; the check script uses that installation without adding dependencies.

## Local navigation and truthful states

Local routes use `?persona=reaves|neural|guest&view=player|team|matchup|standings&id=…`. Links work through History API navigation with visible back-to-home links, normal Back/Forward, destination-heading focus and source-link focus restoration on browser Back. The explicitly labeled persona select is synthetic only; it updates query and `html[data-persona]`. Unknown personas fall back to Reaves. Invalid local ids produce a useful unavailable page rather than guessed data.

`html[data-personal-study-ready="05"]` is set after local fonts and initial non-lazy images settle. `?stage=structure` keeps the same content/geometry while neutralizing colors and hiding image content without removing its dimensions.

All current fixture values are visibly synthetic. Completed Week 2 samples retain their period and partial-player counts, separately from Week 3. Papichooter's zero and NeuralNets' missing score remain distinct; no leader/margin is inferred for that pair. Reaves' quote coverage is 24/24; NeuralNets' 16/22 subtotal cannot become a complete total. Both league value ranks remain unavailable. Quotes are modeled FAAB, not held money. No history line, Lineup Power, fabricated news/injury, player game count, account action, model generation or mutation is introduced. NeuralNets' historical team view retains the previous-manager qualification.

The footer exposes all 15 fixture destinations. Production exits are visibly identified in body/footer; every external anchor has accessible wording that identifies leaving the prototype. No external exit was followed during verification.

## Reproduction

Open the existing repo-root static server:

`http://127.0.0.1:4207/qa/homepage-personal-20/05/?persona=reaves`

Use `persona=neural` or `persona=guest` for the other complete homes. Run the bounded automated check with the already installed tools:

`node qa/homepage-personal-20/05/check.mjs`

An alternate static-server base can be supplied as `GOAT05_BASE`. The runner writes only this directory's `browser-evidence.json`; it does not capture/package the final catalog.

Stable actions and expected outcomes:

| Persona | Selector | Expected local result |
| --- | --- | --- |
| Reaves | `#action-player` | `main[data-view="player"][data-player-id="1444"]`, Damian Lillard, **42.5 points** |
| Reaves | `#action-matchup` | `main[data-view="matchup"][data-matchup-id="m1"]`, 184.5 vs 171; saved **56%/44%**, explicitly synthetic |
| Reaves | `#action-standings` | `main[data-view="standings"]`, all ten current rows |
| Neural | `#action-player` | `main[data-view="player"][data-player-id="1380"]`, Giannis, **45 points** |
| Neural | `#action-matchup` | `main[data-view="matchup"][data-matchup-id="m4"]`, papichooter **0**, NeuralNets **Score unavailable**, no saved probability |
| Neural | `#action-standings` | Full ten-row standings, NeuralNets explicitly marked **Your team** |
| Guest | `#action-team` | `main[data-view="team"][data-team-id="1"]`, public Reaves club summary, no inferred private roster |
| Guest | `#action-standings` | Full standings without a claimed viewer team |
| Guest | `#action-matchup` | Public m1 score/context, no personal model block |

All links above can be focused and activated with Enter. Destination focus is `#page-heading`. Browser Back must return to home and focus the originating action. `#back-home` is the explicit ordinary return-to-home link. `#context-matchup`, `#open-my-team`, `#all-players`, `#persona`, `#sources`, `#full-standings`, `#roster-table`, `#player-points`, `#player-quote` and `#saved-model` support further inspection.

## Actual browser evidence and limits

`browser-evidence.json` records the exact final HTML/CSS/JS hashes and input fixture hash, six persona/width combinations, 18 primary action activations, destination focus, browser Back/source focus and all 15 footer routes. The final check passed at **1440 and 1120 CSS px for Reaves, NeuralNets and guest**, including **200% root text size** with no horizontal overflow. Each primary local destination also stayed within its viewport.

The first enlarged-text run found unbroken manager names overflowing the 1120px standing companion. Container-driven stacking and intrinsic text wrapping fixed it. The final recorded run passes. Supplemental checks exercise NeuralNets' 22-player roster/six unpriced quotes, AJ Dybantsa's unavailable quote/evidence, historical owner qualification, Reaves' complete quote coverage/unavailable rank explanation, native persona switching and structure-stage geometry parity.

Method: installed Playwright, headless Chromium, local HTTP server, reduced motion. Actions were activated by keyboard Enter; source disclosure was opened by keyboard. All six runs reported **zero page errors and zero external requests**. Temporary local screenshots were used to inspect the three authored home compositions; root owns final captures and packaging. Enlarged root text is evidence of text reflow, not a claim of physical-device or browser-zoom testing. Safari, Firefox, physical devices, real sign-in and production destinations were not exercised. No production app build/test was run for this isolated static concept.

Source is frozen after the bounded checks. No known blocker remains.
