# 13 · Card Culture

This isolated QA direction answers: **Who is on my team, what are those players worth in the model, and what should I inspect next?** The primary member action is **My team**, alongside **View roster**. The public view introduces the same league through its current featured pairing and team-owned player cards.

## Visual decisions

Grape `#32124d`, lavender `#e1d3fb`, tangerine `#ff9d52`, and white establish the whole page. Local **Righteous** is the display face; local **Space Grotesk** handles reading and tabular data. Both files are supplied in the common font catalog under SIL OFL 1.1. No shared CSS, theme template, production tokens, other direction or old mock was inspected or imported.

The cultural objects are actual player cards. Each has an approved portrait, supplied identity/position, roster-supplied NBA team, current modeled FAAB quote and explicit owner relationship. The lead three are the member’s highest modeled values. The league binder contains all ten supplied top modeled players. Double-edge construction, restrained rotation, flat printed court arcs and solid offset shadows evoke a physical card collection without inventing scarcity, grades, awards or a marketplace for the cards.

The supporting composition changes pace: an open lavender scoreboard beside the lead cards; ruled scouting and form lists on white; a grape dated-editorial spread; open saved-AI rows; a lavender player binder; a search-driven white roster directory; a pale standings and ledger spread; an orange market/practice section; and open back issues. These are independent compositions around their actual information rather than one repeated dashboard panel.

## Wide and narrow composition

At 1440 CSS px the top uses separate fanned cards with readable captions on the left and the current pairing on the right. The full current roster valuation follows the portraits. Scouting, editorial and league data use asymmetric or open columns. Five player cards fit across the league binder.

At 390 and 320 CSS px the lead card becomes a horizontal identity object above two smaller cards. The public view gives both featured anchors a full-width horizontal treatment. The phone binder uses two columns. Supporting lists and sections stack; names wrap, controls stay available, rosters become single-column lists, and the standings retain rank, team, W, L and PF. The normal-flow Menu disclosure opens with Enter and closes with Escape, restoring trigger focus. It uses ordinary links, no modal or menu-role trap.

Type is root-relative: body 1rem, secondary .875rem, provenance .75rem. Primary actions, disclosure controls, price actions, search, select, view switches and phone navigation meet the 44 CSS px target. Inline identity and source links retain their inline-text role. Focus is a visible three-pixel outline. No autonomous motion, canvas or WebGL exists; reduced motion and save-data do not remove information.

## Preserved content and states

The directory retains all ten teams, all 228 unique roster-player links with supplied positions/NBA teams, managers, current records/opponents and historical records. NeuralNets’ previous-manager attribution appears before opening the historical detail. Search covers teams, managers and players; player matches open the relevant roster. Sort choices change actual ordering; open/close controls operate all visible rosters. All ten standings rows retain PF divided by 100.

Member-only areas carry `data-personal`. The 24-value disclosure carries `data-roster-values`; ten directory objects carry `data-team-id`; ten player/team cards carry `data-face`; five matched saved rows carry `data-ai-pair`. The rendered body receives `data-mock-ready="13"`.

The synthetic-fixture strip stays visible. Complete fixture/source details and dated editorial sources are in the footer. Current Week 3 pairing, known 0.0, Pending and Incomplete are distinct. The draft October edition remains clearly dated and separate. Current modeled values, observed EMA form, completed-week points/GP/coverage and editorial opinions each retain their own basis. Team news/moves and league transactions remain explicitly synthetic.

All five AI entries retain the actual returned choice, both probabilities, independent confidence, saved timestamp and disclosure of model/prompt/input/evidence. The first returned choice remains the away team at 35%, even though the home team has 65%; confidence remains 20%. `?ai=stale` labels both the slate and each saved result visibly. `?ai=missing` retains current pairings with Unavailable values and no saved-row hooks. Mismatched season/week/pair also fails closed to Unavailable. No fake team-history line, Power ranking or league leader is produced.

Navigation preserves Home, News (`/intel`), Stocks, History, Arcade, AI Decides, Teams, Transactions, Weekly archive, Trade analyzer and member team/roster actions. Player profiles use actual `/player/:id` routes. Prices link to the real `/stocks#player-board` destination, whose current implementation has no selected-player URL parameter; no fake deep-link behavior is claimed. Both supplied archive entries preserve their routes, titles and date ranges. The supplied real Free Throw poster and actual practice/Arcade routes are used.

## Verification evidence

Evidence is a **local static component fixture** at `http://127.0.0.1:4206/qa/homepage-themes/directions/13/index.html`, using installed system Chromium `/usr/bin/chromium` through the existing Playwright module. No browser or package was installed.

- Member and public: 1440, 390 and 320 CSS px. All disclosures opened through the footer. No document horizontal overflow; all ten directory objects, ten faces, five saved rows and 228 unique player links retained. Member has all 24 values; public has no personal objects. No JS exceptions, failed image loads or HTTP asset errors.
- 200% root text enlargement: `document.documentElement.style.fontSize='200%'`, at 1440 and 390 CSS px with all disclosures opened. Computed body type changes from 16px to 32px. No document overflow or out-of-viewport content. This tests root enlargement separately from narrow-width reflow.
- Phone Menu: keyboard Enter opens; Tab enters navigation; Escape closes and restores focus to Menu. Hidden navigation links leave the tab order.
- Search `Embiid`: one team and its open roster. No-match search: zero results with recovery copy. Clear restores ten. Roster-size sort puts team 2 first. Open all / Close all operate every roster. Standings PF ascending puts T Halibooty first at 271.00.
- Ready/stale/missing AI checked. A browser-only intercepted copy of the data module changed the saved week to 99 to exercise unmatched output; all five current pairings remain with Unavailable, zero saved-row hooks and no fake probabilities. The source fixture was not edited.
- Full desktop and phone renders inspected, including lead card name exposure, league binder, standings, open rosters and source footer. Native lazy images were warmed for full-page inspection. All image paths remained local.
- Main actual color pairs, calculated with WCAG relative luminance: grape/white **15.80:1**, grape/lavender **11.22:1**, grape/tangerine **7.67:1**, muted `#645171`/white **7.10:1**, muted/lavender **5.04:1**, muted/pale **6.20:1**. Focus `#8c3900`/white **7.78:1**, focus/lavender **5.52:1**. White/grape editorial text uses **15.80:1**. Portrait backgrounds are not used behind reading text.
- `node --check` passes for the authored module. No application code, production route, dependency, credential, database, Git or deployment changes.

Limitations: static fixtures do not establish production authentication, provider correctness, real Next routing/back restoration, physical-device behavior, screen-reader acceptance or playable-game execution. Destination paths were verified against source contracts; this static server cannot execute the production application routes. The root coordinator owns final bulk captures and independent visual comparison. Below-fold native lazy images should be warmed before a single full-page screenshot.
