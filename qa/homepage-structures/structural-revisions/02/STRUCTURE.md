# Court positions — bounded craft and phone revision

Source-ready grayscale revision in this folder only. The first `wireframes/02/` source and its images remain untouched. This keeps the court-position / field-note architecture as one of the twenty options; it does not claim final acceptance or implement full artwork.

## Contract and geometry

**User question:** “Where on our court can I understand this week, inspect my team or find someone in the league?”

**Primary action:** Choose one of six actual court positions to open its adjacent field notes. Matchup, modeled value, leading team, edition title, searchable roster inventory and recent move count remain useful information on the court itself.

At 1440px, a full-bleed flat 2D court occupies approximately three fifths of the page and the open reader occupies the remainder. The court stays visible while the reader's longer content scrolls with the document. The selected position is indicated by an underline and small selection marker, not a dark dashboard block. Closing the reader expands the court; another position reopens it.

At 390px and 320px, the whole useful court is composed vertically: wings above, matchup at centre, baselines below, then the sideline. The six positions use content-sized grid placement over the full court geometry rather than smaller absolute desktop coordinates. The reader follows inline. At very narrow enlarged text, positions use one wider lane with alternating alignment; no text is clipped to preserve a decorative court ratio.

Selection focuses the reader heading. On phone it also brings that heading into view. Back hides the reader, focuses the actual selected position and brings that target into view at every tested size. Escape closes the reader with the same return behavior. The reader is nonmodal. Native controls expose secondary lists and evidence; no hover-only, dragging or gesture path is required.

## Concrete changes from first source

- Replaced the inherited navigation/status/title stack with a compact GOAT / Stocks / Explore header. Home remains the brand destination and an explicit Explore route; every previous destination remains reachable. Public/member comparison is inside Explore.
- Replaced the permanent multi-line synthetic banner and footer warning with one compact **Synthetic concept** disclosure beside the court title. Its expansion retains the complete offline scope, Nov 12 fixture date, dated editorial/source distinction, zero/Pending/stale/unavailable distinction, missing producer boundaries and member/public fixture limitation. Per-row AI and editorial source provenance remains attached to the relevant content.
- Removed decorative study/zone numbers, tracked capitals, negative tracking, repeated “Open field notes” labels, repeated court-format labels and the extra member identity echo above the map. Position names remain useful context in the reader and accessible button text.
- Removed the filled selected rectangle, foldout edge strip, dotted status boxes, repeated reader dividers and row borders. Spacing carries the hierarchy. Court lines still explain the map; probability bars still encode values; the standings header retains its useful table rule.
- Reduced repeated matchup narration: the reader shows its week, incomplete status, source time and the actual team rows directly. “Saved AI picks” replaces implementation-oriented row terminology. Directory and standings leads are shorter; underlying facts are retained.
- Corrected return behavior so programmatically selected states restore their own trigger rather than an earlier clicked trigger. Back also scrolls that focused target into view at enlarged desktop text. Escape closes Explore or the provenance disclosure first when focus is inside them.

## Local semantic roles

This folder's own `:root` declares and consumes separate font roles for body text, headings and numeric values. It also declares body/caption/title/section/metric sizes and semantic colors for page, court, court lines, text, secondary text, controls, hover, rules, focus, selection and probability meter track/fill. All authored colors are neutral grayscale; local approved portraits retain `grayscale(1)`. There is no shared theme, production token edit, external font or imported presentation template. There are no letter-spacing or uppercase transformation rules.

## Content and capture map

`body.dataset.studyReady` remains `02`. `window.goatStudy.states` and `activate(id)` preserve six state IDs. The default `matchup` hook keeps the court visible at the top; on phone other state hooks bring their inline reader to its start. Native disclosure, search, sort, close and reopen behavior remain available within these views.

