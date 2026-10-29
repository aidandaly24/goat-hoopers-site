# 01 — Electric Night Court

Source-ready isolated QA direction. No production files or shared styling are imported or changed.

**User question:** What matters for my team tonight, and where can I inspect the league?

**Primary action:** Member **My team** (`/team`), with **View roster** (`/teams/1#team-roster`) alongside it. Public readers start with the current pairing and **Find a team**. Stocks remains directly reachable in the header at every width.

## Art direction and composition

Midnight navy `#090e25`, court deck `#111a37`, acid lime `#d2ff41`, and violet `#c3a4ff` establish an after-hours gym rather than a paper bulletin. Bebas Neue gives names, scores, section numbers, and large values an athletic condensed rhythm; DM Sans carries prose and working data. Both are local official Google Fonts assets listed in the shared font catalog with SIL OFL 1.1 provenance. No external font request is made.

The opening is an original SVG full-court stage. Its center line, lanes, arcs, and sideline organize the personal nameplate and paired scoreboard. A narrow acid sideline continues through the page, indexed section marks follow it, and open team rows act as the league's bench. Violet marks completed-week context, model probabilities, and the off-court tools. Flat square edges, wide open rows, prominent numbers, and minimal card framing carry the theme through the full page. The existing white GOAT mark stays unchanged.

The approved arena is a bounded natural 16:9 still with a caption, not a background beneath reading text. The actual Free Throw preview has its own useful launch link. Player portraits are bounded identity aids. No canvas, WebGL, figurines, invented photography, autoplay, or imitation game controls are present.

At 1440 px, the nameplate occupies the first third of the court and the pair occupies the remainder. The roster-value desk and observed-form notebook sit in two open columns. A violet completed-week band merges the shared best/rough selection once while retaining both labels. Five saved AI rows, three compact dated stories, ten roster rows with integrated modeled faces, standings, actual tools, and both archives follow.

At 390 px, the court becomes one reading column while the paired score comparison remains side by side where it fits. At 320 px or enlarged text, its score columns stack. Team name, manager, record, opponent, historical attribution, highest modeled player, price, and complete roster are retained. Standings become compact two-line rows with explicit W/L/PF labels. Container queries allow the working rows to respond to increased root font size as well as viewport width. All type uses rem-sized final rules; the checked body and h1 sizes double exactly when the root changes from 16 to 32 px.

## Data, actions, and relevant states

- Member identity, 24-player roster, standing, top three prices, all 24 modeled values, coverage, basis, and computation timestamp are supplied fixture fields.
- The current feature comes from `currentMatchup`. Known `0.0` remains different from missing **Pending**. Scores remain explicitly incomplete.
- The dated opening edition and its source statistics/opinions remain separate from the current matchup. Both dated archive entries retain their dates, titles, source notes, and real `/weekly/...` destinations.
- All five saved AI results preserve the returned choice, both probabilities, independent 20% confidence, saved timestamp, roster IDs, model/prompt identifiers, missing input snapshot, and supplied evidence. The first returned choice is the away team at 35%, even though the home team is 65%. `?ai=stale` visibly labels all saved rows as stale. `?ai=missing` renders **Saved AI unavailable** without zero probabilities or saved-row hooks. An unmatched pair takes a separate unavailable branch.
- All ten modeled faces are integrated into the team directory. All 228 unique roster references retain actual player links, position, and NBA team. NeuralNets' 2025 record explicitly retains the previous-manager/QBs Gremlins attribution.
- Search matches team, manager, and roster player names. Player matches open their full roster. Empty matches get an explicit result. Directory sorting changes real row order; standings sorting preserves source rank and displays `pointsFor / 100` as fantasy points.
- Member wire, moves, observed EMA form, completed-week points/GP, source period, eligible coverage, and shared selections remain separate from price and dated editorial bases.
- Recorded team-value history, league-stat producers, and Lineup Power remain unavailable. No chart, ranking, result, or trend is invented.
- Native links retain Home, News (`/intel`), Stocks, History, Arcade, AI Decides, Teams, Transactions, weekly archive, trade analyzer, team/profile/player routes, and actual Free Throw launch.
- The compact fixture label is always visible. Full synthetic-data warning and dated sources are accessible through native disclosures and the footer.

## Access behavior

Semantic headings, labelled search/sort controls, live search-result counts, native details, a focus-only skip link, and a visible acid focus outline are provided. Phone action targets are at least 44 CSS px; ordinary inline prose links retain their inline-link treatment. The navigation disclosure opens with Enter, closes with Escape, and restores focus to its summary. Hidden disclosures leave their children out of the tab sequence. There are no modal inspectors or motion-dependent states.

Reduced motion disables animation and transition rules. No autonomous motion is authored, and save-data does not remove content. Court lines are decorative and pointer-inert. Their final 16% opacity keeps the measured worst-case muted text/court-stroke composite at 6.01:1.

## Actual checks and evidence

Evidence type: **static browser fixture**, installed headless Chromium through installed Playwright, served by the coordinator's local server at `http://127.0.0.1:4206/qa/homepage-themes/directions/01/index.html`.

Final `index.html` SHA-256: `7f4e560a3f50fa6c40cefc25c83c3ac9a757709e78029a711fcf0b8b0db40d62`.

- Both `?view=member` and `?view=public` checked at 1440, 390, and 320 CSS px, separately at root `100%` (16 px) and `200%` (32 px), with **every disclosure opened**. All 12 combinations had document scroll width equal to viewport width.
- Actual body sizes were 16/32 px; h1 sizes were 83.2/166.4 px at desktop and 52.8/105.6 px at phone widths. This is root text enlargement, not browser zoom.
- Checked ten directory containers, ten faces, five saved AI hooks, ten standings rows, 24 member value items, and 228 unique full-roster player links.
- Exercised Menu Enter/Escape/focus restoration; player/manager search; empty search; directory roster-size sort; standings name and PF sorts; public member-area removal; stale five-row labels; missing AI zero saved rows and explicit unavailable state.
- Loaded both font families and all 17 rendered images successfully. No script errors, 4xx/5xx asset responses, or external runtime requests were observed.
- Inspected actual full-page desktop/phone captures and the opening stage. Corrected the arena/Arcade aspect handling and the enlarged-text data-row reflow during this pass.
- Calculated contrast: main ink/night 17.72:1; secondary/night 10.30:1; secondary/deck 9.25:1; violet/deep-violet 7.79:1; lime/row 14.08:1; dark label/lime 16.46:1; control boundary/night 6.03:1. These are defined foreground/background pairs, plus the stated composited court-line pair; they are not a screen-reader audit.

Machine-readable size/count/asset evidence: `selfcheck.json`. Local inspection captures: `selfcheck-wide.png`, `selfcheck-390.png`, `selfcheck-320.png`, `selfcheck-stage.png`, and `selfcheck-phone-stage.png`. Coordinator bulk capture and pairwise visual review remain separate.

## Limitations and forbidden patterns

This is a local static design fixture. No production Next routing/history restoration, authenticated state, real data loader, live API, physical phone, screen reader, or full Arcade gameplay path was exercised. Destination hrefs are retained; this server is not a production route test. No install, service, network source, Git operation, PR, commit, deployment, or production edit was performed.

Forbidden here: cream/Inter palette inheritance, generic marketing feature-card hero, fake Live labels, invented price history, inferred AI winners, synthetic current-week awards, truncated rosters, fake controls, and unreadable text over photography. No remaining implementation blocker is known.
