# Court Atlas — direction 10

> Accessibility repair copy. The original design and author verification record below are retained for provenance. Those 200% checks did not establish the combined 390px/root-font-200% case. The corrected diagnosis, scope and actual repair results are in [QA-REPAIR.md](QA-REPAIR.md).

Question: what matters on our floor this week? The first action is **My team** for the member or **Explore teams** for a public visitor, close to the current pairing and useful roster context. Ordinary player, team, league, market, game and archive routes remain available.

The original arena becomes a static editorial map. Three indexed court regions correspond to real visible HTML: the baseline carries identity and valuation, center court carries the current matchup, and the right wing carries scouting. The small numbers on the image are a legend, not a scene interface. Scores, players and prose are outside the busy artwork. There is no 3D runtime, canvas, animation, generated material or replacement mascot.

The desktop composition is an open three-column spread with a strong central score sheet, narrow working margins and one original court image. Inter varies from light italic week numerals to dense player names; Geist Mono aligns values and source figures. All colors use the selected Paper + Slate semantic roles. Subsequent rows widen into three editorial takes, a saved-model ledger, the ten league faces, a full directory and standings, tools, and both archived editions. The result is a readable league page before any index link is used.

The member baseline includes standing, manager, roster count, current modeled total, top three prices, complete native 24-player value disclosure, pricing timestamp and unavailable recorded history. The wing distinguishes observed EMA form from prices and dated editorial. Completed-week performers and the team wire remain member-only; the public page uses league player and modeled-price context.

The current pairing comes from the member's current matchup or the first current directory pairing. Known 0.0 and unknown Pending remain different. The supplied October draft is visibly stale and does not narrate the November fixture as opening week. Its inconsistent retained prose/team IDs are explained in its source disclosure. Editorial periods, source dates and selection reasons stay with the actual opinions.

All five saved AI pairs display each probability, the actual returned choice and separate confidence. No winner is inferred from probability order. Ready, stale, missing and unmatched states are explicit, with model, prompt, roster IDs, saved timestamp, evidence and unavailable input/baseline metadata disclosed per pair. Sample links switch `view` and `ai` locally; they do not authenticate, generate picks or save data.

At below 64rem, center court precedes the member baseline beside it; the wing widens below. Below 40rem, all regions become a linear reading order: matchup and court, personal or public baseline, scouting, editorial, recap, models, faces, directory/standings, tools and archive. Names wrap, directory rosters become a single list, and the same destinations remain available through an ordinary nonmodal Menu disclosure plus persistent Stocks. Escape closes the navigation and returns focus. Native roster/provenance disclosures and visible labelled search/sort controls preserve access without modals.

Forbidden patterns: fake live scores, zero-filled missing values, inferred model choices, invented price history/Power, official-award labels on dated samples, scenic navigation that replaces content, giant player panels, repeated boxed cards, and page-width horizontal scrolling. The directory retains all ten teams, previous-manager attribution, current opponents and every actual roster reference. Search matches teams, managers and players; matching players open their complete roster. Sorting is available for directory and standings.

## Verification

Authored and checked only these two files. Local headless Chromium against `127.0.0.1:4198`, both `view=member` and `view=public`, at 1440, 390 and 320 CSS pixels:

- No page-width overflow in initial or all-native-disclosures-open states; no JavaScript page errors. All images were explicitly loaded and decoded in the final pass, with no broken assets.
- Exactly 10 directory teams, 10 faces, 5 ready saved pairs, and 228 roster references with 228 unique `/player/` routes in both views. The member has all 24 valuation rows; public has no personal region or value disclosure.
- Searching `Wolf` returns its single matching team and opens the complete roster. Clear restores all ten teams. Directory and standings name sort both place Huff n’ Puff first.
- Mobile Menu opens; Escape closes it and restores trigger focus. Keyboard first reaches Skip to content; activation focuses `main`.
- `ai=stale` visibly labels the retained five-pair slate stale. `ai=missing` displays Unavailable with no fabricated pair rows. Both retain reflow at 390px.
- Separate 200% text check at 1440px doubled each rendered element’s computed font size, not just viewport width or root size. Both modes retain page-width reflow with all native disclosures open. A separate root-font 200% check also passed. Reduced-motion emulation preserves all static content.
- The authored desktop and 390px openings were visually inspected as in-memory Chromium captures; the parent owns gallery files and broader capture/review. Inline editorial attribution links retain their ordinary text-link semantics.
- Computed WCAG contrast for the actual opaque light-theme role pairs: ink/paper 12.70:1, secondary/paper 5.15:1, accent/paper 6.56:1, white/accent action 7.22:1, incomplete-status/paper 5.51:1, control border/paper 3.41:1. All informational text stays outside the court image. This is a bounded token-pair calculation, not a universal accessibility claim.

This is static-fixture evidence, not production Next routing, authentication, backend, physical mobile, screen-reader or destination-game verification. No application build is relevant to these isolated HTML/CSS/JS files. No external data requests, installs, branch operations or production edits were performed.
