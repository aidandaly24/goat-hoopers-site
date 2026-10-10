# GOAT Hoopers design direction

**Current design authority · October 8, 2026 · Paper + Slate selected by Aidan.**

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
and security contracts remain authoritative. The selected palette now has canonical runtime roles in `src/ui/tokens.css`;
visual composition and functionality migrate through separate small PRs.

The project-only [goat-hoopers-design skill](.agents/skills/goat-hoopers-design/SKILL.md)
routes design tasks to short, optional review references. This document remains
the decision record; the skill does not introduce a second palette or install
external skills. Its references attribute the ten UI source studies without
importing their manuals or framework/package-manager preferences.

## AI Decides — approved page composition

Aidan approved the separate AI Decides desktop layout on October 9, 2026.
Keep published weekly pairings in one compact strip, followed by the editable
question/choices and a personal result on the same open canvas. The arena and
court photo belong on the homepage; its compact prediction preview links here.
Presets open a two-team picker; Save fills an editable draft. Custom decisions
support 2–8 choices, add/remove and Reset. Published picks stay separate from
personal experiments. Show every returned probability, independent confidence,
experimental status and returned model/prompt/as-of metadata. Missing or stale
inputs have explicit states; no mock percentages or invented explanations ship.

Aidan clarified on October 10 that presets must put the question and actual
selected-team roster/stat evidence directly into the editable prompt. Both
Who wins? and Who has the edge? load that visible content through a free,
authenticated source preview; the run sends the complete textarea once.
Question-only edits retain the source check when the roster block is intact.
Roster edits or changed choices submit visible custom content with an explicit
unverified label and no additional hidden roster data. Loading, errors, Cancel
and stale responses preserve the existing draft. Replacing an existing draft
is explicit; Refresh retains the question and replaces only an intact block.
Unrelated custom choices keep the ordinary text-only flow. Saved weekly picks
remain separate and immutable.

Continue refinement through useful detail, depth, control feedback and authored
motion while retaining the approved composition. Avoid nested panels, repeated
boxes, decorative gauges, random shapes and large empty areas. Probability
motion may reveal the returned distribution; it must never imply new evidence
or certainty. Numeric labels remain readable and static. Reduced motion and
Pause retain all data and controls. Mobile trims gaps and repeated helper copy,
with readable labels, complete options and at least 44px control targets.
The page consumes the shared shell's theme and navigation; it owns neither.
Weekly and personal matchup results show the actual returned choice, not the
first probability or an inferred winner. Roster IDs remain visible; any name is
labelled as a current display name, not frozen prediction metadata. Numeric
custom choices are literal. Session verification failure keeps cached content
and editing available with a distinct message and disabled generation.

## Decisions and review status

| Status | Direction |
| --- | --- |
| Confirmed by Aidan | Off-white main canvas with restrained touches of color; more neutral than the current broad green background. |
| Confirmed | A friends' league, with specific character; avoid generic AI/SaaS layouts, repetitive decorative cards, excessive horizontal/vertical bars and oversized player features. |
| Confirmed | Game of the Week first; weekly good/bad/watch-next-week editorial, league happenings, clickable teams with useful data, and retained weekly archives. |
| Confirmed | Preserve the meaningful arena/court, selected GOAT logo and reusable embroidered pennants. Generate the featured weekly banners; do not generate a banner for every team name. |
| Confirmed | Preserve the approved stocks composition and useful dense data. Keep working search, filters, sorting, inspection and price provenance. |
| Confirmed, newest usability rule | Arcade discovery shows actual playable games, a real preview of free-throw practice and clear Play navigation. Hide nonfunctional/fake catalog entries. Verify the whole path to play, not just an HTTP 200. Arcade improvements need not wait for the broad migration. |
| Confirmed removal · 2026-10-09 | Aidan rejects the bald/blocky hooper figurine family everywhere. Remove all 11 team/generic public GLBs, their loaders and inspection controls, including previews. Retain team avatars, readable identities, rosters and profile links; preserve approved arena, pennants, logo and unrelated props. No replacement figurine. |
| Confirmed by Aidan after rendered desktop/phone comparison | **Paper + Slate**: the exact canvas, surface, ink, divider, control and slate accent values below. |
| Proposed; verify per surface | Type sizes, section density, radii and performance ceilings. These are guidance, not a mandate to change every component at once. |
| Proposed; implementation review pending | One root-owned global destination definition and a compact phone disclosure; exact labels/grouping below are recommendations, not an Aidan-approved menu specification. Follow on from #84 / PR #87. |
| Proposed; verify per interaction | Extend the current Courtside 180ms motion token with small feedback/overlay roles and persistent ticker Pause/Resume. No animation library or blanket motion pass. |

