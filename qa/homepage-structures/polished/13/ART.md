# Varsity folio — study 13

Frozen full-art candidate in `qa/homepage-structures/polished/13/`, built only from own corrected `structural-revisions/13/`. Both earlier folders remain intact. This handoff is ready for independent capture/review, not final user approval or a production release.

## Art and interaction contract

**User question:** What is happening for my club now, and which part of the league should I open next?

**Primary action:** Open a named full-width folding programme spine. The source spine becomes the origin of one integrated spread and the prior spread closes. Unequal folded heights, different title origins and the named neighbouring folds retain the accepted book architecture.

**Assigned direction:** Varsity folio — navy, athletic gold and white; Graduate chapter identity and DM Sans contents. Read only allocation entry 13. No other author's art or allocation entry was inspected.

Graduate gives the spines their collegiate character; content and controls use DM Sans so names, decimals, provenance and long rosters stay readable. The programme has deliberate flat planes: gold fore-edge, navy selected fold, white matchup page and navy AI/scouting leaf. The dated reader has a navy narrative leaf beside white player stories. The planes are part of one open spread, with no detached cards, sticker badges or illustration imposed on every view. Approved player portraits keep their actual colour and a head/shoulder crop to support identity. No court image is added as ornament.

The compact phone model remains two header rows followed by a gold fore-edge and the active spine. Synthetic concept is visible and expands full provenance; Destinations expands in normal flow. Phone retains the binding edge, real unequal spines, explicit Fold book and neighbouring fold actions. Scores, roster lists and standings retain the corrected narrow layouts. At 320px, names/values wrap and teams can read one after the other. Nothing depends on drag, hover or a new motion framework.

Local `tokens.css` owns the literal font/paint declarations and named type/spacing roles. `style.css` consumes those roles; content foreground/muted/focus roles change deliberately on navy. The palette is navy `#102c4c`, gold `#f4c34e` and white `#ffffff`, with two legible content-muted roles and a control-line role. No gradient, opacity stack, shadow stack, tracking hack, repeated content-rule forest or decorative chapter code. Functional numbers such as dates, standings and scores remain.

## Sources read and applied

Read selectively as primary reference guidance on 2026-10-29, without installing skills, running their scripts or adopting their global workflow requirements:

