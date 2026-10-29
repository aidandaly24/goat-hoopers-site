# Study 08 — Head to head

Stage one: bounded working grayscale structure, awaiting independent geometry review. Only this folder is authored. No production changes, Git operations, provider calls, packages, shared presentation, old mockups or other authors were used.

## Design contract

**User question:** What does my side look like against this week's opponent, and where can I inspect the rest of the league?

**Primary action:** Read the two teams in alignment, then compare players or open the real team/roster destinations. A member begins on their own 1/2 pair. The public edition begins on that public fixture pair without rendering the personal summary.

**Desktop geometry:** The matchup owns the page rather than appearing as a hero above a dashboard. Two continuous grayscale halves hold identities, current scores, season lines, anchor players, saved probabilities and actions. A narrow central seam names the comparison being made. Player/value and form/wire views keep these same halves and the same pairing. League-wide information replaces this composition with a full-width indexed reader; the dated edition is a separate article with its own archive index.

**Phone geometry:** At 390px the two-sided name/score block stays visible while side buttons select the detail column. The team comparison tabs change the subject, and the side buttons change whose detail is read. Thus an opponent roster is not appended below an entire personal dashboard. At 320px and at enlarged root text, container queries reflow full team names above the two-sided scores, expand the workspace navigation, and permit the score context to leave sticky positioning. Rosters become labelled reading rows. Both teams and score status remain available. At very narrow effective widths the side controls become two full-width buttons.

**Forbidden patterns:** No repeated card grid, boxed KPI dashboard, imported section anatomy, probability-based replacement of the returned choice, fabricated price line, invented opponent total, or anonymous mobile stack. System fonts and grayscale approved local portraits expose geometry.

## Navigation and states

`window.goatStudy.states` and `activate(id)` expose eight actual views. `body.dataset.studyReady = '08'` is set after first rendering.

| ID | Reachable content / behaviour |
| --- | --- |
| `comparison` | Default two-team comparison, known 0.0 versus Pending, incomplete state, records/ranks, anchor values, saved returned choice and separate confidence, provenance disclosure, team actions. Pair selector reaches all five matchups. |
| `rosters` | Same pair/context. Member modeled total, coverage/time/basis/rank, top three and all 24 prices; opponent subtotal explicitly unavailable; both complete roster references with position/NBA. Phone side buttons choose which roster to read. |
| `scouting` | Same pair/context. Member form watches, completed-week best/rough lists, period/participation/coverage caveats, two news links, recent personal move. Opponent personal projection explicitly unavailable. |
| `league` | Full-width searchable/sortable ten-team directory with ten anchor faces/values. Native roster disclosures contain every one of the 228 unique player references. Team/profile links and “Read this matchup” connect back to the comparison. |
| `standings` | All ten current ranks, W/L and PF (`pointsFor / 100`), member indicator and honest missing Lineup Power / aggregate context. |
| `picks` | All five saved AI pairings. Preserves away returned choice at 35%, other probability 65%, independent 20% confidence. Each provenance disclosure includes saved timestamp, model/prompt, input/slate snapshot absence, input and returned evidence, baseline absence and synthetic message. |
| `edition` | Archive index switches between both dated records. Coherent dated game, all three exact spotlights with stats/opinion/period/selection/source dates, happenings and sources. Direct archive routes preserved. |
| `tools` | All three recent league moves with date/week/type/team references; Stocks, trade, AI, News, Teams, Transactions, Arcade, actual free-throw, History and archive destinations. Explicit recorded-history and Power unavailable states. |

Hashes are direct state entries and ordinary navigation uses browser history. Back/Forward restores the state. Pair, side, search and selected archive entry remain in local memory during view changes. Leaving a reader has a labelled return action. Native disclosures need no modal containment. The global League tools disclosure supports Escape and returns focus to its summary. All hidden phone halves leave the tab order through `display:none`.

## Content and factual handling

- Imports only `{ inventory, data, mode, aiState, esc, money }` from the local `../../data.js`. No runtime external requests, remote fonts or modules. Approved logo/portraits are local.
- Compact persistent synthetic/frozen-date label plus footer provenance. November fixture time is not presented as today. Dated editorial is draft/unpublished and separated from current Week 3.
- `home.edition.game` has the known 1/2 identity versus 1/5 narrative conflict. This study does not render that inconsistent game. `data.archive[0]` supplies the coherent 1/5 upcoming dated narrative and `data.archive[1]` the coherent historical 5/7 final. Fixture data remains unchanged.
- `?view=public` uses the public data branch and no personal summary. This fixture mode switch is not an authentication boundary. Member `/team` and `/teams/1#team-roster` actions appear only for the matching personal team.
- `?ai=stale` clearly labels stale results and withholds current probability bars; saved historical provenance remains available. `?ai=missing` renders all five actual pair identities with unavailable results and no invented probabilities.
- Known score zero is formatted `0.0`; null is Pending. Current pairs are not final. The 2025 record attribution, including NeuralNets' previous manager note, is retained in directory expansion.
- The supplied null recorded-value history and absent Power producer receive explicit text, without fake charts or rankings. Only the supplied current modeled valuation rank is used.