**Implementation evidence, inspected main `32794327df2ec8cd3d2b30935c2df51b354f63ca`:**
Paper + Slate roles and Inter/Geist Mono are in source; this pass does not
re-measure their rendering. Desktop `SiteHeader`, `MobileNav` and page-injected
`SectionNav` still define different menus; neither primary menu includes
Stocks. PR #87 owns that repair and remains separate from this document.
`CombinedTicker` still pauses its CSS marquee on hover, rotates modes every
15 seconds and checks reduced motion when its rotation effect starts; there
is no persistent Pause/Resume button or live preference-change subscription.
The proposed global navigation and motion refinements below are not implemented
by these documentation edits. Later work must re-inspect its exact source head.

The neutral comparisons live at
[design-previews/neutral-courtside/index.html](design-previews/neutral-courtside/index.html).
An isolated noindex hosted copy is generated at
`/design-preview/neutral-courtside/index.html` through the existing public-files
mechanism, with no normal navigation entry or data loader. Its hosted HTTP publication remains coordinator-owned. Private Mac Chrome
captures at 1440px and 390px were inspected and delivered as images before
Aidan chose Paper + Slate. The frozen comparison remains unchanged.
Switch color at the same scroll position and width. All three use the current
Courtside component tree, identical fixture content, arena crop, portraits and
pennants. They are palette experiments, not redesigned page compositions.
The broad teams divider remains unchanged for comparison; reducing its visual
weight is a separate layout improvement. A labeled appendix supplies synthetic
W/L, stock-move, live, medal and badge examples because the frozen fixture has
no populated standings or quotes. Those examples are not league results.
The black horizontal logo is an unchanged approved variant for light surfaces.
The existing primary clay master remains the selected logo; no logo redesign is
proposed. See the [review README](design-previews/neutral-courtside/README.md)
for provenance, reproduction and verification limits.

Direction B homepage implementation keeps the court left and This Week right within the existing 78rem/responsive-gutter contract. The selected row uses type weight alone: no frame, dark strip or selected stripe. AI Decides and This Week share that right-hand sidebar: retain team pictures, selectable pairings, matchup details and the AI playground link, with full bars only for actual saved ready probabilities and explicit unavailable/past-week states. The duplicate lower AI preview is removed. Mobile stacks the sidebar below the court. Compact good/bad/watch stories, the live directory and visible Stocks/Arcade entries reuse the current data contracts and shared Paper + Slate theme.

Aidan’s October 9 homepage correction removes the player-specific skip shortcut and the Pause motion / Inspect the floor controls. The shared shell retains focus-only keyboard skip access. The court stays static; deliberate team selection retains its brief reduced-motion-aware context rail. Label the default story **Featured matchup** and show its existing editorial selection reason; selected sidebar pairings are labelled separately. The approved court-left/sidebar-right grid and saved AI preview remain intact.

The populated-slate correction keeps all five saved matchup rows on the right, with avatars, current names and roster-matched percentages in the value column. The AI Decides heading and playground both link to `/ai-decides`. The court uses its natural 16:9 frame; the editorial reason, real team context and matchup notes sit directly beneath it in the left column. Detailed roster IDs, model choice, generation/input timestamps and source evidence stay in matchup notes or the full AI page. The sidebar keeps a concise preseason/weekly signal and model-estimate label; it has no fixed-height scroll area. Phone reading order is court, featured team context, then all five picks. The shared container/gutters stay unchanged.

## Shared reading theme — bounded follow-on to #84

