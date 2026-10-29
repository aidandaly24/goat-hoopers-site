# League wire — full art, option 06

Source-ready for root's independent captures and critique. This is one of twenty retained directions; it is not a selection, production change or final user acceptance. Frozen `wireframes/06` and `structural-revisions/06` were preserved.

## Exact reference work

Read `ART-BRIEF.md`, only allocation 06 from `art-allocation.json`, the project's existing design guidance and this option's corrected source. Primary guidance was read directly, not inferred from names or installed as a workflow:

- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md): let one content-specific idea govern the whole experience. Here the date rail owns the composition, including the register. Purposeful type, rhythm and actual league identities replace generic marketing anatomy.
- [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): retain content, wiring, routes and hooks, and compare against the starting inventory. No Hallmark scaffold, linter or script was downloaded or executed.
- [Elaya redesign](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md): diagnose existing patterns, break equal-card symmetry, use focused hierarchy and inline expansion, preserve states and focus. This allocation's palette/fonts and the user's immediate-interaction/no-tracking requirements take precedence over that document's preset values, gradients, floating chrome and blanket reveals.
- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): change the task arrangement for the available space while preserving functions. Phone dates become compact left-spine markers, market value leads its top-three annotation, and the register gives search priority over repeated context. Browser viewport evidence is distinguished from device evidence.

GitHub Raw links were rejected by the web reader; the successful GitHub file views supplied the actual applicable text. No downloaded code or external assets were executed, and no installation was attempted. These are read-only design references, not a wholesale adoption of their rules.

## Visual decisions

The assigned pistachio/deep-forest/white direction is a complete reading field, not a set of colored feed cards. Pistachio is the page ground. Deep forest carries readable content, links, focus and selected filters. White marks the continuous date rail. The source date remains the organizing object even as entry widths and left/right ownership vary.

Local **DM Sans** handles reading, headings and tabular values; **IBM Plex Mono** is reserved for dates. No manual tracking, italic accent, gradient, opacity stack, decorative index, row-divider forest, shadow or generic bordered feed slab is used. The headline is “League wire”; there is no introductory hero above an unrelated dashboard.

`tokens.css` declares local font resources and semantic reading/heading/number/date roles, type scale, weight roles, paint roles and spacing roles. Consumers use those roles. Literal paint values and font families are confined to role/resource declarations. Two existing OFL assets were verified against the local font catalog:

| Font | Local file | Verified SHA-256 |
| --- | --- | --- |
| DM Sans variable | `../../assets/fonts/dmsans/DMSans[opsz,wght].ttf` | `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d` |
| IBM Plex Mono regular | `../../assets/fonts/ibmplexmono/IBMPlexMono-Regular.ttf` | `6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46` |

Only approved local portraits are used. Their natural color, deliberate top-centered crops and adjacent names carry identity. There is no unrelated arena ornament or added imagery. All ten franchise faces remain visible in the phone register, including at 320px.

## Composition and copy refinement

- Retained the corrected chronological stream and its unequal-width entries. The current matchup, market observation, form, moves, saved slate, completed evidence and dated issues still use the same source periods.
- Gave the first matchup a direct checked date and one incomplete-status explanation. The repeated current-pair model summary is a native disclosure; all five saved returns remain at their own November 10 entry.
- Removed redundant annotation labels and repeated numeric interpretation around the AI slate. The actual returned choices, probabilities and confidence stay in the five rows. Duplicate member move prose was removed while the same move remains in the dated activity list.
- Kept the compact **Synthetic concept** disclosure. Its complete provenance remains expandable, with fixture date distinguished from today.
- Made phone market reading start with total, basis, coverage and full-roster disclosure, followed by its highest modeled FAAB values. Desktop keeps these across the time spine.
- Made the as-of register a focused reader. Its log filters are hidden while inside the register and restored on return, with prior scope/period/scroll and event-trigger focus retained. Search is near y447 at 320px. Repeated inventory and unavailable-producer notes remain in a coverage disclosure.
- Retained the GOAT identity and every existing destination. Header and footer stay quiet navigation; neither becomes an app-chrome slab or a decorative closing scene.

## Factual and behavioral preservation

