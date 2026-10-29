# 04 — Broadcast desk

Frozen first full-art submission for independent captures/review. Built from this author's frozen `structural-revisions/04/`; both earlier author folders remain unchanged. This is a synthetic design concept, not production or final user acceptance.

## Design contract

**User question:** What is happening in my selected game, and which source should occupy the program next?

**Primary action:** Put one of five actual fixture games on program, or switch source while retaining the selected game's score context.

**States:** same ready `04` and `window.goatStudy` API; eight member states / seven public states, plus five game choices, both dated editions, league rosters/standings/faces, search/sort and disclosures. Current data, stale/missing results, known zero/null Pending and the member/public distinction stay intact.

**Narrow layout:** one native labeled source control and selected-score strip form the sticky phone broadcast controls. Opening the strip exposes all five games. A game selection closes it, updates the actual program and returns focus with clearance measured from the control group's real height. One program remains below; every source is reachable without a repeated stack of desktop panels.

**Forbidden patterns:** fake LIVE status, decorative indices, nested bordered panel stacks, gradients, staggered reveals, opacity entrances, score tweening, autoplay, invented history/Power, unsupported player-stock queries and private member content in the public view.

## Art decisions

The assigned crimson / royal blue / white / almost-black direction is applied through roles rather than a repeated card theme:

| Role | Treatment | Job |
| --- | --- | --- |
| Source slate | Almost-black field; selected source has a crimson band | Persistent choice of program |
| Program | White reader; almost-black score field | Dominant current game or complete selected source |
| Current game context | Royal-blue band with week, game position and Incomplete | Identifies the displayed comparison without a fake live claim |
| Retained score rail | Cool pale surface; royal-blue heading and selected-row marker | Independent score context through other sources |
| Returned model choice | Plain crimson text plus explicit “Returned choice” label | Meaning remains available without color |
| Body / controls | Local variable DM Sans | Readable information and direct controls |
| Display / numbers | Local Barlow Condensed Regular; tabular numerals | Broadcast hierarchy and stable score columns |

The stylesheet was rewritten in the owned folder rather than extending the old grayscale overrides. All literal paint values are declared in `:root` semantic roles; outside that block there are no literal CSS colors. Font names occur only in the two named `@font-face` definitions and semantic family-role declarations; selectors use `var(--font-body)`, `var(--font-display)` or `var(--font-score)`. Spacing roles are declared locally. The remaining 31 old scattered color/font declarations are not carried forward as selector literals or renamed numeric paint tokens.

No tracking adjustment is used to force names into a line. Display leading allows wrapping. DM Sans uses real variable weights; the supplied Barlow Condensed Regular is used at its actual 400 weight. Rendered digits 0–9 each measured 50px in the same score style, with `font-variant-numeric: tabular-nums` computed. Approved portraits remain monochrome informational identifiers with a deliberate head/shoulders crop; there is no decorative court thumbnail.

## Repetition removed, facts retained

| Before | After | Why |
| --- | --- | --- |
| Selected rail row repeats returned team/probability/confidence already on program | “Saved decision on program”; complete pick remains in that row's provenance | Retains all five saved results while reducing duplication across roles |
| “Saved model pick” label plus a headline naming the returned team plus that same team in the probability row | One “Saved model decision” heading; the actual returned team is labeled in its probability row | Team choice appears once in the working decision view |
| Repeated independent-confidence sentence with headline punctuation | Aligned confidence label and actual 20% value | Keeps confidence distinct from the 35/65 split |
| Structural revision browser title / first provenance sentence | “GOAT Hoopers — Broadcast desk” / “Offline design concept” | Names the actual art submission; synthetic/date/non-authentication caveats remain |

Other rail rows still show their actual saved returned choice and probability/confidence. When another source is on program, the selected game's rail also shows those facts again because the program no longer duplicates them. The central returned choice is still the saved away team at 35%, never silently changed to the other side's 65%. All model/prompt/timestamp/input-null/evidence/probability qualifiers remain in their existing accessible disclosures. Stale and missing variants remain explicit.

## Exact primary guidance read and applied

Read directly on 2026-10-29, selectively for this assigned scope. These were source studies; no installer, scaffold, downloaded script or third-party runtime was executed. The explicit art brief, fixed architecture and allocated fonts/palette override prescriptive systems in the references.

- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md): the idea governs the entire experience and real content earns its space. Applied by maintaining source/program/score roles through the team, editorial and directory views, and using type/paint to explain their roles rather than adding a themed hero.
- [Hallmark redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md): preserve content, wiring and routes; distinguish a system change from architectural replacement. Applied by copying only the frozen owned source, preserving hooks/handlers/URLs and checking the complete unique-link inventory against that source.
- [Elaya redesign existing projects](https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md): diagnose typography, generic boxes, numeric alignment and weak interaction states inside the existing stack. Applied through the local font pair, tabular data, flat bands, native disclosures and direct hover/focus states. Its gradients, floating/translucent chrome, palette restrictions and blanket reveal suggestions are not adopted.
- [Emil design engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), animation decision framework and component-feedback sections: frequency and purpose determine whether movement is useful; repeated keyboard work stays immediate. Applied as instant switching, no entrance effects and visible native focus/selection feedback.
- Local `.agents/skills/goat-hoopers-design/SKILL.md` plus visual-hierarchy, navigation-accessibility and motion references were read again. The supplied `reference-notes/craft.md`, `ART-BRIEF.md` and only art-allocation record `04` informed the work; no other author's source or art was inspected.

## Fonts and assets

