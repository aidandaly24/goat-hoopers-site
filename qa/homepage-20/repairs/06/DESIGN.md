# People of the league — direction 06

Question: who am I playing, who owns the player, and what should I inspect next?
The first actions are the two featured team profile links, followed by My team
and View roster in the member desk. The public desk instead offers Find a team
and Meet the players.

The opening is a two-sided typographic matchup: actual team names carry the
scale, manager names remain explicit, and two separate small player portraits
are labelled as top modeled players. A portrait never impersonates a manager.
The names and the 0.0/Pending current score state do the work; a compact crop of
the owned arena connects the friends' league to its court and Arcade route.
There is no decorative hero claim or full-screen portrait collage.

Inter moves between heavy, tightly set team names and restrained editorial
subheads. Geist Mono aligns scores, price units and tabular facts. All page
colors consume the existing Paper + Slate semantic tokens. Open sections,
two-column editorial groups and useful row dividers replace repeated boxes.
The ten league faces form an unboxed roll call with a player, owner, manager
and price; the complete directory remains a separate working roster list.

Member state meaningfully adds the current member identity, standing, full
modeled valuation, three leading prices, all 24 roster values, observed form,
completed-week cohort, team wire and own-team transaction marker. Public state
has a league introduction and selected public price context instead. It never
reads the member summary. A comparison link preserves the current AI parameter.

The dated draft edition is visibly stale. Editorial NBA/college stat periods,
source/check dates and selection basis remain accessible in native details.
AI rows preserve every returned probability and the explicit returned choice,
including the fixture's intentional choice/probability disagreement. Confidence
is a separate number. Each row exposes provenance and unavailable snapshots,
input timestamps, baselines and publication state. `?ai=stale` visibly marks the
slate and every saved row; `?ai=missing` keeps all five current pair identities
with unavailable results.

At narrow widths the member desk follows the matchup; all main sections become
one column, and portrait scale stays bounded. Names wrap, the directory's roster
disclosures become single-column, and a compact standings table retains every
rank, team, W, L and PF value. At 320px league face prices move under identity.
The mobile header keeps direct Stocks access and a native Menu disclosure.
Escape closes Menu and restores summary focus. Native details, visible focus,
labelled search and sort fields, a polite result count and ordinary links avoid
custom modal or application-menu behavior. No animation or scene runtime runs.

Forbidden patterns: fabricated statistics/awards/history, zero substituted for
pending scores, model choice inferred from largest probability, card-walled
avatar catalogs, manager photos inferred from player portraits, and content
hidden for a cleaner opening.

## Verification and limits

Implementation is limited to this direction's index.html and DESIGN.md. It
imports the common data module, reset/fonts and semantic tokens, with no network
data request or application runtime. The mock has no authentication, saving,
pricing engine, prediction call or generated game scene. Application destination
links are real intended routes, but this static preview does not implement those
routes. No screen-reader or physical-device validation is claimed.

Actual checks on October 29, 2026, using installed Chromium through Playwright
against the existing 127.0.0.1:4198 static server. Repository base and fixture
benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`; evidence applies to the
authored local files in this direction, with no commit created:

- Member and public layouts rendered at 1440, 390 and 320 CSS px with no page
  overflow or browser script errors. Expanding every main-content disclosure
  retained each viewport's exact document width. Desktop and phone opening
  screenshots and desktop lower-section screenshots were visually inspected.
- Independent 200% root text enlargement at a 1440px viewport, with every main
  disclosure expanded, retained a 1440px document width in both views.
- All ten directory containers, ten faces, five saved AI pair hooks, ten standings
  rows and 228 unique roster links were present. Every roster ID, name and order
  matched inventory.json exactly. All 24 member valuation IDs and formatted
  values also matched exactly. Public mode contained zero personal panels.
- Player search “Embiid” returned one team / 24 references. Manager search
  “NeuralNets” returned one team / 22 references. A missing query showed the
  empty state. Team A–Z, largest-roster and standings A–Z sorting changed order
  correctly. The NeuralNets previous-manager qualification remained visible
  with its 2025 record in the roster disclosure.
- Both modes tested ready, stale and missing AI. Ready/stale retained all ten
  actual probabilities and all five returned choices; stale displayed five
  visible row warnings. Missing showed five current pairs with unavailable
  results and no invented probabilities or saved-pair hooks.
- Phone Menu and desktop League disclosures opened, closed with Escape and
  restored summary focus. Subsequent keyboard focus had a solid 2px outline.
  Free-throw art loaded from the local asset and measured 358×201px on phone.
- Calculated opaque color pairs: main ink / paper 12.70:1, secondary / paper
  5.15:1, slate / paper 6.56:1, white / slate 7.22:1, control / white 3.76:1,
  and stale-status ink / paper 5.51:1. These are the rendered CSS roles and
  do not constitute a complete accessibility audit.

The static mock does not prove Next route navigation, real authentication,
production data freshness, playing the game, or assistive-technology behavior.
No remaining implementation blocker was encountered.


## Separate accessibility repair copy

This file accompanies `repairs/06/index.html`, copied from the frozen blind
submission. The initial verification above is historical evidence for the
original and did not cover the subsequently reported 390px/200% failure.
The separate repair preserves the visual direction and all source content while
allowing enlarged rows and text to reflow. See [QA-REPAIR.md](QA-REPAIR.md) for
actual original/repair widths, controls, limitations and exact file hashes.
The original `directions/06/` files remain unchanged.
