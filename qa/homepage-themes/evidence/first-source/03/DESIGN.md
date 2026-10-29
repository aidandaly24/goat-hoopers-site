# Broadcast Network — direction 03

A complete independently authored QA homepage. Vivid crimson, royal blue, dark blue and white run through the score bug, saved slate, program rundown, valuation, editorial desk, roster sheets, standings and footer. Sharp rectangular bands and condensed scoreboard typography establish the broadcast identity throughout. There are no autonomous updates or Live claims.

The user question is “What matters for my team and the league this week?” The member's primary action is My team, beside View roster. Public readers can inspect the current featured pairing, saved five-pair slate and every team's roster. The recognizable selected GOAT logo is preserved.

## Composition and type

The arena has an independently chosen wide, shallow crop. Scores sit in solid HTML surfaces beneath it, with no text relying on photo contrast. The full-width five-pair model slate follows immediately. A numbered running-order rail introduces the remaining program segments. Ten price anchors are integrated with their franchise rows instead of a separate card gallery.

Barlow Condensed is the local display and scoreboard face; local DM Sans handles reading and controls. Both use supplied official OFL font files from `../../assets/fonts/`. Every font size is root-relative. Color roles: crimson `#c51335`, royal blue `#163cce`, deep blue `#081c62`, ink `#11172c`, metadata `#47516a`, light blue `#edf1ff`, white `#ffffff`. Measured opaque text/background contrast: white/crimson 5.97:1; white/royal blue 8.17:1; white/deep blue 15.52:1; metadata/light blue 7.02:1; ink/white 17.76:1. The arena caption uses an opaque deep-blue backing.

At narrow widths the running order enters normal flow, navigation is a native-button disclosure, scores stack by team, and all five saved rows remain visible. Name/value groups and player anchors use the available line width. Full rosters and all member values use native details. At large root text sizes the same content remains accessible without page overflow or single-letter menu labels. Numeric roster total remains on one line.

## Truth, content and states

The visible offline-fixture notice and footer distinguish synthetic current records, scores, prices, form, moves, news and AI from dated editorial. The source-check timestamp can be later than the review clock and is explicitly not evidence of current league state. A known 0.0 stays separate from Pending; the featured matchup is incomplete. The dated draft story stays separate from the directory's current Week 3 pairing.

The five-pair saved slate retains both probabilities, actual returned choice, independent confidence, generation timestamp and accessible model/prompt/input/evidence notes. The first returned choice remains roster 2 at 35%, alongside roster 1 at 65%. `?ai=stale` labels each saved row before expansion. `?ai=missing` retains current pairings with unavailable results and zero saved-row audit hooks. Season/week/ordered-pair mismatch handling also renders an explicit unavailable message.

The member total retains its modeled FAAB basis, computation time, 24/24 priced coverage, top three and 24 complete player-value entries. Recorded history and Power are explicitly unavailable. Observed form, modeled price movement and dated editorial watch are distinct. Shared best/rough selections appear once with overlap and completed-week coverage explained. All ten franchise rows retain managers, records, current opponent, top modeled player with profile/price links, and all 228 unique roster links with position/NBA team. Previous-manager history remains visible for NeuralNets. All ten standings and all archive entries remain accessible.

No external runtime requests, installs, APIs, production CSS/components, backend changes, auth changes or generated data are introduced. Only this direction's files are authored. No other direction or earlier design was viewed or copied.

## Verification — static component fixture

Tested in installed `/usr/bin/chromium` using installed Playwright against the root-owned local server on port 4206. The exact source below was checked after the final CSS change.

- Six rendered states: member/public × ready/stale/missing AI.
- Thirty-six full-page geometry cases: those six states × 1440/390/320 CSS px × actual root font 16px/32px, with every details element open. Document scroll width matched each viewport. This is actual root text enlargement, separate from narrow reflow; browser zoom was not substituted.
- Body text measured 16px/32px; desktop h1 76px/152px. Narrow h1 uses the same exact 2× root scaling. Currency total was verified as a single readable line at every tested width/font combination.
- 10 directory containers, 10 modeled-player faces, 228 unique roster references, 5 ready/stale AI rows, 0 missing AI hooks, and 24 member value rows; public has no personal audit hooks.
- Menu Enter opens; Escape closes and restores focus. All ten roster disclosures were activated with real clicks; member values with Enter. Native disclosures retain their contents.
- Team, manager and full-roster player searches, clear/zero-result recovery, directory roster-size/standing sorts and standings name/PF sorts passed.
- All tested visible primary buttons, input/select controls, summaries, navigation and action links meet 44px minimum height on phone.
- No page errors or failed local asset responses. Both fonts loaded; all portrait/game/arena/logo images loaded without broken assets. Runtime request audit found no external requests. Reduced-motion rendering retained all content.
- Inspected actual desktop full-page rendering and phone feature, notebook, directory and footer captures, including enlarged phone controls, score names and values. Root owns the final bulk comparison captures; temporary author captures were removed.

Limits: this is a static fixture, not a real Next route, actual device or screen-reader pass. Links retain real destination URLs; this server does not implement those app routes. Next history restoration, authenticated live data and the complete playable Arcade path were not tested here. No independent pairwise theme comparison or production acceptance is claimed; those remain root-owned.

## Frozen source

`index.html` SHA-256: `2e41c9101d01834c56746827596ee7a71d3df676b617c5f5adf8664c20f5ff45`

No Git operation, commit, merge or deployment was performed. The final response supplies hashes for both deliverables.
