# 17 — Season companion

Source-ready independent QA website. All authored presentation and evidence live in `17/`. The shared fixture is imported for data only; there are no shared presentation imports, new dependencies, installations, production changes or remote writes.

## Use and architecture

- Reaves: `http://127.0.0.1:4207/qa/homepage-personal-20/17/?persona=reaves`
- NeuralNets: same URL with `?persona=neural`.
- Guest: same URL with `?persona=guest`.
- Structure: add `&stage=structure` to any persona. Content, fonts and geometry stay identical; colors/images become neutral.
- Default is Reaves. `html[data-persona]` and `html[data-personal-study-ready="17"]` expose the settled state.

The accepted revised architecture is a reference website: persistent site index and one broad work lane, a shallow current-game ribbon, an open task workspace, a substantive dated franchise entry and all five league fixtures. The original game-plus-season content columns were retired before code. No peer sources were inspected.

Reaves leads with five owned-player completed-week receipts. Neural leads with actual current-opponent research and then its three owned-player receipts; missing pricing is supporting context, not a repair task. Guest receives public fixtures, ten franchises' dated 2025 finishes, league structure, useful public destinations and the real sign-in exit. All 15 fixture destinations are discoverable. The current/private account is never inferred from the demo query.

Memory is useful in ordinary records and team inspection. Every NeuralNets prior record carries the previous-manager/QBs Gremlins qualification. Current zero versus missing, limited evidence, partial modeled subtotal, unavailable saved model and absent valuation history remain separate. All current quantities are visibly synthetic. No lineup, trade, auth, AI, market, notification, API or storage behavior is simulated.

## Primary source applications

Both assigned references opened successfully, and neither was used as an art-direction template:

- [Hallmark Redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): complete 76-line official raw file was read during discovery. Preservation of facts, routes and exact brand led to the complete navigation/footer and source-qualified data. App-screen recomposition helped keep current work ahead of any hero. No reference scripts were run.
- [pbakaus Adapt](https://www.ui-skills.com/skills/pbakaus/adapt): complete displayed skill body and inline responsive reference were read. Upfront desktop information and persistent navigation became the broad task lane plus index. Content-driven reflow means enlarged text grows controls and data columns instead of being shrunk. No installation.

The actual homepage, membership/domain contracts, inventory and fixture were read as listed in PLAN.md. ARCHITECTURE data/access boundaries and DESIGN truthful-content/accessibility requirements are retained. Production visual prescriptions do not govern this isolated QA composition.

## Typography verified in this executor and Chromium

Font availability was checked with `fc-match` and then **Chromium CDP `CSS.getPlatformFontsForNode` on actual rendered elements**, not computed CSS family names alone. `evidence/checks.json` records the platform results and glyph counts.

| Role | Actual rendered family / PostScript evidence | Use |
| --- | --- | --- |
| Heading | URW Bookman / URWBookman-Demi | Non-condensed mixed-case headings, 28–38px |
| Reading | Open Sans / OpenSans and OpenSans-Bold | 16px prose, compact supporting explanations |
| Control | Custom Space Grotesk Light / SpaceGrotesk-Light | Existing local variable face, CSS weight 600, 14–15px buttons |
| Data | Noto Sans / NotoSans-Bold in sampled score | Proportional sans with tabular figures, labelled points/FAAB/coverage |

Filesystem resolution confirmed `/usr/share/fonts/opentype/urw-base35/URWBookman-Light.otf`, `/usr/share/fonts/truetype/open-sans/OpenSans-Regular.ttf` and `/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf`. The heading's actual browser selection is Demi, as above. Space Grotesk uses the existing cataloged font under `qa/homepage-structures/assets/fonts/spacegrotesk/`; its font metadata confirms a `wght` axis from 300 to 700. CDP reports its internal default Light name even when the variable weight requested in CSS is 600. Existing OFL files remain in place, unchanged. No font bytes were downloaded or copied.

Body copy and ownership qualifications have a normal reading measure. Essential quote anchors are 14px; fixture records are 13px; names remain 14–16px. Smaller date/status metadata is secondary. Neither condensed display nor monospace is the default data voice.

## Bounded local verification

Run `node qa/homepage-personal-20/17/check.cjs` with the existing Playwright package and `/usr/bin/chromium`. No browser download is required. The checked server is the existing static server on port 4207.

- All three personas at 1440×1000 and 1120×1000: ready/persona attributes, five visible fixture rows, ten fixture identities, all 15 footer destinations, intended member evidence counts and no page overflow.
- All three personas at both widths with every rendered text size doubled to 200%: no page overflow or detected visible text-box overflow. This is an explicit DOM text-enlargement stress check, not a claim about OS text scaling or every browser's zoom implementation.
- Receipt opens; browser Back closes and restores exact opener focus; Forward restores the receipt; Escape closes. Quote name filtering, the six-unpriced filter, current-opponent record inspection, known-zero versus unavailable matchup explanation, and the labelled persona selector were exercised.
- Structure mode has identical document height and section geometries for all three personas at 1440px. Reduced-motion mode retains all five fixtures and the three Neural receipts.
- No JavaScript page errors or non-local requests during the checks. No live-site exits were followed.
- Native dialog provides labelled Close, Escape and modal focus behavior. Core content remains in normal document flow. The long quote/roster lists are secondary inspection depth.
- Reaves 1440, Neural 1120 and Guest 1440 local screenshots were visually inspected. Author screenshots are supporting evidence; the coordinator owns final captures.

Representative contrast calculations: main reading 14.30:1; mauve supporting text 5.53:1; fixture status 5.37:1; cream on plum 12.72:1; main focus 6.60:1. Focus on dark chrome uses the lime role (10.88:1 against plum). This is not a full accessibility audit.

No phone or physical-device check, screen-reader session, other browser engine, live authentication or backend flow was performed. These are outside this desktop synthetic study and are not claimed as tested.

## Stable selectors

`[data-testid="homepage17"]`, `[data-testid="persona-select"]`, `[data-testid="current-matchup"]`, `[data-testid="member-work"]`, `[data-testid="quote-summary"]`, `[data-testid="franchise-record"]`, `[data-testid="league-games"]`, `[data-testid="source-explanation"]`, and `[data-testid="inspection"]` are stable. The guest has no private member-work/quote-summary markers. Shared local inspection triggers use `[data-inspect]`; the dialog's explicit Close uses `[data-close-inspection]`. Quote controls are `#quote-search` and `#unpriced-only`.

No remaining implementation blockers. Presentation source is frozen for coordinator capture/review.

## Targeted polish — navigation labels

Removed the decorative 01/02/03/04 prefixes from the left on-page navigation. Every useful label, anchor destination and ordering is retained; focus behavior and the reference-book architecture are unchanged. Actual font choices and all substantive content are unchanged. `node --check app.js` passed, and a source comparison confirmed the four prefix spans were the only presentation-code removal and all sidebar hrefs stayed in order. The full unchanged browser matrix was not rerun; its existing report and screenshots describe the prior numbered navigation. `evidence/source-sha256.json` now identifies the cleaned source. Frozen for coordinator recapture.
