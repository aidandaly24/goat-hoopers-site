# ARCHITECTURE.md — how this repo works

Read this before writing any code. It maps the whole repo: where things live,
how data flows, and the contracts every contribution must follow.

## The one-paragraph version

Sleeper API data enters through exactly one door (`src/data/`), gets shaped
into domain objects (`src/domain/`), and is rendered by surfaces
(`src/surfaces/`) — coherent, bounded experiences composed explicitly by pages
(`src/app/`). Shared visuals live in `src/ui/`. Nothing else exists.

## Directory map

### Team value history — recorded-only producer (issue #217)

`data/team-value-history.ts` produces the v1 `TeamValueHistory` envelope and
detail from read-only sources only: recorded modeled quotes via the batched
`data/recorded-quotes.ts` adapter over `stock_snapshots` (original quote ids,
integer cents, native UTC-convention timestamps — the stock store itself is
untouched and its snapshot-saving path is never called), a pinned dated
roster anchor (current Sleeper rosters), and completed-move generation over
the public Sleeper transaction feeds of both leagues in the chain — the
current league over its state-proven week range and the inaugural 2025
league over its fixed, final weeks 1–24 — in the frozen replay ordering
(`status_updated`, tie-break `transaction_id`, complete-only, trades atomic).
Supported days are labelled `replayed`; anything the anchor or ordering
cannot prove stays ambiguous/unavailable with no point. Under the #224
amendment, day detail also lists the 2025 league's completed moves as
sourced events (team-scoped legs — every add/drop carries its roster id —
plus declared participants, shaped draft picks and waiver FAAB, with
carried-none picks distinguished from a record that does not carry the
field); the events assert only their own legs, so the 2025 roster band
stays `ambiguous` and 2025 valuation stays `unavailable`. League provenance
is load-bearing: each feed is normalized separately and every move (and its
DTO) carries its source `leagueId`; only the current league's moves enter
roster inversion, point derivation and the receipt, since the anchor is the
current league's roster — a prior league's move is a display event only,
whatever its timestamps. Team relevance includes declared participants and
draft picks, so a pick-only trade still emits as an event and binds the
generation. The generation
fingerprints the anchor roster, the move set (provenance included), the
admitted quote set and the
roster/source bounds, so any added/revised/pruned quote yields a new
generation and stale detail/summary requests get 409. The producer fails
closed throughout: the move feed loads through the strict
`fetchTransactionsByWeekComplete` (any failed or malformed week rejects the
load — a silent week is never replayed as an empty move set), normalization
validates every completed record (usable timestamps, readable legs,
well-formed participants/bids/carried fields) and rejects the load on a
malformed one rather than dropping it silently, evidence is
admitted only at or before the load instant, compared at native
microsecond precision rather than through `Date.parse` (a future-dated
quote or move never advances `asOf`, and today's unpriced detail claims
replay only through that cutoff), two different prices for one player at
one instant
quarantine the observation instead of selecting by quote id, and the
separate current quote values the anchor roster — never the last
historical replay roster. GET routes live at
`/api/team-value-history/{summary,detail}`; the member homepage passes the
envelope as serializable props into the `TeamValueHistory` consumer in
`season-hub`, replacing the current-roster repricing line. This producer
performs zero Neon writes: the #219 tables stay unapplied/unpopulated here,
nothing is backfilled or reconstructed, and the envelope states the
retained-source (30-day prune) limitation in its source notes until a
separate persistence PR lands.

### Modeled valuation timeline contract

The selected-player read-only `/api/stocks/[playerId]/history` route delegates
to `data/stock-history-range.ts` and its injected SQL store. It pages all retained
observed/reconstructed records within explicit calendar-day bounds, preserves
native microsecond timestamps and exact cents, exposes publication/coverage status,
and returns conservative held reconstructed intervals with a preceding anchor.
It never invokes pricing, upstream stats, publishers or snapshot writes. Lists
and existing detail/chart payloads are unchanged; PR99 owns renderer integration.
See `docs/stock-history-range-integration.md` for range/timezone/retention semantics.

`data/stock-history-client.ts` is the browser-safe, injected same-origin page
adapter for that endpoint. It preserves raw records and held intervals, propagates
abort, exposes generation409/restart and source503 detail, and never fetches later
pages automatically. The separately owned chart connects it only on inspection.

`src/domain/modeled-valuation-timeline.ts` and the pure data helper define a
versioned continuous held-model state with exact updates and separate recorded
snapshots. Calendar and coverage provenance stay explicit; no daily observed
rows are synthesized. The helper has no live loader/store caller. Read
`docs/modeled-valuation-timeline.md` for paging and source/retention integration
gates; chart rendering and the bounded sampling fix remain separately owned.

### Courtside homepage and weekly archive

The accepted opening tip constant and pure `openingPhase` gate live in
`domain/season-opening.ts`, shared by the server homepage/feature and the
client countdown. Server Components import only the rendered `TipCountdown`
component from its `use client` module; calling a helper exported by that
module is forbidden by the Next.js RSC boundary and crashes the homepage.
`qa/home-boundary-next/verify.mjs` builds those actual components in an isolated,
credential-free Next.js app and checks HTML/RSC rendering for public, synthetic
member, missing-edition and archived states; the CI offline job runs this probe.

`src/app/page.tsx` loads `getCourtsideHomeData`, archive references and approved portrait URLs, then composes `CourtsideHome` in the existing `season-hub` surface. `/weekly` and `/weekly/[editionId]` are source-controlled editorial routes. The old `SeasonHub`/`LeagueHero` components and static review stay available for comparison.

`getCourtsideHomeData` accepts injectable clock/data dependencies. Live team identities, all roster references, current pairings and recent moves come through the existing Sleeper/transform membrane; `buildLiveClubhouseDirectory` is a pure projection. Only the slim roster player references are cached for a day, keyed by sorted current roster IDs. A changed roster ID set resolves immediately. The full player directory stays outside Next’s data cache. Existing 300-second league fetches deduplicate across layout and page. No DB/schema, environment, scheduler or publishing changes are involved.

Editorial entries carry explicit draft/publication and date bounds. The latest started entry stays visible with a stale notice after its period ends, never invented weekly results. Source dates, selection reasons, NBA/college period qualifiers and verified historical finals are retained. NeuralNets’ 2025 record visibly names the previous manager in the collapsed summary and explains QBs Gremlins in the full roster.

The server owns the edition, player stories, wire and archive. `CourtsideFeature` composes the approved hero — the edition headline and the court on the left, a team desk (members) or league desk (signed out) beside it — from existing domain projections with no new fetches and no client state; the only client island in the hero is the countdown. The court is a still image with no inspection/pause controls or observer work. The redundant player-specific skip link is removed; the shared shell retains its focus-only Skip to content. Homepage roster inspection retains search/sort in the directory below. The dependency cleanup removes the rejected hooper family and its inspection dialogs/loaders; team avatars, names, roster disclosures and direct profile links provide identity without model requests. The page hands the cached `getAiDecidesData().weekly` domain slate to the down-page AI Decides section: all five pairings render as rows with team avatars, saved split bars and a per-pairing provenance disclosure (model choice, probabilities under current team names, saved timestamp, preview-period closure, model/prompt/input snapshot, evidence, confidence kept separate). Full probability bars require a saved ready result matching the live season, week and roster IDs; expired matching picks are labelled past-week, and missing/mismatched picks remain unavailable. There is no generation on render. Explicit Stocks and Arcade entries remain visible. Shared shell/theme/navigation is retained and no arcade internals are imported or changed.

`public/courtside/` preserves the exact supplied SVG variants, approved two pennants, existing arena and thirty bounded local portraits. Plain images serve pre-sized assets directly without image-optimizer quota. Fonts reuse root `next/font` assets. The homepage does not import a hooper viewer or request rejected models. Budgets, provenance and measured verification live in `courtside-preview/review/INTEGRATION.md`.

### Personalized team front page

The homepage explicitly remains force-dynamic. `data/home-viewer.ts` receives
existing verified membership/account readers, returns only the active roster ID,
and never caches private state. A verified account without a resolved member
gets one indexed `account_identities.subject` existence check before offering a
claim path; inactive/orphaned existing links do not become new claim permission.
No auth mutation or new grant is involved. Session failures never infer a team
from URL input, display name, email or client storage.

`domain/personalized-home.ts` defines one team-edition projection for every team.
Its shared Week 1 preview predicate preserves the existing Courtside sidebar
rule verbatim. `data/personalized-home.ts` purely joins the viewer's current
roster to existing public home, market and news/AI data. The server page reuses
`getStockMarketData` in the root ticker's same React request cache and the
existing public news TTL; no endpoint, refresh, polling or extra snapshot write
path is added. These source caches never receive the viewer or a personalized
result. The existing market execution still has its pre-existing best-effort
snapshot save, once per request. Do not reuse it from an independent personalized
API route. The bounded DTO includes top-three modeled FAAB values with known
historical changes, roster-matched news and existing recent moves, not deep
player details or a new performance metric.

The personalized projection is woven into the edition itself — there is no
separate slab component (the former `PersonalizedHome` surface and its CSS
module are deleted). `src/app/page.tsx` renders only `CourtsideHome`, passing
the personalized DTO and a faces projection (`buildHomeFaces` in
`data/personalized-home.ts`: each clubhouse team's top player by current
modeled value, or null). To build the faces, the page reads the same
React-cached `getStockMarketData` result the root ticker already executed
for this request — no additional market execution or deep fetch is
introduced for any visitor. One member-only read is added: the viewer's own
roster's recorded snapshot history (`getRosterSnapshotHistory` in
`data/league.ts`, delegating to the stock store's batched
`getSnapshotHistory` — a single query over the retained `stock_snapshots`
rows), which feeds the roster-value trend described below; signed-out and
unlinked visitors never trigger it. The news/guide loads and the
personalized summary itself remain member-only.

