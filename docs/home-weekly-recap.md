# Homepage completed-week recap (#190)

The homepage adds a dated league recap while retaining the court, member/public
desks, roster value/history, scouting, team wire, AI slate, directory, standings,
moves, tools and archive. Expand any team to inspect its completed-week starters;
the older editorial Stud/Chud remains available in its own dated disclosure.

User question: who delivered last week? Primary action: expand a team, then open
its profile or a player. States: official totals, exact player points, estimates,
unavailable breakdown, partial team totals, missing source week and archive.
Narrow layout: wrapping team/player rows with native keyboard disclosures and
44px targets. Forbidden: current membership as weekly ownership, DNP as poor
performance, estimated player points as actuals, standings as prospective Power,
or today's recap inside an archive. Shared Paper + Slate primitives/tokens and
existing typography supply the visuals; no 3D or scene changes.

`buildHomeWeeklyContext` receives validated receipts and already-loaded home
data. It requires one consistent current matchup week and an active matching
season; it chooses only the prior week and waits until its exclusive end. A
missing or conflicting context clears any prior completed guide evidence. It
adds no fetch, query, save, public source fanout, credentials or paid generation.
`league.ts`, `personalized-home.ts`, the receipt adapter and Power producer remain
in their existing owners' lanes.

Official team totals come from the reconciled receipt's authenticated matchup
leg, including roster 9's official total. All league totals are required to
award Stud (highest) and Chud (lowest), sharing ties. These are team results,
not judgments about missing/DNP players. Public REST matchup scores are not
used as completed results.

Player rows follow the receipt's distinct contracts: verified points reconcile
exactly; foul-residual teams carry estimated values plus their computed sum and
unallocated residual; unreconciled teams expose no player rows. A nullable
score is unavailable, a proven zero stays zero, GP is the full week's verified
appearances, and each score is from one counted game. A locked zero without an
appearance is labeled explicitly and remains excluded from the member guide.
Current directory names resolve player IDs without asserting current ownership;
departed unknown identities fall back to a linked player ID. No new full
directory fetch resolves a missing name.

Member guide integration happens at page composition so shared loaders stay
untouched. The exact adapter populates `completedWeek`; the existing guide
intersects weekly starters with the member's current roster and excludes GP=0,
null scores and unknown players. Week 1 has six exact teams (2,3,4,5,7,10), three
estimated teams (1,6,8), and roster 9's unavailable breakdown. The guide stays
unavailable for estimated/unreconciled teams, while the league recap explains
their coverage. Missing form/market sources do not prevent verified receipts
from supplying completed results.

Legal-lineup Power remains unavailable per Muse's #190 producer contract,
comment 6433681384: next-week single-game counted contributions over 11 legal
slots, performance evidence rather than asset prices, explicit coverage, true
as-of and a comparable immutable prior snapshot before movement. This patch
does not create a producer or use the old retrospective composite.

Verification uses offline unit/render tests, full typecheck/lint/build, and the
isolated production Next.js homepage probe (`qa/home-boundary-next/verify.mjs`).
Its weekly states use wholly synthetic identities/points and block external
fetches. They establish actual HTML/RSC boundaries, not live membership/data or
physical-device/screen-reader acceptance. Exact tested commit and review/CI
results belong on the draft PR; any later code change requires fresh evidence.