## Applied references

Read repository AGENTS, homepage ARCHITECTURE portions, current DESIGN and `.agents/skills/goat-hoopers-design/SKILL.md` with all three referenced reviews, then the local BRIEF, author assignment and complete `reference-notes/craft.md` supplied-source study.

- **Hallmark custom direction/macrostructures/responsive:** the matchup idea governs every comparative view, including rosters and wire. League information has a different reading instrument rather than more cards beneath a novelty masthead.
- **Elaya redesign / Impeccable principles in the supplied study:** break equal-card symmetry and retain inline expansion, state, focus and return behaviour. The seam compares aligned evidence; native disclosures hold complete secondary inventory. No default left sidebar or funnel was imported.
- **adapt:** phone changes the task mechanism to side selection with the shared pairing still visible; narrow effective widths reflow names and controls rather than shrinking type.
- **Apple spatial continuity / Rauno direct interaction:** pair selection, roster reading and phone side selection retain the same named two-team context; team rows offer an explicit return to that pair.
- **accessibility:** native links/buttons/select/search/details, visible keyboard focus, descriptive states, local result announcements, reachable source details and reflow. No hover/drag-only path or modal.
- **Emil / pbakaus animate / accessible animation:** stage-one state changes are immediate; no animation engine, observer reveal, timer or loop. Reduced-motion retains every action.

**Later motion thesis, not shipped:** an occasional transition from comparison to full-width reader may briefly collapse the central seam as the reader opens, to communicate a change in reading scope. Use at most 180ms and interruptible CSS. Frequent pair/side/keyboard actions stay immediate, scores/prices never tween, and reduced motion uses the same instant destination with preserved labels and focus. Full visual implementation is gated on structural review.

## Actual verification

Local Chromium via installed Playwright, served by the parent's existing `127.0.0.1:4207` server:

- JavaScript syntax check passes; browser reported no page errors.
- All eight major states rendered at 1440, 390 and 320 CSS px, at 100% and 200% root text (48 combinations), including expanded main disclosures. No horizontal page overflow after reflow corrections.
- Directory: 10 team disclosures, 10 anchor faces, 228 player rows. “Embiid” finds one team and opens its roster; a nonmatch gives an explicit empty result; A–Z sorting starts with Huff n’ Puff.
- Member full value disclosure: 24 priced roster rows. All five saved-pick rows and five returned-choice labels present; first away choice remains 35%, other probability 65%, confidence 20%.
- Phone opponent-side activation hides the home detail and displays the opponent detail while keeping the score context present.
- Public roster view: no My team action or personal $1095.25 total. Stale/missing saved AI: five identities, zero probability bars. Reduced-motion emulation retains local search/navigation.
- Visually inspected actual desktop comparison, 390px phone comparison, desktop league reader and enlarged 320px reflow. Temporary inspection images are in `/tmp/goat08-*`; parent owns final captures.
- Final keyboard checks: Enter opens League reader; browser Back returns to comparison; Enter opens the global tools disclosure, Escape closes it and restores summary focus; Enter selects the opponent phone side. The historical archive switch renders the supplied 326.0–251.5 final. Final pass again reported zero browser errors and zero overflow in all 48 combinations. Resource entries were local only; the fixture contains 228 unique player IDs.

## Known bounds

This is a stage-one architecture study, not final visual or accessibility acceptance. No physical-device or screen-reader pass; no production route/auth/server verification. External source/production-destination links are preserved, not fetched. No full release build is appropriate for these isolated static files.

Representative supplied content is reachable in full for the required families. Stage-one abridgment: absent league aggregate stats are summarized as unavailable rather than individually listing all six null field names; raw DTO flags/IDs are not printed where they have no reading job. The stale pick reader preserves historical choice/confidence/provenance while withholding probability bars. No opponent personal news/form/full value is inferred because those projections are not supplied. Final art, full motion, browser Back/Forward scroll restoration and a complete assistive-technology review remain for later implementation after the geometry gate.