Inside the edition: `CourtsideFeature` takes an optional `hero` (the member's
summary + faces). The hero is the edition headline over a two-column layout:
the court on the left — the `TipCountdown` overlay riding the court figure,
with the matchup caption beneath it — and a desk on the right. A member's
desk carries their team identity (avatar, name, manager), the previous
season's record/finish in preseason or the current record/standing in
season, the roster count, their Week pairing with the opponent's season
line, their own saved AI win probability with its provenance line, and the
My team / View roster action bar. A signed-out visitor gets the analogous
league desk: the featured game of the week, both teams' season lines, and
the saved AI preview for that pairing with provenance. Below the court, a
member's roster-value section (`RosterValueSection`) shows their top three
faces LARGE over the team's outlined name and the team value at display
size — the page's only value headline (a partial total stays a labelled
subtotal in one small line beneath it, with the modeled-pricing basis
disclosed beside it, and the full-roster disclosure under it holds every
player's price and the coverage disclosure — unpriced players read
"Unpriced", never $0). Beneath the total, the value chart plots the
roster's value over time from recorded data only: `rosterValueTrend`
(`domain/roster-value.ts`) reprices TODAY'S roster from recorded points —
the retained `stock_snapshots` points plus the current modeled quote —
carrying each player's last recorded price forward and never backfilling
before a player's first recorded point; the domain returns null below two
genuinely recorded points (one snapshot plus the appended current quote is
not a series) and the section then shows the recorded-history unavailable
state. The chart labels itself as that repricing, marks the appended
current point as a modeled quote rather than a recorded snapshot, prints
per-point priced coverage via the recorded endpoints, and shows a change
figure only between the first and last recorded points with identical
coverage — never as historical performance. Signed-out visitors get the
analogous faces section (`BarSetSection`): the featured pairing's roster
anchors large, with no side panel. The
scouting notebook (`ScoutingNotebook`) features one watch on a named basis
(the guide's top watch row for members, the featured face's anchor for
signed-out readers) with around-the-league watches beside it (the other
featured team's anchor, the edition's sourced one-to-watch). The member's
form guide + team wire (`FormGuideWire`) prints Best & rough week only
from the guide's verified completed-week rows (players who actually
played; a note prints only for an actual injury designation — the guide's
no-designation and unknown defaults never render), the honest recap status
line and watchlist-basis disclosure before any completed week, and the
team's real news headlines with its own recent moves. The edition's
player-of-week and underperformer spotlights render as the STUD/CHUD
retrospective (`StudChud`) — oversized outline type for those two words
only, each panel carrying its stats, period, source and selection reason;
they are editorial picks grounded in cited sources, never computed award
winners. AI Decides renders all five pairings down-page (`AiDecidesSection`,
see above). The opening clock is universal and single-presentation: a `TipCountdown`
overlay rides the court figure for every visitor — members included —
exactly once per page,
gated by the clock itself — never by the provider
phase — and it renders even when the weekly edition is missing. It never
renders on an archived edition: the archive flag closes the feature's
clock gate outright. Its time is
anchored to the server's league check — advanced once at hydration, by
the sample's receipt lag only (`anchorFromSample`): the monotonic gap
between the freshest response completion the browser's own timing
records logged and hydration. That lag is a lower bound on the sample's
age — advancing by it can lag the true server instant but can never pass
it — so no client wall-clock offset ever becomes elapsed server time;
wall time is a skew detector, never a source. When the lag cannot be
established (no timing record, or the freshest is too old to be the
carrying response) there is no anchor and the clock shows the unconfirmed
static target instead of a live count. Thereafter the anchor advances
only on the monotonic clock; the interval stops at
the tip and while the tab is hidden. On return, the hidden interval must
reconcile — wall and monotonic clocks advancing together across it
(`resumeClock` reports the resume trusted) — or elapsed time is uncertain
and the display falls back to the unconfirmed static target: device sleep
while hidden is exactly that case, and no confidently stale count is ever
shown. The started
state is terminal through
Week 1, and the copy keeps the source distinction: the target is the first
NBA tip (ESPN schedule), while Sleeper publishes only the Oct 20 date. Its
caption is formatted from the target in America/New_York, naming the zone
as it stands on that date (EDT in October, EST in December). In
the missing-edition state the member's roster-value section and team
actions (`RosterValuationDetails` / `MemberTeamActions`, shared with the
value section) render alongside the notebook, form guide + wire, AI
section and faces strip; the
faces strip (`FacesStrip`) shows
every team's top player linked to their page, and the viewer's recent moves
fold into the league section's moves feed (`TransactionFeed`) marked as their team. Standings,
league leaders and recent moves render as a visible league section under
the directory — never inside a collapsed details element. The
only separate personal element left is a one-line notice for unclaimed or
unavailable accounts. Signed-out rendering keeps the edition's structure and
content unchanged; no current matchup is inferred during offseason, no zero
is substituted for unknown scores/quotes, and saved AI requires matching
league/season/week/pair or the shared explicit Week 1 preview exception.
Stale results are labelled, and model choice, probabilities, confidence and
input/publication provenance stay distinct. Homepage faces resolve exactly
like the rest of the site: approved local portrait map first, then the
directory `Player.espnId` (the clubhouse directory reference now carries
`espnId`; personalized players take identity from the roster reference, not
from a market quote), then labelled initials. All ten teams use this same
code. Offline tests/QA live under the focused tests and `qa/personalized-home`.
No auth, AI generation, pricing, migration, infrastructure or competition gate
is changed by this composition.

The current homepage's `HomeFidelity.module.css` keeps its centered frame
and compact type/spacing local to this surface. `RosterPortraitStage` lays
out the current summary's three priced players as overlapping cutouts,
with a filled decorative team-name backdrop; the accessible player links,
real values, partial coverage and full valuation disclosure remain visible.
`EditorialPortrait` reuses the approved portrait/ESPN/initials chain without
changing shared avatar styling. Faces cards keep their existing team-avatar
links and content. Spotlights retain dated source facts in compact panels,
and the scouting notebook uses only guide rows or current modeled values.
Current hero/desk labels resolve live pairing identity; dated edition text
is available as a separately labelled story. A sourced watch resolves its
present owner by player ID, never the edition's frozen team assignment.
Identity/roster changes appear on the next server render after the existing
provider cache refresh; an already-open page does not receive pushed updates.

Homepage matchup records and streaks load only scoring weeks before the
provider's current week. Current-week transaction activity stays included;
an unfinished 0–0 is never a completed record, and a genuine completed tie
may be the closest game but is never a blowout. The stats grid sizes itself
to its containing panel rather than the viewport. Non-null current pairing
totals carry a "Current score" label, not a claim of verified completion.
`PlayerHeadshot` also detects a failed image already complete at mount so a
cached pre-hydration 404 enters the normal fallback chain.
`qa/home-fidelity` adds
isolated rename/avatar/trade and completed-record fixtures, production Next
HTML/RSC and browser checks, and matched reference captures. It reads no
account/database credentials and performs no application writes.

The reigning champion is derived from the clubhouse directory's
previous-season data — the team whose `previousSeason.finish` is 1, the same
source that prints its "2025 champion" label — never a hardcoded team.
Homepage surfaces pass it to `TeamAvatar`'s `isChampion` prop (desks, AI
rows, faces strip, clubhouse directory, standings). The homepage carries NO
champion showcase section and no other dedicated champion content: the
champion appears through the avatar crown badge and the directory's
champion label only — champions live on the history page.
On avatars the crown is ChampionCrown's
non-interactive badge presentation — avatars sit inside links and matchup
rows, where a nested button would be invalid; the spinnable button
presentation is reserved for standalone placements. `getDefendingChampion()` is deliberately not
used here: it reads the current league's winners bracket, which has no
champion until the running season crowns one.

### Isolated courtside homepage review

`courtside-preview/` is a local, static design review artifact. It does not
replace `/` or import another surface's internals. Run its commands in
`courtside-preview/README.md` from the repository root, then serve that root.
The comparison artifact remains separate from the integrated Next.js homepage; arcade code is unchanged.

- `src/domain/weekly-spotlight.ts` defines dated editorial editions, explicit
  draft/publication state, historical/upcoming matchup state, source checks,
  and the three player editorial roles.
- `src/domain/clubhouse-directory.ts` defines a homepage franchise summary
  using the existing `Team` identity and `Player` reference contracts.
- `src/data/weekly-spotlight.ts` and `src/data/clubhouse-directory.ts` contain
  dated, offline concept fixtures. They are not live loaders or scheduled
  publishing infrastructure. `build-data.cjs` typechecks and validates them
  before producing the small browser payload. Production injects live roster contracts through `getCourtsideHomeData`; the frozen directory remains comparison data.
- `src/ui/courtside-tokens.css` retains the experiment's layout/type vocabulary.
  Production color names alias the selected Paper + Slate roles in
  `src/ui/tokens.css`; homepage and archives reuse existing Inter/Geist assets.
  See top-level `DESIGN.md` for current visual authority.
- Native `<details>` retains all 228 roster references behind ten compact
  summaries. No player-detail or external API request is made by this preview.
  Rejected figurine controls, the optional viewer and its asset preparation
  script are removed from this preview too; profile links remain available.
- `ASSET-PROVENANCE.json`, `DESIGN.md`, and `review/` pin the approved assets,
  visual decisions, and captured desktop/mobile evidence. Weekly banner
  regeneration remains a content workflow; only two approved samples ship.

The trial's 70rem, 55rem, and 40rem breakpoints are documented in its token
file. Removing the comparison artifact requires no DB or Vercel change. The production surface is independent of its generated browser payload.

