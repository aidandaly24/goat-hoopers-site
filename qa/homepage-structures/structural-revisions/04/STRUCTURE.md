# 04 — Broadcast switcher: bounded structural revision

**Status:** Frozen grayscale source for fresh captures and independent review. Original `wireframes/04/` and its images remain untouched.

**User question:** What is happening in my selected game, and which source should I put on the main program next?

**Primary action:** Select a game to put its actual current fixture context on program, or switch source while keeping the selected score context available. This remains a source/program/score architecture rather than a series of equal dashboard tiles.

## Before / after

- **Source indices:** the initial arbitrary two-digit source labels could split `04` and `06` into separate digits. This revision removes those decorative indices. Source names now occupy the slate directly. There is no keyboard channel-number action to justify keeping a number. Week 3, Game n of 5, standing ranks, GP, dates, scores and probabilities remain because they identify actual information.
- **Phone entry:** the inherited multiple-link masthead and long fixture warning pushed the actual program down. A single Menu disclosure preserves all ten site destinations plus the public/member comparison link. A compact always-visible **Synthetic concept** disclosure retains the complete warning, November 12 fixture date and non-authentication caveat. The footer retains the concise synthetic label and useful routes.
- **Measured opening:** at 390×844, 16px root, the initial score field began at y=669.8px. The revised field begins at y=296.3px; its first numeric score begins at y=505.8px. These are browser geometry measurements of the two local versions, not a subjective acceptance claim.
- **Phone broadcast controls:** source selector and selected score strip now share one sticky control group. The group remains available while reading a source. Expanding the score rail reveals all five games. Selecting a game closes the rail, puts that game on program and returns focus to the program. Scroll placement uses the actual control-group height so the program is not concealed behind wrapped controls at enlarged text sizes.
- **Repeated explanations:** removed the numbered PROGRAM tag, repeated member/fixture subtitle, repeated current-pair introduction and long 0/Pending explanation. The current field retains week/game position, Incomplete status, actual team/manager/record/score, Fantasy points and Not supplied. The score rail clarifies Pending once. The model still shows its exact returned choice, both probabilities and independent confidence.
- **Ornament:** removed arbitrary tool-list numbering, tight heading/value kerning, model border stripe and nonessential separator lines around stories, faces and headings. Kept score separation, selected-game marker, probability split, roster/table lines and focus outlines because they carry grouping, selection or access. Local semantic grayscale color and system-font tokens live in this author's CSS. No theme art, animation or broad reader replacement was introduced.

## Retained geometry and states

At 1440px the default still has a narrow 168px source slate, one large flexible program and a 282px score rail. One focused dark score field dominates. Other sources still use the appropriate unboxed valuation ledger, scouting comparison, dated edition reader, searchable roster index, standings and handoff list. Source selection replaces the complete reading surface while preserving the selected score context.

Below 820px, one native labeled source selector and one score-rail toggle remain above the active reader. They stay visible during document scrolling. The expanded phone rail has its bounded internal scroll area; other reading remains normal document flow. Intrinsic text reflow retains full names and values at 320px and 200% root text, including a one-column team comparison when enlarged text requires it.

`document.body.dataset.studyReady = '04'` and `window.goatStudy` remain unchanged contracts. Eight member states / seven public states are `matchup`, `team`, member-only `scouting`, `edition`, `league`, `standings`, `wire`, `tools`. `activate('matchup')` selects the own/first pair; `activate('league')` selects the roster index. Five game choices, both edition-date choices, League faces / roster / standings controls, search/sort and native detail disclosures remain real substates. No capture is faked. Menu and concept disclosures close with Escape and restore focus to their own summary. No modal, gesture-only, hover-only or drag path exists.

## Preserved content map

