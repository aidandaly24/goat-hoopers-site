# Concept 02 — Bright social league

Revised within the original author’s concept after the early product gate. Source is complete and frozen for root-owned delivery capture. Only `02/` was authored; no peer or old prototype implementation was inspected. Baseline history belongs to the parent’s Git snapshot, not to duplicate files here.

## What managers return to do

The first three tasks are to open the current pairing, explore the players behind their own team, and compare the people they compete with. The homepage composition follows those tasks: an explicit two-manager matchup, a portrait-led roster preview, and a compact view of named league competition. Full rosters and the full standings are dedicated local destinations rather than the homepage spine.

Reaves sees its own scored pairing against Ware the Hoes At?, with both manager handles, current records, the 13.5-point sample gap and access to saved model context. Its three visible roster identities are Joel Embiid, Anthony Edwards and Alperen Şengün, using approved portraits and actual supplied evidence/quotes.

NeuralNets leads with papichooter and its own Giannis Antetokounmpo, LaMelo Ball and AJ Dybantsa roster references. Its missing score remains “Not returned” beside the opponent’s recorded zero. No leader or AI result is inferred. Missing quote coverage is a quiet lower-page note and an optional inspection filter, never an instruction to repair the data or the homepage identity.

Guest gets a substantial public homepage: the featured pairing, all four other pairings, named managers, the three unbeaten teams, useful league tools and clear actual-site account entry. It never claims an owned team. The local public team directory uses the supplied roster references only where they exist for Reaves and NeuralNets; it does not fabricate the other eight rosters.

“Social” means identifiable managers, opponents, roster players and shared competition. There is no chat, friend graph, notification service, quote, last-visit baseline or invented rivalry history.

## Website architecture and routes

The persistent exact-logo header provides Home, The league, Your roster (or Meet the teams for guest), Tools & Arcade, and visibly identified current-site account entry. The homepage has useful normal scrolling content. The current location is marked in navigation; every local detail view has a Back link. All 15 fixture destinations remain discoverable in the footer, with labeled exits to the current GOAT site.

Local query routes preserve the explicit demo persona and optional structure stage:

- `?persona=reaves`, `?persona=neural`, `?persona=guest` — complete homepages.
- `?persona=reaves&view=matchup&matchup=m1` — current Reaves pairing, saved synthetic 56/44 model context, distinct 0.35 confidence and opponent identity.
- `?persona=neural&view=matchup&matchup=m4` — current Neural pairing, missing score, no saved model result and qualified opponent context.
- `?persona=reaves&view=roster` — all 24 players, search and optional completed-week/unpriced filters. Neural’s equivalent contains 22 players.
- `?persona=reaves&view=player&player=1511` — Joel Embiid’s supplied 137.50 modeled FAAB quote and 38 completed Week 2 counted points. Player routes opened from another team carry `team=`.
- `?persona=guest&view=league` — 10-team table and all five pairings.
- `?persona=guest&view=team&team=8` — NeuralNets team identity, current synthetic record and visibly qualified 2025 previous-manager history.

Navigation uses ordinary anchor URLs enhanced with local History API rendering. Browser Back and visible Back restore the originating control and scroll position; roster search/filter state survives player inspection. Directly opened detail URLs have a home fallback. In-page tools/source links scroll without adding false route history. Source explanation is a native disclosure with close/focus return.

Useful selectors for root review: `[data-focus="main-matchup"]`, `[data-focus="spotlight-1511"]`, `[data-focus="home-roster"]`, `[data-focus="home-league"]`, `[data-focus="roster-player-1511"]`, `[data-focus="table-team-8"]`, `[data-back]`, `#player-search`, `#roster-filter`, `#sources > summary` and `[data-close]`.

## Typography, proportions and approved materials

Barlow Condensed regular gives the competition and team names a sports identity in normal mixed case. Primary team headings are 72px, section headings 44px, player names 32px and score figures 76px, with deliberately tighter line height for names and scores. It is not used for reading paragraphs or controls.

