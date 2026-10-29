# First-source structural adjudication

Blind verdicts locked before consulting the shared inventory. This reviewer did not author the studies and did not read allocation files, author STRUCTURE.md claims, or existing critics before locking the blind verdicts. After that lock, bounded content/limits excerpts from STRUCTURE.md were consulted only for inventory reconciliation; no existing critics or allocation files were read. No source or Git changes were made. This is a grayscale architecture gate, not artwork, preference ranking, release approval, or a claim that all20 structures are unique.

The exact first-source freeze was checked by SHA-256: 81 files checked, 0 mismatches. Live base: `http://127.0.0.1:4207/qa/homepage-structures/wireframes/NN/index.html?view=member`. Viewports were native 1440×1000 and 390×844, reduced motion. Browser interactions used real Playwright pointer clicks, keyboard Enter/native-select keys and wheel input; no state-capture API was used to establish interaction. Each of the 13 assigned studies received substantive pointer and keyboard checks at both widths. Test-locator mistakes were corrected against the actual DOM; they are not reported as product defects.

Existing evidence root: `qa/homepage-structures/evidence/wireframes/`. For each ID, captures.json identifies native viewport JPEGs and whole-document JPEGs for every saved state. Initial native desktop/phone pixels were inspected for01,02,03,04,05,07,09,10,12,13,16,19,20. Full member desktop default and the first two substantive recorded states were inspected as geometry strips, then selected native states and live views were inspected at readable size. 03 also required the complete interior reading strips in panes.json; its1000/844px document capture alone does not represent the chapter contents. Public capture manifests were checked for the corresponding initial states; exhaustive public-mode interaction/content equivalence was not tested. Findings below concern architecture demonstrated in the member states, with public coverage limited accordingly.

## Verdicts

| Pair | Blind verdict |
| --- | --- |
| 01/05 | N |
| 02/07 | R |
| 09/12 | R |
| 03/20 | D |
| 02/19 | D |
| 04/13 | D |
| 13/19 | D |
| 02/04 | R |
| 04/10 | R |
| 16/19 | R |

D = defensibly different; R = related family with substantive structural differences; N = near duplicate requiring structural rework; U = uncertain/uninspected. R does not establish twenty-way uniqueness.

## 01/05 — N

Both are a continuous vertical document reached through a section index, beginning with the unfinished matchup and proceeding through saved picks, own roster/form, people/directory, dated editorial, archive and tools. Both reveal receipts and rosters in place through details disclosures. The larger type, column proportions, extra people region and longer rhythm in 05 do not create a different page/state architecture. Phone preserves the same long document and collapsed contents pattern.

Desktop evidence: 01/member-desktop-00-default.jpg; 01/member-desktop-01-model-notes.jpg; 01/member-desktop-02-roster.jpg; 05/member-desktop-00-default.jpg; 05/member-desktop-01-picks.jpg; 05/member-desktop-02-roster.jpg. Native 1440 viewport files inspected separately.

Phone evidence: Native 390 default viewport files for both; real saved-receipt and complete-roster disclosures exercised at 390. Both remain one ordinary document scroll.

Real interaction: Pointer anchor to model/picks followed by pointer saved receipt disclosure; keyboard Enter on complete 24-player roster disclosure, on desktop and phone. Both receipts and roster may remain expanded together.

Required structural rework: Rework one, proposed 05: replace the continuous section-index document with a working comparison of all five pairings in aligned rows, with score/model/source dimensions that can be investigated while row identity and other pairings remain present. Phone must keep the selected pairing and comparison context instead of reproducing the same anchored long document. Re-audit that rework against all other studies before advancing either pair member.

## 02/07 — R

Both use a spatial overview to enter one content area, but their working geometry and retained context differ. 02 retains the six-zone court as a roughly 60% wide working index beside a narrow field-notes reader. 07 replaces its room overview with a small station navigation rail and a broad station document; its score station juxtaposes a matchup and five model calls. This is a related selector/reader family with a real overview-to-station transition, not an independent architecture established by room artwork.

