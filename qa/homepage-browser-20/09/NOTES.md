# 09 — Team kit

Frozen source: `index.html`, `style.css`, `script.js`.

URL: http://localhost:4207/qa/homepage-browser-20/09/

Neutral structure: http://localhost:4207/qa/homepage-browser-20/09/?stage=structure

## Page idea and useful work

A single original sleeveless basketball jersey is the entire team home. The neck and arm bindings establish the physical outline; the club name is the chest print; the current record occupies the position normally taken by a jersey number, with an explicit wins–losses label; matchup, player, franchise and league facts remain in the garment through the hem. The record is not an invented player number. There are no equal player cards, hidden primary views, hero/feature panels or additional common footer.

The home answers: What is Huff n’ Puff’s current context, who is the opponent, which roster player can I inspect, and where do I go next? The primary action opens the real team profile. Native links also reach the player profile, Stocks, Intel, History, the two nearby clubs, Teams and league tools. The header preserves direct Stocks access. My team is the existing destination, not a claim of a real signed-in session.

Selected content: Huff n’ Puff / GriffinHealy; synthetic 2026 record 1–0; Week 3 away matchup against Josh Diddy’s Roster, with Huff’s null score labelled Pending and the opponent’s supplied 105.5 points; Donovan Mitchell / SG / 131 modeled FAAB value; the completed 2025 season at 10–11 and eighth; papichooter/Luka Dončić and NeuralNets/Giannis Antetokounmpo as nearby club entry points. No personal totals, scores, news or player availability were inferred.

All substantial content is initially visible in normal document flow. The native disclosure contains supplemental provenance only. Synthetic data and its Nov 12, 2026 source period are labelled visibly at the top; the expanded source note explains future dating relative to Oct 30. No draft weekly edition, forecast or AI result is presented as current truth.

## Actual reads and applications

- `qa/homepage-browser-20/AUTHOR-CONTRACT.md`, own `FACTS.json`, repository `AGENTS.md`, and `ARCHITECTURE.md` (overview plus relevant data, surface, UI, environment and account contracts). This is isolated QA, with no production source, data access, account, database or network execution added.
- `.agents/skills/goat-hoopers-design/SKILL.md`; `references/navigation-accessibility.md`; `DESIGN.md` controls, responsive/navigation and acceptance guidance. Used native destination links, visible focus, a semantic main/h1, a skip link and a nonmodal native disclosure. Production palette/primitives and mobile layout were explicitly outside this experiment’s constraints. Read `src/ui/siteDestinations.ts` and route references in current shared shell files to verify existing destination names; no implementation was imported.
- `qa/homepage-structures/reference-notes/craft.md` as the resolved primary reference index.
- Actual [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), opened Oct 30, 2026. Applied the client-specific whole-page idea and content-derived structure. The jersey governs the full composition. Did not use a prescribed section count, palette/font bans, installation, scripts, theme drawing or marketing anatomy.
- Actual [Hallmark macrostructures](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/macrostructures.md), opened Oct 30, 2026. Read the six-axis fingerprint as a vocabulary for describing a completed composition. Fingerprint: centered chest print; a single shaped object with changing internal spans; stitched and bound seams; typographic links; inline roster portrait; no reveal. No catalog shape was imported, and no stock SaaS section deck was applied.
- Cloud environment runtime skill, for selected environment readiness and credential boundaries; no credentials were read or used.

No peer, pilot or old prototype implementation was read. No external code, asset or font was downloaded, and no package or service was installed.

## Assets and controls

The approved black GOAT horizontal SVG is served unchanged. The local approved Donovan Mitchell portrait is used with CSS grayscale/luminosity treatment. Fonts are the existing OFL Graduate and DM Sans files from the supplied local catalog. Jersey geometry, bindings and mesh are original local SVG/CSS. Meaningful text remains HTML.

There is no animation or entrance reveal. Reduced motion therefore retains the full experience. Links are native anchors. The source label uses native details/summary, with Escape closing and restoring the summary’s focus. The fonts-ready hook sets `document.documentElement.dataset.browserStudyReady = '09'`. Structure mode changes only color/texture treatment, preserving all text, controls and geometry.

Desktop is the authored scope. 1120 and 1440 layouts keep the shaped garment. Intrinsic `em` minimums and wrapping let the matchup and roster reflow for enlarged text. No phone layout was designed or tested.

## Bounded browser evidence

Headless system Chromium `/usr/bin/chromium`, Playwright already present in the environment, static review server on port 4207. No browser/package installation. Two bounded check screenshots are retained locally as `check-1440.png` and `check-enlarged.png`; root owns the final review captures.

- 1440 × 1000 and 1120 × 1000: document scroll width equals viewport width; both approved images loaded; no page script errors. Document heights were 1811 and 1772 CSS px respectively.
- At both widths, designed and neutral stages had identical bounding boxes for the main, h1, every primary section and hem.
- 1120 × 1000 text-only stress: snapshot every HTML/body/descendant computed font size, then set twice that value inline. Result: scroll width 1120, document height 3489, no measured descendant horizontal overflow. Visual review confirmed intact numeric values and readable flow. This is text enlargement, not browser zoom.
- Tab reached the visible skip link; Enter focused `main#team-home`. Opening the native source disclosure then pressing Escape closed it and focused its summary.
- Emulated reduced motion was detected. There are no moving elements in either preference.
- Source contrast roles are high contrast cream/gold on burgundy, or dark text on a pale ground. Neutral-stage text remains dark and readable; its final color-only adjustment did not change layout.

Not claimed: live/authenticated routes, backend behavior, browser Back/Forward on the production app, physical devices, screen-reader testing, phone behavior or a universal accessibility audit. No release/deploy action was attempted. No remaining source blocker.