Space Grotesk is the reading face at 17px/1.55, with 14–16px supporting copy. System UI controls use 15px semibold with useful padding, rather than condensed display letters. IBM Plex Mono supplies precise roster quotes, records and compact comparison data at 14–22px; scores use the display face with tabular figure styling. Long names wrap rather than truncate. Enlarged text grows the page.

Bright yellow, lilac, sky and pink surfaces distinguish competition, player identities and shared league context. Deep violet ink and one primary action role keep labels readable. Color does not carry unknown or state meaning alone. The source mode neutralizes those colors and imagery while preserving full geometry.

The exact supplied black/white GOAT logos remain intact. Player photos and the existing game preview are used for actual roster identities and an actual-site Arcade destination. All font bytes are existing local OFL assets, referenced in place; no assets, packages, scripts or fonts were downloaded, and the existing OFL notices remain untouched.

## Actual source reads and selective effects

1. [Redesign Existing Projects — full raw SKILL.md](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md), read directly on 30 Oct 2026 after the assigned GitHub URL opened. Actual sections include Typography, Layout, Interactivity and states, Content, Component patterns, Code quality and Strategic omissions. The useful effects are explicit current location, semantic page structure, readable measures, actionable missing-data explanations and Back behavior. Its prescribed fonts, gradients, palette, scroll reveals and approval workflow are not adopted; the user asked for independent complete QA concepts.
2. [better-colors](https://www.ui-skills.com/skills/jakubkrehel/better-colors), core Colors through Reporting, lines 28–102, read directly. Semantic role mapping and measurement informed the CSS variables and explicit contrast checks. The one-primary-action principle reserves the homepage’s filled action for opening the pairing. No linked secondary source is claimed as read and no install command was run.

Repository reads: `AGENTS.md`; `ARCHITECTURE.md` homepage/personalization and ownership contracts; `src/app/page.tsx`; `src/surfaces/season-hub/CourtsideHome.tsx`; `src/domain/personalized-home.ts`; `src/data/home-viewer.ts`; `src/ui/siteDestinations.ts`; author brief, product inventory and shared fixture. The shared data import is the only presentation-external JS import. Production files and membership resolution remain unchanged.

## Browser evidence and limits

`verification.json` records real bounded checks using installed Playwright and system Chromium against the existing port 4207 static server. All three final homepages loaded with their approved images, no page errors or HTTP failures, and no horizontal document overflow at 1440 or 1120 CSS px. At 1120px, setting root text to 150% also produced no horizontal overflow. Each homepage contains zero full roster rows and zero standings tables.

Verified local paths: Reaves home → matchup → Back with focus restored; home → Joel Embiid → Back with focus restored; home → full roster → Joel search → player → Back preserving search and row focus; Neural matchup/no model; six-unpriced optional filter; Giannis player view; guest league table with 10 teams and five pairings; Neural team profile with previous-manager qualification; source open/close/focus; all 15 actual-site routes; persona selector. Selected detail views also passed 1120px checks, and Giannis’ long name passed 150% text without overflow.

The first deep-path check found hash navigation closing the source disclosure through route rerendering. It was corrected and verified in the final successful run. This is completed work, not a remaining blocker.

Structure mode at 1120px retained the same Reaves page height, 2791px. A full-page Reaves diagnostic screenshot and first-fold Neural/guest diagnostics were inspected; the temporary diagnostic PNGs were removed so root owns final delivery captures.

Declared solid contrast pairs were computed and stored in the evidence file: ink/yellow 13.68:1; ink/lilac 11.19:1; ink/sky 12.08:1; muted/page 6.60:1; muted/sky 5.28:1; white/primary 8.50:1; white/footer 15.53:1. These are bounded pair calculations, not a complete accessibility audit. Visible focus styles and native controls are present. There is no reveal animation or motion-dependent content; reduced motion disables smooth scrolling.

No live API, authentication, model generation, database, storage, lineup or trade mutation, production build, mobile/device capture or external publication was performed. All current quantities are visibly synthetic. No blocker remains.