Aidan requested one SVG sun/moon button instead of an Appearance dropdown.
The shared root header owns the sole `ThemeToggle` export from
`@/ui/ThemeToggle`; pages consume semantic `--gh-*` roles and never mount a
second control or add page-local theme state/provider. The effective preference
lives on **`html[data-theme="light|dark"]`**. Only manual `light`/`dark` choices
use **`goat-hoopers.theme`** in localStorage. Missing, invalid or unreadable
storage follows the system preference (light if unavailable). System changes
remain live until a manual choice; blocked writes retain the manual choice for
the current mount but cannot promise persistence after reload.

The root head applies the preference before paint; the button's deterministic
server/first-client loading state becomes an ordinary button named for its
next action: **Switch to dark theme** / **Switch to light theme** after hydration.
Its action name changes, so it does not use pressed-toggle semantics. Its target is 44×44px at every width, outside phone-hidden
account/navigation groups. Theme glyph and control colors switch immediately,
without a hover/background fade. The existing black/white horizontal logos
switch by CSS at the same dimensions; original SVG assets remain unchanged.
No reset dropdown, cookie, new provider, framework or data service is added.

Paper + Slate's selected light values remain exact. Slate night uses canvas
`#151D24`, raised `#1E2932`, hover `#293844`, ink `#F5F4EF`, secondary `#BCC5CD`,
accent/focus `#9FC3DE` with label `#17212A`, control `#94A2AF` and divider
`#455462`. Semantic win/loss/live use `#94D5B9` / `#F0AAAA` / `#EDB494`;
champion/silver/bronze use `#DEC68B` / `#B9C3CC` / `#D5A578`. Existing aliases
resolve from the html root. Fixed identity/position colors and bounded scene,
chart-specific and banner materials retain their owners' meanings.

User question → change the reading theme; primary action → toggle dark theme;
relevant states → system, manual, storage unavailable and loading; narrow layout
→ one persistent button beside Stocks/Menu; forbidden patterns → appearance
menu, duplicate provider/control, theme fade with mismatched foreground,
page-body redesign or logo regeneration. Issue #126 tracks implementation and
revision-bound evidence; this section does not claim physical Safari or screen
reader acceptance.

The one shared league list adds **AI Decides** after Intel and before Trade
Analyzer. Its frontend and homepage entry remain their separate owners' scope;
this shared-shell change defines only theme/navigation and does not alter its
body or runtime activation. No page-local menu is introduced.

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

For each changed surface, add a short design contract to its existing entry
comment or review record: **user question → primary action → relevant states
→ narrow layout → forbidden patterns**. For example, the exchange answers
“What is this player worth?” with Inspect; its states include loading,
unavailable detail and source-labelled history; its narrow layout retains
filters, units and Close; it forbids eager full-history payloads and oversized
portrait cards. This extends the existing surface contract, not a new registry.

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

## Selected palette and retained comparison

Color belongs to a team, a material, an action or a state. The neutral canvas
occupies most of the page; it is not another full green treatment. Green can
remain a small court reference or a labeled positive result.

| Token role | Chalk + clay (comparison) | **Paper + slate (selected)** | Linen + burgundy (comparison) |
| --- | --- | --- | --- |
| Canvas | `#F6F3EB` | `#F5F4EF` | `#F5F1E8` |
| Raised/readable surface | `#FFFDF7` | `#FFFFFF` | `#FFFCF6` |
| Row hover | `#EEECE4` | `#EBEEF0` | `#EEE9E0` |
| Main ink | `#242824` | `#242D35` | `#2C2928` |
| Secondary ink | `#63675F` | `#5F6870` | `#6A625C` |
| Action/editorial accent | `#A54429` clay | `#345B77` slate | `#843F46` burgundy |
| Decorative divider | `#D9D6CC` | `#D7DADE` | `#DBD4CA` |
| Control boundary | `#898D83` | `#7B858E` | `#91857B` |
| Focus on light | `#245A4B` | `#345B77` | `#843F46` |

