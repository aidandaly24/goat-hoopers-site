# Tunnel Cinema — direction 16

An independently authored static QA homepage. Files are confined to this
direction; no peer direction, previous mock, shared template, production style,
or Muse 3D implementation was inspected or changed.

## Surface contract

- User question: Who am I facing now, and what should I inspect about my roster
  and the league before my next decision?
- Primary action: My team for members; Find a team for public readers. The
  featured current pairing leads both views, followed by saved picks and full
  roster access.
- States: member/public; known 0.0 versus null Pending; incomplete current
  scores; dated draft editorial; ready, stale, missing and unmatched AI;
  searchable/no-match directory; unavailable history, Power and league stats.
- Narrow layout: bounded entrance with two stacked opponent nameplates;
  personal value desk below; one reading column; roster and source details
  expand in document flow. Direct Stocks access remains beside Menu.
- Forbidden patterns: invented tunnel photograph, fake live scene, autonomous
  motion, WebGL/canvas, synthetic data presented as actual results, fabricated
  charts/Power rankings, and current-week award claims from dated editorial.

## Visual decisions

The charcoal entrance is an architectural frame: thin amber perspective jambs,
an arena still behind luminous condensed team names, and a horizontal sill for
the member identity and modeled roster value. The existing arena is cropped,
desaturated and darkened in CSS; no source image or logo is edited. All text
over the image sits in the dark lower gradient or an opaque caption scrim.

Locally served variable Oswald supplies the short headings and numeric score
display. Arial/Helvetica supplies the reading and data text. Body type is 1rem,
secondary text .875rem, and metadata .75rem. All sizes are root-relative.

Below the entrance, seven numbered chapters form a quiet long reading page.
Open columns and horizontal row rules replace a repeated card gallery. Amber
marks actions, returned model choice and key status; gray numbered chapter
markers support orientation. Team faces are integrated into the roster
directory rather than repeated in a separate gallery.

Semantic colors are local to `tunnel.css`: night `#111315`, pit `#090a0b`, raised
surface `#1b1e21`, luminous text `#f3f4f1`, secondary `#b5b8ba`, amber `#f5b847`,
quiet rules `#3e4346`, and control boundary `#858b8f`.

Calculated opaque contrast pairs: text/night 16.87:1; secondary/night 9.34:1;
secondary/raised 8.40:1; amber/night 10.49:1; dark action label/amber 10.46:1;
control boundary/raised 4.85:1. Decorative large chapter numbers/night 3.41:1.
These calculations are not a claim of exhaustive screenshot or screen-reader
accessibility certification.

## Data and interactions

Only `../../data.js` is imported. The complete fixture remains linked from the
source disclosure, along with dated edition sources and font provenance.

- The feature selects `directory.currentMatchup` for the member's team, or the
  first current pairing for public readers. Current Week 3 and dated Oct 5–11
  editorial remain separate.
- All ten directory containers and modeled faces remain present. Every one of
  the 228 unique roster player references has a profile link, position and NBA
  team in its team's native disclosure. Prior-manager attribution is visible
  for NeuralNets before and after expansion.
- Search covers team, manager and roster-player names; a player match opens the
  matching roster. Clear restores all teams and returns focus to search.
  Team sort offers standings, team name, manager and roster count. Standings
  independently sort by rank, points for, team name or wins.
- The member has the complete 24-player value disclosure, top three values,
  pricing basis, priced/unpriced coverage, computation time and value rank.
  Recorded team-value history is explicitly unavailable.
- Observed EMA form, completed Week 2 fantasy-point evidence, current modeled
  prices and dated editorial stats retain their distinct bases and periods.
- The five saved AI rows preserve actual returned choices. The first choice
  remains roster 2 at 35%, despite roster 1 having 65%; confidence remains 20%.
  Saved timestamp, model, prompt, team IDs, input/evidence fields and absent
  snapshots are available in native provenance details.
- `?ai=stale` labels every saved row visibly; `?ai=missing` and `?ai=unmatched`
  retain all five current pairs with Unavailable output and no probabilities.
- Native Menu supports Enter; Escape closes and restores focus to its summary.
  It is a nonmodal document-flow disclosure on narrow screens. Source-details
  navigation opens the actual disclosure before following its anchor.
- Price links open the actual `/stocks#player-board` destination. The existing
  exchange has no supported player-specific inspector URL, so readers use its
  search to inspect a particular player. Profile links remain player-specific.
- Arcade uses the supplied real preview and `/arcade/free-throw`, confirmed in
  the existing route's game dispatch. Production gameplay is not modified.

## Checks performed on the final source

Chromium via the already installed Playwright, served from the root-owned
`http://127.0.0.1:4206/qa/homepage-themes/directions/16/index.html`.

- `node --check tunnel.js` passed.
- Member and public at 1440, 390 and 320 CSS px, with disclosures closed and
  all open: document scroll width equals viewport width.
- The same six view/width combinations at `html.style.fontSize = '200%'`, both
  closed and all-open: body grows from 16px to 32px; no document overflow.
- All eight member/public × ready/stale/missing/unmatched states at 320px:
  ten teams, ten faces and 228 roster links retained. Ready/stale have five
  saved-row hooks; missing/unmatched have zero saved hooks and five visible
  current pairs. Public has no `data-personal` or member value list. Member
  retains all 24 values in every AI state.
- Keyboard Menu Enter, Tab, Escape and focus restoration passed. Player and
  manager search, no-result status, Clear/focus restoration, largest-roster
  sorting, and standings name sorting passed.
- The first AI row was checked for the away-team choice, both 65/35 values,
  independent 20% confidence and expanded provenance. The value disclosure
  exposes 24 linked rows. The source link opens its target details.
- Full-page desktop/phone compositions were captured; the entrance, notebook,
  roster row, expanded AI provenance and footer/source disclosure were also
  inspected at readable image size. Lazy images were loaded by scrolling the
  entire page before verifying them: all 18 rendered images loaded.
- No JavaScript exceptions, failed local resource responses or external runtime
  requests were observed. Local Oswald loaded. Reduced-motion plus Save-Data
  retained ten teams, five saved AI rows and direct phone Stocks access.

## Limits

This is an offline static component fixture, not a live Next.js/auth integration.
Destination URLs preserve actual application paths, but the static preview does
not run those application routes. No production play/reset/exit journey,
physical-device Safari test, screen-reader pass or Next history restoration is
claimed. No new API, install, external runtime, shared CSS or production change
is needed. Final exact SHA-256 values are returned separately to the coordinator.
