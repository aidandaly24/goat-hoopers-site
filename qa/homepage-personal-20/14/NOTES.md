# 14 — The linked brief

Source ready and frozen for root capture. This is the revised, screened concept 14: a complete continuous prose-led homepage. It does not reuse the original rail or two-player comparison architecture. Only `14/` was authored; no peer source, shared helper, fixture, production file, dependency, git action or publication was used.

## Open and capture

- `/qa/homepage-personal-20/14/?persona=reaves` — default member, Reaves Dropper.
- `/qa/homepage-personal-20/14/?persona=neural` — contrasting member, NeuralNets.
- `/qa/homepage-personal-20/14/?persona=guest` — public-only guest.
- Append `&stage=structure` for the same content and geometry with neutral color and hidden imagery.
- Wait for `document.documentElement.dataset.personalStudyReady === "14"`. The persona is in `document.documentElement.dataset.persona`.
- Existing local server: `http://127.0.0.1:4207/`.

Root owns final captures and packaging. Temporary local inspection images were removed after review.

## First three functional checks

1. **Owned-player reading and return.** On Reaves, `.primary[data-note="player:1444"]` is Read Damian's week. Activate it with Enter. `#reading-note[open]` appears, `#note-title` is Damian Lillard and receives focus. `#note-content` contains 42.5 completed Week 2 points and $74.00 modeled FAAB. Escape or `#close-note` closes and restores the same trigger/document position. Browser Back closes; Forward reopens. On Neural the equivalent first action is `.primary[data-note="player:1380"]`, with Giannis Antetokounmpo and 45 points / $135.50.
2. **Complete quote inspection and explicit gaps.** Open the first `button[data-note="quotes"]`. Reaves has 24 `.detail-list li` entries and 24/24 coverage. Fill `#quote-search` with Embiid: one result, $137.50, and `#quote-count` says 1 of 24. `#clear-search` restores 24. Neural has 22 entries, 16/22 coverage and exactly six Unpriced entries. Search AJ Dybantsa: his quote stays Unpriced. Escape closes even when the search has text.
3. **Zero versus unavailable and absent model.** On Neural, use `[data-note="matchup:m4"]` **with `.first()`**: there are intentionally two entry points, the narrative link and the supplied update. In the note `.note-facts dd` reads 0 followed by Unavailable. The explanation infers no leader/tie/margin and says no saved estimate is supplied. Close returns to the invoking link.

Supplementary local tasks: `button[data-note="standings"]` opens all ten standings; `button[data-note="slate"]` opens all five pairings; `button[data-note="team:8"]` includes the previous-manager qualification. The guest `.primary[data-note="team:1"]` opens a public team note with current record and qualified previous season. The labelled `#persona-select` navigates to the complete selected synthetic homepage; it does not log in.

## Architecture and truthful states

An ordinary masthead and horizontal local navigation lead to a russet linked brief. It opens with league position, an owned-player fact, own-game context and quote coverage. The white article connects team, opponent and player facts through readable paragraphs and short marginal source notes. Five Reaves or three Neural verified player facts remain visible inline. Historical and Arcade paragraphs stay in the same article. The full roster, standings and schedule are secondary readings rather than home table/card families.

Reaves shows 2–0, standing 1, 615.5 points for, 184.5 versus 171, $1,095.25 modeled roster value and 24/24 coverage. The saved synthetic split is 56%/44%, saved October 26 at 08:00 UTC, explicitly not calibrated odds. Confidence 0.35 is separately labelled in its note.

Neural shows 0–2, standing 10, 412.25 points for, own unavailable score against papichooter's recorded zero, $1,622.00 modeled **subtotal** and 16/22 coverage. Its primary action reads Giannis rather than repairing missing prices. Its saved estimate is unavailable. The six missing quotes remain unknown. Any 2025 1–20 record retains the previous manager as QBs Gremlins qualification.

Guest uses public team, standings, matchup and historical fields only. It has no personal roster, quote or model output. All current quantities are visibly synthetic. No current NBA affiliation, injury, games-played count, new news event, human quote, model identity, price movement, value rank, historical value series, Lineup Power or action submission was invented.

