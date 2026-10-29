# 02 footer wordmark — bounded QA rework

Status: source-ready. This rework corrects only the footer wordmark layout and word wrapping. It does not change the monochrome direction, page content, data, markup, controls, routes, typography elsewhere or first submission. The copied `DESIGN.md` is explicitly labelled **first-version rationale**, including its historical hash and checks; it is not current verification.

Preview: `/qa/homepage-themes/rework/02/index.html?view=member` or `?view=public` on the existing port 4206 server. Shared fixture/font imports retain their correct relative/local paths. No stale screenshots or original check reports were copied into this folder. Root owns the new capture and pixel review.

## Before and after

The preserved first version put the 3rem footer wordmark into an 8rem desktop column and allowed arbitrary word breaks. Independent pixel review reported `GOA / T / HOO / PERS / .`. A new Chromium DOM Range measurement independently reproduces two line fragments for `GOAT` and three for `HOOPERS.` at 1440px, both 100% and 200% root size. First-version 200% text also breaks words at narrow widths even though its default phone presentation is coherent.

The rework uses a max-content footer wordmark column on desktop and forbids soft word breaks in the existing `GOAT<br>HOOPERS.` text. A footer-local inline-size container query reduces only this decorative wordmark from 3rem to 1.5rem when the available footer width is at most 16em. This preserves the default 48px phone mark, allows a 96px mark on enlarged desktop, and fits a coherent 48px mark within the 256px content width at a 320px viewport with actual 200% root text. Reading text remains 16px normally and 32px at 200%. This is a responsive display-mark adjustment; it does not reduce enlarged body text or apply browser zoom.

The complete runtime script and generated content markup compare byte-for-byte with the first version. Programmatic comparison confirms that the only source differences are the named footer CSS replacements and the footer-specific container query.

## Exact source and preservation hashes

SHA-256:

| File | Hash |
| --- | --- |
| First `directions/02/index.html` | `e95c05048474d14043ccbbb8f608b648d31c9e93960c67f5bfe6be6829e2aadf` |
| Rework `rework/02/index.html` | `39bdb41603254aebeedf00aae42dbe522e996127e469d649c59786de8c68e76b` |
| Rework labelled `DESIGN.md` | `2e00c5fe9f719f00a2d745467db3b4ae3f1297fb2d481e7461b73d5c316c89e4` |
| New `CHECKS-REWORK.json` | `b539f8d40a444a201ad8b701e3b1d445f9c026d005cee543852c84ee8dbbcfbd` |

The original source hash is unchanged. Original supporting files also remain byte-identical:

- `directions/02/DESIGN.md`: `9f74ebbfc10a38c3ff2159905cb4278fbb62376938295cbb7680dff282e4052c`
- `directions/02/CHECKS.json`: `5984f1ab10c2c05949eee51b76d65ba8dec35085062800651473333ba6c2aa88`
- `directions/02/full-check.png`: `e53f441619d2851b14c24c808f875022ee7130bd5479100d58bf4e3c17e2311e`

No first capture, source, Git state or production file was edited.

## Precise fresh checks

Evidence: **local static browser fixture**, installed Chromium through Playwright, against the existing 4206 server. `CHECKS-REWORK.json` records the exact rework source hash and raw before/after word rectangles. It is not real Next-route, screen-reader or physical-device evidence.

Every combination of member/public, 1440/390/320 CSS pixels and 100%/200% actual root text was tested with **all disclosures open**, including footer and navigation. Fonts finished loading before measurement. DOM Ranges measured each original word text node, rather than inferring coherence from page-level overflow.

| Width | Root | Body size | Wordmark size | GOAT line fragments | HOOPERS. line fragments | Page / internal overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | 100% | 16px | 48px | 1 | 1 | None |
| 1440 | 200% | 32px | 96px | 1 | 1 | None |
| 390 | 100% | 16px | 48px | 1 | 1 | None |
| 390 | 200% | 32px | 48px | 1 | 1 | None |
| 320 | 100% | 16px | 48px | 1 | 1 | None |
| 320 | 200% | 32px | 48px | 1 | 1 | None |

Both views passed every row above. All twelve runs retain ten teams, 228 unique roster links, ten faces, five saved AI rows, ten standings rows and two archives. Member runs retain all 24 player values; public runs have no member value list. The script itself is unchanged.

Focused regression checks also passed: Enter opens native navigation; Escape closes it and restores focus; Niederhäuser player search resolves team 2; roster-size sort starts with team 2; standings name sort starts with rank 6. No JavaScript page errors occurred.

Remaining review: Root's fresh visual recaptures and independent pixel comparison. No new screen-reader, physical-device, production-route or gameplay claim is made. No broader redesign, convergence, install, commit, merge or deployment was performed.
