# 07 · The open hardwood clubhouse

Local-only complete-homepage correction. Only this directory is owned by this change. The prior `polished/07` room and its evidence remain intact. Source is frozen for root's four final full-page captures; no publication or production approval is implied.

## Before / after

The prior room introduced its objects, then put the five-game slate, substantial roster work, standings, wire and archive inside closed disclosures and bounded interior readers. This room puts a complete league home on the floor immediately. The five pairings, ten useful franchise summaries, member notebook or public noticeboard, two dated folders, three editorial observations, full standings, recent moves and actual game preview are present in normal document flow. No primary home content has an internal scroll area. Walnut wall/floor planes, cream bench paper, the shelf's folder tabs, copper actions and local Lora/DM Sans remain the design's material language.

The desktop still reads as score wall beside lockers, then broad foreground bench beside archive shelf, then a scouting sheet and the ledger/game crate. Phone becomes a walk through those same objects, with every section naturally extending the document. At enlarged root text the scene relaxes to one major column and long words/numerals wrap. There is no scenery animation, sticky reader, fixed content viewport, generic shared renderer or stylesheet.

## Surface contract

User question: what matters around our league, and where can I take the next action? Primary action: inspect all five pairings and compare an actual pair's two locker notes. States: member/public, 0.0/Pending incomplete scores, saved/stale/missing AI, dated draft editorial, historical final, unavailable producers and absent transaction legs. Narrow layout: one normal document retaining identical destinations and material identity. Forbidden: doors concealing most homepage content, internal primary readers, live-looking invented facts, printing 228 raw names to create height.

## Content / composition map

| Place | Initially visible | Optional depth / real destination |
| --- | --- | --- |
| Entry | GOAT identity, compact synthetic fixture label, member/public edition, Stocks/Teams/Arcade | Around-room anchors; full fixture warning at the end |
| Score wall | All five Week 3 pairings and incomplete scores; actual returned choices, probabilities and separate confidence, or honest missing/stale state | Each Compare opens that pair's notes without closing other retained notes; saved timestamp, IDs, model, prompt, null input, evidence and baseline disclose locally; `/ai-decides` |
| Locker wall | Ten faces, team/manager, current record, count, current opponent, representative modeled player value | Five curated roster references per locker, dated previous-season/previous-manager note, full `/teams/:id#team-roster`; search checks all 228 unique imported references and shows actual player matches; standing/name/size ordering |
| Member bench | Team identity/standing, $1,095.25 modeled total with 24/24 priced and 0 unpriced, rank/basis/time, three highest values, three EMA watch rows and sample, completed Week 2 best/rough rows and source period/coverage, two team-wire items and sample move | All 24 values in normal flow; `/team`, full roster, `/stocks#player-board`, transactions. Embiid's overlapping best/rough entry appears once and the overlap is explained |
| Public bench | League/team/playoff context, dated October opening-pairing narrative and explicit separation from November Week 3, three dated October happenings | Team profiles, history and the exact draft edition. No personal total/form/team wire or `/team` action |
| Archive shelf | Both dated drafts and narratives; source-date upcoming Week 1 versus completed 2025 final, 326.0–251.5 | Local selection/date/source notes; `/weekly/2026-W41`, `/weekly/2026-W40`, `/weekly` |
| Scouting sheet | All three October proposed editorial picks, opinions, current ownership links and exact NBA/college stat periods | Each selection reason and source/check date stays attached to the item |
| Ledger | All ten current standings with manager, W–L and PF; three sample moves; explicit absent move legs and unavailable Lineup Power/team-value history | Transactions, Stocks, Trade analyzer, News/Intel and History |
| Games crate / ending | Arena crop, real free-throw preview, named Play action and no invented prize/ranking claim; full destination footer | `/arcade`, `/arcade/free-throw`, fixture/date boundaries and return to clubhouse |

## Data and interaction boundaries

`room.js` explicitly imports only `inventory`, `data`, `mode`, `aiState`, `esc`, `money` from `../../data.js`. An initial boundary check validates ten unique teams, ten directories, five valid pairings and available archive input. Approved local portraits, `/public/courtside/arena.jpg`, `/public/arcade/free-throw-preview.jpg`, local licensed DM Sans and Lora are reused unchanged. Per-design font, paint, type and spacing roles live at the top of this directory's `room.css`.

