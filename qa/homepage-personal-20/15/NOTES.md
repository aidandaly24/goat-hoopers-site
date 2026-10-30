# 15 — Open gym: source ready and frozen

The accepted continuous daylight gym is built in this directory only. The full page uses an upper wall, roster bench, shared playing floor, and exit threshold as its layout. The people/roster side and court sit alongside one another at normal desktop text size; their intrinsic text-relative widths wrap into a readable sequence when enlarged. This avoids squeezing enlarged names into narrow columns. All content remains ordinary HTML in document flow.

## Run and states

- Reaves default: `http://127.0.0.1:4207/qa/homepage-personal-20/15/`
- Neural: append `?persona=neural`.
- Guest: append `?persona=guest`.
- Structure: append `&stage=structure` to a persona query, or `?stage=structure` to the default.
- Ready selector: `html[data-personal-study-ready="15"]`; persona selector: `html[data-persona="reaves|neural|guest"]`.

`index.html`, `style.css`, and `app.js` are self-contained presentation source. Only the data export in `../fixture.js` is imported. There are no shared presentation helpers, external service calls, authentication simulations, edits, dependencies, git actions, or publication.

## Product and source decisions

The returning member first sees their identity/current record and actual supplied completed-week sample. Reaves gets five players; Neural gets three, without becoming a missing-data error page. The court contains the member's real fixture pairing and all four other pairings. Guest instead gets all ten public team identities/managers and all five games, plus an actual GOAT sign-in exit. Footer navigation retains every fixture destination, with explicit real-site exit context.

The heading voice changed from the discovery candidate to **Archivo Black**: broad recreation-gym signage, used only for headings. **DejaVu Sans** handles reading, controls, and lining-tabular data. Names wrap; text is never shrunk to fit. The existing Archivo Black file is used directly, with its existing OFL notice retained in the shared licensed font directory. No font was installed or downloaded.

All geometry is original CSS/inline SVG. The exact authorized GOAT SVG is preserved, and two small existing player portraits are used for identity. There is no new illustration asset file, character/figurine family, WebGL, canvas, large photograph, animation requirement, or copied dashboard motif. The still version is the full experience.

Verified reference reads are recorded in PLAN.md; the concrete build effects are:

