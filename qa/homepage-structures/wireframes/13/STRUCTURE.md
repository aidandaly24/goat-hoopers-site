# 13 — Folding atlas

Stage one only: working grayscale architectural prototype. Full art and final acceptance await the independent geometry gate. All authored files are local to `wireframes/13/`; no shared presentation, production, data, Git, provider, installation or other author's files were changed.

## Design contract

- **User question:** What is happening for my club now, and which part of the league should I open next?
- **Primary action:** Unfold a named chapter from its spine. The default useful spread is the current Week 3 pairing and the five saved model choices.
- **Desktop geometry:** One full-width book with five unequal-height chapter spines. Each spine has a numbered binding, a different title indent and a fore-edge of visible paper lines. Exactly one integrated large spread opens at its spine's origin; previous spread folds shut. It uses a broad left reading leaf and subordinate right leaf, rather than independent cards. Folded chapter spines remain in the document. The sticky fore-edge names the immediately neighbouring chapter(s), since a fully expanded roster can be long.
- **Phone geometry:** Keep the numbered vertical binding, broad spine shapes, full-width fold origin and fore-edge neighbour navigation. Inside a single open spread, the two leaves become a continuous readable page. Scores, quote rows, standings and roster references change form rather than shrinking desktop columns. At 320px the pairing is read team by team; standings become rank/name with separately labelled record and PF; roster references use one readable column. The binding narrows to preserve reading width. There are no rounded accordion cards.
- **Forbidden patterns:** Hero above a repeated dashboard; equal cards; sections that remain all open; coloured theme as the source of distinction; fake history, ranking or final score; private edition in public DOM.

## Navigation and states

Native labelled buttons change chapters; links retain real destinations. Current spine says Fold and exposes `aria-expanded`. Click/Enter/Space toggles that spine. Arrow keys move focus between spines; Home/End focus first/last. Escape folds the active chapter and returns focus to its spine. Close spread does the same. Previous spread traverses the local chapter trail. Browser Back/Forward restores chapter state from the hash. Intentional chapter navigation aligns its origin below the sticky fore-edge; ordinary reading scroll is native.

Native inline disclosures hold secondary source notes, saved-model details, complete value lists and complete rosters. These are nonmodal; there is no focus trap. Switching archive edition restores focus to the selected archive button after replacing its local reader. Opening one chapter makes all inactive spread content hidden and removes its controls from keyboard traversal.

`window.goatStudy.states` exposes seven representative states; `activate(id)` opens actual content:

| ID | Reachable working view |
| --- | --- |
| `week` | Default Week 3 pairing; all five saved choices with probability/confidence; native probability/provenance disclosures |
| `club` | Member quote, top three, all 24 values, scouting/completed week, news/move; public version has all ten faces instead |
| `league` | Search/sort all ten clubs and every roster, standings, faces disclosure, unavailable Power |
| `stories` | Oct 5–11 draft sample, coherent upcoming matchup, three sourced player spotlights, happenings, archive links |
| `archive` | Sep 28–Oct 4 draft archive containing the historical 2025 final and its source |
| `tools` | All route destinations, recent league moves, unavailable recorded history and Power |
| `closed` | All five unequal spines folded; no spread content exposed |

The ready marker is `document.body.dataset.studyReady='13'`. Query modes are `?view=member`, `?view=public`, `?ai=stale`, and `?ai=missing`. Hashes select the five chapter IDs or `#closed`. The `archive` API state is a particular reader selection within `stories`; individual archive reader selection is not independently encoded in browser history.

## Content map and fidelity