| ID | Position | Preserved information |
| --- | --- | --- |
| `matchup` | Centre circle | Own member pair / public featured pair; week, teams, managers, current records, incomplete scoring, known **0.0** and **Pending**; all five AI rows, returned choices, both probabilities, separate confidence, generation/model/prompt/input/evidence provenance |
| `roster` | Left wing | Member identity, 24-player count, standing/actions, modeled FAAB total, priced/unpriced coverage/basis/time, top three, all 24 values, unavailable history/Power, watch form, completed-week best/rough, news and moves; all ten league faces. Public mode renders league faces/values and tools without personal data |
| `standings` | Right wing | All ten teams, rank, manager, W–L, correctly scaled PF, playoff facts and honest Power unavailable |
| `edition` | Left baseline | Dated draft game and selection reason; three complete spotlight opinions/stats/periods/sources; happenings; source dates; both dated archive entries, historical scores and routes |
| `league` | Right baseline | Ten managers/team records/current opponents; all **228 unique player references** with positions, NBA teams and profile links; local team/manager/player search, standing/name/roster-size sorting; qualified prior-season attribution |
| `wire` | Sideline | All three synthetic league moves, dated happenings, sources, Stocks/trade/AI/Arcade/Free Throw actions and provenance boundaries |

Facts still use the required explicit import from `../../data.js`. The first saved AI choice remains Ware the Hoes At? at **35%**, the other side is **65%**, and independent confidence is **20%**. Stale results remain labelled; missing results retain five pairing rows and show no fabricated probabilities. Completed-week recap keeps the exact Nov 2–9 period, FP/GP, five-player coverage and shared best/rough selection once. Dated Week 1 editorial stays separate from current synthetic Week 3. History and Power remain unavailable. No price is relabelled as form, no zero is relabelled Pending, and no partial score is final.

Stocks retains `/stocks#player-board`; all previous routes, archive entries and team/player actions remain reachable. Public mode has no personal value rows or `/team` action. The mode switch remains a fixture comparison, not an auth boundary.

## Craft and motion

Hallmark's complete-experience principle keeps navigation on the court rather than making the court an ornamental opening. Elaya's inline expansion principle supports a readable adjacent foldout without repeated framed sections. Adapt informed content-sized phone positions instead of compressed coordinates. Apple/Rauno spatial continuity informed selection and return to the actual origin. Accessibility/frontend engineering informed native controls, visible focus and enlarged-text testing. Emil/pbakaus informed the decision to keep this bounded revision still: frequent selection and return are immediate, with no hidden essential text or decorative loops.

No animation was added. If the geometry passes independent review, the later motion thesis remains one short, interruptible foldout transition that explains its origin. Keyboard and reduced-motion behavior would keep the same still states and actions.

## Actual targeted verification

Installed Chromium/Playwright against the parent-served local port 4207:

- All six states at **1440 / 390 / 320**, each at **100% and 200% root text**: 36 render combinations, no document horizontal overflow and no page errors.
- Actual position → reader → Back paths for all six positions across the same six viewport/text settings: **36 paths passed**. Heading focus, expanded state, correct return target, returned target visibility and hidden reader were checked. The smallest exercised court target dimension was **61.56px**.
- Escape returned the standings reader to its actual court trigger. Explore and Synthetic concept opened without page overflow at all six settings; Escape closed and focused their own summaries.
- Directory retained 10 team disclosures and 228 player rows. “Embiid” search showed one team / one player; roster-size sort led with Ware the Hoes At? (27 players).
- Member view retained 24 value rows, ten faces, three watch rows and five unique recap rows. Ready AI retained five rows / ten meters and the returned 35% choice. Stale notice was present; missing AI retained five rows / zero meters. Public retained ten faces, zero personal value rows and zero `/team` links.
- Author inspected own 1440 / 390 / 320 default renders for court geometry and phone reading order. Temporary check images were removed. Root owns full-state evidence and Muse review.

## Limits

Awaiting full-state captures, Muse review and independent structural acceptance. This is still a static offline prototype; destination applications, production auth, physical devices and screen readers were not exercised. No formal universal accessibility/contrast certification is claimed. Small provenance captions and inline profile/source text links remain compact; the 44px court control target check does not claim every inline text link is a boxed 44px control.

No full artwork, production integration, first-source mutation, shared/Muse edits, Git operation, external call, install or subagent was used. No new content inventory was abridged in this revision. As in the first source, the current edition holds the three full spotlights while its identical archive disclosure links to that edition rather than duplicating them again; players remain in supplied order within team rosters.
