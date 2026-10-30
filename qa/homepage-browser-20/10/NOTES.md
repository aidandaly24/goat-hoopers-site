# 10 · Value field

The personal homepage treats a roster as a collection of different kinds of evidence. A continuous peach field lets the roster quote, the open portrait quote, two staggered supporting prices, a completed-week table and an EMA annotation share space without turning into cards. The small Week 3 pairing closes the actual personal question rather than adding a generic league-content footer.

## Surface contract

- User question: What is my roster worth, and what player evidence should I read alongside that value?
- Primary action: Open the league’s prices, with direct player and roster destinations beside the relevant evidence.
- States: Synthetic current fixture; known 0 versus missing score; complete 24/24 price coverage; Week 2 verified participation cohort; unknown availability; native provenance disclosures.
- Desktop: 12-column open field at 1440 and 1120. Text follows natural document flow; no inner scrollers or hidden primary content. No phone design was requested in this round.
- Forbidden patterns: invented prices, full-roster performance inferred from five players, current value masquerading as available waiver funds, price sparklines without history, fake quote attribution and stock-terminal/card-grid scaffolds.

## Reads and application

Read `AGENTS.md`, `ARCHITECTURE.md` (whole read plus focused personalized-home, FAAB valuation and data/access contracts), `DESIGN.md` relevant composition/type/navigation rules, `.agents/skills/goat-hoopers-design/SKILL.md`, its visual hierarchy and navigation/accessibility references, the local author contract, own `FACTS.json`, the approved font catalog and the resolved `qa/homepage-structures/reference-notes/craft.md` index. The experimental contract authorizes independent visual tokens and desktop-only work; production source, primitives and design authority remain unchanged.

Actual primary documents read through the index:

- [Hallmark custom direction](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md): applied the principle that the client’s own content should determine the whole composition. The numbers are the visual material throughout; the page does not stop at a strong opening. No scaffold, palette ban, section quota, font lottery, script or installer was adopted.
- [Elaya redesign guidance](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md): applied the diagnosis of equal-card symmetry and default sidebar layouts, tabular numerical alignment and explicit native focus. Its fixed font/value catalog, sales anatomy and blanket animation were not adopted.

The existing approved GOAT SVG and Embiid portrait are used unchanged. DM Sans handles prose, Space Grotesk prices/names and Barlow Condensed the single position marker. All are existing local OFL bytes; no assets or dependencies were downloaded. No external source markup or scripts were copied.

## Data decisions

Everything comes from own supplied fixture. One compact top label explicitly identifies this as a synthetic study with the November 12, 2026 snapshot. Native details explain that this is future-dated relative to review. No live or authenticated data work occurs.

The roster total is $1,095.25 modeled FAAB, 24/24 priced, second of ten. The three leading quotes are Embiid $137.50, Edwards $124.50 and Şengün $108.25. No historical percentage is printed because the palette does not provide a baseline period for it. Five Week 2 player totals are separated from the EMA fantasy-points/game measure. November 2–8 is the inclusive human-readable version of the supplied November 2–9 end-exclusive period. No missing score becomes zero: Reaves has 0, Ware is Pending.

## Interaction and structure stage

All substantial content is visible by scrolling the document. Only explanatory provenance uses native details. Focus rings are visible and the focus-only skip link reaches main. There is no animation or initial reveal, so still and reduced-motion presentations contain the same evidence. `?stage=structure` changes semantic color variables and image grayscale only. Geometry, text, portrait dimensions, destinations and content remain identical. Readiness is `document.documentElement.dataset.browserStudyReady === '10'` after local fonts finish.

## Verification · frozen source

Bounded local Chromium checks used the existing system `/usr/bin/chromium` through the installed Playwright library, with the existing repo-root server on port 4207. No browser or dependency was installed.

- At 1440 × 1000, document width was exactly 1440 and full height 1589; at 1120 × 1000, width was exactly 1120 and full height 1539. No element extended outside the viewport horizontally. Both assets loaded and all three font faces reported loaded. The two full-page renders were visually inspected.
- At 1120, captured computed font sizes were doubled on every HTML element. Document width remained 1120 and height became 3205. Large price decimals wrap into their own lines; text stays in normal document flow. The full enlarged render was visually inspected. No text-size reduction or special test state exists.
- At 1120, every `main` descendant’s rounded x/y/width/height tuple matched exactly between designed and `?stage=structure` states.
- Keyboard Tab reached the visible outlined skip link first; Enter navigated to `#home`. Each native summary opened using keyboard Enter. Expanded disclosures caused no horizontal overflow. Reduced-motion preference was active during this pass.
- There is one semantic `main`, one `h1`, and all 21 links have names and nonempty destinations. Every external GOAT path used has an existing matching source route. No page JavaScript errors occurred.

Local visual inspection images: `/tmp/goat10-1440.png`, `/tmp/goat10-1120.png`, `/tmp/goat10-enlarged.png`. Root owns the delivery capture set. Live-route navigation, physical devices and assistive technology were not tested and are not claimed. Production typecheck/build were not run for this isolated static QA page.

Source-ready URL: `http://localhost:4207/qa/homepage-browser-20/10/` (neutral: append `?stage=structure`). Source is frozen for coordinated capture; no blockers remain.