Aidan chose **Paper + Slate** after seeing actual rendered captures, including
the phone opening and team directory. Canvas `#F5F4EF`, white working surfaces
and slate `#345B77` actions are the site-wide baseline. Team identity and
permanent assets retain their colors. Keep all three frozen comparison
artifacts as evidence; do not regenerate them to imply a different decision.

Semantic states on light surfaces, consistent across all three
treatments: positive `#245A4B`, negative `#A13E3E`, live/action-needed
`#A54429`, championship/first place `#795C1C`, second place `#5F6870`,
third place `#855022`, neutral secondary ink. Pair each with text/icon/shape:
W/L, +/−, Live, Champion and ordinal ranks. Never
apply team colors as essential small text without checking contrast. Pale
dividers are not adequate control boundaries or focus indicators. A white
label on an accent-filled button needs its own contrast check.

The isolated preview maps every inherited win/loss/live/silver/bronze token to
these darker values and separates first-place gold from action color. Its
accent-tinted status badge uses main ink for the label, including on hover.
Calculated checks cover the actual canvas, surface, hover and 12% badge-tint
pairs represented in the appendix; they do not replace rendered review. Do not
carry legacy bright green/red/orange text onto light backgrounds unchanged.

### One semantic system, with bounded exceptions

Canonical roles live in `src/ui/tokens.css`. Courtside, Arcade discovery,
trade terminal and history page names alias the same selected values. These
compatibility names preserve component structure while eliminating separate
page palettes; remove an alias only after its last consumer migrates.

| Role | Canonical values | Consumers / migration rule |
| --- | --- | --- |
| Canvas / surface / hover | `--gh-bg` `#F5F4EF`; `--gh-bg-raised` / `--gh-bg-card` `#FFFFFF`; `--gh-bg-hover` `#EBEEF0` | Body, chrome, cards, forms, dialogs, quotes and inspector. CS wall/deep/court and trade/history page names alias these roles. No global glow/grain. |
| Ink / secondary | `--gh-text` `#242D35`; `--gh-text-dim` / `--gh-text-faint` `#5F6870` | Main, secondary and provenance text, including legacy CS/terminal/history names. |
| Action / label / focus | `--gh-accent` / `--gh-focus` `#345B77`; `--gh-on-accent` `#FFFFFF` | Slate fills use white labels. Legacy gold action names resolve to slate. Bright position/team fills use `--gh-ink-on-color` `#242D35`, not the white action label. |
| Divider / control boundary | `--gh-border` `#D7DADE`; `--gh-control` / `--gh-border-strong` `#7B858E` | Quiet row rules versus perceivable inputs/focus. Native fields locally use the control role rather than darkening every page divider. |
| Outcomes / identities | `--gh-win` `#245A4B`, `--gh-loss` `#A13E3E`, `--gh-live` `#A54429`, `--gh-champion` `#795C1C`, silver/bronze as above; `teamColorVar()` | Text/ordinal labels retain meaning. Existing team/position hues remain identity cues, with readable dark labels. |
| Approved stocks workspace | Shared page roles plus owner-scoped chart roles | Preserve composition, useful density, list/detail behavior and provenance. The selected site-wide palette also applies to its working surfaces. Retain distinct estimated/recorded chart styles and the chart owner's token names; contrast-check them on white when that PR lands. No chart or pricing logic change here. |
| Championship object / playable scene | `--gh-banner-*` / `--gh-scene-*` | Existing crimson fabric/brass banner and dark court HUD stay bounded to actual objects. History pages, game discovery and shared chrome remain paper. This exception cannot become another page-wide theme. |

A scoped scene must set its actual `color` and raised-surface roles; changing
custom property values alone does not change inherited body text. Status badges
inside a scene use an opaque local surface so their text contrast is stable
over moving court imagery.

Publication hues are darkened to remain readable on paper, with their existing
publication labels. The game's HUD locally restores its approved scene type
and light text. Comparison `--review-*` variables stay isolated and never enter
production imports. No new palette framework, assets or fetching is needed.

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
  Normal text needs 4.5:1; large text needs 3:1. Large means at least **18pt
  regular or 14pt bold** (24px or about 18.67px), not 18px/14px. Measure actual
  rendered foreground/background pairs, including composited tints, opacity,
  muted text, hover, accent fill and dark exceptions. Disabled/inactive controls
  have WCAG exceptions; review their readability without claiming a required
  contrast pass. Token names or a palette swatch alone do not prove compliance.