| Exact primary reference | Read / applied decision |
| --- | --- |
| [Hallmark direction](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md) | Custom direction, subject specificity and a single idea throughout. The whole experience remains an actual folding league programme; names, scores, roster quotes and reader actions carry its identity. The reference's generic shape/palette restrictions yield to the explicit assigned palette and accepted architecture. |
| [Hallmark redesign](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md) | Read What a redesign keeps, Depth and relevant Build guidance. Kept facts, wiring, routes, state hooks and prior files. Art changes the visual system within the accepted folds; it does not quietly replace the architecture. |
| [Elaya redesign-existing-projects](https://raw.githubusercontent.com/elayadesign/redesign-skill/main/skills/redesign-existing-projects/SKILL.md) | Read diagnostic, typography, colour and layout audit guidance. Use the assigned two useful faces, medium/bold hierarchy, tabular data and purposeful asymmetry. Avoid equal card columns and accidental default styling. Its prescribed palettes, gradients, tracking suggestions and scripts do not override this task. |
| [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt) | Read mobile/content/navigation adaptation and verification guidance. Preserve tasks and 44px controls, retain fore-edge/back/fold book on phone, keep the actual information architecture and distinguish Chromium emulation from device proof. |
| [Emil animate](https://www.ui-skills.com/skills/emilkowalski/animate) | Read frequency/purpose gates, property/tool choice, interruption and reduced-motion guidance. Frequent chapter browsing stays immediate; there is no decorative entrance or animated score. The same explicit folds and focus return work with keyboard and reduced motion. |

The supplied local `reference-notes/craft.md`, ART-BRIEF and the previously read Goat Hoopers hierarchy/navigation/motion skill informed scope. No external markup, code, asset or runtime dependency was copied.

## Local fonts and files

Both existing font files are SIL Open Font License 1.1 according to the verified local catalog. Their checked bytes match that catalog:

```text
971222b309851d86f2513f89b510dc52d52ef7798b5f43af2c6f58d43df568e5  assets/fonts/graduate/Graduate-Regular.ttf
8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d  assets/fonts/dmsans/DMSans[opsz,wght].ttf
```

Four source files: `index.html`, `tokens.css`, `style.css`, `atlas.js`. Fonts/assets are referenced locally and remain unmodified. Ready13 is set after `document.fonts.ready`, so captures use the actual local faces. The native capture API remains seven substantive states: `week`, `club`, `league`, `stories`, `archive`, `tools`, `closed`.

## Retained facts, paths and states

Explicit imports remain `{inventory,data,mode,aiState,esc,money}` from `../../data.js`. Common fixture is unchanged.

- Current Week 3 keeps both clubs/managers/current records, a known 0.0 distinct from null Pending and the incomplete state. Exact current checked time remains in expandable provenance.
- All five saved AI rows retain returned choice, named probabilities, confidence, generated time, model/prompt, input/weekly snapshots, evidence, baseline and status. First away choice stays 35%, the other club 65%, independent confidence 20%. Stale and missing remain explicit; no generation on render.
- Member quote retains identity/standing/count/actions, modeled FAAB subtotal, pricing basis/time, priced/unpriced/roster coverage, value rank, top three and all 24 roster values. All form/recap/news/move fields remain. Public constructs no private subtotal, scouting or My team content.
- Ten faces, all ten team directory entries, all 228 unique player references with position/NBA/profile routes, functional search/sort and all ten rank/W/L/PF standings remain. PF stays `pointsFor/100`; dated previous-season attribution remains separate.
- Both dated draft archives, the coherent historical final, all three exact player spotlights, opinions/stats/periods/selection reasons, happenings and source dates/routes remain. The known `home.edition` 1/2 ID versus 1/5 prose conflict is still handled using coherent current data and `data.archive`; no source fixture is corrected or combined into a new result.
- Recorded value history and Lineup Power remain unavailable, with no invented line or ranking. All route destinations, footer provenance and source links remain. Final corrected-versus-polished anchor comparison found no missing or added destination URL.

The prior corrected [STRUCTURE.md](../../structural-revisions/13/STRUCTURE.md) contains the detailed family-by-family map, which remains applicable.

Product-copy changes are limited to presentation/prototype wording and punctuation: removed visible chapter-order numbers, replaced Member/Public atlas with Member/Public folio, removed structural-study/grayscale footer wording, changed invented metadata separators to punctuation, clarified slate versus pick status, removed duplicate punctuation around evidence and moved the implementation-specific fixture-conflict explanation from product copy to this document. All supplied source content is rendered from the same fields.

## Navigation and still-motion decision

Native spines preserve `aria-expanded`, `aria-controls` and their IDs. The previous spread becomes hidden and leaves keyboard traversal. Arrow keys/Home/End move spine focus; Enter/Space open; Escape/Close/Fold book close with origin focus return. Previous spread and browser Back/Forward restore chapter state. Header disclosure Escape closes its own disclosure and returns to its summary. Archive selection returns focus to its selected button. Every control is labelled; there is no modal trap.

**Motion decision:** no scene animation. Chapter selection is a frequent reading/navigation operation; immediate plane replacement, named neighbours and source-focus return provide its continuity. Pointer, keyboard, reduced motion and capture API all reach the same still states. There are no timers, autonomous loops, delayed text, entrance sequence, scrolling reveal or score tween.

Actual representative path exercised with pointer at **1440 and 390px**:

1. Default Week → fore-edge Next: Your club. Club opens at its spine; Week hides; focus is `spine-club`.
2. Previous spread → Week. Find another club → League index; Week hides and focus is `spine-league`.
3. Destinations disclosure → Open the destinations chapter. The menu closes, Tools opens and focus is `spine-tools`; its next-fold action returns to Week.

Equivalent keyboard/reduced path: focus Week spine, ArrowDown, Enter, Escape; focus returns to `spine-club` with no active spread. Browser Back restores club; Forward restores closed. Under live reduced-motion emulation, the same pointer fold opens club and `document.getAnimations().length` is 0. No `motion-demo.json` is needed to claim a transition; this is an explicitly still concept with a tested real navigation path.

## Final checks

Installed Playwright and local Chromium against root's 4207 server, final source below:

- **252 content reflow cases:** member/public × ready/stale/missing AI × seven actual API states × 1440/390/320 CSS px × 16/32px root text. All active native data disclosures expanded. No horizontal page overflow, page errors or remote runtime requests.
- **108 additional header cases:** same editions/AI/width/text settings with provenance open, Destinations open and both open. No overflow. Root32 is a 200% text test, not a claim about physical-device/browser zoom behaviour.
- Both local faces reported loaded. Member's 14 and public's 21 rendered image elements all loaded with nonzero natural width. Long club/player names were present through expanded directory/AI states.
- Final phone exposed links/buttons/inputs/selects/summaries across seven states measured at least 44px high at 390px.
- Actual exclusive fold, internal cross-links, Previous spread, browser Back/Forward, keyboard arrows/Enter/Escape and focus return passed at 1440 and 390px. Search Embiid returns one 24-player club and opens its roster; Clear restores ten. Name sort starts team 6. Counts are 228 player references, 24 member values and five AI rows.
- Public DOM lacks private subtotal and scouting content. Stale/missing labels passed. The first AI disclosure renders both 35/65 probabilities and separate 20% confidence without changing the returned choice.

Measured rendered primary colour pairs, using computed foreground and first opaque rendered ancestor background:

| Rendered pair | Contrast |
| --- | ---: |
| White content/header on navy | 14.13:1 |
| Gold identity/Synthetic concept on navy | 8.58:1 |
| Navy fore-edge navigation on gold | 8.58:1 |
| Navy matchup names on white | 14.13:1 |
| Muted AI content on navy | 10.78:1 |

These measurements establish the sampled opaque text pairs, not a universal accessibility audit. Focus uses navy on white/gold and gold/white on navy; controls retain explicit states independent of colour.

Final normal-text opening geometry:

| Width | Header height | First spine top | First team top |
| --- | ---: | ---: | ---: |
| 1440 | 74px | 118px | 241px |
| 390 | 94px | 138px | 226px |
| 320 | 94px | 138px | 237px |

Own supporting snapshots: `check-1440.png`, `check-390.png`, `check-320.png`, `desktop-check.png`, `phone-check.png`, `club-check.png`, `stories-check.png`, `closed-phone-check.png`. Root's independent captures/review are still the evaluation evidence.

Final source SHA-256:

```text
db37282add13cc675509e79a04c8c34cea6fdc3c4954d1a3e459dd7220283f99  index.html
36d293bd30ab6455054287b45c57f2746d128bb832bffbf532f513d99572e2de  tokens.css
4533d897af259c9516a383c99f83c51ce6a250341690550841364616fc899863  style.css
ca152d90703e606b09589da0bd4a53b3b41541b150427e0c2eddaa76cacb8b8c  atlas.js
```

The corrected source hashes still match its frozen handoff (`f50144…`, `d21c94…`, `632a06…`); original wireframe source/images were not written.

**Limits:** no physical-phone/Safari/Firefox or screen-reader pass; no exhaustive rendered contrast audit of every control interaction; live auth/provider facts and production destination applications unverified. Direct URLs are preserved and internal chapter paths are tested, but the local static host is not proof of those destination applications. This isolated static artifact needs no application build or release action. No task action was denied or left uncertain. Independent art review and user acceptance remain pending.
