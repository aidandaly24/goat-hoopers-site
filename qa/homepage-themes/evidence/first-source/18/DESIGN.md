# Sports Web 2000 — direction 18

An independently authored, early sports portal for GOAT Hoopers. The user question is “What matters for my team and this league?” The primary member action is **My team**, beside **View roster**. Public readers get the current featured matchup and direct team/edition access.

## Visual contract

- Navy `#071d42`, bright white `#ffffff`, sports orange `#f36d19`. Blue-gray rules, alternating table rows and a striped outer desktop canvas supply the early-web structure. Small beveled controls, rectangular sections and underlined identity links are intentional.
- Verdana body and controls, Arial headings, Courier New numbers and timestamps. System stacks need no remote font. Body text is 1rem; secondary text .875rem; metadata never below .75rem. Text uses root-relative units and doubles when the root changes from 100% to 200%.
- The selected white GOAT logo sits in a navy masthead. A small crop of the authentic supplied arena occupies its right edge. Real approved portrait thumbnails support editorial and directory identities; the supplied free-throw image is an actual game preview.
- Desktop uses a useful left league sidebar, a wider matchup/editorial/notebook column, then full-width working tables and archives. This is a sports portal with dense, ruled content, rather than a collection of floating cards.
- Phone reflows into current team/matchup, dated editorial, the useful sidebar contents, notebook, recap, saved picks, directory, league report and archive. Navigation becomes a normal-flow disclosure; Stocks stays directly visible. No fixed overlays, internal menu scroller or hidden essential table fields.

## Information and interactions

Current matchup identity comes from the directory, with the member’s own pairing selected when present. Known zero remains **0.0**, unknown scores remain **Pending**, and the fixture is visibly **Incomplete**. The old October draft story is separately dated and never presented as the current Week 3 story.

Member content retains identity, manager, standing, roster count, team actions, current modeled FAAB total, pricing basis/time, coverage, top three and all 24 player values. Recorded value history is explicitly unavailable. The scouting notebook distinguishes observed EMA form, modeled price and dated editorial. Completed-week totals keep FP, GP, source period and coverage. The shared Embiid selection appears once with its membership in both supplied groups stated. Team news and recent moves keep synthetic labels.

All five saved AI pairings show both model probabilities, the actual returned choice, independent confidence and accessible saved provenance. The first pick remains roster 2 / Ware the Hoes At? at 35%, while Reaves Dropper has 65%; confidence remains 20%. Model, prompt, generation time, roster IDs, evidence and absent input snapshot remain distinct. Stale is visible without expansion. `?ai=missing` and `?ai=unmatched` retain current pairing identities and say Unavailable rather than showing zero probabilities.

All ten teams have modeled face rows, actual player/team links and Stocks price links. Full rosters retain all 228 unique player links, positions and NBA teams. Search covers team, manager and player; player matches open their full roster. Sort supports standing, alphabetical team and roster size. Standings contain all ten rank/W/L/PF rows; PF divides supplied hundredths by 100. Their sort supports rank, wins/losses, PF and name. Previous-manager attribution remains visible for NeuralNets’ prior record. League stats and Power show honest unavailable states.

Native details provide rosters, complete values, story sources, archive sources and AI provenance. The phone Menu opens with Enter, closes with Escape and restores trigger focus; closed navigation links leave the focus order. Labels, semantic headings, table headers, visible focus, skip navigation and audit hooks are retained. No autonomous motion, marquee, fake ticker, invented chart, generated-on-render AI or fake game controls.

## Actual checks

Browser: installed Chromium 154.0.8037.57, via installed Playwright, against root’s local server on port 4206. This is an offline static fixture check, not production Next routing or live/auth/API verification.

- Member and public at 1440, 390 and 320 CSS px; each also checked with `document.documentElement.style.fontSize = '200%'`. Body computed size changes from 16px to 32px. All native details were opened. Document scroll width equaled viewport width and no element crossed the horizontal page bounds. Numeric values remain unbroken, including 320px/200% PF and sidebar prices.
- Actual screenshots inspected for the complete initial desktop/phone page, phone top/directory, open values, 320px/200% top/standings/source details. Root owns final bulk captures.
- Counts verified: 10 directory containers, 10 modeled faces, 228 roster player links, 24 member values, 5 ready AI rows. Public has no personal area or member value list.
- Search checked for NeuralNets, Lillard, no match and reset. Player search opens its matching roster. Team name and roster-size sort, plus standings name and PF sort, were exercised. First PF row shows 320.5.
- Keyboard checked: Enter opens Menu, Tab reaches Home, Escape closes/restores Menu focus; Enter opens a full roster. Previous-manager text was verified inside NeuralNets’ roster.
- Ready, stale, missing and deliberately unmatched AI states exercised. Stale keeps five saved rows and five visible warnings; missing/unmatched have no saved-row hooks and retain the current scoreboard. First AI row verified as returned away choice 35%, home 65%, confidence 20%.
- Every local image loaded successfully. No JavaScript page errors, failed resource responses or external runtime requests in the interaction/state pass.
- Opaque rendered color-role contrast calculations: body/white 16.88:1; secondary/row wash 5.98:1; link/white 10.15:1; white/navy 16.62:1; orange-ink/fixture wash 6.63:1; active navy/orange 5.55:1. Focus uses 7.18:1 on white and the brighter orange 7.98:1 on navy.

Limitations: no physical phone or screen-reader acceptance; no live backend, production destination rendering, authenticated route behavior or Next Back/Forward claims. Native profile/source links preserve real destinations, but the static preview server is not the production application. Inline content links retain normal inline-link target exceptions; dedicated phone actions/disclosures use the 44px target floor. No production files, tokens, shared styles, repository configuration or data were modified.

## Deliverables

`index.html`, `portal.css`, `portal.js`, and this file are the complete independently authored theme. Only the common data fixture and approved local media are consumed. The supplied root fixture and every peer/older design remain untouched and were not inspected.