- Dialogs/panels have a named heading and Close. Escape, focus containment
  where modal, restoration to the trigger (or a stable board heading) and
  sensible Back/Forward behavior must work. Preserve the stock inspector's existing
  retry, cached details, stale-response protection and post-close focus fix.
- The **site design target is 44×44 CSS px**, including icon-only inspect/close,
  sort, mobile tabs and disclosures. This is stronger than WCAG 2.2 AA's
  **24×24 CSS px minimum**, which has spacing, inline, equivalent-control,
  user-agent and essential exceptions. Record an applicable exception rather
  than calling every smaller inline link an AA failure. Give icon-only buttons accessible names.
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
  deferred Three/model loading for approved assets only, no parallel figurine
  gallery. The rejected hooper family and homepage inspection action are removed.
- **Idle scene rendering: zero continuous frames.** Render on load, resize or
  manual interaction; suspend offscreen/hidden; dispose GPU, canvas, download
  and decoded bitmap resources on close/unmount. A closed viewer cannot keep
  work alive. Respect a reduced-motion preference change during a session.
- **Functional transitions: generally 120–200ms.** Extend the existing
  `--gh-cs-duration: 180ms` rather than introducing a parallel timing system;
  proposed feedback/state/overlay timings and lifecycle checks live in the
  optional [motion reference](.agents/skills/goat-hoopers-design/references/motion.md).
  Focus, price inspection and numeric price updates are immediate. No looping bobbing, autoplay camera,
  parallax, scrolljacking, forced scenic scrolling, pulse or banner carousel.
  At most one restrained authored basketball moment is appropriate per surface;
  the optional emblem settle, currently 750ms, must earn its space and becomes
  static under reduced motion. Do not add generic scroll reveals or hide
  essential content awaiting an observer or animation. A ticker needs a
  persistent keyboard/touch **Pause/Resume** control that stops automatic
  movement and mode rotation, plus a readable static reduced-motion state.
  Hover pause alone is insufficient. These ticker refinements remain a follow-up.
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
state. **Stocks must stay directly reachable everywhere**, independent of the
ticker's current mode or whether it has content. Essential tools must stay reachable from both sizes. Evaluate the first
phone screen with real content: identity plus the next useful action should be
clear without three consecutive navigation/status strips dominating it.

### Global navigation recommendation — follow on from PR #87

After the current shared-shell repair is reviewed, consolidate main and league
bars from one small ordered destination definition composed by the root layout.
Avoid three drifting lists and page-injected global navigation. Local section
links may remain where they explain that page; no generic route registry is
needed. The shared-shell owner implements this in a subsequent bounded PR.

The bounded consolidation uses desktop **Home, News, Stocks, History, Arcade**,
then **League tools**: Teams, Transactions, Draft, Intel, Trade Analyzer and
Weekly archive, in that order. Root layout supplies one typed destination list;
footer entries derive from it. On phones the approved logo, direct **Stocks**
shortcut and **Menu** replace the fixed six-tab bar. The Menu deliberately omits
Stocks to keep one visible Stocks destination and current-page announcement;
the other primary links retain their relative order, followed by identical
league tools and account actions. This shortcut is the documented exception to
displaying the complete primary sequence in one row.

Only the compact ticker/header belongs to the measured sticky stack. Expanded
disclosures are normal-flow siblings before page content, using natural page
scrolling at enlarged sizes. Opening from a scrolled page reveals their first
row while retaining trigger focus. Hidden children leave the tab order; Escape
closes and restores trigger focus, and activation, route changes and responsive
layout changes close the disclosure. No modal role, focus trap, fixed panel or
internal menu scroll area is introduced.

