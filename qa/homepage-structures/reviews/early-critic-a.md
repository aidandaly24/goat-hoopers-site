# Early structural review A — frozen studies 01–07

Independent reviewer; I authored none of these studies. This checkpoint concerns grayscale geometry, navigation and information reveal. It is not a shortlist, final acceptance or permission for production work.

The required rework pairs are **01/05** and **02/07**. The complete 21 assigned verdicts, each with desktop and phone reasons, are in `early-pairs-a.json`. Other related families receive R where verified behavior supplies a substantive distinction; the pair count is not a diversity score.

## Rework requirements

**01/05 — N.** Both are one continuous, anchor-addressed home document: current pair, five saved picks, member value/form, league identities/directory, dated editorial, archive and tools. Both expand detail in place. On desktop, 01 uses columns and ledger rows while 05 uses staggered text and inline name runs. Those are local composition differences inside the same macroarchitecture. On phone both become the same long thematic sequence with a collapsed index and native disclosures. Display type, serif/sans treatment and the removal of card outlines do not establish another navigation model.

Rework one into a different task and reveal model on both sizes. For example, a query-led comparison workspace could replace the selected information and retain explicit comparison context, instead of exposing all home sections in another continuous scroll. Another type scale, offset section, or reordered anchor sequence does not resolve this pair. Preserve these originals and review the rework separately.

**02/07 — N under this gate's strict rail-and-reader rule.** Both ultimately have six topical selectors feeding one reader. 02 retains a broad court-shaped selector next to its notes column. 07 adds a room-shaped entry screen, hides that room after entry, and substitutes a narrow station rail next to the reading sheet. I verified that `#room` has zero height in entered locker/press states. The extra cover, rail width and scene do not create a different working task. On phone, 02 keeps its paired overview above notes while 07 substitutes six compact station buttons; the working content in both remains one selected vertical topic reader. That context-retention difference is real, but insufficient to distinguish the dominant architecture here.

Rework one so the spatial structure governs substantive working states instead of becoming a generic topic reader. An explicit possible rework for 07 is to make station-specific in-place reveals remain part of the navigable room: score selection opens a working score surface there, locker expansion exposes the roster there, and archive selection operates as a distinct browsing structure. The phone must preserve those task relationships with purposeful navigation, rather than reducing every station to the same topic strip and content stream. A new scene, tilted edges or a differently decorated rail will not resolve this pair.

## Observed structures and real behavior

| Study | Desktop geometry and behavior | Phone transformation and exercised states |
| --- | --- | --- |
| 01 | One continuous spread; asymmetric columns and marginal annotations; anchors move within the same document. | Columns become a long single reading flow. Pointer opened all 24 roster values; keyboard Enter opened model note 1; `Dybantsa` search left one matching club and opened its full roster. Both sizes retained the surrounding document. |
| 02 | Six spatially arranged summary selectors occupy most of the left side; one narrow notes reader changes on the right. | Paired positions remain in a large overview above the reader. Pointer selected roster; keyboard selected editorial and activated Back to court. Selection moved focus to `notes-title`; Back returned focus to the originating position. |
| 03 | Full-width chapters are physically adjacent in a horizontal reader; each has independent vertical scroll. Offscreen chapters are inert. | One bounded active chapter and a fixed bottom Previous/picker/Next bar remain. Pointer selected My club on desktop; phone picker and reader ArrowRight changed real chapters; search in League found AJ Dybantsa. Wheel scrolling reached the last roster rows/footer. Leaving and returning retained club scroll at 1428px desktop and 2389px phone. |
| 04 | Narrow source selector, broad replaceable program, and separately actionable five-game score rail. Scores remain available while reading a team or editorial. | A program picker and separate score summary/disclosure survive. Team and editorial were opened; keyboard activated game 2 from the score context, replacing editorial with that game's program. This independent second information context is the substantive distinction from the simpler selector/reader family. |
| 05 | One continuous anchor document; staggered text regions, flowing player-name runs and inline disclosures. | Same long sequence with an expandable text index. Pointer opened all 24 values; keyboard opened the first saved receipt; player search was entered. The roster becomes wrapping text rather than 01's rows, but the surrounding task/reveal model is unchanged. |
| 06 | Dated events pair annotation and evidence across a time spine. Topic and source-period controls change the visible event set. | Date groups remain in a vertical stream with working filters. Pointer Market produced two dated entries; keyboard period selection reduced Everything to the completed Week 2 event. Register button replaced the event view with the searchable dated register. This earns R against the other long documents, not N for merely sharing vertical reading. |
| 07 | Spatial entry overview becomes a six-button station rail and a single reading sheet after entry. Locker has a local two-column composition; press has an article/archive arrangement. | Overview keeps some paired objects, then becomes compact station navigation above ordinary body scrolling. Pointer entered locker; keyboard selected press and closed the station. Close restored the room and focus to the initiating locker. These are working controls, but the scene is chiefly an entry layer. |

The phone layouts do not all flatten identically: 02 retains its overview, 03 its chapter frame, 04 its independent score control, and 06 its date filters. The specific flattening concern is 01/05's common continuous sequence, plus 07's loss of spatial working context after entry.

