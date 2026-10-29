# Structural revision 10 — Quote planning bench

Grayscale structure only. The original `wireframes/10/` is untouched. New authored files are confined to this revision folder: `index.html`, `bench.css`, `bench.js`, `STRUCTURE.md`.

## Before / after

The first version had a task rail that replaced one ordinary matchup, roster or editorial document. Critic C correctly observed that numbered reading sections did not create a working task. Its Pending status also broke across lines.

This revision is a mutable entity workspace. A user builds **Package A and Package B** from actual player references and supplied modeled quotes. Add, remove and move operations change the packages, priced coverage and monetary subtotal. The selected players and quote inspections remain while league/model/editorial notes are consulted. Evidence references can be retained in the working tray. Browser Back and Undo restore earlier working selections. There is no category rail, exclusive reader, team dossier or full-team matchup comparison masquerading as a task.

The default example selects the two current-pair modeled anchor quotes: Joel Embiid $137.50 and Domantas Sabonis $140.75. These are starter working selections, not a claimed saved user trade. The task can include arbitrary players from multiple franchises. Each player can be in one package at a time; moving an entity removes it from the other package. Source controls change only the candidate set, never the working packages.

## Surface contract

- **User question:** Which actual players and supplied quotes should I take into a trade-planning conversation, and what evidence should I retain with them?
- **Primary action:** Add/move/remove players, inspect quote evidence, retain a relevant note, then follow the real `/trade-analyzer` destination.
- **States:** Two seeded packages; multi-player package; in-place quote inspection; partial pricing; retained model evidence; own roster audit; all-league records; dated notes. Stale and missing saved models remain explicit.
- **Desktop:** Candidate quote shelf and attached notebook on the left; persistent working tray on the right. Both packages remain present. The tray has bounded native vertical scrolling when its actual contents exceed the viewport. Reading a dated or roster note does not replace the tray. No bordered card grid or overview widgets.
- **Phone:** Two packages remain side by side in the initial working area, with full useful entity controls. Candidate shelf and notebook follow in normal flow. A compact bottom strip preserves A/B quote totals and player counts while reading, with an Edit tray anchor back to the actual working packages. No category picker or multi-link header wall. The header has GOAT, Synthetic concept provenance and a native Go to disclosure.
- **Forbidden:** A replacement topic reader, fabricated trade verdict, backend or AI generation call, invented quotes, zero substituted for Unpriced, hidden personal edition in public, fake ranking or history line, decorative terminal labels and ornamental tags.

## Working state, validation and access

All facts are imported explicitly from `../../data.js`; no runtime provider, module, font or image request goes outside the local fixture. Candidate identities come from all 228 supplied roster references. Member mode has 33 unique supplied quotes: 24 own roster values and the ten public anchor quotes, with the overlapping own anchor counted once. Public mode has ten anchor quotes and no member roster-price projection.

Packages sum supplied quote values in integer cents. Empty means No selection. An all-unpriced package says Unpriced; it never reports a fabricated $0 value. Partial pricing says **subtotal**, priced count and Unpriced count. Fully priced packages say modeled FAAB total. The display supplies quote arithmetic and no judgment of fairness or player quality. The analyzer link does not pretend to transfer a package through an unsupported URL parameter.

Add/move inputs are checked against real player IDs and package sides. The history boundary validates player IDs, uniqueness across the two packages, note IDs, source/sort values, page integer and query type before restoring state. Pagination rejects invalid/out-of-range pages. User search text is escaped in rendered values. Unknown capture-state IDs throw before mutation.

Actual mutations and retained-evidence changes push local history. Candidate filtering/pagination and native disclosure state update the current entry. Browser Back/Forward and Undo restore working selections and a useful control/working-tray focus. Source Add/Move/Remove controls stay keyboard operable after their label/state changes; updates have a polite status announcement. Quote inspections and several notebook notes can remain open together, including after retaining a note. Escape closes an active quote inspector or header disclosure and restores its native summary focus. Nothing is modal or trapped.

Selections persist while working in this page and through its browser history; reload persistence and external submission are intentionally absent. `Synthetic concept` opens full fixture/date/provenance and the public/member comparison. The Go to disclosure preserves real destinations without a permanent navigation wall.