All content imports explicit `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. A bounded JSON inspection of `inventory.json` established the actual fields before implementation. Synthetic metrics have a persistent compact label; fixture Nov 12 is explicitly different from actual today. No fetch/model generation takes place.

| Visitor job / preserved family | Concrete place and handling |
| --- | --- |
| Recognize and act | Approved local GOAT logo; Home, News `/intel`, Stocks `/stocks#player-board`, Teams and All destinations in masthead. Chapter 05 has History, Arcade, AI Decides, Transactions, trade analyzer, archive and existing `/arcade/free-throw`. Member links `/team` and `/teams/1#team-roster`. Public/member comparison appears above the book and in relevant spread. |
| Current pairing | Chapter 01 uses `personal.summary.matchup` for member; public uses directory's first current matchup. Both clubs, managers, current record, Week 3, known 0.0, null Pending and incomplete state are visible. It does not assert a final. |
| All five AI rows | Chapter 01 renders all five returned choices, chosen probability and independent 20% confidence. Expanding each native row reveals both named probabilities, saved timestamp, season/week/roster IDs, model, prompt, missing snapshot/input/baseline labels, input and returned evidence, and probability caveat. First returned away choice remains 35%, other club 65%. Stale is visibly labelled; missing has an unavailable message and destination. |
| My club, member only | Chapter 02 renders identity, manager, current standing/record, 24-player count, modeled FAAB subtotal, coverage 24/24 and unpriced 0, pricing basis/time and value rank. Top three have portraits, positions, prices and supplied changes. Every one of 24 roster values is in the native full-values disclosure, including position. Unpriced formatting remains distinct from zero. Recorded history is honestly unavailable. Public creation uses only public `data` and renders none of this member reader. |
| Scouting and completed week | Member chapter 02 has all three form watches with EMA FPPG, GP, observed-game basis and unknown availability, all three best and three rough rows with actual fixture points/GP, the exact Week 2 period and coverage. It preserves the overlapping small-cohort limitation and synthetic recap qualifier. Both team-news stories keep route/outlet/time; the recent move keeps week/type/time and explicitly absent add/drop legs. |
| Ten faces | Public chapter 02 has every supplied player face, team link, player link, position and modeled FAAB value. Chapter 03 also provides all ten faces in a native disclosure for either edition. Defending champion is supplied identity context, not an invented honor. |
| League directory and all players | Chapter 03 includes all ten managers, current records/opponents and roster counts. Each native roster disclosure contains every supplied player reference: **228 unique IDs total**, full name, position and NBA team, with actual `/player/ID` links and distinct team/profile/roster routes. Search covers club/manager/player/position/NBA; matching a player opens its roster. Sort is standing, team name or roster count, with stable name tiebreaks. Count and Clear are functional; zero results reports 0 matching clubs. |
| Standings/history attribution | All ten supplied rank/W/L/PF rows are in chapter 03; PF uses `pointsFor/100`. Playoff count/week retain supplied values. Each roster disclosure has the dated 2025 record/finish and supplied owner note. Current summary rows do not display the old record. |
| Dated editorial | Chapter 04 uses only coherent `data.archive` entries. All three first-entry spotlights retain exact stats, opinion, period, position/ownership route, selection reason, source link and checked date. Selection/source details use native disclosures. Happenings retain text/date/routes; all sources are reachable. Both archive entries keep dates, draft state, time bounds and exact `/weekly/ID` routes, plus `/weekly`. Historical reader shows the supplied 326.0–251.5 final, its separate 2025 context and no fabricated spotlights. |
| Other league information | Chapter 05 retains all three supplied recent league moves with week/type/time, absent-leg qualification and transaction destination. Footer states fixture provenance and links archive/history/transactions. Power and recorded history have explicit unavailable states; no chart or fake ranking is substituted. |

**Known fixture conflict:** Preserved `home.edition.game.teamIds` says 1/2 while its dated prose names 1/5. That object is not rendered as a game result. Chapter 01 uses coherent current Week 3 data; chapter 04 uses coherent archive W41 (upcoming 1/5) and W40 (historical final 5/7). Shared fixture remains unchanged.

Stage-one inventory is not numerically abridged: ten faces, ten teams, 228 player references, 24 member quotes, five AI picks, three first-entry spotlights, all supplied team news/moves/happenings/sources and both archives have reachable places. Deep provider history, player stats and real route applications are outside this offline study; profile/tool links are retained as destinations.

## Applied supplied craft references

