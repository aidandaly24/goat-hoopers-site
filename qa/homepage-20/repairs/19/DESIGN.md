# 19 — Timeline Edition

This is the responsive repair copy. The original `directions/19/` submission remains frozen and unchanged. Only enlarged-text/reflow behavior is repaired here; [QA-REPAIR.md](QA-REPAIR.md) records the exact current test method, dimensions and accessible table scrolling. The first-round design and verification notes below are retained as the original record.

The user question is: **What matters for my team now, and which older league stories am I reading?** The first member action is **My team**, beside a separate **View roster** action. Public visitors start with the real current directory pairing and can browse teams or sign in.

This is an independently authored static HTML composition. Only the common inventory, semantic tokens, fonts and approved local assets are shared. It does not import production components or scene code. No other direction or prior mock image was inspected.

## Composition

An issue masthead and a broad Week 3 headline establish the league before the dated reading columns. The current pairing sits beside the natural 16:9 arena. A narrow date column gives each section its source period; open rows provide the content. There is no connected process timeline, decorative progress line, card grid, background illustration or invented event.

The order distinguishes:

1. November 12 fixture source: current matchup, member identity, roster valuation, observed-form notebook and timestamped synthetic team wire.
2. November 10 saved AI slate: five pairings, actual distributions, returned choices and separate confidence. The returned choice is retained even when the larger probability belongs to the other team.
3. November 2–8 completed Week 2 examples: totals and GP, with the source's November 9 exclusive endpoint. Five unique supplied performers appear once; Joel Embiid's shared high/low selection is explicitly marked.
4. October 5–11 expired draft editorial: three dated opinions, original NBA/college periods, selection reasons and linked sources. October happenings retain their supplied dates. Both archive entries keep their titles and routes.
5. The league reference desk: ten leading-player faces, the searchable complete directory, sortable standings, recent moves and working destinations.

Paper + Slate roles remain exact. Inter handles names and prose; Geist Mono carries dates, records, amounts and scores. The existing selected logo, arena and free-throw preview remain unchanged. Player portraits support compact rows rather than oversized features.

## States and interaction

- The visible fixture notice labels every current record, score, price, form, news and AI example synthetic. No synthetic date is presented as the machine's current date.
- The known home score is **0.0**; the away score is **Pending**. The pairing is incomplete.
- `?view=member` uses `data.personal.summary`; `?view=public` renders no personal sections, valuations or completed member performers. Both comparison links remain usable.
- Valuation includes the supplied modeled FAAB total, 24/24 coverage, computation time, top three values, explicit price-change limits and all 24 roster values in native details. Recorded history remains unavailable. No FAAB balance or historical curve is invented.
- Observed form prints EMA FP/G, eight observed games per supplied row, availability uncertainty and unavailable exact game dates. Prices and the older AJ Dybantsa editorial watch have separate labels.
- `?ai=stale` marks all five saved results stale visibly and removes current probability bars while retaining their historical numbers. `?ai=missing` preserves five current pairings with Unavailable states and no invented saved timestamp. Provenance retains model, prompt, choice, confidence, source time, evidence and unavailable snapshot/input fields. Matching checks season, week and roster pairs.
- Team search matches names, managers and every roster player, including accent normalization. Directory sorting supports name, current standing and roster size. All 228 unique player links remain in native roster disclosures. NeuralNets' 2025 record names the previous manager and QBs Gremlins.
- Standings retain all ten ranks, W/L and PF divided by 100, with rank, PF, team-name and wins sorting. Stat leaders, streaks and Lineup Power remain explicitly unavailable.
- Native disclosures avoid modal behavior. League menu supports Enter, Escape and focus restoration. Navigation, archive and player links are ordinary links. The footer preserves destinations and fixture-state comparison links.

## Narrow layout and accessibility

At the established 70rem, 56rem and 40rem breakpoints, the date column becomes an inline source label; the court, pairing and desk stack. Direct Stocks access remains visible beside a native League menu. The member's My team and View roster controls stay near the top. Lists wrap long names, roster expansions become one column, and standings retain all fields without horizontal page scrolling. Important phone controls and row actions have 44px targets.

No automatic animation, observers, delay, external data requests, save operation or generation runs. Shared focus treatment is immediate. Image failure produces a named fallback. The page does not add a local theme controller.

Forbidden patterns for this direction include current-week editorial award claims, treating a null score as zero, inferred AI winners, invented timestamps/history, inherited previous-manager blame, figurines, process-timeline decoration and essential information hidden to make the page look cleaner.

## Original first-round verification

Evidence below is the original **static browser fixture**, served from `http://127.0.0.1:4198/qa/homepage-20/directions/19/index.html` in installed headless Chromium through Playwright. These first-round results apply to the frozen original. The separate root-font-enlargement issue and repaired artifact's results are recorded in QA-REPAIR.md. Neither fixture is a Next route or a production deployment.

- Member/public × ready/stale/missing AI at 1440, 390 and 320 CSS pixels: all 18 initial states rendered without page errors or page-width overflow. All states retained ten teams, ten faces and 228 unique roster links. Ready/stale retained five saved-pair hooks; missing retained five explicit unavailable pair rows. Public states had zero personal hooks and zero member value lists.
- Actual input tests: player search `Lillard` returned roster 1; manager search `Aedan23` returned roster 2; no-match search displayed recovery copy; clearing restored all teams. Largest-roster sorting placed roster 2 first; team-name standings sorting placed Huff n' Puff first while preserving its rank 6 and PF 293.0.
- All disclosures expanded at 320px: 228 roster links remained visible, with no page overflow. The all-values disclosure retained 24 rows. Previous-manager attribution was checked in roster 8.
- Keyboard Enter opened the value disclosure and League menu. Escape closed the menu and returned focus to its summary. The focused summary had a visible 2px solid slate outline.
- A separate 200% text-enlargement test at a 1440px viewport doubled every element's precomputed font size, including form controls (body 16→32px, search 14→28px). It was independent of the 320px reflow check. The initial test exposed fixed-width editorial stats and PF columns; those were changed to text-relative sizing. Final overflow and clipping checks are recorded below.
- Solid rendered color-pair calculations: ink/canvas 12.70:1; secondary/canvas 5.15:1; white/slate action 7.22:1; fixture-warning/canvas 5.51:1; control/canvas 3.41:1. No text is over the arena image.
- The returned AI choices were checked as rosters 2, 4, 6, 8 and 10, separately from the displayed 65%/35% distributions. Joel Embiid appears once in the completed-week list.
- Desktop top, phone top, editorial and full-page captures were inspected locally. Reduced-motion browser preference was used during interaction checks; this artifact has no authored motion.

Final rerun: all 18 public/member/AI/width combinations passed without JavaScript errors or horizontal page overflow. The 1440px 200% text check passed without page overflow; the detailed clipping check after the sizing repair found no clipped visible elements. HTML SHA-256: `d82f558d902e77e8fdf816fff62ba36bdf87575b4cb5426d3e5ac5eb99e2a730`.

The static fixture does not establish real authentication, Next routing/history restoration, source freshness, an actual-device or screen-reader pass, production backend behavior, gameplay or release readiness. Ordinary route links are supplied but their destination implementations are outside this artifact. No installs, paid calls, production changes, Git operations or sub-agents were used. No known blocker remains in the assigned mockup scope.