Desktop evidence: 02/member-desktop-00-matchup-viewport.jpg and 01-roster/02-standings full states; 07/member-desktop-00-room-viewport.jpg plus 01-week/02-locker full states.

Phone evidence: 02 retains the compact court above selected notes and scrolls to notes with Back to court; 07 removes the room and introduces a wrapped station nav above the station document. Both native 390 images and live selected views inspected.

Real interaction: Pointer roster zone and keyboard standings zone in 02; pointer score-wall entry and keyboard own-locker navigation in 07, at both viewports.

## 09/12 — R

Both retain a broad diagram beside a replacement reader and are therefore close relatives. 09 navigates dated stops and current-week branches; dated readers expose continuation/return links along the route. 12 has two actual selection grains: a franchise node opens its roster shelf and updates the retained central game/connection, while a game edge selects the paired teams and a game reader. The orbit is a working team/game context, rather than only a new drawing around the same category selector.

Desktop evidence: 09/member-desktop-00-archive-40-viewport.jpg, 01-archive-41 full and 02-current full; 12/member-desktop-00-default-viewport.jpg and 01-team full; live team2/team8 and game2 states.

Phone evidence: 09 unfolds into a vertical stop route followed by its dated/branch reader; 12 keeps the compact numbered orbit and central pairing before the shelf. Team and game selection still update both diagram context and reader at 390.

Real interaction: 09 pointer current junction, keyboard team branch, then actual dated continuation to archive-41; 12 pointer franchise2 and franchise8, keyboard game2, at both widths.

## 03/20 — D

03 is a fixed-height, horizontally positioned sequence of chapters with one independently scrolling chapter active at a time, a persistent bottom previous/next/index control, and retained reading offsets. 20 is a nested question/child path: players leads to form or prices, with parent breadcrumb and summary retained alongside the current branch and a stable matchup context. These create different relationships between sections, not different names for the same reader.

Desktop evidence: 03/member-desktop-00-default-viewport.jpg, 01-team/02-scout viewport states and default/team reading strips in panes.json; 20/member-desktop-00-home-viewport.jpg, 01-players and 02-form full states.

Phone evidence: 03 keeps a bounded chapter scroller and bottom chapter select/arrows. 20 compacts the matchup into a disclosure and stacks the ancestor trail/current child in the document; it retains nested parent/child navigation rather than a chapter carousel.

Real interaction: Pointer Next and keyboard Next in 03; wheel week to600, team to420, return to week retains600 at both viewports. Inactive chapters are inert. In 20 pointer players then keyboard form child preserves This week/My players/Form path at both viewports.

## 02/19 — D

02 has a fixed set of six category zones and one side reader. 19 lands in a searchable alphabetic franchise field and inserts a dossier immediately after the selected entity row, pushing following rows down; selecting another team moves that single insertion to the new row. The dossier has entity-specific overview/roster/form tabs. The list is the working document, not a decorative selector feeding a generic side drawer.

Desktop evidence: 02 matchup/roster/standings states; 19/member-desktop-00-index full and 01-own-dossier viewport/full states, plus live second-team insertion.

Phone evidence: 02 keeps the court over notes. 19 retains the alphabetic field and row-positioned dossier with a persistent bottom Teams/Find player/Notebook/My team bar; roster tabs stay inside that insertion.

Real interaction: 02 pointer roster and keyboard standings; 19 pointer own franchise, keyboard Roster, then pointer team2; exactly one dossier remains and moves to team2, on desktop and phone.

## 04/13 — D

04 is a three-context workspace: source navigation, a replaced central program and a separate current-score rail that remains available while the program is roster or dated editorial. Score selection can replace the program independently. 13 is an in-flow chapter fold: opening a spine inserts its spread between neighboring folded chapter spines and replaces the previous open spread; closing can return to five closed spines. It has no independent persistent score workspace.

Desktop evidence: 04/member-desktop-00-matchup-viewport.jpg, 01-team and 03-edition full; 13/member-desktop-00-week-viewport.jpg, 01-club/02-league full and 06-closed full.

