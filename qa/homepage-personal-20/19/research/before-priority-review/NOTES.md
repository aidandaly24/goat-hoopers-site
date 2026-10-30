# Concept 19 — source frozen for root capture

Complete static desktop website: `index.html`, `styles.css`, and `app.js`. Data-only import of `../fixture.js`; no presentation imports, dependencies, production/shared-file edits, git operations, publication, or live calls. Root owns final captures and packaging. The local temporary screenshots used for inspection were removed after review.

## Open and capture

Base: `http://127.0.0.1:4207/qa/homepage-personal-20/19/index.html`

- `?persona=reaves` — default member; five supplied Week 2 samples, complete 24-of-24 quote coverage, current score and saved synthetic estimate.
- `?persona=neural` — different opponent and three samples; missing own score, opponent’s recorded zero, six unpriced players, partial subtotal, no saved estimate.
- `?persona=guest` — public Reaves/Ware starting pair, public league context and all other pairings; no member player samples, quote totals, or saved estimates.
- Append `&stage=structure` for the same content and geometry with neutralized color/image emphasis.
- Wait for `document.documentElement.dataset.personalStudyReady === '19'`. `dataset.persona` is the selected synthetic example. Readiness waits for fonts, non-lazy images, and a layout frame, and ignores an obsolete render generation.

The selector is visibly labelled Demo persona. “Synthetic demo” and source explanation are visible in the header. Sign in and other real destinations say GOAT site; they leave the prototype.

## Architecture as built

Two separate team narratives interweave through one ordinary CSS Grid document. The viewer opens broadly, while the opponent starts lower and narrower. The viewer evidence occupies seven tracks; the opponent’s current score occupies four. The viewer score then shifts inward, and the opponent history widens across the middle. Quotes return to the viewer’s broad field while the opponent closes with the actual scouting boundary. The four other contests open outward with staggered spans rather than a fixed personal/league split or a repeated card band.

The article elements retain a coherent reading order; their sections use normal grid layout, not absolute positioning or an internal scrolling canvas. There is no section rail, comparison matrix, full-roster homepage spine, player wall, invented rivalry, or opponent player roster. The lower public history and actual game preview are bounded parts of the document, followed by a complete semantic route directory.

The useful primary action is already visible in the normal 1000px-high first viewport at both tested widths for every persona. The Reaves opening also shows the named player sample list beginning in the first viewport. Enlarged text is allowed to move actions lower and make the document taller.

## Typography and assets

- Archivo Black: broad mixed-case team and section headings; actual regular/black face, no synthetic weight or condensed headings.
- DejaVu Sans reading stack: 16px base equivalent and 1.65 line height, with rem-based body and secondary text growth. Confirmed installed in discovery.
- Space Mono: precise, ordinary action and navigation labels, with 44px targets.
- Space Grotesk: proportional tabular figures for scores, modeled FAAB, ranks, and dates. Missing values use words.

All font bytes are existing approved local assets from `qa/homepage-structures/assets/fonts/catalog.json`; OFL notices are untouched. The GOAT SVG is exact. Joel/Giannis portraits and the free-throw preview use supplied approved paths. No download, installation, scene, or generated imagery.

## Reference reads and concrete effects