Read the local Goat Hoopers skill, visual hierarchy, navigation/accessibility and motion references, plus `reference-notes/craft.md`. Used those supplied, already-verified source notes rather than external calls or scripts.

- **Hallmark custom direction/macrostructures/responsive:** The custom book idea determines the whole navigation and reveal model, not merely an opening gimmick. All visitor jobs become actual chapters and reader content. Desktop and phone retain the same book identity while data changes form.
- **Elaya redesign-existing-projects:** Breaking equal-card symmetry produced unequal spines and continuous leaves; inline expansion keeps source and destination in context. State/focus/back behavior is part of the implementation.
- **Elaya landing-page-design:** Meaningful task labels, coherent local type/spacing, useful empty states and actual native controls apply. A marketing funnel and floating marketing navigation do not suit this multi-intent league reader.
- **Rauno interaction design / Emil apple-design:** The same spine becomes the open chapter origin, neighbours remain named along the fore-edge, and closing returns to the origin rather than a detached modal.
- **pbakaus adapt / Addy accessibility:** Phone keeps every function, labelled record/PF, all source details and visible focus. Targeted browser reflow and keyboard checks are separate from any unperformed assistive-technology claim.
- **Emil animate / pbakaus animate / accessible-animation:** Stage one is immediate, with no decorative animation or timers. This preserves keyboard frequency and a still equivalent. A later art-stage motion, if approved, would give only the occasional pointer-open action one short, interruptible fold-origin transition; text, reduced-motion and keyboard state would remain immediate. Its purpose would be to explain which spine owns the spread. No blanket entrance reveals, score tweening or scroll observer is proposed.

This is more than reskinning because the navigation/reveal and containment change: a source-origin chapter replaces the entire active spread, long secondary data lives in that reader, the fore-edge carries adjacent context, and phone remains a bound atlas. The structural gate must still judge whether that fingerprint is sufficiently distinct; no full final acceptance is claimed.

## Actual verification and limits

Local installed Playwright/Chromium against root's `127.0.0.1:4207`, 2026-10-29:

- All seven API states at 1440, 390 and 320 CSS px: one active spread (zero for closed), no page overflow. Repeated with **32px root text (200%)**, including all native details in the active chapter expanded, for both member and public: no horizontal overflow in any of the **84 edition/viewport/text/state combinations** after fixes.
- Five saved AI rows; 228 directory player references. Search Embiid returns one club and opens that roster; Clear restores ten clubs. Keyboard arrow focus moves to next spine; Enter opens; Escape closes and restores its spine focus.
- Browser Back returned from Week to Tools; Forward restored Week; Previous spread returned Tools. Switching archive retained selected button focus.
- Public DOM has no member subtotal, Scouting notebook or My team. Stale/missing queries render explicit corresponding labels. No page errors observed.
- Live emulated reduced-motion preference retained chapter navigation and reported zero animations. Stage one has no motion dependency or timers.

The final CSS touch-target additions were followed by that final 84-combination browser check. The final visible phone control-height check found no link/button/input/select/summary shorter than 44px. That run reported zero page errors and zero remote requests. `desktop-check.png` and `phone-check.png` are local working review snapshots, not the parent's authoritative geometry-gate captures.

Final checked source SHA-256 values (no Git operation):

```text
d22bcba97d6f160c0fb55df6f2048af3ec71572c8c345d8a62daadb1cdc22658  index.html
fa5bf30a86e1c614e94c94a38a62ae864432778146b44a90ecbcae32781148fc  style.css
80d622359a31ee831868b2841f2cd40911d33e356b9d7b88e6e770b058f10fe3  atlas.js
```

Unverified: real route application behavior, authenticated production access, live facts/model source, physical phone, browser diversity and screen reader/assistive-technology traversal. Rendered contrast has not had a full measured audit. The open default spread can exceed one viewport; named adjacent spines stay available in the sticky fore-edge, and the real unequal chapter spines follow at their document origins. No application build was run because this is isolated static HTML/CSS/JS, not an application change.
