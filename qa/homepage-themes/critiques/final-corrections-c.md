# Critic C — responsive corrections 17 and 20

The inspected rework pages resolve the scoped intrinsic-layout problem in the live 390 × 844, 200% root-text probes. Both member and public modes keep document width at 390px with a computed body font of 32px and every main/footer disclosure open. The sampled long names, score cards, search/sort controls, tables and expanded footer content remain readable. I found no additional layout correction to request from these inspected scenes.

This is bounded visual QA, not formal approval or a new theme selection. My first-version pair classifications and the combined first-round diversity review remain unchanged. No source files, capture files, or pair-result files were edited during this verification.

## Actual browser probe

I used local Chromium through Playwright against `http://127.0.0.1:4206/qa/homepage-themes/rework/17/index.html?view=member` and the corresponding public, 20/member and 20/public URLs. Each completed probe used this sequence:

1. Set viewport to 390 × 844 and wait for the direction’s ready marker.
2. Await `document.fonts.ready`.
3. Call `addStyleTag({content: 'html{font-size:200%!important}'})`.
4. Open every `main details` and `footer details`.
5. Inspect real viewport screenshots at the score/intro, directory controls, expanded long-name roster, standings controls, focused footer disclosure/link, and document bottom. Visible lazy images were allowed to load at the relevant viewport before the later screenshots.

| Page | Computed body | Viewport / document width | Main/footer disclosures open |
| --- | --- | --- | --- |
| 17 member | 32px | 390 / 390px | 22 / 22 |
| 17 public | 32px | 390 / 390px | 20 / 20 |
| 20 member | 32px | 390 / 390px | 24 / 24 |
| 20 public | 32px | 390 / 390px | 22 / 22 |

The width measurements support the rendered scenes; width alone was not treated as readability evidence. Live screenshots were rendered directly from in-memory JPEG buffers in this critique turn. No new screenshot files were written.

### Direction 17

The normal desktop app composition retains its original blue matchup, white modules and pale workspace shell. The phone layout gives titles, team/player metadata and archive badges room to reflow. The directory and standings selects display concise options without widening the page. The corrected normal pages retain the same art direction as the first versions.

At 200%, “Shai Gilgeous-Alexander” wraps into two clear lines, with its FAAB value below; expanded roster content remains in the white card. Search and standings controls have clear dark-blue focus outlines. The final footer source link and disclosure also show visible outlines without horizontal clipping.

The live fixed dock wraps to three controls on its first row and two on its second. Its labels remain readable. It occupies about 228px of height, leaving an unobscured content area of about 616px; the page scrolls normally behind it. At document bottom, the final footer text ends at 457.97px in member mode and 458.58px in public mode, while the dock starts at 615.84px. The final text therefore clears the dock in both modes. I also focused the last dock control, used Shift+Tab, and inspected the resulting keyboard focus on “League”: the blue outline remains visible and the control stays inside the viewport (top 730.42px, bottom 829.61px; viewport bottom 844px).

### Direction 20

The normal desktop and phone pages preserve the pastel club composition, arch portraits, pill controls and coral archive. The corrected page remains visually the same direction as its first version.

At 200%, the inner score card stacks team names and score circles vertically. The names and circles do not collide. “Shai Gilgeous-Alexander” wraps clearly with its price/action beneath; “Giannis Antetokounmpo” and the subsequent expanded roster content remain within the page. Search and standings controls fit and show visible purple focus outlines. Standings reflow into readable name/record/PF entries. The expanded footer source record wraps long JSON/source text; the final preview line remains within the viewport. There is no fixed dock in the inspected 20 states.

## Corrected capture coverage and comparison

For each `NN` in `17`, `20`, under `qa/homepage-themes/evidence/`, I inspected all four corrected complete pages:

- `rework-NN-member-desktop.jpg`
- `rework-NN-member-phone.jpg`
- `rework-NN-public-desktop.jpg`
- `rework-NN-public-phone.jpg`

I also inspected all four corresponding `-checkpoints.jpg` composites (member/public × desktop/phone), and the individual `rework-NN-member-desktop-top.jpg`, `-middle.jpg` and `-bottom.jpg` crops. Phone checkpoint panels are native 390 × 844; desktop checkpoint panels are reduced to 720 × 500, and the individual member desktop crops are native 1440 × 1000. Complete long pages were composition overviews, not a claim that every line was enlarged and read.

