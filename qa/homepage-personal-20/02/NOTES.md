# Concept 02 — The league roll call

Final source is complete and frozen for root-owned capture. Only `02/` was authored. No peer source, other author’s implementation or old prototype was inspected; the parent supplied overlap constraints and accepted this revised architecture before implementation. No production or shared fixture files were changed.

## Product priority and composition

This homepage is a connected directory of the people who play the league. Its spine is one continuous roll call organized by the five actual fixture pairings. Each relationship names both managers, their teams, current records and a compact score. The rows share a readable surface with visible connecting lines; they are not five opaque cards or a standings table.

Personal work is integrated into the relevant relationship. A compact task band identifies the returning manager’s own team, season record and place. The member’s pairing is first and visibly marked. Inside that pairing, one approved owned-player portrait links to a meaningful local player inspection, with two named teammates and roster entry alongside it. There is no separate three-player strip, opponent sidebar or ranked competition section.

The first three useful actions are to inspect a pairing, meet a named manager/team and explore the players behind one’s own team. Reaves emphasizes opening its known scored matchup. NeuralNets emphasizes exploring its 22 players while keeping the unresolved pairing visible. The missing score is explicitly “Not returned” beside papichooter’s known zero; no leader is inferred. Neither missing coverage nor data repair is the product identity.

Guest sees all ten managers and all five public pairings, with a clear actual-site account entry and qualified 2025 historical context. It never claims an owned team. Public local team pages offer supplied roster references only for Reaves and NeuralNets; the other eight rosters are not fabricated.

This resolves the rejected matchup → three player cards → standings rhythm through a different product structure, not a color or section-order swap. Social means actual managers, opponents and owned-player identities from the fixture. There is no chat, friend graph, notification service, invented quote, rivalry history or last-visit baseline.

## Typography and bright social identity

Righteous is used for short welcoming headings and compact manager initials. Primary team headings are about 42px at 1440px, main section headings 28px. Long team names, managers, paragraphs and controls use the ordinary mixed-case Verdana/Geneva/sans-serif system stack; the reading baseline is 16px/1.65. Controls use clear bold system text with visible focus and useful padding. Long names wrap rather than truncate.

Space Mono supplies roster quotes, scores, records and numeric detail, generally 13–18px in compact comparisons and 32–40px in inspection views. There is no Barlow, condensed display or Lora reading treatment. All font bytes are existing local licensed assets, referenced in place. The system stack needs no download. Existing OFL notices remain untouched.

Yellow marks the manager’s own place within the league, lilac gives the directory a shared heading, and pink/sky initials distinguish the two sides of each pairing without assigning fictional team colors. Deep violet ink anchors the bright surfaces. Unknown values always have words, never color alone. The exact supplied black/white GOAT logos are preserved. The one owned-player portrait and actual game preview have concrete destinations and purposes.

## Persistent website and local routes

The exact-logo header gives Home, The league, Your roster (or Meet the teams for guest), Tools & Arcade, plus visibly identified current-site account entry. All 15 fixture destinations remain discoverable in the semantic footer. Exit arrows and accessible text label links that open the current GOAT site in another tab.

The existing local query routes are retained:

- `?persona=reaves`, `?persona=neural`, `?persona=guest` — complete homepages.
- `?persona=reaves&view=matchup&matchup=m1` — known Reaves score, opponent and saved synthetic model context. The 56/44 estimate and separate 0.35 confidence remain inside inspection, not implied live odds.
- `?persona=neural&view=matchup&matchup=m4` — known opponent zero, missing Neural score, and no saved model result.
- `?persona=reaves&view=roster` — full 24-player roster, search and optional completed-week/unpriced filters. Neural’s equivalent has 22 players.
- `?persona=reaves&view=player&player=1511` — Joel Embiid’s 137.50 synthetic modeled FAAB and 38 completed Week 2 counted points. Links from another team carry `team=`.
- `?persona=guest&view=league` — full 10-team table and five pairings.
- `?persona=guest&view=team&team=8` — NeuralNets and its explicitly qualified previous-manager 2025 record.