Phone evidence: 04 transforms source navigation into a native select and scores into a separate toggleable strip; score choice still changes the program. 13 keeps full-width chapter spines and the opened spread in their place in the sequence, with neighboring chapter controls at the edge.

Real interaction: 04 pointer team, keyboard editorial, keyboard game2 from score rail; phone native source selector and actual score toggle/game2. 13 pointer club spine and keyboard league spine at both widths.

## 13/19 — D

Both can expand content in document flow, but 13 expands one thematic chapter in a fixed five-chapter sequence, keeping neighboring spines. 19 filters/orders an entity index and inserts one team dossier at that team’s alphabetic position; the team dossier itself has local tabs and can move to a different entity row. Section expansion and entity insertion are different working hierarchies.

Desktop evidence: 13 week/club/league/closed full states; 19 index/own-dossier/roster-search full states and live team2 insertion.

Phone evidence: 13 keeps chapter spines surrounding the single thematic spread. 19 keeps letter filter/search/order, entity-row insertion and bottom entity/navigation controls. Neither becomes the other’s generic stack.

Real interaction: 13 pointer club and keyboard league; 19 pointer franchise1, keyboard Roster, pointer franchise2 at both widths.

## 02/04 — R

Both select a category and replace a working reader, so they belong to the same broad family. Their persistent contexts differ materially: 02 dedicates most of the width to the six-zone court and a narrow notes column; 04 uses a small source rail, broad program, and an independent five-game score rail that survives non-matchup programs. Selecting a score in 04 changes both the selected game and the program.

Desktop evidence: 02 matchup/roster/standings viewport/full states; 04 matchup/team/edition viewport/full states plus live game2.

Phone evidence: 02 keeps its two-dimensional court before notes, with a return-to-court action. 04 compresses source selection into a native select and scores into a separate expandable strip above the program. Actual controls preserve those two axes at 390.

Real interaction: 02 pointer roster/keyboard standings; 04 pointer team/keyboard edition and score2, with phone native selector and score-strip toggle.

## 04/10 — R

Both start from a narrow task/source rail and a broad replacement document, so this is a related workspace family. 04 always carries a separate five-game score context. 10 instead arranges the selected task as numbered steps and adds an on-demand evidence inspector beside that document; the inspector is local detail and can be closed back to the task. This is a substantive persistent-score versus task/detail relationship, beyond labels or section order.

Desktop evidence: 04 matchup/team/edition full states; 10/member-desktop-00-matchup-viewport.jpg, 01-pick-evidence viewport/full and 02-roster full. Live inspector verified alongside the unchanged matchup task.

Phone evidence: 04 has native source select plus independent score toggle. 10 has a native task select and replaces the task with its evidence inspector, with Back to matchup document returning to the task. Neither is merely the same stacked cards.

Real interaction: 04 independent source and score operations; 10 pointer Inspect model evidence, keyboard Back to matchup document, and keyboard/native roster task selection at desktop/phone.

## 16/19 — R

Both are franchise-first browsers with local week/roster/form detail and a separate league reader, but the dominant entity traversal differs. 16 has one selected franchise on a horizontal bench, next/previous/direct-index controls, and one attached dossier beneath it; 19 keeps the alphabetic franchise list as the document and inserts a single dossier at the selected row. The shared dossier vocabulary makes them relatives, while traversal and context placement remain structurally distinct.

Desktop evidence: 16/member-desktop-00-bench-viewport.jpg, 01-neighbor and 02-roster full; 19 index and own-dossier full plus live moved insertion.

Phone evidence: 16 becomes one selected franchise/face with next/previous/direct select above its attached dossier. 19 retains a filtered vertical index with the dossier between entity rows and a persistent bottom bar.

Real interaction: 16 pointer Next franchise then keyboard Roster tab; 19 pointer own team then keyboard Roster and pointer team2, at both widths.

## Interaction and geometry observations