Pending uses a nonwrapping status column whose width follows its text. The current pair remains visible beside the working players; manager/current-record details are reachable in place. Known 0.0 stays distinct from Pending and the pair remains incomplete.

## Content map

| Required information | Reachable place |
| --- | --- |
| GOAT / Home / direct destinations | GOAT Home link; Go to contains Home, News `/intel`, Stocks `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, Trade Analyzer and Weekly archive. Member mode adds `/team` and `/teams/1#team-roster`. Analyzer is also the tray's action. Stocks/player/team profiles remain native valid links. |
| Current pair | Working tray always retains the member's current pair, or public first current pair, with week, both team names/scores and incomplete status. Manager names/current records are in its disclosure and repeated in current-week evidence. |
| All five AI decisions | Current matchup / saved models notebook note. Every pair's returned choice, both probabilities and independent confidence is visible. First returned choice remains away 35%, other 65%, confidence 20%. Each record has model/prompt/timestamp/input/slate snapshot/baseline/evidence disclosure. Null input remains unavailable. Stale and missing variants have visible local status. |
| Member identity / modeled roster | My roster / values and form note: team, manager, standing, record, count, team actions, supplied $1095.25 modeled total, coverage, time, in-season basis, supplied modeled-value rank 2/10, top three quotes/changes with unknown change period disclosed, all 24 roster values in native disclosure, recorded history unavailable. Public omits this note and its private prices. |
| Form / completed week / member wire | Same member evidence note retains all watch EMA FP/G, games and limitations; best/rough FP and GP, exact completed Week 2 period/eligible coverage and synthetic caveat; both news items and recent move with source/time/type. No form claim derives from price. |
| Ten faces and public rosters | League people / records note: all ten grayscale approved portraits, anchor player/team links and modeled values; full directory with managers, current record/opponent, champion label only where supplied, all 228 unique player references with position and NBA abbreviation in roster disclosures. Team 8's 2025 record explicitly belongs to previous manager QBs Gremlins. |
| Search and sort | Candidate shelf searches player, team or manager within the labelled source; select All 228 players for league-wide lookup. Source can be current pairing or any of ten teams. Actual quoted-value/name/team sort and ten-row pagination operate locally. Unknown values sort after known values and remain Unpriced. |
| All ten standings | League evidence note has rank/W/L/PF, with PF divided by 100. Power unavailable, no fabricated ranking. |
| Dated editorial | Dated editorial / archive note uses coherent `data.archive[0]` (1/5) for Oct 5–11, its draft/unpublished status, game/context/selection reason, all three exact spotlight opinions/stats/periods/source dates, happenings and source list. Its older-entry disclosure carries Sep 28–Oct 4 (5/7) historical final, score, provenance and real edition route. |
| Arcade / moves / unavailable data | Moves / play / data gaps note retains all three recent league moves, existing grayscale game preview and `/arcade/free-throw` Play route, history and Power gaps and unprovided league leader inputs. |
| Provenance / comparison | Compact Synthetic concept opens complete offline synthetic caveat and fixture date; footer repeats synthetic status/gaps and public/member comparison. Dated sources carry their own dates. |

The conflicting `home.edition.game.teamIds` 1/2 is never combined with its dated prose about 1/5. Current Week 3 comes from the personal/current directory pairing; dated game narrative comes from the coherent archive. Shared fixture files were not edited.

## Capture hooks

`document.body.dataset.studyReady='10'` and `window.goatStudy={states,activate}` are available. Each activation selects actual local content/state, resetting candidate filters for deterministic captures.

| State | Working result |
| --- | --- |
| `bench` | Two current-pair anchor selections, candidate shelf and closed evidence notes |
| `built-package` | Several supplied player quotes together in A; B and retained model reference remain |
| `quote-evidence` | Supplied quote provenance open inside the retained A entity |
| `unpriced` | Actual unquoted roster player added to A; honest subtotal and coverage |
| `current-week` | All-five model note open/retained while packages remain |
| `roster-audit` | Member audit open/retained; public uses public league evidence |
| `league-records` | All-team directory/roster/standings evidence open/retained |
| `dated-notes` | Coherent dated editorial open/retained while working packages stay present |

Remaining actual states are individual roster/source selections, candidate pages, independent native disclosures, header destinations/provenance, older archive and tools/play evidence. Long desktop tray content has an actual element scrollbar; the page and notebook use ordinary page scroll. Phone has no inner tray scroller.

