# Direction 17 — Athletic type broadsheet

The question is “Who am I playing, and what matters for the next roster decision?” The first action for a member is **My team**, beside **View roster** and the saved AI picks. Public visitors get **Explore teams** in the same position. Both versions feature the current directory pairing, rather than presenting the older editorial pairing as current.

The actual team names earn the display size. Reaves Dropper uses heavy Inter; the opposing name has a lighter weight and a subordinate scale. Known and pending scores sit beside their respective identities. A narrow court photograph and a short league playoff reference balance the asymmetrical type. The court keeps its natural 16:9 frame, with no text overlay or scene runtime. The selected logo, Inter, Geist Mono and Paper + Slate roles are reused unchanged. There are no imported component layouts, new fonts or frameworks.

The page changes density deliberately. The oversized matchup leads into a member roster ledger and compact form notebook, then the dated editorial, saved AI reference, ten league faces, wire, searchable directory, sortable standings and archive. Every current fixture state is explicitly synthetic. The October draft editorial is separately dated, visibly stale and retains its sources and selection basis. Price changes, observed EMA form and editorial opinion have distinct labels and periods. Model choice is displayed directly from the returned choice field, including this fixture’s choice/probability disagreement; confidence stays a separate signal.

The member ledger includes the modeled FAAB total, complete pricing coverage, calculation time, value rank, top three values and all 24 values in a native disclosure. Recorded history remains unavailable. The completed-week lists retain fantasy points, GP, period, eligible coverage and overlap caveats. Team news and moves stay labelled synthetic. Public HTML receives no personal summary markup.

The full directory retains all ten identities, current records and opponents, and 228 unique roster player links. Search covers team, manager and every player. Sorting supports name, points for and roster size. Previous-season records are kept inside roster disclosures with their manager qualification; NeuralNets’ 1–20 record explicitly belongs to the previous manager as QBs Gremlins. Standings retain all ten ranks, W/L and source-display PF, with functional Rank/PF header buttons and aria-sort. Missing league stats and Lineup Power remain explicit. Stocks, trade analysis, actual free-throw practice, all league destinations and both dated archive entries remain ordinary links.

## Surface contract

- **User question:** Who is my current opponent, what do I know about my roster, and where is the useful league reference?
- **Primary action:** My team / View roster for members; Explore teams for public visitors.
- **States:** Public/member, synthetic current information, incomplete scoring, known zero versus pending, ready/stale/missing/unmatched saved AI, dated draft editorial, unavailable history/stats/Power, search matches and no results, expanded rosters/value/provenance.
- **Narrow layout:** The name-and-score composition stacks before the bounded court, then the same content order. Ledger, notebook and editorial columns collapse; directory rows retain opponent and record; standings fit the page without horizontal scrolling. Stocks stays directly available beside a native Menu disclosure. Escape closes menu disclosures and restores summary focus. Body text is 16px, secondary 14px and metadata at least 12px. Phone controls and roster/player action rows have 44px targets; ordinary inline editorial links use the inline-link exception.
- **Forbidden patterns:** Generic marketing hero, decorative invented statistics, repeated matchup posters, fabricated prices/history/rankings, inferred model choice, zero standing in for missing scores, unlabeled sample awards, text over busy photography, repeated card grids, new scene runtimes and copied direction markup.

## Verification performed

Installed Chromium through Playwright, against `http://127.0.0.1:4198/qa/homepage-20/directions/17/index.html`, on 29 October 2026. This is static offline fixture evidence, not production route/auth/backend evidence.

- Public and member at 1440×900, 390×900 and 320×900: no page-width overflow, no JavaScript page errors, ten directory containers, ten faces and 228 unique directory player links. Members contain 24 roster values; public contains no personal section.
- Public and member at 390px with separate `html { font-size: 200% }` enlargement: no page-width overflow. This is separate from 320px reflow. A further member check expanded the valuation, NeuralNets roster and phone menu together at 200%; no page-width overflow.
- Public and member ready/stale/missing AI: five rows for saved states, zero fabricated rows for missing; stale labels visible outside disclosures, missing labelled Unavailable. Known 0.0 and Pending both retained.
- On all three widths in both views: search by Embiid, Aedan23 and NeuralNets returned the expected single team; no-match search and clearing worked. Name/PF directory sorting and ascending/descending standings PF sorting worked.
- Keyboard Enter opens roster/value native disclosures. All 24 values remain accessible; the NeuralNets roster retains the previous-manager attribution. Phone menu Enter, Escape, visibility and focus restoration passed at 390px and 320px.
- Visually inspected rendered 1440px desktop and 390px phone opening viewports. Court sizing was corrected to a natural 16:9 frame after that inspection.
- Measured rendered solid-color pairs in Chromium: body/canvas 12.70:1, secondary/canvas 5.15:1, primary-action label/fill 7.22:1. No transparency or image overlay is used for those pairs.

No screenshot files, installs, network data calls, commits, branch changes, production edits or other-direction inspections were made. Only this folder’s `index.html` and `DESIGN.md` are authored. Root owns bulk captures and independent critique.

## Limits

Ordinary product links preserve their intended destinations; this static server does not establish those product flows, authentication, backend access, Next history restoration, physical phone behavior or screen-reader announcements. No physical-device or screen-reader pass was performed. There is no data saving, generation, polling or real league data access. The layout uses native disclosure behavior and no animation. No remaining implementation blocker.
