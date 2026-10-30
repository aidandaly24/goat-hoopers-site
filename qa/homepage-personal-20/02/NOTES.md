# Concept 02 — Team home

Status: source complete and frozen for root-owned delivery capture. Only this directory was authored. No peer implementation or old prototype was inspected. The shared data-only `../fixture.js` supplies synthetic state; all markup, composition, styles and behavior here are original to this author.

## Product and information architecture

This homepage starts with a returning manager’s current work. Reaves opens on a known Week 3 score, an inspectable pairing and a short list of new evidence. Five completed Week 2 rows and a complete own-roster quote follow. NeuralNets opens on its six missing prices; its pairing is secondary and explicitly unresolved. Its available three-player evidence remains separate from the missing current score. Guest gets public pairings, standings, historical context and real account entry, without a claimed team.

The exact GOAT logo and current Home marker anchor a small main navigation. The team view adds useful local section links. The lower homepage contains the complete roster, standings and other current pairings in normal document flow, followed by actual-site tools, Arcade and a semantic destination footer. Every fixture route is discoverable. Actual-site links have an exit arrow and accessible text explaining that they open the current GOAT site in a new tab.

The default rejected was an oversized editorial statement followed by equal feature cards. The useful work begins in the first fold. The two-column roster is a readable list of data, not a collection of promotional boxes. Search and optional filters operate on the initially complete list.

## Typography and color

- Space Grotesk, from the existing licensed local catalog: 44px/600 primary heading, 28.8px section headings, 18.4px smaller headings. Mixed case, restrained tracking. It gives team names a deliberate identity without requiring a poster-sized title.
- System UI stack for body and controls: 16px/1.55 reading baseline, 14px primary controls and compact rows, 12–13px secondary explanations. Body copy has a 65-character maximum measure. Long player names wrap; they are never truncated to preserve row heights.
- IBM Plex Mono, existing local OFL asset, for score, record, rank, quote and point data. Scores are 56px; table/roster data is 13–14px. Tabular figures align comparisons. Mono is not used for paragraphs or team names.
- The local font files are referenced in place. No font bytes or assets were downloaded; existing OFL notices are preserved alongside the shared files.
- The neutral page/surface/text roles and single rust action role are semantic CSS variables. One filled action receives emphasis in each persona. Missing data is described in text, not signaled only by color. No trend, value rank or current leader is inferred from incomplete evidence.

## Reference reads and concrete effects

1. [Redesign Existing Projects — full raw SKILL.md](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md), including Typography, Layout, Interactivity and states, Content, Component patterns, Code quality and Strategic omissions. Read directly on 30 Oct 2026; the GitHub starting URL also opened. This is a reference, not an installed skill or an adopted design system. The relevant effects are tabular data, bounded reading measures, current-page navigation, native meaningful HTML, usable missing-data states and explicit close/back behavior. Its recommended font list, gradients, palette and scroll reveals were not adopted because this brief calls for independent typography and immediate content.
2. [better-colors](https://www.ui-skills.com/skills/jakubkrehel/better-colors), core Colors through Reporting sections, lines 28–102. Read directly; no install command run and no linked secondary files claimed as read. “Every step has a job” and semantic role separation led to named page/surface/muted/action variables. The one-primary-action principle changed Neural’s main emphasis to missing-quote inspection rather than coloring its unresolved matchup. Contrast computation is reported only for the explicit checked pairs below.

Repository reads: `AGENTS.md`; `ARCHITECTURE.md` directory/homepage/personalization sections and domain/data/surface/UI/page ownership contracts; `src/app/page.tsx`; `src/surfaces/season-hub/CourtsideHome.tsx`; `src/domain/personalized-home.ts`; `src/data/home-viewer.ts`; `src/ui/siteDestinations.ts`; author brief, product inventory and the shared fixture. Production membership remains server-resolved; query personas here are explicitly synthetic display state.

## Local action behavior

- Reaves: “Inspect matchup evidence” opens a native inline disclosure with the saved synthetic 56/44 estimate and separately labeled 0.35 model confidence. Close returns focus to its summary.
- Neural: the primary missing-quote action filters the roster to exactly six unpriced players and announces the result count. The roster filter can restore all 22. There is no fabricated total, ranking, live score or model result.
- Evidence names open the corresponding roster row, reveal the supplied quote/evidence, and move keyboard focus to its summary. The close control returns focus to that row.
- Team and pairing details use native disclosures with explicit close controls. The source link opens the source explanation. The visible demo selector navigates ordinary persona URLs and preserves structure mode.
- No authentication, trade, lineup, notification, AI, quote, storage or API operation is simulated or invoked.

## Browser evidence

`verification.json` records bounded real browser checks using installed Playwright with system Chromium, served from `http://127.0.0.1:4207/qa/homepage-personal-20/02/`.

All three persona views loaded without page errors or HTTP failures. Each had document width equal to viewport width at 1440 and 1120 CSS px. At 1120px, setting the root text size to 150% also produced no horizontal document overflow. This is an enlarged-text check, not a mobile-device claim.

Verified the Reaves matchup open/close/focus flow, Joel Embiid evidence-to-roster inspection and loaded portrait, Neural’s exactly-six unpriced filter and Giannis name search, and source disclosure in all three views. Default roster counts are 24, 22 and 0 for Reaves, Neural and guest. Structure mode kept Reaves’ 1120px document height identical (3354px) while neutralizing colors and imagery. Diagnostic screenshots of Reaves full page and Neural at 1120px were visually inspected, then removed so root owns the delivery captures.

Computed declared solid color pairs: body/page 13.50:1; muted/page 5.76:1; primary label/fill 6.66:1; muted/quote surface 5.39:1; body/white 14.99:1. This is a bounded check of those pairs, not a claim of a complete accessibility audit. Focus indicators are visible CSS outlines; native disclosures remain keyboard operable. No motion or scroll-reveal dependency exists; reduced-motion disables smooth scrolling.

No production build, live-account test, mobile capture or external publication was performed or required. Final delivery screenshots belong to root. No blockers remain.
