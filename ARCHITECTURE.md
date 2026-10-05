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
                 # Transaction, Season, DraftPick. Types + tiny helpers only.
  data/          # The ONLY place Sleeper is touched.
    sleeper.ts   # Raw API client. Returns raw JSON, nothing else.
    transform.ts # Raw JSON -> domain objects. The membrane.
    league.ts    # High-level loaders pages/surfaces call (getSeasonHubData).
  surfaces/      # Bounded experiences. One folder per surface.
    season-hub/  # "What's happening in the league": hero, standings,
                 # draft board, activity feed. Receives domain objects,
                 # never fetches.
  ui/            # Design tokens (tokens.css) + primitives (Card, Badge,
                 # SectionHeading, TeamAvatar). Every surface uses these.
  app/           # Pages. Thin: load via src/data, hand to surfaces.
ARCHITECTURE.md  # This file.
CONTRIBUTING.md  # PR workflow, conventions.
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
- A surface answers ONE question ("what's happening in the league?",
  "how did the draft go?"). Standings + matchups + activity live together in
  `season-hub` because they're the same question — not because they're
  convenient to group.
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

## Caching strategy

- League data (rosters, users, league meta): `revalidate = 300` (5 min).
- Draft picks: immutable; cached 1 hour.
- Player directory (~3MB, too big for Next's data cache): fetched with
  `no-store` and ONLY when name resolution actually needs it (a pick missing
  embedded metadata, or non-empty transactions).

## Environment

- `SLEEPER_LEAGUE_ID` — overrides the default league (GOAT Hoopers
  `1387473752807190528`). Only needed for local experiments against another
  league.

## Adding a new surface (checklist)

1. Define any new domain types in `src/domain/` first.
2. Add a loader in `src/data/league.ts` (or extend an existing one) that
   returns those domain objects.
3. Create `src/surfaces/<name>/` with an entry component documented like
   `SeasonHub.tsx`.
4. Build it from `@/ui` primitives and `--gh-*` tokens.
5. Compose it explicitly in a page under `src/app/`.
6. Open a PR — it gets a preview deployment automatically.