This grouping received independent intended desktop/mobile design review for
issue #84's follow-on; its rendered and actual Next evidence belongs to that
draft PR. It does not claim Aidan approved these exact labels before review.
Preserve /weekly archives, history children, footer/profile links and every
existing destination. Retain logged-in display-name → /team as the single
account entry in the active layout; phone account actions are in Menu. Retain
logged-out My Team/login/claim and logout, and keep public /teams separate from
private /team. Trade Analyzer provides an ordinary **Back to Stocks** link
beside its existing workspace heading without changing share/picker behavior.

Current navigation uses a plain accent underline without a selected pill or inset
shadow; keyboard focus keeps its separate outline. The logo link shares the
44px target floor with navigation controls.

Use ordinary links and disclosure buttons with visible names, `aria-expanded`
and `aria-controls`, not application-menu roles or a focus trap. Escape closes
an open disclosure and restores its trigger focus; closing it must remove its
hidden children from the tab order. Match nested current routes at a slash
boundary. Inspect real Back/Forward restoration and direct anchor clearance
with and without the ticker, enlarged text and wrapped chrome. The existing
PR #87 owns current offsets and skip/focus repair; these docs do not change it.

## Existing route audit and small-PR migration

Original audit basis: `a327e9c`. The palette implementation adopts merged main
`be55463` (including chart PR78, sorting PR79 and Arcade PR77) and preserves the deployment
hold. Source findings below remain layout follow-ups; the selected palette
pass has separate real-component desktop/mobile QA in
[docs/paper-slate-palette-qa.md](docs/paper-slate-palette-qa.md). No claim that
every authenticated route or live backend was exercised is implied.

| Routes / files | What to preserve | Bounded design work |
| --- | --- | --- |
| Shared shell: `layout.tsx`, `globals.css`, `SiteHeader`, `MobileNav`, `SectionNav`, `SiteFooter`, `CombinedTicker` | Account state, all destinations, site metadata, safe-area space, fail-soft ticker | Neutral chrome, selected logo variant, shared type/spacing/focus roles, consistent active-page semantics. Desktop header currently has no current-page state; mobile already uses `aria-current`. Reduce stacked bars without deleting destinations or hiding actions. |
| `/`, `/weekly`, `/weekly/[editionId]` · `season-hub` | Weekly order, dated sources, archives, full live directory, inherited-manager note | Neutral tokens, smaller editorial footprint and fewer visual separators after palette selection. Source no-edition branch currently returns before the directory/standings: keep core tasks available independently of editorial. Sorting remains intact; rejected figurine inspection is removed. |
| `/stocks` · `stock-market` | Approved board/inspector composition, filters, slim quotes, recorded/reconstructed source labels, retry/cache/focus | Shared Paper + Slate shell/board/inspector; preserve chart owner roles and provenance. Review any density/size change separately against actual mobile usage. |
| `/trade-analyzer` · `trade-analyzer` | Two pickers, domain verdict, FAAB totals, share query, Copy Link | Use selected shared neutral control/ink roles through terminal compatibility names. Never break URL restore or treat verdict color as the entire explanation. |
| `/teams`, `/teams/[rosterId]`, `/team` · `teams`, `team` | Public profile links, complete roster, record/streak, game log, picks, wire, franchise history, private rewards ledger and redirects | Compact neutral identity/roster composition. TeamProfile uses the existing TeamAvatar/initials treatment; the rejected hooper family is removed without changing unrelated approved assets or roster data. Keep pending/settled rewards distinct. |
| `/player/[playerId]` · `player` | Real identity, ownership, draft slot, transactions, honest unavailable stats | Reuse the compact identity/working-list treatment. Keep the current 88px headshot proportionate; do not turn it into a giant athlete hero or fabricate stats. |
| `/transactions` · `transactions` | Type/team filters, real chronology, linked people/teams | Neutral readable timeline/list, control hierarchy, compact time metadata; no decorative wall of colored chips. |
| `/draft` · `draft` | Round grouping, pick order, owner/player links | Desktop board and narrow pick feed share type/spacing; preserve the actual selections and units. |
| `/intel` · `intel`, `preview`, `power-rankings`, `playoffs`, `records` | Four documented public composites, null preseason states, projection/model labels | Shared title/controls and readable data groups. Keep meaningful odds bars; don't remove charts just to remove decoration. No restyling changes the analytics formulas. |
| `/news` · `news` | Event-derived coverage, publication identities, section filters, linked actors | Editorial list rhythm and compact mastheads; distinguish generated event coverage from curated weekly opinion. Publication accents stay small and labeled. |
| `/history`, `/history/champions`, `/history/hall-of-fame` · `history` | Verified titles/records/inductees, franchise history | Neutral page/chrome; crimson fabric and brass stay within championship banners. One material does not need a whole unrelated site theme or every record in an engraved card. |
| `/arcade`, `/arcade/[gameId]` · `arcade` | Approved playable free-throw scene and controls, real availability, local-score limitations | Separate owner ships discoverability now: playable-only catalog, actual preview, prominent Play and usable back/exit. No fake inactive tiles, simulated preview of an unavailable game, or unsupported prize promise. |
| `/claim`, `/login`, `/admin/invites` | Session/server actions, invite consumption, authentication errors and restrictions | Shared neutral form fields/labels/focus and legible validation. Keep commissioner/admin access and secret handling intact; no visual mock accounts or new auth. |
| `loading.tsx`, `error.tsx`, `not-found.tsx`; unavailable/provision notices | Existing recovery and actual limits | Same text/background roles, explicit retry/back routes, reduced-motion loading; no dead-end blank slate. `/api/stocks/[playerId]` remains an API contract, not a visual route to redesign. |