```
src/
  domain/        # The shared language: Team, Standing, Matchup, Player
                 # (carries espnId: string | null — the ESPN athlete id the
                 # headshot renders from; null = initials fallback),
                 # Transaction, DraftPick, Season, LeagueStats, PlayerDetail,
                 # TeamProfile, PowerRanking, PlayoffOdds, RecordBook,
                 # MatchupPreview, PlayerMove, PlayerStock/StockMarket,
                 # TradeVerdict/analyzeTrade, ManagerArchetype (GM IQ:
                 # per-season manager archetypes — MetricId, ARCHETYPES,
                 # percentileRank, assignArchetype's documented decision
                 # table, buildArchetypeProfiles, currentArchetype),
                 # TeamRosterValue + buildTeamRosterValue (market quotes
                 # joined to a roster by Sleeper player id — the /team
                 # roster-value view; implemented on the shared
                 # summarizeRosterValue policy in roster-value.ts, issue
                 # #214 — one implementation of quote filtering and
                 # cent-exact totals).
                 # Types + tiny helpers only. formatSeasonStatus(Season.status)
                 # renders the human status ("pre_season" -> "Preseason").
    arcade/      # The SECOND bounded context: SiteUser, InviteCode,
                 # GameSession, Game, GameScore, LeaderboardEntry,
                 # GameHubSummary, PlayableGame, Reward, plus the game registry
                 # (games.ts). Game carries an optional launchNote so
                 # coming-soon games say why/when instead of "coming soon".
                 # Never imports league
                 # types — teams are referenced by Sleeper roster id only.
  data/          # The ONLY place the outside world is touched.
    sleeper.ts   # Raw API client. Returns raw JSON, nothing else.
    espn.ts      # Sleeper -> ESPN athlete id mapping for headshots
                 # (resolveEspnId + the checked-in full ESPN_ID_MAP of
                 # 607 players, built 2026-10-08 from Sleeper joined to
                 # ESPN rosters; SEED_ESPN_ID_MAP remains the hand-verified
                 # spot-check subset. league.ts wires ESPN_ID_MAP at every
                 # resolution point — zero component edits). Also the
                 # headshotUrl formatter.
    nba-stats.ts # Player fundamentals: Sleeper's stats feed → cached
                 # PlayerStatProfiles (impure shell; math in transform.ts).
    transform.ts # Raw JSON -> domain objects. The membrane.
    analytics.ts # Pure data tools: computePowerRankings, computePlayoffOdds,
                 # computeRecordBook, computeMatchupPreviews. No fetching —
                 # same pure-inputs pattern as computeLeagueStats. All
                 # return null before the season tips off (never fake data).
    league.ts    # Loaders: getSeasonHubData (home), getTeamDetail (/team),
                 # getTransactionHistory (/transactions), getDraftBoard
                 # (/draft), getTeams (/teams), getSeasonMeta (site
                 # chrome: league meta + NBA state, no heavy sections),
                 # getPlayerDetail (/player/[playerId]), getTeamProfile
                 # (/teams/[rosterId]), getPowerRankings, getPlayoffOdds,
                 # getRecordBook, getMatchupPreviews (data tools),
                 # getTableData (/table: standings + streaks via the
                 # shared analytics assembly, roster values via
                 # getStockMarketData in the same request),
                 # getDefendingChampion (champion roster id from the
                 # playoff winners bracket; null until someone wins —
                 # NOT the source for TeamAvatar's isChampion: the
                 # current bracket is empty until this season crowns
                 # someone, so surfaces use reigningChampionRosterId()
                 # from history-2025.ts instead).
    manager-archetypes.ts # GM IQ loaders: getManagerArchetypes /
                 # getManagerArchetype — pure reads of the baked 2025
                 # metrics (gm-archetypes-2025.ts) through the domain's
                 # buildArchetypeProfiles. No Sleeper, no DB, no cache:
                 # the season is final, so the input never changes. The
                 # raw map is an injectable parameter (rule 11).
    db.ts        # SECOND DOOR: Vercel Postgres via Drizzle. Schema +
                 # lazy client. Nothing else imports drizzle or SQL.
    arcade.ts    # GameStore contract + DrizzleGameStore + FakeGameStore
                 # + getGameStore() factory + getArcadeHubData() loader
                 # (registry + weekly leaders + viewer's best, store
                 # passed as a parameter). Dependency inversion lives here.
  three/         # Interactive 3D viewers (client components). GLBViewer
                 # (GLTFLoader + AnimationMixer, idle loop, click one-shots),
                 # PropViewer (basketball/trophy/crown/hoop). Team identities
                 # use TeamAvatar; rejected hooper loaders/assets are removed.
                 # Prop assets in public/3d/,
                 # built by the Blender pipeline in 3d/ (see 3d/README.md).
                 # FreeThrowEnvironment is private practice-only scenery:
                 # approved Blender scenery, camera-selected crowd LODs and
                 # instanced reaction cohorts. FreeThrowScene owns finite cues;
                 # React completed-result/streak state is its sole cue source.
  public/3d/     # Approved props (basketball, trophy, crown, hoop)
                 # and independently owned free-throw assets with named animation
                 # clips. Do not hand-edit; regenerate via 3d/build_all.sh.
  surfaces/      # Bounded experiences. One folder per surface.
    season-hub/  # "What's happening in the league": hero, standings,
                 # stats strip, activity feed, section links to the deeper
                 # league pages. Receives domain objects, never fetches.
    transactions/ # "What has every team been doing": full wire history
                 # with client-side type + team filters. Receives domain
                 # objects, never fetches.
    draft/       # "How did every team get here": the completed rookie
                 # draft board, grouped by round. Receives domain objects,
                 # never fetches.
    teams/       # "Who's in this league": team directory cards (avatar,
                 # name, manager, record, PF), each linking to the public
                 # team profile. TeamProfile: identity + streak, full
                 # roster (headshots, every name -> player page), game
                 # log, rookie picks, recent wire moves. Receives domain
                 # objects, never fetches.
                 # GmArchetypeCard: the GM IQ card — one manager's
                 # archetype from real season behavior (archetype name +
                 # tagline, five percentile bars with visible percentile
                 # units and keyboard/touch-accessible metric definitions,
                 # season label, prior-manager note). Unmeasured metrics
                 # stay null and render as unavailable (never imputed).
                 # Null archetype renders an honest empty state.
    player/      # "Who is this guy": one NBA player's page — headshot,
                 # position pill, NBA team, owning GOAT Hoopers roster
                 # (or Free Agent), rookie-draft slot, wire history.
                 # Receives PlayerDetail; never fetches.
    power-rankings/ # The computed power order with week-over-week
                 # movement arrows. Self-contained: takes PowerRanking[]
                 # (null in the preseason), built for homepage embedding.
    playoffs/    # Simulated playoff odds (Elo Monte Carlo) with
                 # probability bars. Self-contained, null in preseason.
    records/     # The all-time record book: biggest blowouts, closest
                 # games, highest weekly scores. Self-contained, null
                 # in preseason.
    preview/     # Weekly matchup previews: projections, win-probability
                 # bars, the model's pick. Self-contained, null in
                 # preseason.
    intel/       # "What do the numbers say?": the League Intel hub
                 # composing the four data tools (preview, power
                 # rankings, playoff odds, record book) with
                 # broadcast-desk framing. Receives all four datasets;
                 # never fetches.
    stock-market/ # "What is every player worth": the FAAB-denominated
                 # player exchange. The selected navy/gold board uses shared
                 # site tokens, with market coverage and a compact tape.
                 # StockMarket renders server summaries; StockBoard combines
                 # search/position/draft/roster filters, sorts and progressive
                 # rows. StockQuoteRow names and visible Price history buttons
                 # open the existing inspector; Full profile is a separate link.
                 # Lists stay slim; ExchangeIcon
                 # provides stroked SVG inspection/navigation marks. StockInspector
                 # shows production sample sizes, price components and a
                 # dated/source-tagged value path on selection. Both reconstructed
                 # sources are dashed estimates; recorded snapshots and the
                 # current modeled quote are distinguished (PR49 semantics).
                 # On-demand detail uses data/stock-detail-client.ts against
                 # the existing GET /api/stocks/[playerId]. Per-board caching
                 # deduplicates requests; explicit retry evicts failures and
                 # request identities prevent stale detail from replacing the
                 # selected player. No eager deep payloads or schema changes.
                 # PriceHistoryChart inspects the bounded sampled points with
                 # dated/FAAB axes, ranges, pointer input and a native keyboard
                 # slider. Reconstruction, recorded snapshots and the appended
                 # current modeled quote retain separate labels/line treatments.
                 # Its light semantic tokens are scoped to the chart; no repricing.
                 # RetainedHistory adds an explicit selected-player date-range
                 # load using the injected stock-history-client. Recorded native
                 # calendar dots and UTC held reconstructions stay separate;
                 # manual pages preserve raw records. Range changes, player
                 # changes and Close abort pending reads; 409 requires restart.
                 # Exhausted retained pages still have unknown coverage.
                 # On mobile, close restores focus after the panel is removed.
                 # StockRow remains as the legacy row, with PR40 detailMachine
                 # retry on failed re-expansion, in-flight dedupe and ready
                 # details cached per mount. Its merged source is preserved.
                 # CombinedTicker is still rendered by the root layout.
    trade-analyzer/ # "Is this trade fair": hypothetical trades priced in
                 # FAAB dollars (TradeAnalyzer: two search pickers + running
                 # totals + verdict). --gh-term-* aliases the shared neutral palette.
                 # Verdict math (analyzeTrade, fair/leans/fleece bands) is
                 # pure domain (domain/trade.ts). Receives slim StockQuotes,
                 # never fetches.
                 # Share contract: both sides encode as ?a=<ids>&b=<ids>
                 # (router.replace, no reload); restored on load with unknown
                 # IDs dropped silently. "> COPY LINK" copies the share URL.
                 # objects, never fetches.
    news/        # The League News Network: real NBA articles from the
                 # ESPN + CBS Sports RSS feeds. Newsroom (front page),
                 # NewsFeed (client-side section chips: Latest / League
                 # Players / Rookie Wire / Free Agency). Headlines link
                 # out to the real article; mentioned players chip-link
                 # to /player/[playerId]. Receives domain objects,
                 # never fetches.
    history/     # The trophy room: neutral league history page; legacy
                 # --gh-wood-* names alias shared roles. Banner fabric/brass
                 # remain scoped materials within the championship object.
                 # TrophyRoom (hub: champions preview + records + HOF
                 # preview), ChampionsWall (hanging banners, one per title),
                 # ChampionBannerCard, RecordsGrid (engraved plaques),
                 # HallOfFameList (+ full page), FranchiseSection
                 # (Wikipedia-style franchise history, embedded on team
                 # pages). Domain: history.ts. Loaders: getLeagueHistory
                 # and getFranchiseHistory (src/data/history.ts) — the
                 # 2025 founding season is baked into history-2025.ts
                 # (final, verified vs the Sleeper API); the current
                 # season stays live. Hall of Fame inductees are curated
                 # there too — real history only, no fabricated moments.
    arcade/      # Public implemented-game catalogue: ArcadeHub,
                 # GameDetail (rules + leaderboard + rewards),
                 # Leaderboard, RewardLedger, GameCard, ProvisionNotice.
                 # Receives domain objects, never touches the store.
                 # GameCard receives PlayableGame: actual preview, direct
                 # Play link and phone controls; no account/store gate.
    team/        # "My Team": identity + record, full roster (each player
                 # shows their modeled FAAB price), the team total roster
                 # value (issue #189: per-player prices + total joined from
                 # getStockMarketData() in the same server request — React
                 # cache-shared with the root-layout ticker, so no extra
                 # provider calls or snapshot writes), and FAAB winnings.
                 # Rendered by /team for the logged-in manager. Unknown
                 # quotes render "—" (never $0); the total footnotes its
                 # coverage ("over N of M players with quotes") and carries
                 # the market's pricing-basis label. getTeamDetail's
                 # contract is untouched; the join lives in
                 # getTeamRosterValue (src/data/league.ts) over the pure
                 # domain projection buildTeamRosterValue. League rank of
                 # the total is issue #184's, not this surface's.
    the-table/   # "Where does everyone stand": The Table leaderboard
                 # (issue #184) — one board, four lenses. League =
                 # standings + signed streak, projected over verified
                 # final results only (domain helper projectTableLeague
                 # in domain/the-table.ts: completed weeks exclusively —
                 # the in-progress week's live scores and points-for
                 # never count as results); Value = roster FAAB totals
                 # from the shared market quotes (computeTeamValues over
                 # summarizeRosterValue, ranks from the shared
                 # rosterValueRank in domain/roster-value.ts: a rank
                 # exists only when every roster is fully priced, equal
                 # complete totals tie); Power and Arcade render honest
                 # unavailable states until weekly table snapshots /
                 # arcade scoring exist. The signed-in viewer's row is
                 # pinned in a strip and highlighted. Lens switching is
                 # local state; never fetches.
  ui/            # Design tokens (tokens.css) + primitives (Card, Badge,
                 # SectionHeading, TeamAvatar, PositionPill,
                 # PlayerHeadshot, PlayerRow, TransactionSummary,
                 # ChampionCrown, SiteHeader, SiteFooter, MobileNav,
                 # SectionNav) + teamColors.ts (roster id -> --gh-team-N).
                 # Every surface uses these.
                 # ChampionCrown is the defending champion's crown: a crisp
                 # inline SVG in site gold, tilted a few degrees and nudged
                 # off-center so it reads hand-placed. Two presentations:
                 # the interactive button (click/Enter/Space fires a 360°
                 # overshoot-and-settle spin, off under
                 # prefers-reduced-motion) is for standalone placements
                 # only; the aria-hidden badge (interactive={false}) is for
                 # avatars inside links/buttons, where nested interactive
                 # content is invalid. TeamAvatar always renders the badge
                 # when isChampion is true. Surfaces opt in with the
                 # reigning champion's roster id from
                 # reigningChampionRosterId() (src/data/history-2025.ts) —
                 # derived from the verified 2025 placements, the same
                 # canonical record the clubhouse directory's
                 # previousSeason.finish is built from. Do NOT use
                 # getDefendingChampion(): it reads the current league's
                 # winners bracket, which is empty until this season crowns
                 # someone. No crown renders while the derivation is
                 # unknown.
                 # PlayerRow is the linked player identity (headshot +
                 # name -> /player/[sleeperId] + position pill + NBA team);
                 # every player name site-wide renders through it.
                 # TransactionSummary renders one transaction as a sentence
                 # with player names -> player pages and the acting team ->
                 # its team page, built from structured adds/drops.
                 # SiteChrome groups ticker/header in one sticky stack and
                 # measures its actual height for anchor/focus clearance.
                 # A clipped skip link focuses the root content container.
                 # SiteHeader is the site-wide chrome (wordmark, primary
                 # nav, account state). Nav rule: logged in, the manager's
                 # display name with a team-colored avatar ring is the
                 # single entry point to /team and "My Team" disappears;
                 # logged out, "My Team" stays as the login nudge.
                 # Root layout supplies ui/siteDestinations.ts's small typed
                 # ordered list to SiteHeader and filters its footer entries.
                 # Desktop primary: Home / News / Stocks / History / Arcade.
                 # League tools discloses Teams / Transactions / Draft / Intel /
                 # Trade Analyzer / Weekly archive in the same phone/desktop order.
                 # Phone: approved logo / persistent Stocks / Menu, with Stocks
                 # omitted from Menu to avoid duplicate links/current states.
                 # SiteHeader composes the existing server ticker slot and toolbar
                 # inside SiteChrome; disclosure panels are normal-flow siblings,
                 # so their enlarged height never inflates sticky target clearance.
                 # Ordinary links/disclosures close on Escape, activation, route
                 # changes and responsive layout exit; no focus trap or modal menu.
                 # Phone account actions live only in Menu. The fixed bottom bar
                 # and its body-space reservation are retired. MobileNav and
                 # SectionNav keep null compatibility seams for unchanged owners'
                 # pages/isolated reviews, with no destination lists or markup.
                 # SiteFooter keeps league, season, existing links and disclaimer;
                 # destinations derive from the root list. Ticker/poller, auth and
                 # league/data ownership remain unchanged.
                 # PositionPill colors PG/SG/SF/PF/C via --gh-pos-* tokens.
                 # PlayerHeadshot renders a supplied approved local portrait
                 # first (portraitSrc), then the ESPN CDN headshot by ESPN
                 # athlete id (Player.espnId; plain <img>, never next/image —
                 # Hobby quota), then an initials-in-team-colored-disc
                 # fallback (client component; failures are tracked per
                 # source so a failed portrait falls through to ESPN and a
                 # changed source can recover). Unmapped or broken images
                 # fall back to initials.
                 # Reading the session cookie in the layout forces dynamic
                 # rendering (see layout.tsx) — deliberate: correct account
                 # state everywhere beats static caching for a ten-manager
                 # league site.
  app/           # Pages. Thin: load via src/data, hand to surfaces.
    actions.ts   # Server actions: claim/login/logout (sessions + bcrypt),
                 # commissioner invite-code management. The only place
                 # that touches cookies or calls getGameStore() in the
                 # app layer.
    arcade/      # /arcade (game list), /arcade/[gameId] (detail +
                 # leaderboard + ledger). force-dynamic; render the
                 # ProvisionNotice when the DB isn't provisioned.
    claim/       # /claim — invite code -> account. Co-located form.
    login/       # /login — team + password. Co-located form.
    team/        # /team — the logged-in manager's page (identity, roster,
                 # roster value, FAAB winnings). Redirects to /login when
                 # logged out.
    table/       # /table — The Table leaderboard (issue #184). Loads
                 # getTableData + the viewer's team id (same session
                 # lookup as the root layout; null when signed out).
    transactions/ # /transactions — full wire history (type + team filters).
    draft/       # /draft — the completed rookie draft board.
    teams/       # /teams — the team directory.
    teams/[rosterId]/ # /teams/[rosterId] — one franchise's public profile.
    player/[playerId]/ # /player/[playerId] — one NBA player's league page.
    intel/       # /intel — League Intel: the four data tools composed
                 # (matchup previews, power rankings, playoff odds,
                 # record book). force-dynamic via data loaders;
                 # revalidate 300.
    admin/       # /admin/invites — commissioner invite codes, gated by
                 # COMMISSIONER_KEY (server-side check, every action).
ARCHITECTURE.md  # This file.
CONTRIBUTING.md  # PR workflow, conventions.
AGENTS.md        # House rules (below the Next.js-managed block).
```

