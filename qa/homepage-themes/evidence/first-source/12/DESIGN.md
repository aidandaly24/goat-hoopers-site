# 12 — League Zine

An independently authored static homepage study in this folder only. The current QA brief explicitly permits this palette and typography beyond the older production Paper + Slate decision. No production styles, components, configuration or data have been changed. No earlier or peer theme was inspected, imported or used as a template.

## Surface contract

- **User question:** What matters for my team this week, and where can I inspect the league?
- **Primary action:** My team, beside the member identity, record, standing and roster count. View roster is adjacent. Public visitors get team discovery and the same current league reference.
- **Relevant states:** Member/public; incomplete current matchup; known 0.0 versus Pending; synthetic current facts versus dated draft editorial; ready/stale/missing/unmatched saved AI; empty search; full roster and valuation disclosures; unavailable value history, Power and league leaders.
- **Narrow layout:** Score identities can wrap into separate rows; the collage follows essential matchup copy. Notebook columns stack. Native disclosures retain full roster and model evidence. Standings become pink ledger entries with explicit Rank/Wins/Losses/PF labels. Search, sort and actions remain visible. Container-based face layouts and adaptive value columns also reflow at enlarged root text sizes.
- **Forbidden patterns:** Invented quotes, fresh generated AI, odds presented as certainty, zero substituted for missing evidence, fabricated value-history charts or Power ranks, distorted data or controls, replaced player imagery, fake game controls, autonomous motion and external runtime requests.

## Visual decisions

Lemon `#f5f129` is the continuous page stock, ink `#151515` supplies the masthead and edition spread, and hot pink `#ff6cad` supplies the member desk, player clippings, directory face slips and standings ledger. The small AI sheet uses warm stock `#fffdf4`, a black edge and a hard offset shadow; it reads as another pasted sheet within the zine. This treatment continues through rosters, working controls, market links, archive entries and footer.

Local Anton sets short poster headings, team names and prominent values. Arial/Helvetica supplies ordinary reading and controls; Courier New gives scores and data tabular numerals. Every font size is root-relative. Body is 1rem (16px normally), secondary copy .875rem (14px), and metadata .75rem (12px). Long names and source text wrap. Readable content has no transforms.

The lead combines the approved arena still and a bounded, grayscale approved portrait. A single rotated lemon tape and a separately rotated saved-output label establish the off-axis paper language without rotating an essential name, statistic, body paragraph or control. Pink dotted paper on the member nameplate, black rules, dashed folds, rough visual hierarchy and the alternating spreads carry that character farther down the page. No player photo is regenerated or retouched; grayscale and crop are CSS presentation only.

The selected GOAT logo remains unchanged. Anton loads from `/qa/homepage-themes/assets/fonts/anton/Anton-Regular.ttf` (official Google Fonts asset, SIL OFL 1.1; catalog SHA-256 `a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab`). All arena, game, logo and portrait URLs come from the common inventory. Below-fold images are lazy loaded. There is no package, external stylesheet, remote runtime, canvas or WebGL dependency.

## Information and behavior

The current featured pairing comes from the member matchup or public directory, never the old edition story. Both teams retain manager, record, current score, Week 3 and incomplete status. The separate unpublished Oct 5–11 edition preserves its supplied opinion, NBA/college stat periods, selection notes and dated sources. It is labelled as a draft sample. The fixture's dated narrative/frozen IDs are not promoted to current matchup facts.

The member desk retains modeled FAAB total, priced/unpriced coverage, computation timestamp, top three values and price moves, all 24 player values and unavailable recorded history. Form watch retains EMA basis, observed games, availability note and period; it is separate from modeled price. Completed-week best and rough lists retain points, GP, coverage and overlap qualification. Team news and moves are explicitly synthetic.

All five saved AI rows preserve the actual returned choice. In the first row, Ware the Hoes At? is still the returned 35% choice, Reaves Dropper retains 65%, and independent confidence is 20%. Each save time is visible. Model, prompt, roster IDs, input/result evidence and missing snapshot/baseline provenance are available in native disclosures. Stale labels are visible while closed. Missing or unmatched saved output shows Unavailable/Unmatched and retains current pair identities without a `data-ai-pair` hook.