- **Find/action:** GOAT identity; Home, News `/intel`, Stocks `/stocks#player-board`, History, Arcade, AI Decides, Teams, Transactions, Trade analyzer and Weekly archive in Menu. Actual Free Throw destination remains in Tools. Member actions retain `/team` and `/teams/1#team-roster`. Comparison retains AI query state.
- **This week:** all five current directory pairings with exact scores and incomplete status; selected program carries both team names, managers and records. Known `0.0` stays separate from null `Pending`. All five saved AI rows retain exact returned away choice at 35%, other side 65%, separate confidence 20%, timestamp/model/prompt/null input snapshot/evidence/probability qualifier. The lower-probability stored choice is never silently replaced. Stale and missing query states remain explicit; nothing is generated.
- **Member:** 24-player roster, identity/standing/actions, exact modeled FAAB subtotal, 24/24 priced coverage and zero unpriced, basis/time/value rank, top three exact values/change and all 24 values/positions, unavailable recorded history, two supplied news items and recent move. Public rendering substitutes League faces and has no member valuation/news/scouting edition.
- **Scouting:** all three exact form-watch EMA examples with sample counts/availability notes and source distinction; completed Week 2 best/rough are deduplicated with both selection positions, exact points/GP, five-player eligibility, period and DNP/unknown exclusions preserved.
- **League:** all ten faces with profile/team/manager/position/modeled value; ten searchable team files, current record/opponent and all 228 unique player references with position/NBA and actual profile links. Team and roster-player sort controls remain. All ten standings use `pointsFor / 100`; NeuralNets' prior-manager QBs Gremlins attribution remains explicit. Power stays unavailable.
- **Read/explore:** both coherent dated archive records, game context, all three exact spotlights with opinion/stat/source periods and selection/source checks, happenings, all edition sources/date bounds and draft publication status; all three supplied current transaction records and their empty player legs. Both dated routes remain real links. The contradictory `home.edition.game.teamIds` is not used to invent a corrected pairing; dated editorial comes from the coherent archive and Week 3 comes from directory/personal sources.

No required information family was removed for compactness. Source data imports remain `{inventory,data,mode,aiState,esc,money}` from `../../data.js`.

## Reference principles that changed this revision

The supplied critique was applied to decorative numbering, tags, tight kerning, repeated labels, divider forests and boxes; it was not treated as a ban on useful score/status grouping. Hallmark's architecture fingerprint preserves the source/program/score behavior across the whole experience. Elaya's symmetry critique supports a dominant program and local expansion rather than equal repeated cards. `pbakaus/adapt` changes the phone task controls and keeps every destination reachable. Addy's accessibility guidance drives native semantics, visible focus, real reflow checks and measured wrapped-header clearance. Rauno/direct-interaction principles preserve the selected game through source changes. Emil and `pbakaus/animate` keep frequent switching instant; there is no opacity or entrance effect in this stage.

**Motion job / fallback:** no authored motion is needed for this bounded revision. Source and selected-game labels provide immediate feedback. Reduced-motion users receive the same instant content and controls; no timer, crawl, reveal or score tween exists. Any later motion proposal requires its own purposeful review.

## Actual targeted checks

Installed Chromium via Playwright, root-owned local server, 2026-10-29:

- JavaScript syntax check passed; revised URL returned HTTP 200. No browser page errors in tested member/public ready/stale/missing modes.
- Every member and public capture state measured no horizontal page overflow at 1440, 390 and 320 CSS px with 16px and 32px root text. Member check included expanded 24-value disclosure and first full team roster. Expanded Menu and concept provenance also stayed within 320px at 200% root text.
- Actual desktop source click changed the program and focused `#program`. Selecting game 4 changed the matchup; changing to My team retained that selected score row.
- Actual phone source select changed to My team and focused the program. Opening the rail and choosing game 3 closed it, selected the real game and focused `#program`; program top was y=123.8 and sticky control bottom y=124.2 (rounding difference under 1px). At a 600px document scroll, controls remained at y=0.
- Closed Menu and concept body were confirmed hidden. Menu retains 11 links (ten site routes plus comparison). Escape closed each disclosure and restored summary focus. Synthetic warning is visible only on explicit expansion, while its label stays present.
- Both modes rendered all five AI rows for ready/stale/missing conditions. Public state scans found no private subtotal/news/scouting patterns. Numeric zero, Pending, exact 35/65 result and separate 20% confidence are retained in the rendered current program.
- One revised phone and desktop diagnostic image was visually inspected outside the author deliverable directory. Root owns the fresh capture set and independent/Muse review.

## Limits / deliverables

Only `structural-revisions/04/index.html`, `style.css`, `app.js`, `STRUCTURE.md` were edited. First wireframe/images, shared files, production, Muse, Git and external services were not changed. No install, external call or subagent was used. This is grayscale structural QA; no final art, production build, production-route behavior, screen-reader/device audit, measured contrast certification or independent acceptance is claimed. Static comparison view switching remains a fixture control rather than authentication. No blocker remains for fresh captures and review.
