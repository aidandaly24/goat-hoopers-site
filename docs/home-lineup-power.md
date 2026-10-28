# Homepage Lineup Power consumer (#190)

This draft depends on the frozen recap content from #266 and merged producer
#269. Its combined head needs its own verification/review. Neither #266's branch
nor its saved AT workspace/evidence is changed or treated as consumer approval.

The page starts the public producer read with its existing home/AI/viewer reads,
then joins the guarded result to already-loaded team identities. The
`data/home-lineup-power.ts` facade captures season, prior-stat season and source
leg from the exact injected state dependency the producer reads. It checks that
the explicit projected week is leg + 1 and that the calculation timestamp falls
within this load. Home season/phase and all ten roster IDs must agree. Failure,
invalid coverage/context, foreign teams or a supposed prior return an explicit
unavailable state rather than a plausible ranking. No producer file or contract
is modified; handoff questions on #269 comment6458160196 remain for Muse review.

`domain/home-lineup-power.ts` is the public envelope. `HomePowerRankings` uses
the producer's `lineupPowerRanks` helper. Complete/partial full-11 totals rank,
including known zero and shared ties. Partial explicitly names prior-season
fallback; unavailable has no points/rank and shows how many slots are evidenced.
No retained prior is available: movement is unavailable, never zero/arrows against
a previous render, and no storage is introduced. A future approved retained-prior
handoff should reuse `lineupPowerMovement` with its existing chain checks.

Provenance states the explicit projected scoring week, source leg, horizon,
content-addressed snapshot ID and calculation time. Calculation time is not a
provider-stat update timestamp. The live producer uses one counted-game estimate
per declared legal starter, scored from season PPG with league settings; current
season falls back to prior season. No counted-week actual, player price, asset
valuation, bench production or standings composite is substituted.

Source budget: the producer reuses Sleeper's existing 300-second league/state/
roster caches and 86,400-second current/prior season-stat cache. Two season-stat
reads cover all teams; no full player directory, player-detail fanout, database,
snapshot save, polling, publisher or paid provider is added. The public source
wrapper is React request-cached and receives no private viewer input.

Design contract: question — which starting lineups project strongest for the
specified week? Action — compare teams and open a profile. States — complete,
prior-season partial, team/global unavailable, no stored movement and archive.
Narrow layout — one wrapping row per team with numeric units, coverage and 44px
links; sources use a native disclosure. Forbidden — standings/FAAB as Power,
per-game × scheduled-games totals, fabricated prior movement, client-only helper
calls from a server component, or live projections in an archived edition.

Tests cover actual producer/fake-source integration, context/source failures,
identity joins, all coverage states, known zero, ties, no invented movement,
single live composition and archive exclusion. New production Next.js states
are `power-public`, `power-member`, `power-unavailable`, `power-malformed`,
`power-no-totals`, `power-missing-edition`, `power-archived`; every value is
synthetic. They do not establish live membership, hosted integration, physical
phone or spoken screen-reader behavior. Arena files and owner-controlled readers
are untouched; the public DTO/component can be composed there separately.

Run `HOME_POWER_BROWSER=1 node qa/home-boundary-next/verify.mjs` for the optional
Chromium matrix (Playwright and Chromium must already be available). It checks
ten keyboard-traversable team links, source-disclosure Enter/Space cycles and
retained focus, 44px controls, 1440/390/320 reflow and long names, 200% text,
light/dark text and focus contrast, all missing-data states and archive exclusion.
Screenshots, accessibility-tree text and JSON are task-local under
`HOME_POWER_EVIDENCE` (default `/tmp/goat-home-power-evidence`). An accessibility
tree is automation evidence; it is not a spoken screen-reader pass.
The one-route fixture omits destination pages: existing surrounding-homepage
prefetch 404s are explicitly listed separately from unexpected errors; failed
assets, fixture routes and other errors still fail the matrix.