The directory combines all ten modeled faces with all ten team containers. It retains manager, current record, opponent, prior-season record and finish, full rosters, position/NBA team, actual player profiles and Stocks links. NeuralNets' 2025 line immediately identifies the previous manager as QBs Gremlins, with attribution repeated inside its roster disclosure. Search covers team, manager and player; a player-only match opens the relevant roster. Sort supports team number, name, manager and roster size. No-match results have a working Clear search control.

All ten standings rows remain visible, with functional rank/name/PF/wins sort and PF divided by 100. League leaders and Power are honest unavailable states. Recent transactions, Stocks, trade analyzer, the real free-throw route, Arcade and both dated archive routes remain available. The complete fixture warning and provenance are accessible through the top source-notes link and footer disclosure.

Audit hooks: `data-mock-ready="12"`; ten `data-team-id` containers; ten `data-face` entries; five ready/stale `data-ai-pair` rows; one member `data-roster-values` list with 24 entries; four member-only `data-personal` areas and none in public mode.

## Actual checks

Browser checks used installed headless Chromium through the installed Playwright package against root's static server at `http://127.0.0.1:4206/qa/homepage-themes/directions/12/index.html`. This is fixture evidence, not a production Next route test.

- Member and public at 1440, 390 and 320 CSS px: full-page captures after scrolling through the whole page to load images. All local images and Anton loaded successfully; no browser errors or external requests were observed. Full-page/footer captures were visually inspected, alongside opened model provenance, a complete roster and enlarged valuation details.
- At all six view/width combinations, document scroll width equalled viewport width. The check was repeated with every native disclosure open. Separate root enlargement set `html { font-size: 200% }`, producing a computed 32px root and body; all six enlarged/open cases also retained viewport-width reflow. This was actual root text enlargement, not a screenshot resize.
- Menu: keyboard Enter opens; Tab enters ordinary links; Escape closes and restores focus to the Menu button. The menu is a nonmodal normal-flow disclosure. Hidden links leave the tab sequence. Link activation and responsive breakpoint changes close it.
- Search: team (`NeuralNets`), manager (`TommyDieselfuel`) and player (`Damian Lillard`) each find the correct single team. Player search opens its roster. No-match and Clear search work. Directory name/roster-count sort and standings name/PF sort change ordering meaningfully.
- Verified 228 unique roster profile links, all 24 member valuation entries, ten directory containers, ten modeled faces, ten standings rows and five saved AI hooks. Known 0.0 and Pending remain distinct. Member-only hooks are absent from public view.
- `?ai=stale`: five closed-row stale labels and saved hooks. `?ai=missing`: zero saved hooks, all five current pairings and explicit unavailable text. A browser-only intercepted module changed the saved week to 999 to verify unmatched-output rejection; all five current pairings remained and zero saved hooks rendered. Source fixture files were unchanged.
- Reduced-motion emulation retains the complete information and controls. There is no autonomous motion. Required application hrefs and both archive hrefs were checked. All `aria-labelledby` and `aria-controls` references resolve.
- Opaque rendered color roles were checked: ink/lemon 15.21:1; ink/pink 6.96:1; ink/stock 17.92:1; focus/lemon 8.61:1; focus/pink 3.93:1. Dark surfaces use stock focus (17.92:1 against ink); yellow/pink editorial sheets explicitly restore the dark focus role. Essential text is never placed directly over the collage.
- JavaScript syntax was checked with `node --check`. No application build is needed for this isolated HTML/CSS/module preview.

## Limits

No physical-device, Safari, screen-reader or authenticated application-flow test was performed. Destination href checks preserve the real routes but do not establish the application behind this static server or its Back/Forward restoration. Portraits, values, roster and AI fixtures were validated as supplied; this work does not claim current live league truth. No missing data producer, AI input snapshot, pricing history, Power ranking or official award is invented.

Review captures are transient `/tmp/theme12-final-{member,public}-{1440,390,320}.png`, with opened-state captures under `/tmp/theme12-open-ai.png`, `/tmp/theme12-open-roster.png`, `/tmp/theme12-footer.png` and `/tmp/theme12-root200-values.png`. Root owns the final comparison captures. The final source fingerprint is reported with the source-ready handoff after all edits.
