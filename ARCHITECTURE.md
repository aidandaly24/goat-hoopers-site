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
                 # Transaction, Season, LeagueStats. Types + tiny helpers only.
    arcade/      # The SECOND bounded context: SiteUser, InviteCode,
                 # GameSession, Game, GameScore, LeaderboardEntry, Reward,
                 # plus the game registry (games.ts). Never imports league
                 # types — teams are referenced by Sleeper roster id only.
  data/          # The ONLY place the outside world is touched.
    sleeper.ts   # Raw API client. Returns raw JSON, nothing else.
    transform.ts # Raw JSON -> domain objects. The membrane.
    league.ts    # High-level loaders pages/surfaces call (getSeasonHubData).
    db.ts        # SECOND DOOR: Vercel Postgres via Drizzle. Schema +
                 # lazy client. Nothing else imports drizzle or SQL.
    arcade.ts    # GameStore contract + DrizzleGameStore + FakeGameStore
                 # + getGameStore() factory. Dependency inversion lives here.
  surfaces/      # Bounded experiences. One folder per surface.
    season-hub/  # "What's happening in the league": hero, standings,
                 # stats strip, activity feed. Receives domain objects,
                 # never fetches.
    arcade/      # "Play games, win FAAB": ArcadeHub (game list),
                 # GameDetail (rules + leaderboard + rewards),
                 # Leaderboard, RewardLedger, GameCard, ProvisionNotice.
                 # Receives domain objects, never touches the store.
  ui/            # Design tokens (tokens.css) + primitives (Card, Badge,
                 # SectionHeading, TeamAvatar). Every surface uses these.
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
- Primitives (`Card`, `Badge`, `SectionHeading`, `TeamAvatar`) are the default
  building blocks. Reach for raw HTML/CSS only when a primitive genuinely
  doesn’t fit.

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