- [pbakaus, adapt](https://www.ui-skills.com/skills/pbakaus/adapt): substantive skill/reference read in discovery, not an index. Context-led desktop adaptation led to simultaneous useful evidence, intrinsic long-name wrapping, and content-driven track changes. The enlarged-text finding removed fixed pixel limits on the external/status labels.
- [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design): complete essay prose read; embedded demos not physically exercised. Spatial consistency led to return-to-origin inspection flows. Frequency & Novelty led to immediate navigation without repetitive entry motion; Scroll Landmarks led to scroll restoration. Nearby, explicit actions apply Fitts’s Law.

Full source-read inventory and product contracts are in PLAN.md. The public GOAT web opening was unavailable during discovery; current product inspection used the authorized production source, not a claimed live visual review. No real login, market, AI generation, or mutation flow was exercised.

## Bounded verification

Command: `node qa/homepage-personal-20/19/check.mjs` using the already installed Playwright and `/usr/bin/chromium`. `node --check qa/homepage-personal-20/19/app.js` also passed. The machine-readable complete result is `checks.json`.

Final result: **PASS** — nine layout/text checks, three structure-geometry checks, three task scenarios, keyboard/focus check, and zero browser page errors. All local visible assets loaded. No horizontal document overflow in any tested state. No source edits followed this passing run; subsequent edits only document the result.

| Persona | 1440px normal document height | 1120px normal height | 1120px with 200% root text |
| --- | ---: | ---: | ---: |
| reaves | 3687 | 3733 | 7352 |
| neural | 3514 | 3538 | 7031 |
| guest | 3222 | 3288 | 6429 |

Text enlargement changes the actual root/body text to 32px; it is not a screenshot scale. All three pages grew, preserving labels, normal document access, and zero horizontal overflow. At 1440px, every structure view had identical stanza rectangles and document height to its final counterpart.

Locally inspected Chromium images: Reaves opening at 1440px; full NeuralNets at 1120px; full guest at 1440px. Root creates final deliverable captures. This does not claim physical-device, Safari/Firefox, screen-reader, or production behavior verification.

## Stable task selectors and observed results

1. **Reaves evidence and opponent context.** `#evidence-1444` opens `#view-heading` for Damian Lillard; `[data-testid="player-evidence-points"]` reads 42.5 pts. Browser Back restores `#evidence-1444` focus. `#inspect-opponent` opens Ware’s public team context, explicitly without a player roster. `#back-to-story` returns focus to the opponent trigger.
2. **NeuralNets missing quotes.** `#task-primary` opens six unpriced rows in `[data-testid="quote-table"]`; `[data-testid="quote-count"]` says six of 22. `#quote-player-4866` opens AJ Dybantsa, whose quote is Unpriced and evidence is Not included in this sample. Back preserves the six-row filter and restores trigger focus. `#quote-filter` All shows 22; `#quote-search` Giannis shows the supplied 135.50 quote; a nonexistent name produces the explicit no-results state.
3. **Guest public discovery.** `#inspect-opponent` opens Ware, without `#team-own-quotes`. Back restores the trigger. `#league-team-8` opens NeuralNets with the visible previous-manager/QBs Gremlins qualifier and `[data-testid="team-current-score"]` still unavailable. The real `a[href="https://goathoopers.com/login"]` remains discoverable.

Keyboard check: Tab reveals `.skip`; Enter focuses `#main`. Keyboard activation of `#task-primary` focuses the detail heading. Shift+Tab reaches Back with a 3px visible outline; Enter returns to the originating primary action. The native `#persona` control updates the query and the displayed team. No custom gestures or motion are required.

## Data semantics retained

Current Week 3 score is separate from synthetic completed Week 2 player samples. A missing NeuralNets score never becomes zero, a tie, or a leader. Papichooter’s zero is preserved. Modeled FAAB always carries units/coverage; NeuralNets remains an incomplete 16-of-22 subtotal. No league value rank, historical valuation line, opponent roster, availability, injury, positional edge, or forecast is invented. Reaves’ saved choice/probabilities and separate confidence/provenance remain distinct; NeuralNets offers no fake generation. Guest detail routes expose public fields only.

## Frozen presentation source SHA-256

- `index.html`: `c117e7c89f401c91150aabf6b17d3659dbb1621ac40cc79315d110b348f3b59d`
- `styles.css`: `8d13f92189a4911d474db819820205e3f840a23ca36787f09ad3bd6d07a56705`
- `app.js`: `5525314c42650e1636133b1471bf2de1d0aa4918b31ea44d42805518a2bdedf7`

No remaining implementation blocker. Source is frozen for root capture/review.
