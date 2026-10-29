# Electric tactics court

Full-art QA implementation of study 02 after the corrected structural gate. Source is confined to `polished/02/`; the first and corrected versions remain unchanged. Ready for independent capture and review, not final user acceptance or production integration.

## Art decisions

The cobalt court is the working navigation surface. Its six positions keep useful matchup, value, standing, edition, directory and move information in place. Ice cyan indicates the selected position and traces its route toward the field-note reader: across the court edge toward the adjacent desktop reader, or down the vertical phone court toward the inline reader. The trace uses actual selected-target geometry; it does not assert a relationship between unrelated statistics. The reader repeats the selected position in a matching selection mark.

The reader is readable white with dark blue text, rather than another framed dashboard. It keeps dense lists, honest statuses, native disclosures and direct actions. Court geometry stays flat SVG, with no image wallpaper, 3D or Muse assets. Existing approved portraits identify the ten franchise players in their list; their crop favors the face and does not replace the names or values.

Oswald supplies condensed sport headings. Space Mono supplies primary scores, modeled values and numerical comparisons. Body text stays system sans at 16px. Headings have normal tracking and wrapping leading; reader headings size to their available width so “Standings” does not split mid-word at 320px / 200% root text. Narrow value/player rows and standings use more vertical space instead of squeezing names between figures.

All 34 local semantic font/type/color/spacing roles are declared in `:root` and consumed. Palette literals occur only in those role declarations; font names outside roles occur only in the necessary local `@font-face` registrations. No selector contains a scattered palette or font-family literal. No tracking or uppercase-transform rule is used.

The two font files are existing local OFL assets from the verified catalogue: Oswald variable and Space Mono Regular. Both matched the catalogue SHA-256 before implementation, and both loaded successfully in Chromium. No external assets, fonts, module imports, dependencies or services were added.

## Reference reading and application

Actual primary documents were read selectively during preparation, rather than relying only on the supplied reference notes:

- [Hallmark custom direction](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/direction.md): client-specific decisions must govern the complete experience. Applied to the whole court navigation/reader system, not an ornamental opening followed by cards. Its generalized theme exclusions yield to the explicit Electric tactics allocation.
- [Hallmark redesign](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md): preserve content and wiring while changing presentation. Applied by starting from own corrected source, retaining every destination/state/control and checking the full link inventory against it. No referenced scripts or installers were executed.
- [pbakaus adapt](https://www.ui-skills.com/skills/pbakaus/adapt): adaptation changes placement and interaction for the context rather than scaling desktop coordinates. Applied to the complete vertical phone court, inline notes, content-sized targets, enlarged-text rows and visible return target.
- [Emil design engineering](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md), particularly animation decision and accessibility sections: repeated input should feel immediate; keyboard and touch require appropriate feedback. Applied to instant selection, clear focus and accurate origin return.
- [Emil animate](https://www.ui-skills.com/skills/emilkowalski/animate), frequency/purpose/tool-selection guidance: motion must earn its role. The static route already explains the origin/destination, so this frequently used map gets no scene animation.

Local `ART-BRIEF.md`, only allocation entry `02`, `reference-notes/craft.md`, and the font catalogue were also read. No other author's allocation or implementation was inspected.

## Motion / still interaction path

No scene animation, score tweening, autoplay, scroll reveal, loop, timer or decorative RAF was added. The route redraws only on selection, font readiness or size changes; it is still at rest.

Representative pointer path: choose **Your team** on the left wing → the reader shows that team's values/form/wire, the selected route and field-note position agree → **Back to court** hides the reader and visibly focuses the actual left-wing target. On phone, opening brings the inline reader into view; Back brings the selected target back into view.

Keyboard path: focus a court button and press Enter → reader heading receives focus and is visible → Escape returns to that button. Reduced motion has the identical still path and content. Live reduced-motion testing found zero active animations. The controller also brings an offscreen heading into view after a lower court selection at enlarged desktop text.

## Preserved content and behavior

- Six state IDs and `window.goatStudy` API are unchanged; `studyReady='02'` waits for local fonts and the initial route drawing.
- All ten teams, 228 unique player references, ten faces, member 24-value disclosure, top three, coverage/basis/time, form watch, completed-week recap, news/moves and dated editorial/archive remain reachable.
- First AI returned choice remains Ware the Hoes At? at 35%, other side 65%, independent confidence 20%. All five AI rows and model/prompt/input/evidence provenance remain. The first repeated matchup headline is visually suppressed in the AI list because its complete pairing is immediately above; its semantic heading remains.
- Known 0.0 stays separate from Pending; scores stay incomplete. Stale output is labelled; missing output has no invented probabilities. Power and recorded team-value history remain unavailable. Public mode contains no personal values or `/team` route.
- Every link href, including duplicate contextual actions, matched corrected source in all six member and all six public views. Relative Home/compare URLs, archive links, profile IDs, form IDs/options and native disclosures retain their wiring. No application routing/history mechanism was replaced.
- Synthetic scope stays compact in the expandable disclosure; source dates, model records and precise coverage remain attached to their content. Redundant narrative, metadata separators and the repeated first AI matchup context were tightened without dropping facts.

## Actual verification

Installed Chromium/Playwright, local parent server port 4207:

- **144 render combinations:** all six views × 1440/390/320 × 100%/200% root text × member/public/stale/missing. No horizontal page overflow or browser errors; local fonts loaded and selected routes remained finite.
- **36 actual selection/reader/Back paths:** each view at every viewport/text setting. Reader heading focus and visibility, correct returned target, visible return target and closed reader passed. Smallest exercised court target dimension: **69.39px**.
- Keyboard Enter/Escape passed. Explore and Synthetic concept expanded without page overflow at all six viewport/text settings, with Escape returning to their summaries.
- All reader disclosures expanded at 320px / 200% text without page overflow.
- Directory: ten teams / 228 unique player links. Embiid search found one team and one player; roster-size sort led with Ware the Hoes At? (27 players).
- Member: 24 value rows, ten faces, three watch and five unique recap rows. Every portrait decoded successfully. Public: ten faces, zero personal values, zero `/team` links.
- AI ready/stale: five rows / ten meters; missing: five rows / zero meters. First returned 35% choice and known 0.0 / Pending score distinction were confirmed.
- Corrected-source versus polished href multisets matched in all twelve member/public views.
- Measured opaque rendered pairs: court white/cobalt **7.55:1**, cyan selected label/cobalt **5.08:1**, reader text/background **15.33:1**, reader secondary/background **6.94:1**. Court focus uses the same white/cobalt pair; reader focus uses cobalt/reader background. These named checks are not a universal accessibility certification.
- Static role audit: 34 roles, all used; zero palette literals outside roles, zero font-family literals outside roles/registrations, no tracking/uppercase transforms. JavaScript syntax passed. No remote runtime requests occurred.
- Own desktop/phone and enlarged-reader images were inspected during author QA; temporary check images were removed. Root owns full-state captures and independent review.

## Limits

Physical devices, screen readers and production destinations were not exercised. This remains an offline fixture and its member/public switch is not authentication. Inline text links retain normal inline behavior; the court control measurements do not claim every prose link is a 44px box. Independent visual review and full-state evidence remain pending. No production, shared/Muse, first-source, Git, remote-write or root infrastructure change was made.