Only the two assigned local OFL families are requested. Their actual bytes were hashed and matched the local verified catalog:

- `assets/fonts/barlowcondensed/BarlowCondensed-Regular.ttf`: `583cec5da3b84bc4dc7c9c72e2a565c94d34e431518b19d7e250b7830ad5f996`.
- `assets/fonts/dmsans/DMSans[opsz,wght].ttf`: `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d`.

All existing approved logo and portrait references stay local. Readiness waits for the fonts. Ten league-face portraits and all three editorial portraits were decoded successfully during the browser check; no failed asset requests occurred. There are no remote font/module/image requests in this preview.

## Actual verification

Installed Playwright / Chromium, root-owned server, 2026-10-29:

- `node --check app.js` passed. Both named fonts loaded. No browser page errors or HTTP asset failures in tested flows.
- **270 state/size/variant combinations:** all eight member and seven public states; ready/stale/missing; 1440/390/320 CSS px; root 16px and 32px. Every combination measured no horizontal page overflow. Additional member detail checks opened the full 24-value list, first full roster and selected model evidence.
- **Content:** ten teams, 228 unique player references, 24 member values, ten faces and three editorial spotlights. Local Şengün search found his one supplied reference; team/player sort controls worked. Second archive date button opened “The title everybody’s chasing.” All seven public states in each variant were scanned for private subtotal/news/scouting patterns without a match.
- **Routes:** unique href inventories across all API states match the frozen source: member **266/266**, public **264/264**, zero missing links. The menu retains ten site destinations plus the comparison link; tools retain Free Throw and member roster actions. External production route behavior is not established by this static preview.
- **Desktop actual controls:** a source click changed the program and focused `#program`; selecting game 4 changed the actual current pairing. Opening My team retained that game in the rail. Enter on a focused source button and then a focused score row also changed the corresponding content and returned focus to `#program`.
- **Phone actual controls:** native source selection, rail open and game-2 selection worked; selection closed the rail and focused the program with 0px overlap relative to the sticky controls. Source select and rail toggle each measured 44px high at 390px. Menu/provenance Escape closes them and returns focus to summary. All current game scores, including 0.0/Pending, remain actual fixture values.
- **Reduced motion:** switching to reduced motion, selecting a different source, then changing the media preference back retained readable content; `document.getAnimations().length` was zero. There is no authored scene motion to disable.
- **Semantic scan:** zero literal colors outside the `:root` role block. Selector font families use semantic variables; only the two `@font-face` declarations name the loaded families.
- **Rendered paint checks:** solid token pairs match their rendered uses. Contrast ratios: main ink/white **18.55:1**, secondary text/white **6.44:1**, white/source **18.55:1**, white/crimson selection **6.65:1**, white/royal-blue band **8.56:1**, returned-choice crimson/white **7.94:1**; input boundary/white **4.15:1**. These bounded checks do not certify the complete site.
- One desktop and one phone diagnostic image were visually inspected outside the deliverable directory. Root owns the independent capture set and subsequent critique.

## Representative action path and motion decision

Pointer: choose My team in Sources, then select another game in the retained rail. The selected game replaces the reader immediately, marks the actual score row, and focuses the program. Keyboard: focus the same source/score button and press Enter; content and focus respond immediately. Phone: choose a native source, expand five games, choose one, and return to the focused program with both sticky controls available. The reduced-motion equivalent is the same still path. No animation was added merely for full-art status.

## Targeted Next game keyboard correction

A reviewer reproduced focus falling to `BODY` after Enter activated Next game, because the program replaced the button that held focus. The Next game handler now records whether its initiating button owns focus, advances the same selected game, and restores focus to the newly rendered Next game button only in that case. Restoration uses `preventScroll`; existing source/API focus behavior is unchanged. An unfocused programmatic click also leaves external focus alone. No layout, source, score, URL/history or data behavior was changed.

Targeted verification on 2026-10-29: **24 combinations** of member/public × ready/stale/missing AI × 1440×1000 / 390×844 × normal/reduced motion. In each combination, click Next game, focus its newly rendered control, then press Enter twelve consecutive times without reseeding focus. All **288 repeated Enter activations** advanced through the actual five-game cycle and wraparound, kept visible focus on Next game, kept the focused control within the viewport and below phone sticky controls, matched the selected score row, and preserved the source, URL and history length. No page errors occurred. API source loads and an unfocused programmatic Next click retained external Menu-summary focus; actual source navigation still focused the program and retained the selected game. This was a targeted keyboard check at normal root text; the earlier documented reflow checks remain the layout evidence because no markup/style changed.

Only `app.js` and this evidence note changed for this correction. Corrected `app.js` SHA-256: `531af50da9cd666d224fe1d586f1b7a170a6f53e750031d37b6f8bf3cea4b40a`. Root will refresh captures and independent critics will recheck this source; no independent acceptance is claimed here.

## Limits / freeze

Only `polished/04/index.html`, `style.css`, `app.js` and this `ART.md` were created/edited. Earlier sources, images, shared facts/fonts, root capture infrastructure, production, Muse and Git remain untouched. No install, provider call, remote write, new dependency or subagent was used. Primary guidance was read over the web as requested; it is not a runtime dependency.

This is source-ready for fresh captures and independent review. No screen-reader/physical-device pass, production build, actual auth-boundary validation, production routing or final acceptance is claimed. History/Power still have no connected producer, no line/ranking is invented, and the contradictory dated `home.edition` pair is not used to manufacture a correction. No implementation blocker remains.