`?view=public` switches the edition. `?ai=stale` retains labelled old output; `?ai=missing` retains the score wall and marks saved picks unavailable. The away team's returned choice at 35%, other team at 65%, and independent 20% confidence are printed faithfully. No choice is inferred from the larger probability. The conflicting `home.edition.game` remains unused: both coherent `archive` records supply dated history instead. The complete warning distinguishes the November 12 fixture, the browser's actual UTC date and the October source dates.

Native disclosures have local Close actions; Escape closes the focused open disclosure and restores its summary. Comparison clears an active search, opens the actual pair's two notes, retains other open locker notes and moves to their labelled section. Clear comparison removes the marks while keeping the notes open. Search/sort do not introduce a second reader. No autoplay, entrance reveal, observer-hidden content, animation loop, API request or persistence is present. Reduced motion retains the identical still experience. `document.documentElement.dataset.homepageReady='07'` is set after rendering.

## References applied

Read the current `AUTHOR-BRIEF.md` in full, only 07's `correction-allocation.json` entry, own `polished/07/{index.html,room.js,room.css,ART.md}`, repository `AGENTS.md`, the relevant architecture/data/surface contracts in `ARCHITECTURE.md`, `DESIGN.md`, and `.agents/skills/goat-hoopers-design/SKILL.md` with its visual-hierarchy, navigation-accessibility and motion references. The local `reference-notes/craft.md` records the primary studies; these principles are applied selectively rather than claiming a new remote-source study:

- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md): the room's materials and reading model govern a substantive home, not just a decorated cover.
- [Elaya redesign existing projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md): inspect existing direction first, preserve its useful depth, replace equal generic cards with the room's specific objects and inline detail.
- [Adapt](https://www.ui-skills.com/skills/pbakaus/adapt) and [accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): retain the task, destinations, real controls and content on phones; test 320px reflow separately from 200% root text.
- [Emil design engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) and the project's motion reference: frequent actions respond immediately. This expanded reading experience earns a still treatment; no decorative transition is added.
- [Better colors](https://www.ui-skills.com/skills/jakubkrehel/better-colors): keep the inherited palette in semantic material/text/action roles; comparison and model state have explicit text.

## Actual bounded checks

Evidence is an actual Chromium **static fixture**, served by existing localhost4207; not a production Next route, physical device or screen reader. Test source and actual report are `check.mjs` and `checks.json`.

- `node --check room.js` passed.
- 16 initial combinations: 1440/390/320 CSS px × member/public × 100%/200% root font size, plus 390 member/public × stale/missing saved AI. All initial primary sections present: five matchups, ten lockers, two folders, three editorial notes and ten standings. Fonts loaded; no duplicate IDs, internal primary scrollers, public personal-data leaves, page JS errors or failed local asset responses.
- Two findings at 320/200%: long words/headings and the large value exceeded their text boxes. Added natural word wrapping for enlarged scene text. Targeted member/public rechecks at 320/200%, both initial and with comparison, saved-call, value, archive and editorial notes expanded, now report `scrollWidth:320` and zero internal scrollers. The report preserves the original findings under `correctedFindings`; the full initial matrix was not redundantly rerun after this narrowly scoped wrapping fix.
- Keyboard at 1440 and 390: Enter on Compare opened lockers 1/2 and focused the locker heading; named jump and Escape closed locker 2, restored its summary and retained locker 1; opening all values found 24 rows; local Close restored its summary. AJ Dybantsa search returned one real locker; clearing restored ten; name sort matched actual alphabetical order. Reduced-motion comparison opened lockers 3/4 with all home sections present and zero active animations.
- Inspected full-page desktop/phone renders with actual loaded fonts, portraits, arena and game pixels (`/tmp/clubhouse07-1440.png`, `/tmp/clubhouse07-390.png`). These are author inspection images; root owns final four-page evidence/packaging. Desktop member document is approximately 6,027px high; phone member approximately 14,056px; public approximately 5,531px/12,659px. The long phone document retains the complete visible home rather than constraining it into readers.

Limits: no physical device, screen-reader, universal contrast/hover certification, live/auth/provider execution or complete existing-product navigation was tested. This is a local composition/interaction correction. No install, service, commit, push, PR/comment, Library, production/shared-data/root-helper or other concept edit was performed. No remaining implementation blocker.
