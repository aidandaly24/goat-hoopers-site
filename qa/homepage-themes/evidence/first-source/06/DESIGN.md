# 06 · Asphalt Streetball

This direction answers “What matters for my team this week, and where can I inspect the league?” The member’s primary action is **My team**, with **View roster** beside it. Public visitors get the actual current fixture pairing and a direct path into the searchable league roll call.

## Visual contract

- Asphalt `#20231f` is the full-page ground; deep black-green `#141713` supports source reading; burnt orange `#ae3918` is court paint. Warm white `#fff7ec` carries essential text. Orange `#ff9a61` identifies values and useful links. No cream-paper canvas or shared theme CSS.
- Local **Kalam** appears only in short handwritten annotations and the Week mark. Local **Barlow Condensed** carries the readable body and data at 18px, with 14px secondary text at the normal 16px root. Barlow Condensed is the locally available Barlow family; all type sizes are root-relative. Essential names, scores and values are HTML.
- The orange matchup poster sits asymmetrically beside a large, deliberately cropped owned arena photograph. An original CSS torn edge, angled handwritten mark, square actions and open dark lists carry the street-poster treatment through the page. Essential photo captions use an opaque dark surface.
- At 1440px the pairing, valuation, notebook, dated stories and AI use different useful column proportions. League faces are integrated into ten open directory rows, rather than repeated as a card gallery. Standings and league wire sit alongside one another. The market/trade/practice strip returns to court paint.
- At 390px and 320px the matchup leads, followed by the court. Sections stack; team names wrap; player lists stay complete. Intrinsic wrapping also handles true doubled root text. Phone standings reflow their cells into labelled row groups while retaining the native table and its header semantics.

User question → this week’s team and league context. Primary action → My team, then View roster. States → member/public, ready/stale/missing saved AI, known zero/Pending, unavailable history/Power/stats, empty search, dated draft editorial. Narrow layout → one reading column, wrapping actions and names, native disclosures. Forbidden patterns → invented data/awards/history, inferred model winner, tiny essential text, decorative controls, autonomous motion, generic light card grid.

## Inventory and truthfulness

The page imports only the shared offline data module. It retains the recognizable selected GOAT logo, every required destination, the current Week 3 featured pair, both managers/records/scores and incomplete status. The known home score is **0.0**; the absent away score is **Pending**.

Member-only content includes personal standing/roster count, current modeled FAAB total and basis/time/coverage, top three players, all 24 value entries, observed-form watch rows, the five unique completed-week best/rough selections with overlapping membership labelled once, exact period/GP/coverage, team news and recent moves. Public visitors keep useful league price anchors and dated editorial context. No personal content hooks remain in public mode.

All three dated spotlights retain their supplied opinions, stats, periods, selection reasons and source dates. Dated happenings and edition sources stay separate from current synthetic league data. Both archived editions retain dates, titles and routes.

The saved slate retains all five returned choices and both probabilities. The first returned choice is Ware the Hoes At? at **35%**, alongside Reaves Dropper at **65%**, with **20% independent confidence**. Choice is never inferred from the larger probability. Each row exposes model/prompt, roster IDs, saved time, evidence, and the unavailable input snapshot/time. Stale is visible before disclosure. Missing AI retains all five current pairs with Unavailable and no saved-row audit hooks. A nonmatching result follows the same explicit unavailable branch.

Each directory row carries its team/manager, current record/opponent, roster count, top modeled player/price and real profile/Stocks links. Full rosters retain **228 unique player links** with position/NBA team. NeuralNets’ prior-season record visibly attributes the previous manager, with the complete owner note available in its roster disclosure. The ten standings rows use PF / 100 and functional sorting. League statistics, Lineup Power and recorded team-value history show explicit unavailable states. The practice link targets the actual `/arcade/free-throw` route and uses the owned preview.

## Implemented interaction path

The native Menu opens with Enter, offers ordinary links and closes with Escape while restoring summary focus. Hidden menu links leave the visible tab sequence. Search matches team, manager or any full-roster player; zero results and clearing are useful states. Directory sorting supports standing, name, points-for and roster size. Standings supports rank, points-for, wins and name sorting. Every roster and provenance disclosure is native. The skip link focuses main; the final footer destination retains a visible keyboard outline. No modal, generated-on-render AI or animated scene is introduced.

## Actual browser evidence

Evidence type: **static component fixture**, served from this worktree at `http://127.0.0.1:4206/qa/homepage-themes/directions/06/index.html`. Chromium through the installed Playwright, headless Linux. No installs or external runtime requests.

Final `index.html` SHA-256:

`539ffbdbeeebdb1ba0d52dc72d67d5a30be0e5c6dd6f8580c72892fe832b09b1`

- Final-source render matrix: **36/36 passed**. Member/public × ready/stale/missing × 1440/390/320 CSS px × root 16/32px. All native details were open. The actual computed body font doubled **18px → 36px**. Every case had document scroll width equal to viewport width and no inner main-content overflow. This tests text enlargement separately from narrow reflow, without browser zoom or CSS transforms.
- Every state retained ten directory containers, ten modeled faces and 228 unique full-roster player links. Member mode retained 24 value entries. Ready/stale had five saved-row hooks; missing had none while five current pairs stayed visible. Public had no member-only areas. All ten standings rows remained present.
- Tested Menu Enter → Tab → Escape, closed-menu visibility and focus restoration; team search (NeuralNets), manager search (TommyDieselfuel), accented player search (Yanic Konan Niederhäuser), no results and clearing; directory name/roster-size sort; standings name/PF sort; first saved choice/probabilities/confidence and opened provenance; 0.0/Pending; skip-to-main; final footer Tab focus; reduced-motion content retention.
- Actual rendered desktop/phone screenshots were inspected for the lead, valuation, dated stories, AI, directory, practice/tools, archive and footer. All local images decoded successfully. Zero JavaScript errors and zero external requests were observed.
- Computed opaque foreground/background pairs measured with the WCAG relative-luminance formula: main chalk/asphalt **14.96:1**; secondary/asphalt **9.50:1**; orange/asphalt **7.60:1**; chalk/paint **5.82:1**; secondary/deep **10.81:1**; dark primary label/chalk **16.16:1**; primary hover dark/orange **8.21:1**; quiet hover chalk/deep **17.02:1**; focus/asphalt **12.46:1**. Meaningful photo copy is on an opaque surface. Primary actions and disclosure targets are at least 44px normally; inline prose/source links remain inline.

## Limits

These checks establish this static synthetic fixture, not production authentication, real Next routing/history restoration, data freshness, physical devices or screen-reader behavior. Chromium retained eleven semantic table rows including its header; this is not a screen-reader pass. The unmatched saved-result guard is implemented in source but was not separately injected into the unchanged fixture. Source destinations are correct paths; their application flows were not exercised from this static server. Portraits and the practice image remain lazy-loaded below the lead; capture tooling should scroll or await decoding before judging image availability. No production, configuration, database, Git or PR files were changed.