- 03 independent scroll retention was observed directly at both widths: Week chapter scrollTop600, switch to My club, scroll that chapter to420, return to Week and its offset is still600. Inactive chapters have inert=true, so offscreen sibling chapters are not ordinary active tab stops. This supports a real chapter architecture rather than inferring horizontal navigation from a footer label.
- 19 permits one open dossier, not simultaneous multiple dossiers. Opening team2 after team1 removes the earlier insertion and places the new dossier after team2. The distinction from16 rests on the retained entity list and location of insertion, not a claim of multi-team comparison.
- 04 score selection is not independent parallel content editing: selecting game2 changes the central program back to the matchup program. Its separate score context remains substantive while other sources are being read. On phone the complete score rail must be expanded; the collapsed strip preserves only the current pairing.
- 10 evidence detail retains the task beside it at desktop and becomes a dedicated evidence view on phone. The task picker remains available and the inspector has an explicit return. Its score column wraps Pending into fragments at1440 and390 in the supplied native images. This is a fixable layout/readability defect; it does not determine the structural verdict.
- 16’s horizontal bench has tightly colliding adjacent player/team labels at1440 in the initial native screenshot, and the rightmost franchises extend beyond the initial visible bench. Direct index and previous/next controls provide real access; spacing/label separation and a clearer continuation affordance still need repair. Phone exposes one face with direct index, making access clearer but reducing simultaneous peer context.
- No JavaScript page errors were emitted during the completed main live passes. Successful pointer/Enter transitions are not a complete accessibility audit; screen-reader semantics, contrast and every external destination were not fully audited.

## Content reconciliation after blind verdicts

The blind verdicts above were saved before reading BRIEF.md, inventory.json or author content/limits excerpts. The shared inventory contains 10 franchises, 228 roster references, 10 representative faces, 5 saved AI matchups, 24 personal roster values, two personal news rows, one personal move, and two dated archive entries. W41 contains 3 spotlights, 3 happenings and 5 sources; W40 contains 0 spotlights, 1 happening and 1 source. The personal valuation rank supplied in the fixture is 2/10. Null Power/history/aggregate fields are unavailable evidence, not missing populated results.

Concrete inventory observations, separate from structural classification:

- 20’s live league branch has no input/search field, but has a native rank/name/roster-size sort and complete roster disclosures. Its post-verdict content note says search was intentionally excluded by its assignment. BRIEF.md asks for useful local team/player search. Root should resolve that requirement exception; this reviewer did not read the allocation. The absence is verified, while its authorization is not adjudicated here.
- 05 and19’s post-verdict limits notes explicitly withhold the supplied modeled valuation rank; current standing is a separate field and must not be mistaken for that rank. They state concerns about comparison coverage. This is a documented stage-one abridgment requiring factual resolution for a full implementation, not an architectural reason to merge or separate them.
- 12 phone compresses the diagram’s team/player/value labels into numbered faces. Names, NBA positions and full roster details remain reachable through real team selection; it should not be described as showing all ten named faces simultaneously on phone.
- 16’s local historical-final disclosure preserves the final, selection context and source, but omits W40’s supplied “A rebuild to follow” happening (QBs Gremlins becoming NeuralNets). The actual dated archive route remains linked; the static local dispatch does not itself expose that happening. This is a specific local-content abridgment.
- 16 phone exposes one selected franchise and face; the other franchises are reached through actual previous/next/direct-index controls. This preserves access while deliberately reducing simultaneous peer information.
- 01/05 receipts and complete personal roster values were opened by real controls, not inferred from collapsed screenshots. 19’s 24-player roster tab was also exercised. Complete 228-reference equality across every study and every state was not numerically certified by this adjudication; bounded author content maps are not substituted for that independent field-level audit.
- The recorded 09 first saved state is archive-40, while the actual live member boot is the current junction. Dated-stop continuation was deliberately reached with live controls after inspection. A capture-state ordering must not be reported as a different actual landing behavior.

These findings preserve the blind verdicts and identify work for the complete-content gate. They do not establish public/member authorization behavior or the behavior of production destinations served outside this static 4207 fixture.