Prioritize and gate each PR:

1. **Delivered:** DESIGN.md and three comparable neutral prototypes; usable
   Arcade discovery and homepage sorting have separate merged PRs. Preserve
   their working controls and independent release history.
2. **Selected palette pass:** shared semantic values, neutral chrome, readable
   focus/control roles and bounded banner/game exceptions. Validate real home,
   stocks/inspector, teams, Arcade, trade and recovery components at desktop and
   phone widths. Chart PR78 is merged; preserve its functional changes and role names while
   mapping its light chart to selected semantic values. No layout rewrite.
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
CMS or speculative infrastructure in this plan. The palette uncertainty was resolved
by the bounded comparison and Aidan’s selection. Shared inconsistent styling is accidental
complexity to consolidate. Next/Sleeper/data contracts and approved assets are
imported constraints to preserve. Honest league state and editorial chronology
are essential. Preview artifacts and aliases are transitional: the design
maintainer removes aliases after the last consumer migrates and preserves the
frozen comparison after the choice, keeping the decision/provenance record. Revisit
the plan if actual usability evidence contradicts a proposed token or component.

## Concrete acceptance checks

For each migrated surface, review actual rendering at desktop, 390px and 320px,
then test **200% text enlargement separately from 320 CSS px reflow**. Browser
zoom, text enlargement and a narrow viewport establish different evidence;
record the method. Include long team/player names, empty/error states and reduced
motion. Use keyboard through real controls, profile navigation, Back/Forward, Close,
Retry and focus restoration. Check that fixed chrome never covers content or
focus. Run a complete Arcade catalog → Play → usable game → reset/exit path.
An HTTP 200, a source inspection or a homepage screenshot is not proof that
the rest of the site works. Label evidence as **source**, **component fixture**,
**real Next route**, **actual device** or **screen reader**, with exact revision,
route/state and test method. A fixture's native anchors do not establish Next
history restoration; an accessibility-tree inspection is not a screen-reader
pass, and an emulated safe area is not physical iOS evidence. Keep unperformed
checks explicit. The optional [navigation/accessibility reference](.agents/skills/goat-hoopers-design/references/navigation-accessibility.md)
helps select the relevant checks without implying they have passed.

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
| Paper + Slate quote workspace with approved density and distinct chart provenance | Rebuild it into generic cards or leave bright dark-theme labels unreadable on paper |
| Upcoming/null scores, 2025 record and “Previous manager” | Fabricated live zero score or inherited poor record blamed on today's manager |
| Play free-throw practice using a real preview | A catalog of fake games whose links merely return successful HTTP responses |
| Clear sort labels, units and keyboard focus | Pretty headers that cannot sort, color-only verdicts or unreadable small labels |