I compared these against the first-version full pages and native crops already inspected in my independent review, and freshly revisited `17-member-phone-checkpoints.jpg` and `20-member-phone-checkpoints.jpg` in this turn. The visible changes are intrinsic layout/reflow corrections; I did not observe theme convergence or a new art direction.

## Source and capture identity

I recomputed SHA-256 for every HTML/CSS/JS source listed in `rework-17-captures.json` and `rework-20-captures.json`; all match the recorded source hashes. I also checked both first-version manifests against their original source files; those hashes still match. Both corrected capture manifests contain all four expected page states and no recorded capture failures.

The eight complete corrected image hashes below were computed at the start of inspection and checked again afterward; all remained identical. These hashes pin the image files inspected and do not by themselves certify browser behavior. The existing root verification files separately record 10/10 common cases for each rework; the live screenshot observations above are my additional evidence.

### Corrected source SHA-256

| File | SHA-256 |
| --- | --- |
| `qa/homepage-themes/rework/17/index.html` | `db3a2cd79d9b869c4465470a1de87185027abe8d80a22a0803f10ac7fc834f0a` |
| `qa/homepage-themes/rework/17/workspace.css` | `cf8e0c86d1984fd6c9d572a593073b12c3f05287aff6a5a712d890bcd3b035b4` |
| `qa/homepage-themes/rework/17/workspace.js` | `9fa2f6fb0c5df620fe53e0ba5d4adfab4f90602129495d2c81315a1961c9352f` |
| `qa/homepage-themes/rework/20/club.css` | `0d340f82597ea2f1f65b5394dbbb5b6cfe74a98f1f6179215e96436c416e472a` |
| `qa/homepage-themes/rework/20/club.js` | `c773f198ffed88b6506a9a4cacb3afe74dcc91f6eb98bbad7d8cb39c8524be53` |
| `qa/homepage-themes/rework/20/index.html` | `e7f7b2197e7f66de2a23204c088ea17b74da463eab4294bf48700e7243c98881` |

### Corrected complete-page capture SHA-256

| File | SHA-256 |
| --- | --- |
| `qa/homepage-themes/evidence/rework-17-member-desktop.jpg` | `af08357ab1515a95de5ee3aa63cee46f7cc47d1b8717f2286cd337c85082f4a4` |
| `qa/homepage-themes/evidence/rework-17-member-phone.jpg` | `b98ed3abe6d1a5ba0717af6aea267632f79e07db8df47ba3e79532063d9b93d3` |
| `qa/homepage-themes/evidence/rework-17-public-desktop.jpg` | `d85d2b8a9a5c5e2ec89abcaf7dd2a11cd1f1e48a8b9917148531741c2d42f0e9` |
| `qa/homepage-themes/evidence/rework-17-public-phone.jpg` | `596f1f4ff1dd210ab1f8f5a67d036a9f23199b6af0a6c392f7769f7d7542fae0` |
| `qa/homepage-themes/evidence/rework-20-member-desktop.jpg` | `7adb121241214d168b6153aa2829b60cf2efa017a37e252f00bff7d7bb9df0fc` |
| `qa/homepage-themes/evidence/rework-20-member-phone.jpg` | `e99f287d85310b6f2f2a551fa864cebe1aa5988f92c771abab31f5030f670bf0` |
| `qa/homepage-themes/evidence/rework-20-public-desktop.jpg` | `cd42fa3074b4a144fa5b1342672d791e549eb51c76a5853c7dfcb5e9f6929062` |
| `qa/homepage-themes/evidence/rework-20-public-phone.jpg` | `21203fa06a508ca5428f88893849a95880930605c77242ac3980494b28e0400c` |

## Limits

The live 200% browser probe was performed for all four scoped phone modes; none is left pending. I inspected selected viewport scenes, not every position in the very long expanded documents. I sampled focus with direct focus calls and a real Shift+Tab dock transition; I did not run a complete keyboard journey, screen reader audit, contrast certification, physical-device test or browser-zoom test. Opening all disclosures programmatically tests the expanded layout, not each disclosure’s activation interaction. I did not follow destination routes or retest authentication, data correctness, search filtering, stale/missing AI modes or production behavior. Capture-only full-page handling changes fixed positioning for stitching, so dock clearance conclusions come from the live browser screenshots, not the stitched full pages.

No remaining blocker was found within this bounded intrinsic-layout scope. Later source edits require refreshed matching capture/probe evidence.