The only data import is still `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. No shared facts or providers changed.

- Current: synthetic November 12 checked snapshot, Week 3, both managers/records/scores. Known 0.0 and null Pending remain different; incomplete never becomes final.
- Member: own identity, count, standing and actions; model total/basis/time/coverage, top three and all 24 values; form watch, recorded-history gap, news and recent move. Public rendering has no personal edition or `/team` action.
- Completed: exact supplied Week 2 interval November 2–9, end exclusive, GP/points/coverage. Five unique players; shared Joel Embiid appears once with both best/rough labels.
- AI: all five actual returns. First choice remains roster 2 at 35%, other roster 1 at 65%, independent confidence 20%. Timestamp/model/prompt/input/evidence and current-name qualifications remain accessible. Null input snapshot is explicit. Stale retains source labels; missing invents no rows or percentages.
- League: ten faces and teams, all managers/records/opponents, all 228 unique player references with position/NBA/IDs and profile links; search and actual team/player sort; all ten rank/W/L/PF rows, with hundredths converted using `pointsFor/100`. Prior-manager attribution remains.
- Editorial: both archived issues and routes, three exact spotlight stats/opinions/periods/selections/sources, dated happenings and original checked dates. The coherent archive `[1,5]` pair remains separate from current Week 3 and the contradictory `home.edition.game` pair.
- Unavailable History/Power producers remain honest gaps. No trend, lineup rank, event timestamp, roster leg or current result was fabricated.

Ready remains `document.body.dataset.studyReady='06'`. `window.goatStudy` retains all eight member states (`default`, `league`, `personal`, `week2`, `market`, `ai`, `archive`, `directory`) and six public states. Forms, IDs, handlers, route semantics and native browser navigation were retained. A full comparison across states found the same **275 unique href destinations**, with none added or removed.

## Representative interaction and motion decision

There is no routine reveal, stagger, scene movement, autonomous timer, RAF or score tween. The time spine and filter labels already explain where an observation belongs; motion would delay frequent inspection. Selected-scope paint and visible focus provide immediate feedback.

Pointer path: choose Market, inspect All 24 roster values, open the register, search a player, then Return. Keyboard path: activate the same controls, Enter opens native roster/model disclosures, Escape closes Menu, and Return restores the event's trigger focus. Reduced motion uses the identical immediate path and content; no animation library or alternate scene is required. The representative state path is still and fully operable.

## Actual checks

Installed Chromium/Playwright against root's local server, not a live backend:

- Module syntax passed; no browser page errors.
- All eight member/six public states × ready/stale/missing × 1440/390/320 × 16/32px root text: **252 combinations**, zero page-width overflow. Expanded register/market/AI/archive/Week 2 disclosures also passed 320px with 200% root text.
- Verified ten team rows, ten visible franchise faces, 228 roster URLs representing 228 unique players, all 24 member values, five exact AI rows, five unique completed players. Long names and actual populated lists were exercised.
- Fourteen unique approved portrait files decoded successfully across the states. Both local font families loaded. Runtime requests stayed on the local server; zero remote runtime requests.
- Embiid search returned one team/one player and retained focus. Empty search, team A–Z sort and player-name sort passed. Market scope returned its two observations; an incompatible source period produced an honest empty state. October filtering returned four dated entries and no current matchup. Reset recovered the log.
- Current pairing selection retained input focus. Keyboard Enter opened roster and current-model disclosures. Menu Escape restored summary focus. Register Return restored `event-register` trigger focus. Native public comparison and browser Back returned to the member URL. No new internal URL-history behavior was introduced.
- Public mode suppressed personal entries/actions. Missing retained zero saved rows; stale retained five labeled rows. Reduced-motion preference retained register functionality.
- Consumer-role audit found no literal paint or font-family/font-size values in consumer rules, no tracking, opacity or animation declarations. Measured rendered pairs: forest/page **9.47:1**, secondary/page **6.59:1**, selected text **11.81:1**, dates/white rail **11.81:1**. These are bounded color checks, not a universal accessibility claim.

Root owns the full-state evidence and independent review. Local desktop/phone/market/register inspection images were temporary and are not source deliverables. Source is four files plus this note: `index.html`, `tokens.css`, `style.css`, `app.js`, `ART.md`.

## Limits

No production, shared source, frozen folder, Muse lane, root infrastructure, Git, package or remote deployment was edited. No full screen-reader, physical-device, Safari/Firefox, live authorization or external-route integration pass was performed. This remains a synthetic local concept; fixture mode is not an authentication boundary. Existing data gaps and contradictory unused source pairing are documented rather than repaired in shared data. Independent captures/critique and final user acceptance remain with root.
