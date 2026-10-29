# Direction 04 — Personal team dossier

The user question is “What matters for my franchise, and where do I act next?” The first action is **My team**, beside the member’s actual team and manager identity. **View roster** goes directly to `/teams/1#team-roster`. The public edition replaces the private dossier with a league reference cover and a working team/player search entry.

The composition is a paper dossier with a short franchise cover, a bounded original arena photograph, one current matchup strip, and open editorial columns. Large type belongs to the team identity and the current modeled valuation. Portraits remain small supporting identities. Section numbers and quiet rules organize a long reference page without a dashboard-card grid. Inter and Geist Mono and all semantic colors come from the shared base/tokens.

Member reading order: identity and next actions; current matchup; valuation and complete roster values; scouting notebook; completed-week selections and team wire; dated league editorial; all saved AI pairs; ten franchise anchors; searchable complete directory; sortable standings; activity/tools; both weekly archives; playable-game link; sources. The public cover, notebook and reading order omit private member valuation/form/news data and lead into league context.

## Implemented controls and truth

- Member/public comparison links preserve the requested stale/missing AI fixture state.
- Native directory disclosures retain all ten teams and all 228 player references. Search matches team, manager and player names, including accent-insensitive input; player matches open the full matching roster. Clear restores the directory and search focus. Team sorting supports number, name, PF and roster size.
- Standings retain all ten rows, source rank, W/L and PF divided by 100, with rank/name/PF/wins sorts. The member stays marked without automatic reordering.
- Complete member valuation has top three and a native 24-player disclosure, all actual prices, coverage, rank, model basis and computation timestamp. Missing history is explicit, without a fabricated chart.
- The five saved AI pairs show both probabilities in roster order, the returned choice independently and confidence separately. Source provenance retains model, prompt, save time, roster IDs, matched state, input evidence and explicit missing snapshots/baseline/model evidence. Stale status is visible before expanding. Missing AI renders each current pair with unavailable result fields.
- Completed-week high/low selections merge overlapping player IDs, retaining both Best and Rough labels for the shared selection. Period, points, GP, eligible/displayed count, excluded records and the synthetic fixture qualifier remain accessible.
- Dated sample editorial retains every opinion/stat/period/source/selection reason. The stale draft’s Week 1 story is separated explicitly from the synthetic current Week 3 matchup. Known 0.0 and Pending remain different.
- All requested destinations remain linked. Native menu Escape closes and restores trigger focus; activation closes it. No modal, external calls, generated model result, data saving or scene/game runtime.

## Responsive and accessibility contract

At desktop the cover and open two-column sections give identity, modeled assets and form separate readable measures. At 390/320px the arena becomes a small franchise-material inset, cover facts wrap, actions retain 44px targets, content stacks, the directory uses one roster column and standings become labeled grid rows. The optional desktop page index and direction label are omitted on phones so the team identity and next actions arrive earlier; all sections, global destinations and comparison links remain. No fixed chrome can cover content. Body is 16px; useful secondary copy 14px; provenance 12px. Long identities wrap. Native search, select, details, table, headings and landmarks retain ordinary keyboard behavior. A visible skip link and shared focus ring are present. No animation; reduced motion also disables smooth anchor scrolling.

Forbidden patterns: giant portrait or matchup duplication; repeated panel grid; current awards inferred from dated opinion; price confused with form; fabricated history/Power/availability; missing score rendered as zero; result inferred from probability order.

## Verification

Actual static-fixture checks used installed Playwright and `/usr/bin/chromium` against `http://127.0.0.1:4198/qa/homepage-20/directions/04/index.html`.

- Member and public at 1440, 390 and 320 CSS pixels: no page-width overflow with disclosures closed or with every main-content disclosure expanded. No broken local images; no script errors in the initial member run.
- Inventory: exactly 10 directory teams, 228 roster links / 228 unique player paths, 10 faces, 5 ready saved AI rows, 24 member valuation entries and 10 standings rows. Public contains zero `data-personal` blocks.
- Separate 200% text enlargement: set the document root font size to `200%` at 1440 CSS pixels, with every main-content disclosure expanded; no page-width overflow.
- Search “Damian Lillard” retained one team and opened its roster. A nonexistent query showed the empty result state. Clear restored all ten and returned focus to the search field. A–Z team and standings sorts both put Huff n’ Puff first.
- `?view=member&ai=stale` displayed the stale section label with all 5 saved pair rows. `ai=missing` displayed Unavailable with no saved pair hooks and five current-pair unavailable rows. The ready first pair shows the actual choice Ware the Hoes At?, independent 20% confidence and the 65% Reaves / 35% Ware distribution.
- Known home score rendered `0.0`; null away score rendered `Pending`. Menu Escape closed the disclosure and restored summary focus. Subsequent keyboard Tab reached a comparison link with a solid focus outline.
- Visually inspected the initial 1440 and 390 member captures. The phone opening was subsequently shortened by removing the optional page index/direction label; final reflow and rendering were rechecked.

This is a static synthetic fixture only, not a real Next route, live/auth integration, physical device or screen-reader validation. Root owns bulk captures and independent review. Production-route anchors are present but their destination behavior, game runtime, browser Back/Forward restoration and live auth were not tested through this static server. No claim of full accessibility compliance is made.