- [Frontend UI Engineering](https://github.com/addyosmani/agent-skills/blob/main/skills/frontend-ui-engineering/SKILL.md), relevant partial sections on task contracts, unequal composition, local state, semantics, focus, and unavailable states: implemented distinct spaces with native controls and URL-addressable inspection, rather than equal cards or a static illustration with hotspots.
- [Apple Design](https://www.ui-skills.com/skills/emilkowalski/apple-design), relevant partial §§7, 12, 14, 15, opening of 16: preserved a stable spatial origin/return for inspection, separated reading/control/data scale, and let the architecture reflow with text. No gesture physics, spring dependency, or glass effect was adopted.
- Actual homepage, membership, domain, route, ARCHITECTURE, DESIGN, assignment, and full data-only fixture reads from discovery stand. The build preserves their access and provenance limits while independently choosing its composition and typography.

## Truthful data behavior

The visible label and accessible source disclosure identify the entire current scenario as synthetic, fixed at October 30, 2026, 08:30 UTC. Player samples retain Synthetic completed Week 2 and October 19–25, 2026, with the exclusive October 26 boundary explained in source notes. Game counts, injuries, and missing-player performance are not inferred.

Reaves: 24/24 quotes, 1,095.25 modeled FAAB; five evidenced players. Neural: 16/22 quotes, 1,622.00 labelled subtotal; six named Unpriced players; three evidenced players. Quotes retain their October 30 08:10 UTC calculation. No value rank or history line is invented. Neural's score says Score not returned while papichooter's zero remains 0 recorded. Reaves' saved 56%/44% estimate has its October 26 source instant, synthetic/uncalibrated label, and separate confidence 0.35. Other views do not inherit that estimate. Neural's 2025 reference names the previous manager and QBs Gremlins in its initially displayed history line.

## Bounded verification performed

Command: `node qa/homepage-personal-20/15/browser-check.cjs` from the repository root. It uses the existing Playwright package and `/usr/bin/chromium`; nothing was installed. Final result: **pass**, 12 layout/text cases, three substantive journeys, zero browser page errors, and zero nonlocal requests. Full machine results are in `browser-results.json`.

The matrix covers all three personas at 1440×1000 and 1120×1000, at 100% and 200% root text size. Every case has one H1, five visible-in-flow games, the correct persona/ready state, and no horizontal document overflow. Both member quote disclosures were actually expanded in every applicable case; counts remain 24/22 with zero/six unpriced rows, and expanded lists also have no horizontal overflow. Guest has ten public directory entries and no private quote, sample, or saved-model UI.

At normal text size, all five Reaves evidence rows and all three Neural rows begin in the first 1000px viewport at both widths. The primary matchup inspection control begins at y=717/727/753 for Reaves/Neural/guest at 1440px, and y=706/715/737 at 1120px. The first fold therefore offers useful local work.

The first three journeys use stable selectors and were exercised as follows:

| Journey | Stable selectors | Observed result |
|---|---|---|
| Reaves reads a player and returns, then checks saved matchup context | `[data-evidence-player="1444"] button`, `#inspector-title`, `#primary-matchup-action` | Damian Lillard shows 42.5 and the exact completed period. Open focuses the dialog heading. Back closes and restores the originating control; Forward reopens; Escape closes/restores. Matchup inspection shows 56% and separately labelled 0.35 confidence. |
| Neural searches an unpriced roster player, then checks the missing score | `#quote-summary`, `#quote-sort`, `#quote-filter`, `[data-quote-player="4808"] button` | Value order starts with Rudy Gobert. Searching Ryan yields one Unpriced row. Ryan's inspection preserves Unpriced and Evidence not supplied; Escape restores that row's control. Main matchup inspection distinguishes Score not returned from 0 recorded and has no saved estimate. |
| Guest inspects Neural's public context and finds real account entry | `.directory-team button[data-team="8"]`, `#account-link`, `#source-notes` | Public inspection visibly qualifies 2025 as the previous manager/QBs Gremlins. Escape restores the team control. Sign in points to the actual GOAT login. Every existing non-Home route is in the footer; the source link opens and focuses the disclosure. |

Additional bounded checks: native demo selection changes query and document persona; each structure state reaches ready with all five games; reduced-motion mode retains working matchup inspection and Escape. No external account/tool link was followed or represented as production-verified behavior.

Local full-page visual checks were generated and inspected for all personas at 1440px, Reaves at 1120px, and Neural at 1120px/200% text. Enlarged text initially exposed cramped columns; the final intrinsic-wrap layout resolved this, and the same complete matrix/journeys passed again afterward. `check-*.png` files are local verification evidence; root owns final captures and packaging.

Measured foreground/background contrast for the implemented flat colors: body/wall 12.64:1; secondary/wall 5.85:1; secondary/floor 4.85:1; court text 6.94:1; court secondary 5.82:1; court accent 4.51:1; bench text 8.46:1; bench metadata 6.04:1; footer secondary 5.27:1. Focus uses a visible contrasting outline, with a separate light outline on the dark court. This is not a screen-reader or device-lab certification.

## Frozen source fingerprints

The browser checks and local final visual checks used these source bytes:

```text
865c086fa371cf3ca3a17dbf07f0b691b89b9d4565bae5457555ad71a4cc91b0  index.html
fd8627ac35fe936559b8f615f54c0b58e3e1f8ee1123a8c447946da30cba3689  style.css
cdf399b01207d73abf0e0ecac5105d61f04953789a6cb43b494c35d6fdda9984  app.js
```

Source is frozen for root capture/review. No remaining functional blocker is known. Only this author's directory has been written; no peer source was opened.
