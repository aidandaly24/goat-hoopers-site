# GOAT Hoopers design direction

**Current design authority · October 8, 2026 · exact palette pending review.**

GOAT Hoopers is the weekly bulletin and working reference for ten friends in a
fantasy basketball league. It should feel like our gym, our matchups and our
group chat. Off-white gives the content room; the arena, real pennants, selected
logo, people and meaningful data supply the personality.

Read this alongside [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
This document supersedes conflicting *visual recommendations* in
[REDESIGN-INSPO.md](REDESIGN-INSPO.md), the dark-broadcast comments in
`src/ui/tokens.css`, and the green material direction in
[courtside-preview/DESIGN.md](courtside-preview/DESIGN.md). Those files remain
useful history; their dark-first, gold-everywhere, colored-pill-everywhere,
oversized-award-card and avatar-ring-everywhere prescriptions are no longer
requirements. Their useful rules about real data, mobile access, aligned
numbers, clear navigation and clickable identities still apply. Architectural
and security contracts remain authoritative. This document does not silently
change runtime tokens or approve a production-wide recolor.

## Decisions and review status

| Status | Direction |
| --- | --- |
| Confirmed by Aidan | Off-white main canvas with restrained touches of color; more neutral than the current broad green background. |
| Confirmed | A friends' league, with specific character; avoid generic AI/SaaS layouts, repetitive decorative cards, excessive horizontal/vertical bars and oversized player features. |
| Confirmed | Game of the Week first; weekly good/bad/watch-next-week editorial, league happenings, clickable teams with useful data, and retained weekly archives. |
| Confirmed | Preserve the meaningful arena/court, selected GOAT logo and reusable embroidered pennants. Generate the featured weekly banners; do not generate a banner for every team name. |
| Confirmed | Preserve the approved stocks composition and useful dense data. Keep working search, filters, sorting, inspection and price provenance. |
| Confirmed, newest usability rule | Arcade discovery shows actual playable games, a real preview of free-throw practice and clear Play navigation. Hide nonfunctional/fake catalog entries. Verify the whole path to play, not just an HTTP 200. Arcade improvements need not wait for the broad migration. |
| Confirmed concern; resolution owned separately | Arbitrary figurines are unwelcome. Another task identifies their purpose and fixes homepage sorting. This documentation/prototype change neither removes models nor changes their logic. |
| Proposed for user/panel selection | Exact neutral hex values, accent choice, type sizes, section density, radii, performance ceilings and semantic-token migration below. |

The neutral comparisons live at
[design-previews/neutral-courtside/index.html](design-previews/neutral-courtside/index.html).
Switch color at the same scroll position and width. All three use the current
Courtside component tree, identical fixture content, arena crop, portraits and
pennants. They are palette experiments, not redesigned page compositions.
The black horizontal logo is an unchanged approved variant for light surfaces.
The existing primary clay master remains the selected logo; no logo redesign is
proposed. See the [review README](design-previews/neutral-courtside/README.md)
for provenance, reproduction and verification limits.

## What each view should accomplish

1. **Orient:** show league identity, current location and an obvious route back.
2. **Tell this week's story:** on home, put Game of the Week before secondary
   stories, evergreen tools and identity collections.
3. **Help the next decision:** show the opponent, useful record, roster,
   transaction, player price or playable game close to its action.
4. **Let people go deeper:** names link to public profiles; full rosters, price
   details, source notes and archives are accessible without an overwhelming
   initial view.

Missing editorial must never hide the live directory, standings or league
tools. Failed live data must never masquerade as a result. Distinguish sample,
published, historical, upcoming, current and unavailable states. A preseason
pairing with null scores says Upcoming; an old 2025 record says 2025 and keeps
its previous-manager qualification. A modeled price is not a real transaction.

## Composition and components

Home keeps this reading order: **Game of the Week → three editorial picks →
around the league → compact team directory/useful standings → archive.**
Keep working access to standings, stocks, trades, intel and drafts visible in
navigation or clear section links; an editorial page must not bury every league
task in closed disclosures.

- Use one headline and one short context paragraph per page. Subsections need
  a heading only when they answer a different question. Avoid page title,
  eyebrow, card title and metric strip repeating the same message.
- One lead pick and two subordinate picks is a useful editorial rhythm. A
  portrait supports a name, take and relevant stats; it does not buy an entire
  viewport. On phones, keep all three short takes and their labeled periods
  easy to reach. Compact portrait sizes need a separate layout review; the
  palette comparison deliberately leaves current dimensions unchanged.
- Team directories use compact rows with team/manager, record and season,
  opponent/status and roster count. Expansion retains every player reference;
  a profile link is distinct from a disclosure action. Long names wrap.
- Prefer an open editorial section or ordered list to a card for each sentence.
  Use `Card` for a real independent object/workspace, such as a quote inspector
  or form. Do not nest a whole page inside a card, then card every subsection.
- Separate ideas mainly with spacing and type. A quiet rule can aid row
  tracking or a genuine section change. Do not draw a grid around every stat,
  surround a team with accent bars, or repeat header strips between paragraphs.
  Probability bars and chart axes are useful when they actually encode data.
- Keep real basketball materials specific: arena as a scene, pennants as
  fabric, logo as a mark. No gradient blobs, stock mascots, generic 3D people,
  fake product screenshots, ornamental dashboards or invented team honors.
- Reuse `src/ui/` primitives. Improve a shared primitive when several surfaces
  need the same behavior; do not import another surface's private modules or
  build a new design framework. Pages still load domain data and compose
  explicit surfaces.

## Typography and spacing

The working family is **Inter**, already loaded in `src/app/layout.tsx`.
**Geist Mono** with `.gh-num` stays on scores, records, ranks, timestamps and
FAAB values. Use aligned decimals and units consistently. Names and prose use
the working family. The selected logo carries its own lettering unchanged.

Proposed scale: body 16–18px/1.5–1.65; useful secondary text 14px/1.45; captions
12–13px only for nonessential provenance; section titles 24–32px; ordinary page
titles 32–48px. Home's headline may reach 60px on wide screens. Do not shrink
essential row data or mobile controls into 9–11px terminal labels. Inter
headings use sentence case, 650–750 weight and restrained tracking. Existing
Anton can remain for the approved Stocks masthead or a short basketball score
display; avoid imposing uppercase condensed type on every route and sentence.
These sizes are a proposal to check with actual long names and 200% text zoom.

Use the existing 4/8/12/16/24/32/48/64px spacing scale, exposed through shared
tokens. Suggested relationships: 8–12px within an identity, 16–24px between
related items, 32–48px between distinct sections. Main editorial measure is
60–72 characters; page width approximately 78rem, dense stocks approximately
90rem where its data needs it. Gutters start at 16px on phones and increase
with the viewport. Proposed corners are 4–8px for objects and controls; reserve
fully rounded shapes for avatars or meaningful pills. One-pixel decorative
rules should stay quiet. Shadows describe a dialog or real object, not every
row. Do not create large vertical blanks to make a short player take look
important.

## Neutral palette proposals

Color belongs to a team, a material, an action or a state. The neutral canvas
occupies most of the page; it is not another full green treatment. Green can
remain a small court reference or a labeled positive result.

| Proposed token role | Chalk + clay | Paper + slate | Linen + burgundy |
| --- | --- | --- | --- |
| Canvas | `#F6F3EB` | `#F5F4EF` | `#F5F1E8` |
| Raised/readable surface | `#FFFDF7` | `#FFFFFF` | `#FFFCF6` |
| Main ink | `#242824` | `#242D35` | `#2C2928` |
| Secondary ink | `#63675F` | `#5F6870` | `#6A625C` |
| Action/editorial accent | `#A54429` clay | `#345B77` slate | `#843F46` burgundy |
| Decorative divider | `#D9D6CC` | `#D7DADE` | `#DBD4CA` |
| Control boundary | `#898D83` | `#7B858E` | `#91857B` |
| Focus on light | `#245A4B` | `#345B77` | `#843F46` |

Chalk + clay is the proposed starting point because the approved clay logo and
warm court already support it. Paper + slate is a cooler alternative. Linen +
burgundy is warmer; review it beside actual basketball imagery to ensure the
site still reads as a league rather than a café. Asset and permanent team
colors stay unchanged across comparisons. These are unselected review tokens.

Proposed semantic states on light surfaces: positive `#245A4B`, negative
`#A13E3E`, live/action-needed `#A54429`, championship `#795C1C`, neutral
secondary ink. Pair each with text/icon/shape: W/L, +/−, Live, Champion. Never
apply team colors as essential small text without checking contrast. Pale
dividers are not adequate control boundaries or focus indicators. A white
label on an accent-filled button needs its own contrast check.

### One semantic system, with bounded exceptions

Today global `tokens.css` is navy/gold, `courtside-tokens.css` is green/mineral,
and `body:has([data-courtside-home])` switches shared chrome. The current
**StockMarket** uses ordinary `--gh-*` tokens and the approved navy/gold board.
**TradeAnalyzer**, not the current stocks board, actively uses black/amber
`--gh-term-*`. History separately uses wood/brass tokens. Some token comments
still describe the legacy stocks terminal and are stale.

After a choice, put canonical semantic values in `src/ui/tokens.css`; alias
Courtside names during migration and then remove obsolete duplication. No
per-route hardcoded hexes and no permanent fourth palette system.

| Role | Canonical proposal | Current consumers / migration rule |
| --- | --- | --- |
| Canvas / surface / hover | `--gh-bg`, `--gh-bg-raised`, `--gh-bg-card`, `--gh-bg-hover` | Body, header/footer/mobile nav, cards, forms, dialogs. Map CS wall/deep/court to these roles; remove glow/grain as global chrome decoration. |
| Ink / secondary | `--gh-text`, `--gh-text-dim`, `--gh-text-faint` | Match CS text/ink/muted roles to context; no inverted light text left on new paper backgrounds. |
| Action / on-action / focus | proposed `--gh-accent`, `--gh-on-accent`, `--gh-focus`, `--gh-focus-on-dark` | Separate label color from button fill and readable button text. Legacy gold and CS tan currently do several jobs; split those jobs before aliasing. |
| Divider / control border | `--gh-border`, `--gh-border-strong` | Thin row rules versus perceivable inputs, disabled states and selected controls. |
| Outcomes / identities | `--gh-win`, `--gh-loss`, `--gh-live`, championship role; `teamColorVar()` | Semantic meaning remains stable. Team colors are not backgrounds for entire pages. |
| Approved data workspace | proposed bounded exchange role aliases | Keep stocks layout, density, gold cues and list/detail behavior intact. Scope its current navy/gold values before changing shared global tokens, so a shell migration cannot accidentally recolor the approved board. Exact workspace recolor requires its own comparison. |
| Court, historical objects and playable scene | material/scene-local tokens | Wood/fabric/court can remain within actual objects or a playable scene. Shared page text, spacing and navigation still follow the neutral system. |

The preview's `--review-*` variables are disposable experiment names. They
must not be imported into production. The separate Arcade owner can use the
same role vocabulary and off-white direction now; do not block usable game
discovery on final hex selection, and do not overwrite that task's files.

## Tables, controls and accessible behavior

- Preserve useful density. A roster or exchange is a working list, not a
  sequence of oversized player cards. A row shows identity, relevant numeric
  value/unit, status and a clear next action. Deep detail loads on selection;
  never add eager requests for styling.
- For a semantic table, sortable headers are buttons inside `<th>`; apply
  `aria-sort` to the active header, make direction clear in text/icon, and
  keep a stable tiebreaker. A compact labeled sort select is also valid and
  must have desktop/mobile parity. Don't fake sorting with a styled label.
  Missing numeric values remain unavailable and sort predictably; do not
  replace them with zero. The separate sorting task owns implementation.
- Keep visible search/sort labels, value units and result counts. Use native
  controls where possible. Position/filter chips expose pressed/selected
  state and don't depend on color. Clear and Retry are specific actions.
- Links navigate; buttons change state; summaries disclose. Do not put one
  interactive control inside another. Avoid an entire clickable row hiding
  multiple unrelated destinations. Use explicit profile and inspect actions.
- Keyboard users get a skip link, meaningful landmark/heading order and a
  visible focus ring. Focus contrast is at least 3:1 against its adjacent
  surfaces, and controls/state indicators also meet 3:1 where required.
  Normal text needs 4.5:1; large text needs 3:1. Check actual combinations,
  including muted text, hover, accent fill, disabled state and dark exceptions.
- Dialogs/panels have a named heading and Close. Escape, focus containment
  where modal, restoration to the trigger (or a stable board heading) and
  sensible Back behavior must work. Preserve the stock inspector's existing
  retry, cached details, stale-response protection and post-close focus fix.
- Touch targets are at least 44×44px, including icon-only inspect/close,
  sort, mobile tabs and disclosures. Give icon-only buttons accessible names.
  Announce changed counts/errors politely; decorative duplicates in a ticker
  must not repeat for assistive technology.

## 3D, asset and motion budgets

The arena is meaningful league identity. Its existing still/poster is a valid
first render and fallback. A useful interactive court may enhance it after a
deliberate request. Reusable embroidered pennants identify the *featured
weekly pairing* and retain real fabric detail. Preserve exact approved assets
and provenance in [courtside-preview/ASSET-PROVENANCE.json](courtside-preview/ASSET-PROVENANCE.json).
Do not regenerate player portraits, alter team identity or multiply models to
make a grid feel premium. Missing portraits use initials or a clearly labeled
fallback; text-only data rows are allowed when a face adds no value.

Proposed ceilings for the non-game shell:

- **Initial WebGL/model requests: zero.** One optional scene at a time;
  deferred Three/model loading, no parallel figurine gallery. The homepage
  already keeps its optional viewer outside the initial manifest.
- **Idle scene rendering: zero continuous frames.** Render on load, resize or
  manual interaction; suspend offscreen/hidden; dispose GPU, canvas, download
  and decoded bitmap resources on close/unmount. A closed viewer cannot keep
  work alive. Respect a reduced-motion preference change during a session.
- **Functional transitions: 120–200ms.** No looping bobbing, autoplay camera,
  parallax, scrolljacking, forced scenic scrolling, pulse or banner carousel.
  A single optional emblem settle, currently 750ms, can be retained only if
  it earns its space; reduced motion makes it static. A ticker needs Pause
  and a readable static reduced-motion state if automatic motion remains.
- **Incremental homepage interaction: ≤15KB gzip**, excluding deferred
  installed Three. Retain the existing roughly 329KB arena rather than
  introduce a multi-megabyte hero. Lazy-load below-fold portraits/rosters;
  reuse root fonts. These are proposed ceilings anchored to the existing
  Courtside integration measurements, not new measured results.

The playable free-throw game is a bounded exception: active gameplay can run
frames, with its owner maintaining pause/visibility/context-loss behavior,
usable controls and reset/exit. It does not grant permission for background
WebGL in the catalog. No WebGL, context failure or reduced motion should block
reading league content, navigating to teams or discovering the game. Provide
a real poster, explanation and working navigation rather than an empty canvas.
Do not invent a successful score or claim rewards that are inactive.

## Content voice and weekly workflow

Write like informed friends watching basketball: short, specific and a little
competitive. “Somebody unplug this man” works beside actual Jokić stats;
“Unlock elite insights” does not. Use roster names and actual moves rather
than generic feature copy. Opinions are editorial, not fabricated awards.
Don't manufacture stakes, injuries, forecasts, quotes, champions or live data.

Weekly editions remain curated/source-controlled in
`src/data/weekly-spotlight.ts`, with shared types in
`src/domain/weekly-spotlight.ts`. Add an edition with explicit date bounds,
draft/publication status, selection reason, source/check date and stat period.
Retain old entries and URLs in `/weekly` and `/weekly/[editionId]`; don't replace
the archive each week. Publish only after the editor approves the facts/copy.
Generate or select pennants for that week's featured matchup using the reusable
approved treatment. No new CMS, scheduler, paid service or publishing backend
is needed for this design migration. Updating curated content is human work;
neutral styling doesn't eliminate that responsibility.

## Responsive behavior

Use existing documented breakpoints: 40rem for compact phones, 56/64rem for
shared surface layouts; Courtside has existing 55/70rem adaptations. Keep those
literals documented during migration rather than invent a breakpoint per page.
Start with the narrow layout; enhance to columns when content fits.

At 390px and 320px, names and takes wrap, controls stack without clipping,
numerical units remain visible, and fixed chrome leaves content and focus
uncovered. Prefer compact labeled roster/standings rows over squeezing six
desktop columns into a phone. Preserve every field through a disclosure or
detail view if the collapsed row cannot show it. Horizontal scrolling is a
bounded last resort for a genuine comparative data matrix, never the whole
page, the primary navigation or the default roster experience.

Desktop and mobile share destinations, meaningful order, current-page/section
state and account semantics. Preserve the signed-in manager's single `/team`
entry, login/claim actions, logout, mobile safe areas and active nested-route
state. Essential tools must stay reachable from both sizes. Evaluate the first
phone screen with real content: identity plus the next useful action should be
clear without three consecutive navigation/status strips dominating it.

## Existing route audit and small-PR migration

Audit basis: source at `a327e9c`; current main subsequently includes the separate
PR72 game release. Browser captures of the integrated home and stocks were
visually inspected from retained GOAT review evidence. The other route findings
below are **source findings**, not new browser-reproduced visual bugs.

| Routes / files | What to preserve | Bounded design work |
| --- | --- | --- |
| Shared shell: `layout.tsx`, `globals.css`, `SiteHeader`, `MobileNav`, `SectionNav`, `SiteFooter`, `CombinedTicker` | Account state, all destinations, site metadata, safe-area space, fail-soft ticker | Neutral chrome, selected logo variant, shared type/spacing/focus roles, consistent active-page semantics. Desktop header currently has no current-page state; mobile already uses `aria-current`. Reduce stacked bars without deleting destinations or hiding actions. |
| `/`, `/weekly`, `/weekly/[editionId]` · `season-hub` | Weekly order, dated sources, archives, full live directory, inherited-manager note | Neutral tokens, smaller editorial footprint and fewer visual separators after palette selection. Source no-edition branch currently returns before the directory/standings: keep core tasks available independently of editorial. Sorting/figurine logic is separately owned. |
| `/stocks` · `stock-market` | Approved board/inspector composition, filters, slim quotes, recorded/reconstructed source labels, retry/cache/focus | Align shell and working text; preserve the board's current navy/gold values through scoped roles before global migration. Review any density/size change against actual mobile usage. |
| `/trade-analyzer` · `trade-analyzer` | Two pickers, domain verdict, FAAB totals, share query, Copy Link | Reconcile old black/amber terminal with shared controls and typography; a focused comparison can decide workspace color later. Never break URL restore or treat verdict color as the entire explanation. |
| `/teams`, `/teams/[rosterId]`, `/team` · `teams`, `team` | Public profile links, complete roster, record/streak, game log, picks, wire, franchise history, private rewards ledger and redirects | Compact neutral identity/roster composition. TeamProfile currently puts `HooperViewer` in its identity stage: review necessity with the figurine owner; do not delete unique assets or move 3D ahead of useful roster data by default. Keep pending/settled rewards distinct. |
| `/player/[playerId]` · `player` | Real identity, ownership, draft slot, transactions, honest unavailable stats | Reuse the compact identity/working-list treatment. Keep the current 88px headshot proportionate; do not turn it into a giant athlete hero or fabricate stats. |
| `/transactions` · `transactions` | Type/team filters, real chronology, linked people/teams | Neutral readable timeline/list, control hierarchy, compact time metadata; no decorative wall of colored chips. |
| `/draft` · `draft` | Round grouping, pick order, owner/player links | Desktop board and narrow pick feed share type/spacing; preserve the actual selections and units. |
| `/intel` · `intel`, `preview`, `power-rankings`, `playoffs`, `records` | Four documented public composites, null preseason states, projection/model labels | Shared title/controls and readable data groups. Keep meaningful odds bars; don't remove charts just to remove decoration. No restyling changes the analytics formulas. |
| `/news` · `news` | Event-derived coverage, publication identities, section filters, linked actors | Editorial list rhythm and compact mastheads; distinguish generated event coverage from curated weekly opinion. Publication accents stay small and labeled. |
| `/history`, `/history/champions`, `/history/hall-of-fame` · `history` | Verified titles/records/inductees, franchise history | Neutral page/chrome with actual banner/wood/brass objects where useful. One material does not need a whole unrelated site theme or every record in an engraved card. |
| `/arcade`, `/arcade/[gameId]` · `arcade` | Approved playable free-throw scene and controls, real availability, local-score limitations | Separate owner ships discoverability now: playable-only catalog, actual preview, prominent Play and usable back/exit. No fake inactive tiles, simulated preview of an unavailable game, or unsupported prize promise. |
| `/claim`, `/login`, `/admin/invites` | Session/server actions, invite consumption, authentication errors and restrictions | Shared neutral form fields/labels/focus and legible validation. Keep commissioner/admin access and secret handling intact; no visual mock accounts or new auth. |
| `loading.tsx`, `error.tsx`, `not-found.tsx`; unavailable/provision notices | Existing recovery and actual limits | Same text/background roles, explicit retry/back routes, reduced-motion loading; no dead-end blank slate. `/api/stocks/[playerId]` remains an API contract, not a visual route to redesign. |

Prioritize and gate each PR:

1. **Now, in parallel ownership:** homepage sorting/figurine investigation and
   Arcade discovery remain their owners' work. This PR delivers authority and
   palette comparison only. Do not delay or modify the PR72 game release.
2. **After user choice + independent visual/UX review:** scope approved exchange
   colors, establish neutral semantic aliases, migrate shared chrome/focus/type.
   Validate home, stocks and a plain form together before changing more routes.
   Ownership: design/shell maintainer; rollback is that focused PR.
3. **One home/archive PR:** adjust player footprint and separator density; keep
   editorial-independent core access. Coordinate atop the sorting fix. Gate on
   sample/published/stale/no-edition/unavailable-data behavior and roster parity.
4. **One team/player PR, then one wire/draft PR:** reuse proven identity/list
   components. Gate on all roster references, profile links, long names,
   ownership and current/historical labels. No new data fetching.
5. **One intel/news PR, then history PR:** migrate their established content
   hierarchy and objects. Gate on real/empty model states and historical truth.
6. **One tools/forms/recovery pass:** reconcile trade controls and any remaining
   shell states. Gate on share URL restore, Copy Link, login/claim validation,
   safe navigation and retry without changing auth/database logic.

There is no giant rewrite, new framework, new registry, global search service,
CMS or speculative infrastructure in this plan. Exact palette is an unknown
resolved by the bounded comparison. Shared inconsistent styling is accidental
complexity to consolidate. Next/Sleeper/data contracts and approved assets are
imported constraints to preserve. Honest league state and editorial chronology
are essential. Preview artifacts and aliases are transitional: the design
maintainer removes aliases after the last consumer migrates and archives the
comparison after the choice, keeping the decision/provenance record. Revisit
the plan if actual usability evidence contradicts a proposed token or component.

## Concrete acceptance checks

For each migrated surface, review actual rendering at desktop, 390px and 320px,
then 200% text zoom, long team/player names, empty/error states and reduced
motion. Use keyboard through real controls, profile navigation, Back, Close,
Retry and focus restoration. Check that fixed chrome never covers content or
focus. Run a complete Arcade catalog → Play → usable game → reset/exit path.
An HTTP 200, a source inspection or a homepage screenshot is not proof that
the rest of the site works.

Compare before/after with identical data and asset crops. Check contrast for
each real surface/state, touch targets, full-roster retention, table sorting,
inspector requests and lazy assets. Run checks appropriate to changed logic;
do not run heavy builds merely to validate Markdown. Keep PRs small, use the
repo template, identify concurrent ownership and ask an independent reviewer
to assess rendering and behavior before merging. Preserve original assets and
local work. No AWS, AgentCore, other repositories or paid service is part of
this design work.

| Do, here | Don't, here |
| --- | --- |
| Arena + actual featured pairing + short matchup take | Generic product hero with three feature cards and a CTA unrelated to the league |
| Three distinct curated takes with stat period/source | Giant player panels labeled as calculated awards when they are opinions |
| Compact clickable team rows and every roster behind expansion | Ten full-height pennants or a figurine per row to fill space |
| Navy/gold approved quote workspace within coherent shared chrome | Blindly map every global color to off-white and break price/focus contrast |
| Upcoming/null scores, 2025 record and “Previous manager” | Fabricated live zero score or inherited poor record blamed on today's manager |
| Play free-throw practice using a real preview | A catalog of fake games whose links merely return successful HTTP responses |
| Clear sort labels, units and keyboard focus | Pretty headers that cannot sort, color-only verdicts or unreadable small labels |
