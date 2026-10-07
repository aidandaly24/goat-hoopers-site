# ARCHITECTURE.md — how this repo works

Read this before writing any code. It maps the whole repo: where things live,
how data flows, and the contracts every contribution must follow.

## The one-paragraph version

Sleeper API data enters through exactly one door (`src/data/`), gets shaped
into domain objects (`src/domain/`), and is rendered by surfaces
(`src/surfaces/`) — coherent, bounded experiences composed explicitly by pages
(`src/app/`). Shared visuals live in `src/ui/`. Nothing else exists.

## Directory map

```
src/
  domain/        # The shared language: Team, Standing, Matchup, Player,
                 # Transaction, DraftPick, Season, LeagueStats, PlayerDetail,
                 # TeamProfile, PowerRanking, PlayoffOdds, RecordBook,
                 # MatchupPreview, PlayerMove, PlayerStock/StockMarket.
                 # Types + tiny helpers only. formatSeasonStatus(Season.status)
                 # renders the human status ("pre_season" -> "Preseason").
    arcade/      # The SECOND bounded context: SiteUser, InviteCode,
                 # GameSession, Game, GameScore, LeaderboardEntry,
                 # GameHubSummary, Reward, plus the game registry
                 # (games.ts). Game carries an optional launchNote so
                 # coming-soon games say why/when instead of "coming soon".
                 # Never imports league
                 # types — teams are referenced by Sleeper roster id only.
  data/          # The ONLY place the outside world is touched.
    sleeper.ts   # Raw API client. Returns raw JSON, nothing else.
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
                 # getDefendingChampion (champion roster id from the
                 # playoff winners bracket; null until someone wins —
                 # feeds TeamAvatar's isChampion).
    db.ts        # SECOND DOOR: Vercel Postgres via Drizzle. Schema +
                 # lazy client. Nothing else imports drizzle or SQL.
    arcade.ts    # GameStore contract + DrizzleGameStore + FakeGameStore
                 # + getGameStore() factory + getArcadeHubData() loader
                 # (registry + weekly leaders + viewer's best, store
                 # passed as a parameter). Dependency inversion lives here.
  three/         # Interactive 3D viewers (client components). GLBViewer
                 # (GLTFLoader + AnimationMixer, idle loop, click one-shots),
                 # HooperViewer (team figurine by roster id), PropViewer
                 # (basketball/trophy/crown/hoop). Assets in public/3d/,
                 # built by the Blender pipeline in 3d/ (see 3d/README.md).
  public/3d/     # Static GLB assets (hooper-1..10, hooper-generic,
                 # basketball, trophy, crown, hoop) with named animation
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
                 # stock market, styled as a Bloomberg terminal (a deliberate
                 # dark island via the --gh-term-* tokens). StockTicker
                 # (site-wide marquee, rendered by the root layout),
                 # StockMarket (top gainers / decliners, panic meter, full
                 # board), StockBoard (client-side position + rookie filter
                 # chips), StockRow (Yahoo Finance-style quote row with
                 # expandable factor breakdown), PanicMeter. Receives domain
                 # objects, never fetches.
    arcade/      # "Play games, win FAAB": ArcadeHub (game list),
                 # GameDetail (rules + leaderboard + rewards),
                 # Leaderboard, RewardLedger, GameCard, ProvisionNotice.
                 # Receives domain objects, never touches the store.
                 # GameCard renders a GameHubSummary: stakes, weekly
                 # leader, and the viewer's "your move" state.
    team/        # "My Team": identity + record, full roster, FAAB
                 # winnings. Rendered by /team for the logged-in manager.
  ui/            # Design tokens (tokens.css) + primitives (Card, Badge,
                 # SectionHeading, TeamAvatar, PositionPill,
                 # PlayerHeadshot, PlayerRow, TransactionSummary,
                 # ChampionCrown, SiteHeader, SiteFooter, MobileNav,
                 # SectionNav) + teamColors.ts (roster id -> --gh-team-N).
                 # Every surface uses these.
                 # ChampionCrown is the defending champion's crown: a crisp
                 # inline SVG in site gold, tilted a few degrees and nudged
                 # off-center so it reads hand-placed. It's a real button —
                 # click/Enter/Space fires a 360° overshoot-and-settle spin
                 # (off under prefers-reduced-motion). TeamAvatar takes
                 # isChampion and perches the crown; surfaces opt in with
                 # the id from getDefendingChampion(). No crown renders
                 # until the league has a champion.
                 # PlayerRow is the linked player identity (headshot +
                 # name -> /player/[sleeperId] + position pill + NBA team);
                 # every player name site-wide renders through it.
                 # TransactionSummary renders one transaction as a sentence
                 # with player names -> player pages and the acting team ->
                 # its team page, built from structured adds/drops.
                 # SiteHeader is the site-wide chrome (wordmark, Home/Arcade
                 # nav, account state). Nav rule: logged in, the manager's
                 # display name with a team-colored avatar ring is the
                 # single entry point to /team and "My Team" disappears;
                 # logged out, "My Team" stays as the login nudge.
                 # MobileNav is the bottom tab bar (Home / Arcade / Team)
                 # shown at <=40rem; the header nav hides there.
                 # SiteFooter is the site-wide footer (league, season,
                 # links, unaffiliated-with-NBA/Sleeper line). All three
                 # take state as props (dependency inversion); the root
                 # layout provides the user and the season.
                 # PositionPill colors PG/SG/SF/PF/C via --gh-pos-* tokens.
                 # PlayerHeadshot renders the Sleeper CDN headshot with an
                 # initials-in-team-colored-disc fallback (client component
                 # for the onError switch).
                 # SectionNav is the secondary tab row for the league pages
                 # (Transactions / Draft Board / Teams / Intel); pages provide the
                 # active tab.
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
                 # FAAB winnings). Redirects to /login when logged out.
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
(same dependency-inversion seam as stats): it blends real league signals
(ownership share, FAAB spent on waiver bids, trade count, add/drop
velocity, rookie-draft capital) with fundamentals (age curve, injury
status). "Production" is market-implied — Sleeper's public API has no
per-player stat feed, and the code says so; "contract" always resolves
neutral because Sleeper tracks no contracts and the engine won't invent
them.

Price history comes from the `stock_snapshots` table (`src/data/stocks.ts`
owns the store contract). Change %, the trending/falling sections, and
sparklines all derive from snapshots. When the database isn't provisioned
the store is a no-op: prices still compute live, movers show their honest
"no history yet" states, and nothing crashes. Snapshots older than 30 days
are pruned on write.

The `StockTicker` marquee renders in the root layout above every page
(pure CSS animation, pauses on hover, off under
`prefers-reduced-motion`); the full market lives at `/stocks`.

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
- A surface receives domain objects as props. It never fetches.
- A surface never imports another surface’s components. Shared visuals come
  from `src/ui/`.
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
- Player directory (~3MB, too big for Next's data cache): fetched with
  `no-store` and ONLY when name resolution actually needs it (non-empty
  transactions).

## Environment

- `SLEEPER_LEAGUE_ID` — overrides the default league (GOAT Hoopers
  `1387473752807190528`). Only needed for local experiments against another
  league.
- `POSTGRES_URL` (and friends) — wired automatically when a Vercel Postgres
  database is connected to the project. Absence means "not provisioned":
  arcade pages render `ProvisionNotice` instead of crashing.
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

Until step 2 is done, the arcade builds and deploys fine but every
arcade page renders the provisioning notice. That's intentional — the
preview deployment must never crash on a missing database.

## Accounts (how the auth works)

- **Claim:** Aidan generates one single-use invite code per Sleeper team
  at `/admin/invites` and distributes each privately. A manager enters the
  code at `/claim`, picks a display name, sets a password. The code is
  consumed, the account is created, and they're logged in. Codes are plain
  strings on purpose — device-free, so claiming on a phone and playing on
  a laptop just works.
- **Login:** `/login` — team + password, bcrypt-compared server-side.
- **Sessions:** 90-day httpOnly cookies, SHA-256-hashed tokens in the DB.
- **Friends-grade security:** invite codes close the impersonation hole
  (randoms can't claim teams). This is not bank-grade auth and doesn't
  need to be — it's ten friends playing for FAAB.

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
   The arcade list and detail page render from the registry — no other
   wiring needed for the shell.
2. If the game needs new persistence, add a method to the `GameStore`
   contract in `src/data/arcade.ts` first, then implement it in
   `DrizzleGameStore` (and `FakeGameStore`). Never import `./db` anywhere
   else.
3. Build the play experience as components in `src/surfaces/arcade/`,
   receiving domain objects + the results of store calls as props.
4. Scores go through `store.createScore()`; weekly winners earn a
   `store.createReward()` of `WEEKLY_FAAB_PRIZE` FAAB.
5. Ship mobile + desktop layouts (project rule 7), then open a PR.
