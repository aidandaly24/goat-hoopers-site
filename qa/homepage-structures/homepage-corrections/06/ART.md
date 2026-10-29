# 06 correction — a complete league wire

Local static review at `/qa/homepage-structures/homepage-corrections/06/`.
The original `polished/06` and all earlier research remain unchanged. This
correction is not a selected direction, production implementation or publication.

## Design contract

User question: what is happening in the league, and what should I inspect next?
Primary action: inspect the current pairing, with My team and team/player lookup
directly reachable. Relevant states: member/public, saved AI ready/stale/missing,
known zero versus missing score, current snapshot versus dated draft archive,
unavailable producers. Phone layout: a small left date spine and an ordinary
single reading feed, compact linked team identities, full width search and
native inline roster disclosures. Forbidden: an exclusive reader replacing the
homepage, internal scrolling, content revealed only by filters, a card appended
for every feature, fabricated current stories or inferred results.

## What changed

The homepage now renders its complete curated wire immediately. A broad current
matchup leads, followed by all five visible current pairings. The ten-team
register is part of the document rather than a separate view: every row shows
rank, team, manager, roster count, current opponent, W–L, PF, the leading modeled
player and prior-season context. All 228 player references remain inside their
team's native roster disclosure instead of overwhelming the main reading flow.

The member's modeled roster total, top three values and form guide have their
own November 12 entry. League move summaries, all five November 10 saved picks,
the completed-week cohort, and both dated October editions follow in source
order. The October issue contains all three sourced editorial takes and dated
happenings. It uses the coherent archive pairing [1, 5], separate from the
synthetic current pairing [1, 2]. A real footer closes the wire with useful
league destinations. Filters are optional; their initial collapsed state does
not hide any wire sections.

The original pistachio / forest / white field, DM Sans reading and IBM Plex Mono
date rhythm remain. The white date rail now anchors the full document at the
left, allowing substantive sections to use the width. Team faces, the member
desk, market total, saved-pick columns and compact editorial stories have
different roles and scale. There is no generic repeated card stack. Phone uses
date markers beside the spine, small portraits beside names, labeled standings,
and full width forms. The initial 390px screen shows both matchup identities,
known 0.0/Pending and a My team action.

Semantic paint, type, number and date roles live in `tokens.css`; consumer CSS
uses those roles. Local font files are the same approved OFL resources as 06.
Only supplied local portraits are used. No image generation, remote font,
installed library or live provider was added. No motion is needed for this
frequent reading/filtering task; feedback and focus are immediate, including
with reduced motion.

## Default content map

| Source date | Initially visible content | Additional inline detail / action |
| --- | --- | --- |
| November 12 check | Current Week 3 selected pairing, managers/records, actual zero/Pending, saved returned choice, member or league desk; all five current pairs | Pair selector, My team / roster or Sign in, saved slate link |
| November 12 check | All ten standings/team rows, faces, opponent, PF, leading modeled value, roster count and previous-manager qualification | Team/player search, real sort, all 228 roster references in native team disclosures, direct profiles, Return |
| November 12 check, member | $1095.25 modeled roster total, full pricing coverage, rank, top three values and model changes; three form watches with EMA/game basis | All 24 values, Stocks, Trade analyzer; explicit missing recorded history |
| November 12 activity | Three supplied roster-move summaries; member news or public Free Throw discovery | Transactions, player/news links; no invented add/drop legs |
| November 10 save | All five returned choices, both probabilities, independent confidence | Per-pair model/prompt/time/input/evidence, AI Decides |
| November 2–9, member | Five unique completed-week performers, points, GP, Best/Rough cohort labels and overlap | Participation coverage, exact end-exclusive source period |
| October 5–11 draft | Coherent dated game and context; Jokić, Embiid and Dybantsa editorial takes, all exact stats and periods; October 7/6 happenings | Selection/source disclosures, stable weekly archive route |
| September 28–October 4 draft | Historical 2025 final, exact 326.0–251.5, dated franchise-history note | Selection/source disclosure, stable older issue route |
| Footer | League identity, synthetic/source caveat and useful destinations | Teams, Transactions, Stocks, Trade analyzer, AI Decides, archive, History, Free Throw, Back to wire |

Public mode removes personal roster values, completed-week evidence and private
`/team` actions. It retains the full league register, current pairs, market
values, moves, saved slate and both editorial editions. The model choice is
preserved even when another option has a larger returned probability: first
choice roster 2 at 35%, other option roster 1 at 65%, confidence 20%. Missing
AI renders no pick rows; stale retains five rows with historical-context labels.
No producer gaps are represented as zero, a chart, or a new ranking.

## Guidance used

Read this direction's original `ART.md`, HTML, JS, CSS and role declarations;
the repository `AGENTS.md`, relevant architecture/homepage contracts and
`DESIGN.md`; the project Goat Hoopers design skill with visual hierarchy,
navigation/accessibility and motion references; and `reference-notes/craft.md`.

Read actual supplied primary guidance from
[Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md)
and [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt).
Applied the content-specific governing idea and preservation of useful tasks
across sizes. The requested local palette, chronological character and complete
homepage scope take precedence over those sources' suggested templates,
catalog checks, navigation recipes and installation mechanics. No peer correction
or direction 16 was inspected. No external code was downloaded or run.

## Actual verification

`node verify.mjs` uses installed Playwright and `/usr/bin/chromium` against
localhost 4207. `verification.json` records the exact observed outcomes.

- JS module syntax passed. No browser errors or remote runtime requests.
- 36 combinations: member/public × ready/stale/missing × 1440/390/320 CSS px ×
  16/32px root text. No horizontal page overflow or internal scrolling readers.
- Every default has ten visible franchise rows, five current pairings, three
  editorial stories and both archive links. Member has five unique completed
  performers, all 24 values and 228 complete player references in inline rosters.
- All disclosures expanded together at 320 CSS px / 32px root text: still no
  page-width overflow or internal readers.
- Keyboard pairing selection retained focus. Keyboard register jump, Embiid
  search, no-match state, Clear, actual team/player sort, Enter roster disclosure,
  and Return restored focus and departure scroll.
- Keyboard scope/date filtering exercised matching counts, selected state,
  incompatible empty combination, October-only archive, and complete-wire return.
- Enter opens Menu; Escape closes and restores its summary. Real local edition
  URL switch and browser Back returned between public/member renderings.
- Live reduced-motion state retained working search. Both local font families
  loaded; all 18 rendered portrait instances decoded without broken images.
- Computed rendered text/background pairs measured 9.47:1 for reading ink on
  the canvas, 6.59:1 for secondary ink on the canvas, and 11.81:1 for date/desk
  ink on white. This is a bounded contrast check, not a full accessibility pass.
- Inspected temporary full-page desktop/phone and initial-screen screenshots.
  Initial lazy portraits need scrolling or eager decoding before a full capture;
  root owns the final four review screenshots.

Bounded static-fixture evidence only. No physical device, screen-reader,
Safari/Firefox, live authorization or external-route integration pass. Enlarged
root text is documented separately from 320 CSS px reflow. No Next production
source changed, so no production build was run. No upload, push, PR, comment,
commit, merge, deployment or publication was performed.

Root final copy correction: removed an implementation commit identifier from the product footer. The artifact/source history stays in review metadata; user-facing footer retains the sample date and no-live-refresh status. Runtime facts and layout unchanged. Root recaptured/rechecked the current source.