The footer exposes every supplied destination. There are fourteen distinct real-site destination paths plus local Home. Current-site groups and accessible link names identify exits. Player/team profile exits use fixture IDs. Sign in and My Team are real exits; neither is simulated locally.

## Typography, assets and sources

Reading: Georgia 18px/1.7, opening lead 24px/1.5, bounded paragraph measure. Headings: local non-condensed Space Grotesk 500, 30px section headings / 54px team heading, with a smaller 1120px scale. Controls: Verdana 12–14px in the actual implementation. Data: system sans with tabular figures, retaining source precision and two decimal quote values. Names wrap intrinsically and no text is ellipsized or shrunk to fit.

Space Grotesk is the approved existing local OFL font from `qa/homepage-structures/assets/fonts/catalog.json`; the original OFL notice remains untouched. No font was downloaded. The exact approved GOAT horizontal logo and supplied free-throw preview are used. No portrait hero, removed figurine family, canvas, WebGL or generated illustration.

Product inspection was from the complete required homepage/personalization/destination sources and relevant architecture, ownership, data and design guidance listed in PLAN. It did not run production or issue live API, account, market, database or AI calls. The only shared import is the data-only fixture module.

[Redesign Existing Projects primary SKILL.md](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md): complete rendered skill read, including typography, layout, states, content, components and strategic omissions. The Raw download failed, but the rendered primary source was available. Applied bounded prose, aligned numeric data, explicit current location and dependable return navigation. Did not adopt its prescribed fonts, gradients, animation or audit commands.

[Better Colors primary embedded skill](https://www.ui-skills.com/skills/jakubkrehel/better-colors): complete Colors-through-Reporting body read. Supplemental linked files were not read. Applied semantic color roles, one action meaning, text labels for gaps and measured foreground/background pairs. Neither source was installed or run. No reference index was treated as a source read.

## Checks actually performed

- `node --check main.js` passed on final source.
- Chromium loaded all three persona states at both 1440 and 1120 CSS px, 1000px viewport height. All six had `scrollWidth === innerWidth`; required names, source states, quote coverage and route discovery were checked. No page runtime errors were observed.
- Viewed local full-page captures of Reaves at 1440, Neural at 1120, guest at 1440, and Neural enlarged to 125%. Fixed an initially stretched game image and an offscreen skip-link capture artifact. These temporary checks are not the root's final captures.
- Neural at 1120 with 125% CSS zoom retained `scrollWidth = 1120`. At 200% it also retained `scrollWidth = 1120`; the opened player dialog stayed inside the viewport (x 42, right 1078). These are local enlarged-rendering checks, not a claim of OS text-setting coverage.
- Enter, Close, Escape, Back and Forward; heading focus, trigger restoration and scroll restoration; quote search/Clear/count; all 24/22 quotes; six Unpriced rows; unknown preservation after filtering; absent Neural model and known zero versus unknown passed. Escape from populated search initially cleared search before closing, then was explicitly handled and rechecked.
- Native keyboard Tab reveals the skip link; moving focus away hides it. All notes use native dialog modality.
- Guest normal versus structure geometry was identical: body height 2871px; opening 511.796875px; reading article 1439.5px. Structure changes no content or layout.
- Computed sRGB stylesheet foreground/background pairs: body 15.33:1; muted 6.85:1; link 8.13:1; cover text 6.68:1; primary button 6.68:1; source text 12.79:1; focus on paper 7.27:1. These measurements cover the listed solid rendered roles, not an exhaustive assistive-technology or every-state audit.

No production build, backend verification, mobile capture or live-service test was performed, because this is an independent static desktop QA prototype.

## Frozen source fingerprints

Fingerprints are recorded below after final source checks. Root may capture the current files directly. No release action was taken.

```text
b940f00074347eb35a5a56d4ba8e1085fbaeeb3068419a664eec980e2da1be46  index.html
ead1a117983811e679bd3e1edf1caf82c074559c1541890909d1b0894b13ac45  style.css
08d1b7e9521f15c8f59fcaba9433cdfbe8bf3e710df4a5abc8cb43a9481808f3  main.js
```
