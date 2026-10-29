# Color Club 20 · responsive QA rework

Runtime: `/qa/homepage-themes/rework/20/index.html?view=member` or `?view=public` on the root-owned port 4206 server. Source editing is complete. This is a responsive correction to the independently authored Color Club first submission; its lilac/teal/coral palette, Space Grotesk, court fragment, content and action inventory are retained.

## Reproduced failure

At **390×844**, awaited `document.fonts.ready`, injected exactly `html{font-size:200%!important}` using `addStyleTag`, then opened every `main details, footer details`. Both original views produced **544px document width**, with body text **32px**. The first submission only checked 200% root enlargement at 1440px, so its earlier evidence did not establish this combined narrow/enlarged state. The copied `DESIGN.md` is explicitly marked as historical; the original record was not edited.

The largest overflow came from the NeuralNets face row: a 3.7rem indentation, 4.5rem portrait, 1rem gap and the text’s automatic minimum width placed its right edge at approximately **543.9px**. Native input/select intrinsic sizes also exceeded the available column. The member value total imposed a 448px minimum on a `1fr` track. In the matchup, scaled padding plus a fixed score and gap consumed the text column’s entire width. The additional 320px/200% check exposed heading words, fixed standings columns, AI identities and nested padding as further constraints.

## Correction

Only `club.css` changes runtime behavior. `index.html` and `club.js` are byte-identical to the original.

- Grid and flex children receive zero minimum inline size where their content must wrap. Inputs/selects respect their containing width.
- Matchup names/scores, watch metrics, portraits and the three value leaders wrap when their enlarged text no longer fits a row. Text and numbers remain present at their original relative sizes.
- Narrow nested padding is capped by available container width. Long headings, identities, model labels and values can wrap instead of forcing a wider page.
- The face indentation reduces as readable content needs more room. Header/menu and view-comparison links can wrap. The menu remains within the viewport.
- Standings use a container query when the text-relative available width is insufficient. Rank and team remain first; W–L and PF receive visible per-row labels. Original column headers remain available to assistive technology.

No new page-level overflow hiding, clipping, font-size reduction, fixed-height text area or omitted content was introduced. Existing decorative court geometry remains cropped by the original hero shape. Very large title words may wrap within a word at 200% to preserve the doubled type size. No palette, logo, font, JavaScript, facts, links, fixture, production file or shared style was changed.

## Final browser checks

Installed Chromium with Playwright. The exact root-enlargement injection above was used; normal body size is **16px**, enlarged body size is **32px**. All main/footer disclosures include roster values, full rosters, AI provenance and the complete source record.

| View | Widths | Normal closed/open | 200% closed/open |
| --- | --- | --- | --- |
| Member | 1440 / 390 / 320 | Document 1440 / 390 / 320 | Document 1440 / 390 / 320 |
| Public | 1440 / 390 / 320 | Document 1440 / 390 / 320 | Document 1440 / 390 / 320 |

All **24 combinations passed**, including a scan for overflowing content elements. The unchanged decorative SVG and the intentionally visually hidden duplicate standings column headers are excluded from that scan. No other overflowing content element was found. Recorded matrix: [QA-RESULTS.json](./QA-RESULTS.json).

Interaction regression at 390px, normal and 200%: Jokić search finds one matching roster; an unmatched query shows its empty state. Directory and standings A–Z sorts both start with Huff n’ Puff. Enter opens Menu; Escape from a contained link closes it and restores the summary’s focus. Menu bounds are 54–374px normally and 32–358px enlarged.

Ready/stale/missing AI were checked in both views at 390px/200% with all disclosures open: page width stays 390px. Ready/stale retain five saved hooks; missing retains five current pairing rows with no saved hooks. The stale notice is visible. A locally intercepted mismatched saved season produces five Unavailable rows and no saved hooks; the supplied fixture was not edited. The first actual returned choice remains **Ware the Hoes At?**, its probability **35%**, Reaves Dropper **65%**, and independent confidence **20%**. Price actions still truthfully open `/stocks#player-board` with separate player profile links.

Final inventory: **10 teams, 10 faces, 5 ready saved AI rows, 24 member values, 228 roster links and 228 unique player destinations**. Public has no personal sections. All **19 images** loaded successfully when requested in the browser. Reduced motion retains all ten teams. No JavaScript errors or external runtime requests were observed.

Focused browser evidence: `check-text200-opening.png`, `check-text200-face.png`, `check-text200-standings.png`, `check-text200-320-matchup.png`, `check-normal-directory.png`. Root owns the complete recaptures.

## Exact source hashes

SHA-256 of the rework runtime and supporting records:

```text
index.html      e7f7b2197e7f66de2a23204c088ea17b74da463eab4294bf48700e7243c98881
club.css        0d340f82597ea2f1f65b5394dbbb5b6cfe74a98f1f6179215e96436c416e472a
club.js         c773f198ffed88b6506a9a4cacb3afe74dcc91f6eb98bbad7d8cb39c8524be53
DESIGN.md       2726e7ab7662b3976a9966533c1d4e8dd0465cac381cb8ce6aa6feed3ae20e27
QA-RESULTS.json a2b776cd3086c67af1d128dba918146de4728d86d2da29bb4f5e6df60fbe1368
```

Original `directions/20/` source hashes were rechecked and remain identical to the first submission:

```text
index.html e7f7b2197e7f66de2a23204c088ea17b74da463eab4294bf48700e7243c98881
club.css   7eb864b28ccdba73870400cfbaa7de9f48ef6129b1faa73709ff94987dbab385
club.js    c773f198ffed88b6506a9a4cacb3afe74dcc91f6eb98bbad7d8cb39c8524be53
DESIGN.md  de71bd53d86d7f894139e9b05ea59c0ea4af2b7be6fc1a89759a700f427f3682
```

All first-submission evidence remains untouched. There are no remaining responsive blockers found by these checks. Physical-device, screen-reader and production navigation/game execution remain unverified; this evidence is from the isolated browser fixture.