## Data flow

`ui/controls.module.css` owns shared primary, secondary and quiet action styling;
surfaces compose these CSS roles without changing navigation or event handlers.
`ui/ControlIcon.tsx` provides small monochrome SVGs only for sort, close and
selection state. App-authored text omits emoji and decorative arrows. The source
policy test parses interface literals rather than filtering runtime content, so
user-created names and provider text retain their original values. This visual
cleanup does not change auth, claims, game rules, data access or competition gates.

```
Sleeper API  →  sleeper.ts (raw fetch + cache)
             →  transform.ts (raw → domain)
             →  league.ts (composed loaders)
             →  page.tsx (server component)
             →  Surface (props are domain objects)
```

Data flows one way, top to bottom. There is no client-side fetching of league
data, no context providers for league state, no prop drilling of raw JSON.

### The stock market (FAAB-denominated player prices)

`getStockMarketData` (in `src/data/league.ts`) prices every player with a
market footprint like a stock, in FAAB dollars — the league's waiver
currency. The math is the pure `computeStockMarket` in `transform.ts`
(same dependency-inversion seam as stats):

    price = K × ability × futureSeasons(age) × sentiment × injury

- **ability** is a Bayesian blend of proven production and prospect
  pedigree. Proven production is trailing fantasy PPG in our scoring
  (0.65 × last season + 0.35 × season before), computed from Sleeper's
  own stats feed (`/stats/nba/regular/{season}` — real box-score totals;
  the old "Sleeper has no per-player stat feed" comment was wrong).
  Pedigree is historical year-1–3 fantasy output for the player's league
  rookie-draft slot. Blend weight w = exp(−careerMinutes/800): unproven
  rookies price on pedigree, veterans on production.
- **futureSeasons(age)** is the discounted remaining prime
  (Σ ageCurve(age+t)/ageCurve(age) × 0.85^t) — the dynasty term.
- **sentiment** is a bounded (±25%) overlay from revealed league behavior
  (add/drop velocity, FAAB spent, trades).
- In-season, trailing production blends toward a per-game EMA as games
  accumulate (`emaUpdate` in transform.ts; small alpha for young players
  so one game can't crater them). Preseason, prices run on trailing
  production + pedigree and the page shows a "preseason pricing" badge.

Fundamentals are cached in the `player_stat_cache` table (one row per
player, UPSERTED, refreshed at most daily) by `src/data/nba-stats.ts`,
so page loads never hit the stats feed and Neon stays quiet. Price
history has two layers: `stock_snapshots` holds live daily snapshots
(30-day retention), and `price_history` holds reconstructed deep history
— per-game `gamelog` points backfilled from real game logs plus yearly
`backtest` points for seasons without log coverage. The store
(`src/data/stocks.ts`) uses separate quote and chart reads.
`getQuoteHistory(ids)` selects at most one latest live baseline per unique
requested player in one SQL query (zero queries for an empty set), with
`player_id, snapshot_at DESC, id DESC` ordering for deterministic ties.
Reconstruction never supplies a quote baseline. The shared market-candidate
selector controls the requested set. `getPricePath(id)` reads only the
selected player's reconstruction and latest ten live rows (player filter
before the limit). The detail loader requests 39 historical points, reserving
the fortieth slot for its unchanged current modeled quote. The pure
`stock-history-sampling.ts` orders existing points, preserves both endpoints
and both sides of provenance changes, then prefers extrema and splits the
largest remaining index gaps. It never averages prices, invents dates or
deduplicates a recorded/current same-date pair. Provenance that alone exceeds
the requested budget fails closed instead of being silently hidden.
The list/ticker never request chart history; see `docs/quote-history-queries.md`.
Both reconstructed sources render dashed and are labeled as
current-model FAAB estimates; normal change % and movers use live
snapshots only. `src/data/reconstruct-price-history.ts` is the pure,
offline reconstruction seam. Sleeper season `2023` means `2023-24`,
with a yearly fallback dated June 30, 2024. Game prices include that
game; in-season EMA resets each season. Full prior-season production
is used only in later seasons: frozen completed-season totals take precedence
over partial/missing game logs; log means are the fallback when totals are absent.
Current/future full-season totals never feed a dated game point. Calendar dates/birthdays use explicit
UTC date-only semantics. A yearly point is superseded only when logs
cover its expected games; the rolling window is applied in memory.
When the database isn't
provisioned the store is a no-op: prices still compute live, movers show
their honest "no history yet" states, and nothing crashes.

