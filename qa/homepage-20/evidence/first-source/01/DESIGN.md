# 01 — Courtside Newspaper

A complete, independently authored static homepage direction. Open `index.html?view=member` or `index.html?view=public` through the shared server. `&ai=stale` and `&ai=missing` exercise the supplied saved-AI states.

## Surface contract

- **User question:** What matters in my league this week, and where can I inspect my team or an opponent?
- **Primary action:** My team for a member; Find a team for a public reader. The current pairing and its incomplete scores lead the page; roster inspection sits beside their context.
- **States:** Member/public; known zero/pending score; current synthetic Week 3 versus stale October draft editorial; saved ready/stale/missing AI; unavailable value history, league statistics and Power producer. Search includes results and a useful empty state.
- **Narrow layout:** One reading column retains the same information, sources and native disclosures. Home, News and Stocks remain direct; the ordinary League menu contains remaining destinations. All 228 player references remain in roster disclosures. Directory search opens matching teams' full rosters. Standings retain their five readable columns.
- **Forbidden patterns:** Invented current awards, zero substituted for missing scores, inferred AI choice, invented value history or Power rankings, scene runtime, generic marketing panels, repeated decorative cards, external font/data calls.

## Composition and typography

The page uses the selected Paper + Slate semantic roles, the existing black GOAT logo, Inter and Geist Mono. A compact newspaper masthead and strong horizontal rules establish an edition. A large, tight, factual Week 3 headline introduces the unfinished current pairing. Team identities, managers, records and scores appear together once; the small member nameplate has its own separate personal purpose.

The original arena is cropped into a low, wide baseline photograph. It supplies the league's recognizable place without becoming wallpaper or carrying overlaid interface text. The public and member variants use the same court crop.

An asymmetric second spread pairs the three dated editorial columns and scouting notebook with the complete saved-AI sidebar. The notebook fills useful space below the shorter player stories. Saved choice and model probabilities deliberately remain different facts: the fixture returns the 35% team while giving its opponent 65%, and the page preserves that result. The 20% confidence signal has its own label.

Open type, modest portraits, aligned values and native details replace a repeated card grid. The lower paper carries league happenings, ten compact league faces, a searchable full directory, sortable standings, actual tool routes, a free-throw preview and both dated archives. Detail and provenance can grow naturally without internal scroll boxes or overlays.

## Data and interaction

Only the supplied `../../data.js` is imported. `../../base.css` supplies fonts/reset/tokens/focus; this direction owns its HTML, CSS and interaction code. No application surface/runtime is imported.

The prominent fixture notice distinguishes synthetic records, scores, prices, form, news and AI from preserved approved identities and dated sample editorial. The October section says stale draft before any disclosure is opened. Each opinion retains its NBA/college period, selection reason, source and check date. Current featured teams come from `home.directory.currentMatchup`, using the member's own pair.

Member-only material uses `data.personal.summary`. The desk includes all 24 modeled roster values, top three, total, priced/unpriced coverage, valuation rank, basis and computation time. Recorded history is explicitly unavailable. The notebook separates observed EMA fantasy points per game from price and editorial, retains eight-game samples and unknown availability, and prints completed-week points, GP, exact period and five-player coverage. The overlapping Joel Embiid selection appears once with a clear shared-list explanation.

Directory search matches team, manager and every roster name; sorts support current standing, alphabetical team and roster size. All ten teams show current opponent and separate previous-season context. NeuralNets' previous-manager attribution remains visible in its collapsed team row. Standings sort by rank in either direction, PF and team name. PF uses source pointsFor divided by 100. All five saved AI pairs have native provenance; missing/unmatched states have explicit copy. No generation or saving happens.

The League menu is a native nonmodal disclosure. Escape closes it and restores summary focus. Controls have visible focus; standalone phone actions and disclosure summaries use 44px targets. Inline prose source links retain normal document semantics. No animation is used, and the shared reduced-motion rule remains effective.

## Verification actually performed

Evidence is a **static browser fixture**, using installed Playwright with `/usr/bin/chromium`, served at `http://127.0.0.1:4198/qa/homepage-20/directions/01/index.html`. Repository base: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`; the deliverables are uncommitted files confined to this directory.

- Member and public rendering at 1440, 390 and 320 CSS px. No page-width overflow, including when every native disclosure and the navigation menu are expanded. Visually inspected the member opening at desktop/phone and the desktop editorial/notebook/AI spread.
- Independently enlarged every element's computed font size to 200% at unchanged 1440 and 390px viewports, with details expanded. No page-width overflow. Also checked root/body text-size enlargement separately. This is text enlargement evidence, not a browser zoom or physical-device claim.
- Default rendered inventory: ten directory team containers, ten faces, five AI rows, 228 roster links; member has 24 valuation entries and public has none. Public has no personal summary containers.
- Search tested with Embiid, NeuralNets and a no-match string. Matching roster disclosures open; clearing restores all teams. Alphabetical and roster-size sorts work. Reversed standings begin with rank 10; source PF remains 271.0 for that row.
- Ready choices/probabilities inspected. Stale state has an immediately visible STALE notice while retaining saved results; missing state says Unavailable and keeps directory access. All five saved pairs retain the actual returned lower-probability choice and independent confidence.
- Keyboard Tab reaches Skip to content first. Enter opens the League menu and all-values disclosure. Escape closes the menu and focuses its summary. Focus outline is the shared slate 2px outline.
- No browser page errors in tested views. Local images load when lazy images are brought into loading scope; no failed images after eager-load verification. No external data, fonts, installs or paid services used.

## Limits

This is a standalone static design fixture, not Next.js/auth/backend verification. Product links retain real route targets but the shared static server does not establish those routes' behavior. No screen-reader run, actual-device test, full game interaction, production build or live data verification is claimed. Existing source values remain synthetic. No blockers remain for reviewing this direction.