## Inspected evidence and order

I read `AGENTS.md`, `reviews/PROTOCOL.md`, and `reviews/early-assignment.json`; consulted the architecture overview; then inspected pixels before reading author structure arguments or content maps. I did not read allocation or prior pair verdicts. Source-file hashes for all seven studies matched their `captures.json` manifests at the checkpoint.

For every image stem in the following table I inspected both `desktop` and `phone`. Paths are relative to `qa/homepage-structures/evidence/wireframes/NN/`:

| NN | Member opening: full JPEG and `-viewport.jpg` | Additional member full JPEGs | Public opening: `-viewport.jpg` |
| --- | --- | --- | --- |
| 01 | `member-{device}-00-default` | `member-{device}-02-roster.jpg`, `member-{device}-03-editorial.jpg` | `public-{device}-00-default` |
| 02 | `member-{device}-00-matchup` | `member-{device}-01-roster.jpg`, `member-{device}-03-edition.jpg` | `public-{device}-00-matchup` |
| 03 | `member-{device}-00-default` | `member-{device}-01-team.jpg`, `member-{device}-02-scout.jpg` | `public-{device}-00-default` |
| 04 | `member-{device}-00-matchup` | `member-{device}-01-team.jpg`, `member-{device}-03-edition.jpg` | `public-{device}-00-matchup` |
| 05 | `member-{device}-00-default` | `member-{device}-02-roster.jpg`, `member-{device}-05-edition.jpg` | `public-{device}-00-default` |
| 06 | `member-{device}-00-default` | `member-{device}-04-market.jpg`, `member-{device}-03-week2.jpg` | `public-{device}-00-default` |
| 07 | `member-{device}-00-room` | `member-{device}-02-locker.jpg`, `member-{device}-05-press.jpg` | `public-{device}-00-room` |

I parsed all seven `captures.json` manifests for paths, dimensions, states and scrollable-pane metadata. Complete tall JPEGs were used for whole-document geometry; native live views supplied readable working-state inspection. In 03 the whole-document JPEG is **not complete interior evidence**: its 815px desktop / 675px phone chapter viewport contains a longer independently scrolled document. I inspected actual club interiors through wheel scrolling to the bottom and verified retained scroll after keyboard chapter changes. After the parent added interior evidence, I also inspected `03/panes.json` metadata and the complete `member-{desktop,phone}-01-team-pane-0.jpg` and `member-{desktop,phone}-02-scout-pane-0.jpg` reading strips.

Live URLs were `http://127.0.0.1:4207/qa/homepage-structures/wireframes/{01..07}/index.html`, at 1440×1000 and 390×844, with reduced motion. The interactions above used real pointer clicks, keyboard Enter/arrow keys, native controls and search inputs; I did not call the advertised screenshot activation API. Scratch native screenshots inspected are `/tmp/critic-a-NN-{desktop,phone}-{state}.png`: 01 `roster,model`; 02 `roster,edition`; 03 `club,scout,league,club-bottom`; 04 `team,edition,game2`; 05 `roster,receipt,search`; 06 `market,week2,directory`; 07 `locker,press`.

After first pixel judgments I read the content-map/abridgment sections of all seven `wireframes/NN/STRUCTURE.md` files; 03's full STRUCTURE was also read. I inspected 01's small `index.html`, but did not use CSS/JS implementation narratives as proof of distinct structure.

## Inventory and fixable defects

The content maps place the five AI returns, 24 member values, ten teams/faces/standings, 228 roster references, dated editorial, both archives and tools in reachable disclosures/readers. This is a map check and selective live reachability review, not a fresh exhaustive inventory certification. Search in 01/03 reached the actual AJ Dybantsa reference. 05 explicitly withholds the supplied member value rank and omits secondary metrics/playoff settings; that abridgment should be reconciled against the common required inventory before complete-content acceptance. Other maps omit technical/null metadata and unavailable producers; none earns structural difference by hiding required material.

- **03 phone overflow reproduced:** League → Standings had `innerWidth=390`, document `scrollWidth=1187`, while active chapter width remained 390. The table header contributes the excess. This is a fixable responsive defect, not the reason for any conceptual rejection.
- **04 desktop numbering:** 04 and 06 visibly wrap their two digits onto separate lines in the left source selector. Fix the number column/wrapping; this does not erase the independent-score architecture.
- **07 selected archive title:** in Press, selected “The next chapter” is white on a transparent background over the light sheet on both sizes. I reproduced computed foreground `rgb(255,255,255)` with transparent button background. Restore readable selected text/background and visible focus. This is a concrete contrast defect, separate from 02/07's N.
- **01 enlarged-text overflow:** parent reported a 200% text defect. I did not repeat that matrix; it remains separate from 01/05's conceptual N.

No source fixes, production/shared edits, Git operations, installs, external writes or subagents were used. Playwright's bundled browser was absent; installed `/usr/bin/chromium` worked, so no browser blocker remained. This checkpoint does not cover all advertised states, every provenance disclosure, external destination behavior, screen-reader/physical-device testing, final art or motion. No full-product accessibility certification is claimed. Stop point: early seven-study gate only; remaining assignments are pending.