Team value history (#217) gets its own four-table store in `db.ts`,
landed schema-first (`migrations/team-value-history.sql`, reviewed and
applied separately; no ingest or reader exists yet). `sleeper_transactions`
is the normalized archive of both league seasons' Sleeper transactions —
failed rows are stored verbatim and filtered only at replay read time.
`roster_snapshots_daily` is the replay output (one roster per slot per UTC
day); its `roster_status` is confidence only (`verified` / `replayed` /
`ambiguous` / `unavailable`), with `roster_evidence` carrying the
reasoning — ambiguous days store an empty player list and a NULL
`roster_count` unless a count is independently supported. Derived
offseason-boundary reconciliation lives apart in `roster_boundary_moves`:
`boundary-reconciliation` is a move origin, never a roster status, and a
move whose effective time is unknown stores `precision = 'unknown'` with
NULL `effective_at` / `day` rather than an invented cut date.
`team_value_points` is the derived daily series whose `subtotal_cents`
(and `roster_count`) is nullable because unknown means NULL, never zero.
Recorded points persist there with their original quote references
because `stock_snapshots` prunes after 30 days. The dot owns the
presentation contract (`src/domain/team-value-history.ts`) and picker;
the producer that fills these tables is a later, separately reviewed lane.

The root header renders the `@ticker` server slot on league/content pages
(ESPN style: news headlines, stock quotes, and — on NBA game days — live
scores alternate on a timer; pure CSS animation, pauses on hover, no
auto-switch under `prefers-reduced-motion`); the full market lives at
`/stocks`. The scores mode (issue #56) is fed by ESPN's public scoreboard
API via `fetchLiveGames`/`useLiveGames` in `src/data/espn-client.ts`:
polled directly from the browser every 60s and only while games are live
or scheduled, so Vercel/Neon stay at $0. `LiveGame` and `LiveSlate`
(games + the provider's `day.date`, so the poller detects the provider's
day rollover independently of the browser clock) live in
`src/domain/live-game.ts`. If ESPN is unreachable the mode silently never
appears — the ticker parks on News/Stocks.

The root header receives the `@ticker` server slot. Its explicit home
page and `[...segments]/page.tsx` share the private server `Ticker.tsx`
component. Account, admin, login, signup, claim, forgot-password and
reset-password roots (including nested routes) return null before
either market/news loader; `default.tsx` supplies a null
hard-navigation fallback. League/content routes retain the existing
ticker, bounded 25-quote/12-headline DTOs and outage behavior. Existing
loader caches and the ticker client are unchanged. Public-to-public
soft navigation may invoke the loaders more often than the former
retained root layout; no unchanged navigation cost or universal
bundle/cost savings is claimed. See `docs/ticker-scope.md`. The primary
`src/app/[...segments]/page.tsx` fallback invokes Next `notFound()` for
otherwise-unhandled URLs, so the ticker catch-all cannot retain an old
primary page during soft navigation; specific pages and handlers retain
precedence.

### Explicit price-history imports

Application builds never seed or repair the database. Domain contracts
live in `src/domain/price-history-import.ts`; artifact hashes and validation
live in `src/data/price-history-artifact.ts`.

1. Freeze a JSON config with `directorySeason`, `currentSeasonStartYear`,
   `directoryPath`, `gamelogPath`, `seasonHistoryPath`, `draftPicksPath`, and
   `source: { description, revision, scoring, limitations }`. Paths are relative to the
   config. Season history is a reviewed export, not a mutable runtime cache.
   Draft picks include an `availableOn` calendar date; later drafts never
   affect earlier prices. Record missing/approximate source fields honestly.
2. `npm run price-history:prepare -- inputs.json candidate.json` runs offline
   and produces points plus source/input/model/output hashes, model version,
   reconstruction version, expected counts and approximation assumptions.
   The dataset ID hashes the complete published manifest (excluding only its own
   ID), including source/scoring/assumptions/season metadata and the points hash.
3. Retain a read-only export with IDs and UTC dates. `npm run price-history:plan
   -- backup.json candidate.json plan.json` reports exact affected classes and
   hashes. `npm run price-history:import -- candidate.json --plan=plan.json`
   validates only. Review date/season/player/source coverage and source scoring.
4. Review/apply `migrations/price-history-import-state.sql` separately. The
   unique natural point key and singleton publication state are additive;
   duplicate groups must be zero before creating the index.
5. Only after approving the exact candidate and target, use `--apply
   --dataset=HASH --plan=plan.json` with `PRICE_HISTORY_IMPORT_URL`. It never falls back to
   the application's `DATABASE_URL`. `publishReconstructedPoints` submits
   an advisory lock, a check against the backup's reconstructed-row fingerprint,
   reconstructed-point replacement and completion manifest
   in one Neon HTTP transaction. Failed chunks leave the last committed
   dataset available. Stable point IDs make identical reruns repeatable.
   Live snapshots are excluded from replacement. Keep the previous artifact
   for an explicitly reviewed rollback. No import is tied to deploy/CI.

`docs/price-history-repair.md` defines the affected classes, backup/export and
review sequence, opt-in local Postgres tests and remaining deployment limits.
`data/README.md` and `data/source-audit.json` pin the verified upstream content
and state scoring, coverage and identity limitations; game inputs are unchanged.

Existing unversioned rows remain legacy reconstruction until a separately
approved repair. The live ingestion/EMA updater is still unwired, and live
snapshots still expire after 30 days. A longer observed-history product
requires an explicit retention decision; reconstruction cannot recover old
sentiment/injury observations. Raw box scores are needed to re-score old
games under future league scoring changes.

### The League News Network (real articles)

`getLeagueNews` (in `src/data/league.ts`) feeds the ticker's news mode
and `getLeagueNewsEdition` feeds the `/news` page with REAL NBA
articles — no generated fiction. The pipeline:

```
ESPN + CBS Sports RSS  →  fetchRssFeed (src/data/real-news.ts, fetch injected,
                          per-outlet source-host policy on destinations)
                       →  parseRssItems (pure, regex-based — no DOMParser
                          server-side; absolute http(s) links only)
                       →  matchPlayersToArticle (pure full-name matching vs the
                          projected player directory, via the shared
                          playerSearchKey from #116 — accent/apostrophe
                          insensitive, Unicode-aware word boundaries)
                       →  buildRealNewsFeed (pure: strip HTML, ~200-char summaries,
                          dedupe by URL, newest-first, section assignment —
                          classification only from KNOWN identity inputs)
                       →  loadLeagueNews (src/data/league.ts: RSS in parallel via
                          Promise.allSettled + roster/directory/draft-board
                          identity inputs, each recorded ok/unknown,
                          all injectable per rule 11)
                       →  createLeagueNewsCache (5-min shared copy, last-good on
                          refresh failure)
```

- **Sources:** `https://www.espn.com/espn/rss/nba/news` and
  `https://www.cbssports.com/rss/headlines/nba/`. The Athletic is
  paywalled and Bleacher Report's feed endpoint is dead — deliberately
  not attempted. Article destinations must be absolute http(s) URLs;
  each feed additionally enforces its outlet's host allowlist
  (espn.com / cbssports.com, subdomains allowed) — see the
  source-host policy comment in `src/data/real-news.ts`.
- **Sections:** every article is always in Latest. Classification beyond
  that needs the identity inputs to be KNOWN: a rostered-league-player
  mention adds League Players, a 2026-drafted-rookie mention adds Rookie
  Wire, a mention of an NBA player on no league roster adds Free Agency.
  A failed input is recorded as unknown in the edition's coverage — it
  never looks like an empty real roster/draft, so a roster outage can't
  invent Free Agency labels and a draft outage can't silently remove
  Rookie Wire.
- **Resilience:** one feed failing still yields the other; both feeds
  failing throws so the TTL cache preserves last-good (cold failure →
  honest empty edition with all coverage unknown). Failed identity
  inputs degrade to explicit unknown coverage, never to invented
  classifications.
- **Matching:** full names only (never bare surnames), normalized with
  the shared `playerSearchKey` (accent/case/apostrophe-insensitive),
  Unicode-aware whole-word boundaries, suffix-aware ("Jr.", "II"),
  longest-first with matched spans blanked so "Mikel Brown" can't steal
  "Mikel Brown Jr.". One normalized name shared by two playerIds is
  ambiguous → no chip, never a wrong chip.
- **Freshness, honestly:** the root layout is `force-dynamic` (session
  cookie), so `/news` renders per request and its `revalidate = 600`
  is inert — the effective freshness is the shared per-instance
  5-minute TTL cache, which the ticker and `/news` both read. Open
  pages do not auto-poll; a reload fetches the current cached edition.
  Deliberately no client polling (free-tier budget).
- **URL contract** (`src/surfaces/news/newsUrls.ts`): `?section=<id>`
  selects a section with working Back/Forward/refresh. `?story=` /
  `?revision=` are legacy params from the retired fictional story
  reader: they render an honest "retired" notice with a path back to
  the headlines, never a broken reader. Timestamps render relative
  text with a deterministic UTC `title` (no `toLocaleString` — it
  differs by server/client locale and breaks hydration).
- Surfaces render the outlet masthead, the headline as an external link
  to the real article, a relative timestamp, the summary, and subtle
  mentioned-player chips (plain text until hover) linking to
  `/player/[playerId]`.

`qa/newsroom/` mounts production components with synthetic editions and
approved local fonts/chrome, not an app route; `verify.mts` asserts the
acceptance checklist structurally (no browser in CI).

### The stats seam (dependency inversion in the read path)

`getSeasonHubData` doesn't compute stats inline. Instead:

```
fetchStatsInput(teams)      — impure: calls fetchNbaState / fetchMatchups /
                              fetchTransactions, assembles LeagueStatsInput
computeLeagueStats(input)   — pure: LeagueStatsInput in, LeagueStats out
```

`computeLeagueStats` lives in `transform.ts` and takes all its data as a
parameter — no imports, no network. Tests pass fake inputs straight in.
That split is the rule-11 seam for the Sleeper side: fetching is the thin
impure shell, the math is a pure function of its inputs.

### Offline regression suite

`npm test` (vitest, `vitest.config.mts`) runs the offline suite in
`src/data/__tests__/`, plus the I/O boundary regressions in `src/test/`.
Fixtures live in `__tests__/fixtures.ts` — tiny
synthetic teams, transactions, matchups, and claim-store states, all
credential-free. Tests assert observable domain results, never private
function structure. The default suite installs `src/test/offline.ts` before
collecting tests: real `fetch` and Node socket connections fail immediately,
and ambient application/import database URLs are removed. Fakes remain
injectable. `.github/workflows/ci.yml` uses Node 22 from `.nvmrc`, installs the
exact lockfile including dev tools (`npm ci --include=dev`) with engine
validation, then runs tests, `npm run typecheck`, and the full `npm run build`
sequentially. Any failure fails the check. PR runs test GitHub's merge commit
against the base; logs record both that tested commit and the PR head. Push
runs test the exact main commit. The existing check name remains unchanged.
The production build has no database/import credentials and never seeds;
it can download the public Google fonts used by `next/font`.
The optional isolated-DB contract suite (FakeGameStore vs a throwaway
test Postgres) is separate and fails closed when its target is absent —
it never falls back to production credentials. The explicit
`npm run test:price-history:local` command sets `RUN_PRICE_HISTORY_LOCAL_TEST=1`
and allows only its hardcoded synthetic Postgres target at
`127.0.0.1:55438/price_history_test`. The claim suite introduced by PR53 uses
`RUN_CLAIM_TEAM_LOCAL_TEST=1 npm test -- src/data/__tests__/claim-team-local.test.ts`
and allows only `127.0.0.1:55441/claim_team_test`. The guard remains installed
in both modes: fetch, remote hosts, other ports, implicit hosts and Unix
sockets stay blocked. Each flag only enables its own port. Both flags may be
set for a combined local run; CI explicitly clears both. The database names
and synthetic schemas are fixed in the respective test fixtures; the socket
guard enforces the network endpoints. Test workers are guarded, not arbitrary child processes:
the build CLI regression invokes only `next build --help`.
The claim suite runs the shared FakeGameStore/Drizzle contract plus forced
overlapping claims and mutation failure rollback. It uses a dedicated schema
and the installed Neon HTTP/Drizzle stack with a local Postgres transport;
two independent backend PIDs blocked at a lock prove actual query overlap.
The suite has no configurable URL and never reads application DB credentials.

`LeagueStats` fields are all nullable. In the preseason (`/state/nba`
says `"pre"`) the loader returns `hasGames: false` and every stat stays
null — the `StatsStrip` renders one honest empty state instead of fake
leaders picked from all-zero rows.

The data tools (power rankings, playoff odds, record book, matchup
previews) follow the same seam: `src/data/analytics.ts` holds the pure
functions (`computePowerRankings`, `computePlayoffOdds`,
`computeRecordBook`, `computeMatchupPreviews` — inputs in, domain objects
out, never null-filled), and `league.ts` loaders assemble their inputs
from live Sleeper data. Every tool returns null in the preseason, and its
surface renders an honest empty state. Formulas/models are documented on
the domain types themselves (`power.ts`, `playoff-odds.ts`,
`matchup-preview.ts`).

The arcade has its own one-way flow, through the second door:

```
Browser  →  server action (src/app/actions.ts, "use server")
         →  GameStore contract (src/data/arcade.ts)
         →  DrizzleGameStore → Vercel Postgres (src/data/db.ts)
```

Sessions: the `gh_session` cookie holds the raw token; the database holds
only its SHA-256 hash. 90-day expiry ("remember me" is the default).
Passwords are bcrypt-hashed (12 rounds) — raw passwords never touch the DB.

## The contracts

### 1. Domain is the shared language
- If a league concept exists, its type lives in `src/domain/` with a doc
  comment explaining what it is.
- Surfaces reference each other’s concepts through domain types, never by
  importing another surface’s internals.
- New concept needed? Add the type first, then teach `src/data` to build it.
  Never invent a parallel shape inside a surface.

### 2. Data layer owns the outside world
- `sleeper.ts` is the only module that may call `api.sleeper.app`.
- `transform.ts` is the only module that may interpret raw Sleeper shapes.
- Surfaces and pages import from `@/data/league` (loaders) and `@/domain`
  (types). Importing `sleeper.ts` or `transform.ts` anywhere else is a bug.
- Loaders are resilient: an optional section that fails returns `[]`, it
  never throws the page. The site must render with partial data.

### 3. Surfaces are bounded contexts
- A surface answers ONE question ("what's happening in the league?").
  Standings + stats + activity live together in `season-hub` because
  they're the same question — not because they're convenient to group.
- A surface receives domain objects as props. It never fetches from
  Sleeper or the database. The one exception: a client component may
  fetch the app's own `/api/*` routes for on-demand detail loading
  (Rule 14's list/detail split — e.g. StockRow expanding a player).
  The API route owns server data access and delegates to `@/data/`
  loaders.
- A surface never imports another surface's *private* internals. Two
  documented composite surfaces compose sibling public entrypoints:
  - `intel/IntelHub` composes `preview/MatchupPreview`,
    `playoffs/PlayoffOdds`, `power-rankings/PowerRankings`,
    `records/RecordBook`.
  - `teams/TeamProfile` composes `history/FranchiseSection`.
  A public entrypoint is a surface's top-level component file. Anything
  else (subdirectories, internal helpers, non-component modules) is
  private. New composite surfaces need explicit documentation here.
- `import type` from any surface is always allowed — types are erased
  and create no runtime coupling.
- `npm run check:contracts` parses production surface sources with TypeScript.
  Alias and relative paths obey the same rules, including multiline imports,
  re-exports, literal dynamic imports and `require`. Type-only dependencies
  are allowed, including inline `type` specifiers; mixed imports are checked.
  Composite exceptions belong to the exact component files above, not their
  whole directories. Direct `fetch`/`window.fetch`/`globalThis.fetch`/`self.fetch`
  calls require a literal `/api/*` URL or a template with that fixed prefix.
  Protocol-relative URLs, non-API paths, backslashes and literal dot-segment
  escapes are rejected. Unverifiable module paths and fetch URLs fail closed.
  This is a syntax check, not runtime data-flow analysis: aliases of `fetch`,
  interpolated path values and helper behavior still require code review.
  The offline regression suite also checks the current production surface tree.
- Shared visuals come from `src/ui/`.
- Each surface documents its contract in a comment at the top of its entry
  component (what props it takes, what it renders).

### 4. UI tokens are law
- Colors, spacing, type, radii: `src/ui/tokens.css` (`--gh-*`). No hardcoded
  hex values, no magic pixel numbers in components.
- Need a new token? Add it to `tokens.css` with a comment explaining why.
- Primitives (`Card`, `Badge`, `SectionHeading`, `TeamAvatar`,
  `PositionPill`, `PlayerHeadshot`, `SiteHeader`, `SiteFooter`,
  `MobileNav`) are the default building blocks. Reach for raw HTML/CSS
  only when a primitive genuinely doesn’t fit.
- Team identity colors are `--gh-team-1` … `--gh-team-10` (roster id ->
  color); use them only through `teamColorVar()` in
  `src/ui/teamColors.ts`, never by indexing the tokens directly.
- All numbers (stats, scores, records, timestamps, FAAB) use the
  `.gh-num` utility class: mono + tabular figures. Proportional digits in
  stats are a bug.
- Display type (Anton) is uppercase by default via globals.css. Body copy
  never uses the display face.

### 5. Pages compose explicitly
- `src/app/` pages load data and hand it to surfaces. No registries, no
  dynamic imports by convention, no "drop a folder and it appears".
- If a page composes two surfaces, the composition is visible in the page
  file.

## Responsive approach

Mobile and desktop are both first-class (rule 7). The convention:

- Base styles are single-column and mobile-friendly.
- `@media (min-width: 64rem)` enhances to multi-column desktop layouts
  (season-hub's standings + activity side-by-side, stats strip 3-up).
- `@media (max-width: 40rem)` compacts dense components for phones —
  the standings table re-lays-out as team cards (same DOM, CSS grid
  areas; the header row hides and W/L/PF get inline labels via
  `data-label`), and stat grids stack.
- Breakpoints are documented in `src/ui/tokens.css`. CSS custom
  properties don't work inside `@media` conditions, so the values are
  written as literals and kept in sync by hand — don't invent a third
  breakpoint without documenting it there.
- Touch targets are >= 44px on mobile.

## Caching strategy

- League data (rosters, users, league meta, NBA state, matchups):
  `revalidate = 300` (5 min).
- Player directory (~2.5MB raw): projected at parse time to the fields the
  membrane reads (~330KB), cached per instance for 5 minutes with last-good
  fallback on refresh failure (`createPlayerDirectoryCache` in
  `src/data/sleeper.ts`; `no-store` on the underlying fetch so the 5-minute
  TTL is the single source of truth). Still fetched ONLY when name resolution
  actually needs it — and never cached through the write-bearing market
  producer (issue #44 owns that publication boundary).
- League news feed (public, read-only): one shared copy per instance for
  5 min (`createLeagueNewsCache` in `src/data/league.ts`), so the
  root-layout ticker and `/news` don't recompute it independently. Nothing
  session-scoped is ever cached across requests. The loader
  (`loadLeagueNews`) uses strict variants (`getTransactionHistoryStrict`,
  `getDraftBoardStrict`) that throw on any upstream failure — the TTL
  cache then preserves last-good instead of caching a failure-degraded
  feed. Empty-but-successfully-fetched inputs are legitimate; the
  invariant is "failure throws", not "empty throws".

## AI Decides

`src/domain/ai-decider.ts` is the client-safe draft/result/slate contract, including
every option probability, independent API confidence and frozen snapshot metadata.
`src/data/ai-decider/` owns strict validation, the fixed server-only Decisions
adapter, current-session validation, durable Postgres CAS budgets and immutable
weekly prediction/outcome storage. Dependencies are injected for offline tests.
The explicit `kind:"league"` interactive draft maps two choice names to two
roster IDs, verified again against current canonical server names.
`loadAiLeagueRosterContext` in `league.ts` reuses existing source caches only
after validated identity. The pure bounded projection/prompt in
`ai-decider/roster-context.ts` sends both complete current rosters, known
names/ages and available observed current/prior fantasy stats under league scoring.
Unknown fields remain null. Retrieval time, unknown source update time, cache
revalidation/stale-fallback caveats and coverage appear in separate
`AiLeagueContextMetadata`; weekly snapshots remain immutable and unchanged.
Plain custom text receives no automatic league facts, and the existing request,
input-token and spending limits apply without truncating oversized evidence.
`POST /api/ai-decides/context` delegates a bounded same-origin two-team read to
`context-http.ts` after current manager validation. It loads no provider or budget
operation. `context-preview.ts` serializes every selected roster/player/stat fact
into complete editable column text, with deterministic text digest and separate
source/coverage metadata. Both new interactive presets can fill the visible
question plus roster text. An optional `contextDigest` league run reloads current
canonical facts and verifies the exact text suffix and ordered names before paid
admission. Its `goat-visible-roster-v1` payload supplies the full displayed prompt
once, without a second hidden roster block. Question edits preserve canonical
fact proof; edited/removed roster text uses ordinary custom input with no proof.
Prompt bytes and choice labels are preserved; equality uses trim/NFKC/en-US case
only for identity validation. Transport permits 12,000 characters/32 KiB while the
unchanged 6,144 conservative provider-input budget still rejects excess before
spend. No signing key, token, preview persistence or schema is added.
`POST /api/ai-decides` delegates bounded same-origin drafts to that service;
anonymous users can build drafts without provider calls. `GET` and
`getAiDecidesData()` read cached weekly picks only. League fetch/preparation stays
in `league.ts`; the new raw starter/reserve/taxi/slot/leg fields are optional and
do not change existing transforms. Weekly preparation/public cache reads request
no player directory; only the explicit authenticated roster drill-down resolves names.

The explicit pre-week preparation/generation operation seals one snapshot,
uses a versioned prompt/model and saves all five choice distributions in one
batch, with incomplete matchups labeled unavailable. An experimental prior PPG
baseline and append-only final outcome records remain separate from predictions.
Each immutable week carries a hashed generation manifest; historical reads and
outcomes use its frozen model/prompt rather than current generation constants.
Globally unsupported inputs return before sealing. Usage is settled independently
of prediction decoding, with idempotent CAS completion even for retained leases.
The reviewed-calendar schema1 path still refuses unsupported scoring/phase facts.
Schema2 lineup previews explicitly retain preseason, missing prior-stat coverage
and unknown mode without inferring selection mechanics. BN slots are excluded;
complete eligible starters plus at least8/10 observed stats per team are required.
The separate observed-starter mean is not a full score forecast. Both versions
retain their frozen decoders; no PPG-by-games multiplier is used.

The immutable declaration in `src/domain/ai-lineup-policy.ts` supplies
schema3's eleven active slots and minimum 9/11 observed prior-production
coverage. New public lineup previews carry that policy tag and its
prompt/baseline version; schemas 1/2 keep frozen ten-slot decoding and
hashes. `loadAiWeekContext` exposes `AiSourceConfiguration` from its
existing league read, and `withSourceCompatibility` derives an
`AiSourceCompatibility` notice without persisting it or changing saved
evidence/results. Its `currentWindow` retains pre-annotation readiness,
so changed/unverified settings cannot reopen expired windows or revoke
separately authorized refresh controls. Saved AI/home surfaces show that
provenance; the complete interactive roster path is unchanged. Named
game mode and positional assignment remain unverified.
`migrations/ai-decider.sql` starts disabled and was separately provisioned under
root authorization before this source change; no new migration is introduced. Existing auth/valuation/repair tables are reused
or read without schema/behavior changes. UI/page integration has a separate owner.
The dedicated disposable PostgreSQL CI job executes the AI migration only in a
generated synthetic schema, verifying actual SQL/CAS/triggers with provider mocks.
Its guarded loopback target and service lifecycle never use an application DB URL.
Provider credentials and runtime stay behind `server-only`. `OPENAI_API_KEY`,
`GOAT_AI_DECIDES_ENABLED=true` and an enabled durable control row are separate
server activation gates; absent settings/state produce unavailable drafts.
The optional friends-auth cutover uses the shared exact-`1` predicate and a lazy
server verifier. Only validated session ID/subject/app UUID reach atomic AI
admission; its SQL rechecks expiry, active mapping, verified email and valid team
in the budget mutation. Failed provider verification has no legacy fallback.
The app UUID remains the budget key, preserving counters through cutover; the
legacy default and client request/result contracts remain unchanged.
`loadAiPublicationContext`/`loadAiLineupPreview` prepare the next verified Sleeper
leg, using fresh source-state checks before/after paid generation. Preview bounds
may be null where no calendar is verified; captured source and generated result
timestamps stay distinct. `POST /api/ai-decides/weekly` accepts only an empty
same-origin manager request; the protected daily GET uses CRON_SECRET and one
configured stable app UUID with atomic membership checks. It never borrows a
browser session, resets counters or automatically retries a sealed incomplete
attempt. Cache lookup precedes stats/provider work. Scheduler settings and first
live publication remain root-owned handoff steps, outside this source change.
The separately reviewed `week1-refresh.ts` path permits one explicit preseason
2026/week1 replacement only when `GOAT_AI_WEEK1_REFRESH_ENABLED=1`. Its fixed
original hash is checked before a new immutable `:refresh:1` row is claimed;
only the INSERT winner may call the existing paid evaluator. The original input,
manifest, result and outcomes stay untouched. Auth, control and original-hash
conditions are rechecked atomically at claim/completion; only a validated complete
five-pair result replaces public reads. Timeout, refusal, denial or failed
completion leaves the original public and the sealed attempt unretryable.
The rerun route alone sets `fetchCache="force-no-store"`, overriding the normal
source helpers' positive revalidation intervals. Installed Next fetch tests
verify upstream reads without persistent cache reuse; retrieval time still does
not claim a verified upstream update time. A complete public replacement reads
one selected snapshot, retaining the original-hash check within SQL.
Removing the flag restores original reads without deleting either record.
It adds no migration, counter reset or cron behavior. This source is dormant
until separate review/release/setting clearance and a genuine manager action.
See [AI Decides handoff](docs/ai-decides.md) for limits, retention, exact contracts,
auth findings and outstanding activation/verification work.

`src/surfaces/ai-decides/AiDecides.tsx` owns the editable frontend and its native
team dialog. The thin `/ai-decides` page loads cached AI data, slim team identities
and current-user status in parallel. Only a manual authenticated run can POST to
the app route; injected transports keep fixtures offline. Editing, Reset and
unmount abort/ignore stale responses. All returned probabilities remain unchanged,
with confidence and factual evidence separate. Shared semantic tokens and the
shell-owned theme apply; there is no page-local theme provider or credential.
`AiDecidesHomeEntry` in `AiWeekly.tsx` remains an available public saved-pick preview.
The homepage owns its integrated matchup sidebar and consumes the `AiWeeklySlate`
domain contract directly, without importing AI surface internals; reads never generate picks.
Matchup/weekly choices remain roster IDs. Explicit request/slate context adds
current display names with visible IDs; numeric custom options stay literal, and
request IDs constrain response validation. Frozen evidence is never rewritten.
The scoped picker history listener survives closure, restores Forward entries and
selection/trigger context, coalesces stale entries and preserves Next state.
Route/unmount cleanup never restores an old URL over a new route. A failed page
session lookup renders a distinct auth-unavailable editor/cache view with runs
disabled; server authorization and shared auth remain untouched.

## Environment

- `SLEEPER_LEAGUE_ID` — overrides the default league (GOAT Hoopers
  `1387473752807190528`). Only needed for local experiments against another
  league.
- `POSTGRES_URL` (and friends) — wired automatically when a Vercel Postgres
  database is connected to the project. Absence means "not provisioned":
  account/competition pages render `ProvisionNotice` instead of crashing.
  The public Arcade catalogue and free-throw practice do not require it.
- `COMMISSIONER_KEY` — secret shared only with Aidan. Every admin action
  checks it server-side. If unset, admin actions fail closed.

## Database provisioning (one-time)

Serverless needs real Postgres — no SQLite. Do this once:

1. Vercel dashboard → Storage → Create Database → Postgres.
2. Connect it to the `goat-hoopers-site` project (this injects
   `POSTGRES_URL` etc. into the environment automatically).
3. From this repo, with the env vars available locally:
   `npx drizzle-kit push`
4. Done. Tables: `site_users`, `invite_codes`, `sessions`,
   `game_scores`, `rewards` (see `src/data/db.ts`).

Until step 2 is done, account/competition pages render the provisioning
notice. The public `/arcade` catalogue and `/arcade/free-throw` practice
remain accessible without a database. Preview deployment must never crash
on a missing database.

## Accounts (how the auth works)

Working provider source: [friends auth runtime and operator setup](docs/friends-auth-runtime.md).
`src/data/friends-auth/` owns pinned Better Auth, its transactional PostgreSQL
adapter, email delivery, verified account reads and team linking. Domain parsers
validate exact request fields; `AccountForm` uses shared account primitives.

`surfaces/accounts/AccountSettings` presents the verified account name,
existing membership state and optional claim-form slot. Its bounded settings
rows and account-help navigation use shared controls; password changes remain
on their protected route. The My Team surface contains its existing flag-gated
settings action inside the identity card. No account lookup, new data load,
theme state or mutation is introduced by this presentation.

An individual email account exists independently of a league team. `/signup`
creates provider credentials with a normalized personal username, without a code,
`site_users` row or membership link. `auth_user.id` is the individual account
principal; `auth_user.name` is the non-email username. An additive case-insensitive
unique index prevents two accounts taking the same username. The mounted provider
signup endpoint stays disabled; the bounded same-origin registration endpoint is
the only public account creation path.

After verifying email and signing in, `/account` optionally claims an unused team
code. The ownership transaction rechecks the exact verified provider session,
locks the invitation, inserts membership/link and consumes the code together.
The existing unique `site_users.team_id` constraint permits one owner, including
races using different codes. Used codes and inactive links cannot replace owners.
Existing team owners instead confirm their old password at `/login?legacy=1`;
a fresh five-minute legacy proof links their original app UUID without a code.

`getVerifiedAccount(headers)` authorizes individual account lifecycle and the
separately owned personal-game feature without requiring a team. Games own their
account-keyed persistence and League/Everyone filter; team claiming must not
transfer personal scores. `getCurrentUser()` and `getProviderIdentity(headers)`
retain linked `SiteUser` UUID semantics for team and paid AI access. The AI owner
rechecks exact provider session/link/verified-email/valid-team atomically; its
budget keys remain the original `site_users.id`.

Account login, change/reset password and verification are available with either
account flag enabled. Recovery by email works for unclaimed accounts; team recovery
resolves the active verified linked recipient only on the server, returning a
generic response. Reset revokes provider sessions; cookies are remembered for
90 days, httpOnly, SameSite=Lax and secure on HTTPS. Cookie caching is disabled.
`FRIENDS_AUTH_ENABLED=1` chooses full provider app auth with no legacy fallback;
`FRIENDS_AUTH_ENROLLMENT=1` opens account lifecycle/setup while legacy app auth
remains active. New team claims require the full flag. Source changes do not
configure either flag, migrate live data or deploy.

The original legacy claim/team-password runtime remains when both flags are
unset. Original UUIDs, hashes, sessions, scores, rewards and AI counters remain
preserved. The account repair does not issue rewards or FAAB. See the focused
[account access repair contract](docs/account-access-repair.md) for its migration
and validation boundaries.

## Rewards (the FAAB ledger)

The site is the source of truth for *who earned what*: each game's weekly
winner earns 10 FAAB (`WEEKLY_FAAB_PRIZE`), recorded in the `rewards`
table as pending. Settlement stays human — the Sleeper API exposes no
FAAB adjustment endpoint, so Aidan applies rewards as commissioner and
marks them settled. The ledger shows pending vs settled per user.

## Adding a new surface (checklist)

1. Define any new domain types in `src/domain/` first.
2. Add a loader in `src/data/league.ts` (or extend an existing one) that
   returns those domain objects.
3. Create `src/surfaces/<name>/` with an entry component documented like
   `SeasonHub.tsx`.
4. Build it from `@/ui` primitives and `--gh-*` tokens.
5. Compose it explicitly in a page under `src/app/`.
6. Open a PR — it gets a preview deployment automatically.

## Adding a new game (checklist)

1. Declare it in `src/domain/arcade/games.ts` (`status: "coming-soon"`).
   Planned competitions remain registered but are hidden from the public
   hub. Add `play` metadata only after the route is implemented, including
   an actual preview and accurate phone controls. Competition `status`
   stays independent of public practice availability.
2. If the game needs new persistence, add a method to the `GameStore`
   contract in `src/data/arcade.ts` first, then implement it in
   `DrizzleGameStore` (and `FakeGameStore`). Never import `./db` anywhere
   else.
3. Build the play experience as components in `src/surfaces/arcade/`,
   receiving domain objects + the results of store calls as props.
4. Local practice keeps scores in memory. Implemented league competition
   scores go through `store.createScore()`; weekly winners earn a
   `store.createReward()` of `WEEKLY_FAAB_PRIZE` FAAB.
5. Ship mobile + desktop layouts (project rule 7), then open a PR.


## Week 2 roster draft design preview

`/arcade/week-2-preview` is a noindex preview route, now discoverable on the public
Arcade through a separate `week-2-preview` registry entry. Its explicit preview
mode stays independent of competition status; the planned season-prediction
ballot remains closed. The hub presents two compact game cards and direct launch
shortcuts, with controls in native disclosures on narrow screens. Preview artwork
is typographic and labelled; the free-throw card retains its actual screenshot.
Neither discovery path reads an account or game store. The page composes the
client adapter `DraftPreview` with the injected public
`surfaces/arcade/week-two/WeekTwoDraft` entrypoint. `domain/arcade/roster-draft.ts`
owns the browser-local five-pick state machine, distinct team draw and duplicate
player guard. This preview format is not an adopted competition rule. It has no
score, account persistence, season forecast or prize entry. Week 2 competition
stays closed.

`domain/arcade/nba-rosters.ts` owns slim NBA identities, source observations and
the roster client contract. The read-only `/api/arcade/nba/teams` and selected
`/api/arcade/nba/teams/[teamId]/roster` routes delegate to `data/nba-rosters.ts`.
The directory loads on entering the demo; a roster loads only after its team is
drawn. The loader uses ESPN's current public NBA feed with bounded time/bytes,
strict complete-list decoding and a daily cache of only the slim projection.
All source-listed athletes are retained, including inactive statuses. Source
season, retrieval/provider dates and stale observations remain visible; there
is no guarantee that every recent transaction is already reflected. Failure
preserves the drawn team for retry. The old static `week-two-demo.ts` pool is
historical review content and is not used by the public route.

The surface reuses shared typography, `Badge` and scoped draft material tokens.
The finite team-selection animation has Skip, keyboard access and a live
reduced-motion/hidden-tab finish. Source portraits are lazy within the selected
roster, with initials fallback. The optional lazy poster module renders a
user-requested 1080×1350 PNG on-device and tolerates unavailable/CORS-blocked
portraits. No upload or auth/score/reward endpoint is called. Existing root layout
behavior is unchanged. The offline Vite fixture in `qa/week-two` injects explicit
synthetic full rosters and omits root data/auth loaders; it does not establish
live data, Next routing, deployment or physical-phone behavior. Source verification
is recorded separately in `qa/week-two/roster-source-verification.json`.

`domain/arcade/weekly-leaderboard.ts` defines a display-only weekly board
projection. `surfaces/arcade/WeeklyLeaderboard` receives validated rows, weekly
period/timezone and controlled scope/retry callbacks; it performs no I/O. The top
three, current-user marker, makes/attempts, accuracy and best streak come only
from returned rows. Closed/loading/error/empty states never substitute scores
or dates. The public `/arcade/leaderboard` route uses only its closed state and
imports no ranked runtime/client or database. The Arcade links to this status
page. Live ranked integration remains on the separate, unpublished foundation
branch; the public frontend does not activate ranking or claim live entrants.

## Free-throw practice prototype

`/arcade/free-throw` explicitly composes `FreeThrowPractice` from
`src/surfaces/arcade/free-throw/` before any arcade store lookup. It is
local practice, labelled as a prototype: scores live only in memory and
never call server actions, the GameStore, rewards or a leaderboard. The
registry remains coming-soon for league competition. The public hub filters
`getPlayableGames()` independently of account/store
reads, with a scoped off-white `gh-arcade-canvas`, dark text, actual screenshot
and direct Play link. The root layout's existing account/league chrome is
unchanged. Back/help remain above loading/error overlays and their UI
targets do not initiate court drag gestures.

The domain contract `src/domain/arcade/free-throw.ts` describes metre-space
court colliders, aim and transient ball state. `physics.ts` is pure and
uses 240 Hz fixed substeps, sphere-versus-torus rim contact, a backboard
box and floor. A make is latched once per shot on a descending rim-plane
crossing with full-ball clearance, before floor contact. Frames discard
excess wall time; shots finish within six simulated seconds.

`src/three/FreeThrowScene.ts` is a lazily loaded, asynchronous visual
adapter. It loads the verified GLBs under `public/3d/free-throw/`, keeps
authored PBR maps, transparency and metre scale, and uses a generated
lighting environment. The supplied `ASSET_MANIFEST.json` is imported by
the domain contract to define collider dimensions and the court offset.
The near hoop stays at local origin; the court moves +12.7248 m on Z,
putting the release on its near free-throw line. No collisions are inferred
from render triangles. Asset loading failure and WebGL/context loss offer
a readable retry fallback; textures, geometry, environment and observers
are disposed. Player-character animation and league competition are later work.

The private environment now consumes the derived, approved outdoor Blender art
under `public/3d/free-throw/environment/`: all 416 placements, shared near/far
crowd geometry, batched architecture, vertex AO/source surfaces and a baked sky.
Only completed-result cues blend the source poses per cohort; ordinary GPU
instancing renders them. Sky/reflection resolution, culling and resource cleanup
are independent of physics and scoring. The optional scenery can fail while the
original court becomes playable without awaiting it. Optional loading has a
deadline; effect cancellation frees the renderer during creation and disposes
late results. Native visibility gates frame/reflection submissions while the
existing simulation/reset bookkeeping continues. See `docs/free-throw-blender-integration.md` for
provenance, export commands, measured browser limits and exact-head review gates.

The presentation is one viewport with an overlaid score HUD, world-space
aim reticle/trajectory and bottom aim/power meter. Reset and help are small
in-court buttons. Native labelled sliders live only in the optional help
panel's closed Fine controls section. The default view has no form panel.
Left/right or A/D aim; Space hold/release or the compact touch button
charges power. Court mouse/touch drag also releases a shot. Power clamps
at 100% after 1.6 seconds; repeat keydown cannot restart a hold. Blur,
hidden tabs, pointer cancellation and reset cancel pending input. The
court and charge button suppress touch long-press selection menus.
Pointer cancellation restores the prior aim without releasing a shot.
After settling, a shot shows a brief result and automatically prepares
the next ball at a new shooting spot. `positions.ts` selects one of nine
bounded, reachable spots with injected randomness and excludes the previous
spot. The fixed origin is carried by `PracticeBall`; camera/guide framing
uses that origin without reloading any asset. Center aim faces the rim.
All spots keep the same launch-speed calibration, so distance changes the
required release power rather than granting a hidden assist. Reset/retry
also selects a fresh spot; the first attempt starts at the free-throw line. Reset/unmount clear the pending retry timer. A resize
observer and viewport HUD layouts support portrait, short phones and
landscape. Reduced motion resolves shots to a still result. No render
loop runs on an idle court.

The collider configuration follows the supplied Blender
manifest: scoring plane 3.048 m, rim centerline 3.038 m, rim major radius
0.2386 m, tube radius 0.01 m, and ball radius 0.12 m. The clear opening
radius is 0.2286 m. The 50% shot is calibrated to this practice setup.

Run `npm run test:free-throw` for deterministic physics, charge and shipped
asset map/bounds/anchor checks. See `docs/free-throw-practice-qa.md` for the
browser evidence and local server handoff.

The personal edition's full valuation uses the shared pure
`domain/roster-value.ts` helper: unique roster IDs, integer-cent totals, unknown
quote rows and explicit partial coverage. Value ranks compare only completely
priced current rosters, with shared ranks for equal totals. No historical team
valuation is synthesized. The same helper is available to the separately owned
My Team value follow-up without changing its source files here.

`domain/team-player-guide.ts` separates weekly observed results, verified
current-season EMA form and preseason market movement. `getHomePlayerGuideSources`
is an additive public projection of the existing same-request market inputs;
it performs no new fetch/query/save. Unsupported weekly participation, schedule
and EMA-season provenance remain null. `season-hub/TeamPlayerGuide` renders the
honest source states and accepts no client-selected owner or invented result.
The recorded-week adapter is separately scoped to Muse in #190; see
`docs/weekly-player-guide.md` for the exact data and integration boundary.

## Priced In practice

`/arcade/priced-in` is a registered practice game (registry status stays
coming-soon for league competition). The `[gameId]` page composes
`surfaces/arcade/priced-in/PricedIn` before any arcade store lookup, like
free-throw. Five rounds deal server-side in the page request from
`getStockMarketData` — the same React `cache()` entry the root-layout
ticker already computed for that request; there is no route-handler or
client market fetch, and no new polling.

`domain/arcade/priced-in.ts` owns the pure game: an arcade-owned candidate
shape (the page adapts slim `StockQuote`s into it — the arcade context
never imports league types), sampling with injected randomness (headshot
players deal first, no repeats, a $5 price floor), line-setting 4–15% off
the real modeled FAAB value, and scoring (correct side 100 plus a
closeness bonus of up to 50, anchored at the dealer's minimum $2 line
offset so the best game of 750 is reachable from real deals). Game state
is a pure state machine in the same module (`PricedInGameState`): every
result is tied to one complete deal identity (each round's player, price
and line), Play again locks input while the re-deal refresh is in
flight, and the delivery that answers the re-deal replaces the game
atomically — the state records every delivery it consumes (a delivery
that leaves the game standing still advances the record, so the
pending baseline is always the delivery on screen when Play again
was pressed), and a refresh that redealt identical content still
completes the request
(the page keys the surface by deal identity, which an identical
redeal leaves unchanged). The
surface prints the scoring rule, labels the market's `pricingBasis`
while prices are preseason-modeled, and renders an explicit unavailable
state when the market cannot deal a full game — it never invents prices.

Practice only: scores live in session memory and never touch server
actions, the GameStore or rewards, so no client-computed score is
recorded as a leaderboard truth. The reveal shows the quote's change vs
the last snapshot; the slim quote carries no factor breakdown, so none
is shown (per-player detail loads stay on the stocks surface, rule 14).