Ordinary anchor URLs are enhanced by local History API rendering. Visible Back and browser Back restore the originating control and scroll position. Roster search/filter state survives player inspection. Direct deep links have a home fallback. In-page source/tools links scroll without adding misleading route history. Source explanation is a native disclosure with close/focus return.

Review selectors: `[data-focus="main-matchup"]`, `[data-focus="home-roster"]`, `[data-focus="roll-team-2"]`, `[data-focus="roll-pair-m4"]`, `[data-focus="spotlight-1511"]`, `[data-focus="home-league"]`, `[data-focus="roster-player-1380"]`, `[data-back]`, `#player-search`, `#roster-filter`, `#sources > summary`, `[data-close]`.

## Actual source reads

1. [Redesign Existing Projects — full raw SKILL.md](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md), read directly on 30 Oct 2026 after opening the assigned GitHub URL. Actual sections include Typography, Layout, Interactivity and states, Content, Component patterns, Code quality and Strategic omissions. Useful principles applied here: explicit current location, semantic page structure, bounded reading measures, usable missing states and Back behavior. Its prescribed type, gradients, palette and motion are not adopted; the user requires independent QA concepts.
2. [better-colors](https://www.ui-skills.com/skills/jakubkrehel/better-colors), core Colors through Reporting, lines 28–102. Read directly. Semantic color roles and measured rather than guessed contrast informed the variables. Each persona has one filled primary action. No linked secondary files are claimed as read; no install command was run.

Repository reads: `AGENTS.md`; `ARCHITECTURE.md` homepage/personalization and ownership contracts; `src/app/page.tsx`; `src/surfaces/season-hub/CourtsideHome.tsx`; `src/domain/personalized-home.ts`; `src/data/home-viewer.ts`; `src/ui/siteDestinations.ts`; author brief, product inventory and shared fixture. The data-only fixture is the only presentation-external JS import. Production membership remains server-resolved.

## Final browser evidence

`verification.json` records bounded real checks with installed Playwright and system Chromium against the existing port 4207 server. All three final homepages loaded with approved images and no page errors or HTTP failures. Each had document width equal to viewport width at 1440px, 1120px, and 1120px with root text enlarged to 150%. Each displayed five pairing relationships and ten manager identities, with zero full roster rows and zero standings tables. Member homes had exactly one integrated owned-player portrait; guest had none.

Changed meaningful journeys passed:

- Reaves primary → matchup → Back restores primary focus; the supplied saved estimate appears inside.
- Reaves opposing manager name → team profile → Back restores the manager-name link.
- Integrated Joel Embiid identity → player quote/evidence → Back restores its link.
- Neural primary → 22-player roster → Giannis search → player → Back restores search and row focus → Back restores the homepage primary.
- Optional unpriced filter returns exactly six rows. Missing quotes remain unknown.
- Guest public pairing → matchup → Back restores the pairing entry. Guest Neural team profile preserves the previous-manager qualification.
- Source open/close/focus, all 15 external routes and persona selector passed.

Selected detail views also passed 1120px checks; Giannis’ long-name player view passed 150% text without overflow. Structure mode preserved Reaves’ 1120px document height exactly, 2148px, while neutralizing colors/images. A full-page diagnostic screenshot was visually inspected, then removed; root owns final delivery captures.

The bright solid color roles are retained from the previous checked revision: ink/yellow 13.68:1, ink/lilac 11.19:1, ink/sky 12.08:1, muted/page 6.60:1, muted/sky 5.28:1, white/primary 8.50:1, white/footer 15.53:1. These are computed declared pairs, not a complete accessibility audit. There is no reveal-animation dependency; reduced motion disables smooth scrolling.

No API, authentication, AI generation, database, storage, lineup, trade, production build, mobile/device capture, publication was performed for this revision. All current quantities remain visibly synthetic. No blocker remains.
