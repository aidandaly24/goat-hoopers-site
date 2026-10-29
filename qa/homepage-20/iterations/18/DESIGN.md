# 18 — Night practice + paper

The user question is: “Who do I play, what is known about that matchup, and what should I inspect on my roster?” The first member action is **My team**, beside **View roster** and the saved AI slate. Public visitors can jump directly to the searchable team book.

The opening uses the original free-throw preview as a bounded athletic object. The matchup sits beside it on an opaque scene surface, with the known **0.0** and missing **Pending** score visibly different. Scene ink, muted labels, amber action and control roles come from the repository’s `--gh-scene-*` tokens. The image is intact; essential text is outside it. There is no renderer, scene import or decorative court animation.

The dark opening ends decisively at the paper member desk. The rest is an open reading surface: a large modeled roster total, aligned top values, scouting rows, team wire, dated editorial, saved predictions, ten faces, and a two-column team book / league table. Rules and typography do most of the grouping. Portraits support names rather than buying entire cards. The original arena returns as a small contextual image beside market and practice links.

Inter supplies names and prose; Geist Mono supplies scores, values, ranks and source metadata. Color follows existing semantic roles: paper and slate for reading/actions, scene roles only inside the opening, team colors only as identity marks, and the stale editorial notice as a publication state. No new font, dependency, remote asset, data request or production file is introduced.

The meaningful controls are native links, `details`, search and selects. Search matches team, manager or player; a player-only match opens that team’s full roster. Sorts support standings rank, team name and roster size; the table separately supports rank, PF, wins and name. The navigation disclosure expands in document flow and Escape closes it and restores trigger focus. Stocks remains directly available on a phone. There are no dialogs, automatic animations or saving controls.

Member state contains the full 24-player value list, computed time, 24 priced / 0 unpriced coverage, top three modeled prices, explicit history-unavailable state, observed-form basis and sample, completed-week points/GP/coverage, news and moves. A player present in both completed-week selections appears once with both group labels; the five-player cohort is explicit. Public state replaces the private desk with league context and dated editorial scouting. The directory retains every current roster and prior-manager attribution whenever the 2025 record is disclosed.

The edition is visibly a **stale, unpublished Oct 5–11, 2026 sample**. Its game headline is not reused to describe the current Week 3 pairing. Editorial selection reasons, stat periods, source links and check dates remain accessible. All current records, scores, prices, form, news and AI are prominently synthetic. No additional result, award, history series, ranking or forecast is invented.

All five saved AI pairs print the returned choice independently from each supplied probability and the separate 20% confidence signal. The fixture intentionally returns the second roster ID at 35%, while the other team has 65%; that distinction is retained. Per-pair provenance exposes saved time, model, prompt, evidence and unavailable snapshots/baseline/preview closure. `?ai=stale` visibly labels saved results stale, and `?ai=missing` shows Unavailable with no invented rows. Current ordered roster IDs and week are checked before a saved result is presented as matching.

At phone widths, the opening stacks the matchup before the court, the desk and notebook become single columns, faces use two columns, and the standings become labelled rows. Names wrap. Full roster disclosures keep direct `/player/id` links and all position / NBA-team references. The paper section links make the long reference easy to reach. There is no page-wide horizontal scrolling.

## Verification performed

These are installed Chromium / Playwright checks of the **static fixture**, served at `http://127.0.0.1:4198/qa/homepage-20/directions/18/index.html`.

- Both `?view=member` and `?view=public` rendered at 1440, 390 and 320 CSS pixels with no page-width overflow. The same six combinations passed with every main-content `details` opened.
- All states retained 10 directory containers, 10 faces, five ready AI pairs, 10 standings rows and 228 unique roster-player routes. Member state had all 24 value rows; public state had zero personal blocks/value rows.
- Player search for Lillard and team search for NeuralNets each returned one team; player matching opened the roster. A no-match query showed its empty state. Name sorting placed Huff n’ Puff first in both the team book and standings.
- The value disclosure opened to 24 visible rows. First AI choice was Ware the Hoes At?, and all five returned choices were checked. The featured scores remained 0.0 and Pending.
- Stale AI retained five rows and its visible stale labels. Missing AI showed Unavailable and zero saved-pair rows.
- At a separate 1280 CSS-pixel viewport, `html { font-size: 200% }` produced a computed 32px body and no page-width overflow, both collapsed and with all main-content disclosures open. This is text enlargement, separate from the 320px reflow check.
- Keyboard checks verified the initial Skip to content target, Enter opening a native roster disclosure, menu Enter/Escape and restored trigger focus. Primary phone actions measured 44px tall. Reduced-motion emulation reported zero animations. The final source/footer disclosure remained reachable.
- All local images loaded and there were no browser page errors or failed requests in the six viewport/mode checks. Desktop, phone, 320px directory, edition, enlarged-text and full-page screenshots were visually inspected locally. A full-page pass caught and corrected an intrinsic-height issue on the arena image before final verification.
- Opaque rendered role pairs were checked by WCAG relative luminance: paper ink 12.70:1; paper secondary 5.15:1; white/slate action 7.22:1; scene ink 17.62:1; scene secondary 8.00:1; scene amber state 8.80:1; scene primary label 7.83:1; scene caption secondary 7.37:1. Essential text never crosses the image.

Source benchmark: `64b9971f88ad1f73f5bd00ac0fdef9019909561b`.
Verified `index.html` SHA-256: `88c0f5f4c89e3b3cd44dc3a1458802860df9986b6c04c0e3d359ac9a7985fa32`.

This is not evidence of live data, authentication, production routing, actual game behavior, Next.js history restoration, physical mobile browser behavior or screen-reader acceptance. App routes are preserved as ordinary links. No build was needed for these isolated HTML files. No release operation was attempted. No remaining blocker.


## Separate accessibility repair copy

This file accompanies `repairs/18/index.html`, copied from the frozen blind
submission. The initial verification above is historical evidence for the
original and did not cover the subsequently reported 390px/200% failure.
The separate repair preserves the visual direction and all source content while
allowing enlarged rows and text to reflow. See [QA-REPAIR.md](QA-REPAIR.md) for
actual original/repair widths, controls, limitations and exact file hashes.
The original `directions/18/` files remain unchanged.