## Applied references and latest quality direction

The current brief and critic C were read for this revision. Earlier repository architecture/design and GOAT hierarchy/navigation/motion references, plus supplied craft notes, remain applicable.

- **Hallmark custom direction/macrostructure:** The retained task state governs the complete experience. This revision changes the actual data/interaction model, not labels over a different reader. Candidates, packages and retained references coexist.
- **Elaya redesign:** The old exclusive-reader pattern was removed. Working rows, native evidence expansion and one retained tray replace repeated boxes and section numbering. No marketing funnel or shared template was imported.
- **pbakaus adapt:** Phone preserves two editable packages and a persistent total/return affordance while reading; it is not a desktop rail turned into a category select.
- **Rauno / Apple-design continuity:** Moving an actual player changes its package membership; its quote evidence stays attached to that entity. Retaining a source note adds an intelligible reference back to its existing location.
- **Addy accessibility / frontend engineering:** Real add/move/remove/history actions, local data boundaries, labelled controls, focus, actual full-length names and independent reflow checks establish the bounded evidence.
- **Animation references:** Frequent edits and keyboard input are immediate. Stage one uses no autonomous motion. A later motion candidate is brief source-to-package continuity for an entity move, with unchanged numeric labels and an instant reduced-motion/focus equivalent. No library is justified.
- **Latest user quality references:** Normal tracking, plain task nouns, useful grouping and units; no italic accent words, decorative tags, opaque overlays, terminal labels or equal bordered boxes. Remaining separators track actual roster records, package membership or evidence boundaries.

## Actual checks

Local static fixture at `http://127.0.0.1:4207/qa/homepage-structures/structural-revisions/10/index.html?view=member`, installed Playwright and Chromium; no external application actions:

- `node --check bench.js` passed.
- Final 40 state/reflow checks: all eight states at desktop 1440, phone 390, phone 320, desktop 1440 with 200% root text, and additionally 320 with 200% root text. Zero horizontal overflow or page-script errors.
- Actual source Add A for Anthony Edwards produced A $262.00; moving him to B produced B $265.25; browser Back restored A $262.00. Add focus remained on its working source control.
- Actual Kyrie Irving keyboard Add produced an Unpriced member of B, honest 1/2 priced and subtotal; Back removed that selection. Partial A testing also produced 2/3 priced and subtotal.
- Retaining the current-week note preserved all selected player rows and an already-open Joel Embiid quote inspector. Desktop dated-note activation left the tray at viewport top 16px with both selected players retained; its long-content native scrollbar was confirmed.
- League note has 228 roster rows and 228 unique player IDs. Member full-value disclosure carries 24 rows. Search Embiid produces one source player; Player A–Z begins Aaron Gordon.
- Member/public × ready/stale/missing variants all retain five model rows. Public has zero own-audit notes and only ten supplied public quotes; member has 33. Correct 35/65/20 model values and stale/unavailable labels were checked.
- Quote Escape returns summary focus; Go to Escape closes and returns summary focus. Phone persistent tray, keyboard package edit/Back and navigation after live reduced-motion preference change were exercised. Invalid capture-state input was rejected.
- Pending's computed style is `white-space: nowrap` and it fits its rendered status column. No exercised local HTTP asset errors. Native default desktop/phone screens were visually inspected.

## Limits

This is a new structural candidate for fresh review, not full acceptance. The source shelf is paginated; full roster identity is also available without pagination in league disclosures. Notes do not disappear when another opens, but their natural page length remains a reading cost. The workbench may scroll vertically on desktop with several selections or expanded quote evidence; phone uses ordinary page flow and a retained summary.

Native production destinations are preserved but their external application flows were not followed. No actual authentication, pricing engine, trade execution, model generation, backend persistence, theme/art polish, screen reader, physical device or production build is claimed. Fixture mode is not an auth boundary. Changes are restricted to this folder; no originals/shared/production/Muse/Git edits, external calls, installs or subagents.

Raw domain IDs, points-against, zero ties/games-back and empty move-leg objects are not each rendered as separate data objects. Their required user-facing counts, current records, PF and provenance are present; underlying common facts remain unchanged. No unprovided historical values or trade verdicts are inferred.

Frozen for coordinator captures and fresh independent review.
