# B — Reaves gets the champ

The visitor question is “What is the league talking about as the season opens?” The primary action is following a team or the weekly edition after reading the story already present on the page. This is an unpublished Oct 5–11, 2026 draft, not a current Week 3 report.

## Composition

One sports frontpage, carried by the arena and a deliberately oversized headline. The court has enough room to retain its own GOAT lettering and place; a bottom gradient connects it into an oxblood editorial field. The headline crosses that join, then the continuing story spreads unevenly across twelve columns. The challenger’s last-season record occupies a margin. The old final sits left of a much larger Jokić portrait and three-number standard. A lower rookie story returns to the challenger theme, while dated moves form a narrow wire alongside it. These are unboxed reading positions, not equal article cards or repeated full-width bands. There is no decorative data dashboard or common footer shell.

The priorities are the actual opening pairing, the historical title bar, a contextual last-season player lookback, the first rookie selection, and three useful roster moves. No exhaustive team/player inventory, current metric table, model prediction or feature-family checklist is appended. All primary content is visible in document flow; only supporting provenance is disclosed.

On a phone the arena becomes a deliberate central crop, the headline keeps its offset second line, and the challenger record moves beside the historical headline. Jokić becomes a large full-width sports portrait with the stat triplet retained horizontally. The rookie portrait floats into its prose rather than becoming a separate equal card. The wire becomes hanging dated notes. Reading order remains opener → challenger/title context → Jokić → rookie → moves → provenance. No hover, drag, carousel or motion is required. Native links and details provide keyboard access, with visible focus.

## Guidance actually read

- Repository `AGENTS.md`, relevant homepage/weekly portions of `ARCHITECTURE.md`, and current `DESIGN.md` context. Production visual conventions are left unchanged and are overridden only inside this isolated study by `../EXPERIMENT-CONTRACT.md`.
- [Project skill](../../../.agents/skills/goat-hoopers-design/SKILL.md) and its `references/navigation-accessibility.md`: distinguish source inspection from rendered evidence, use native controls and understandable destinations. No shared navigation surface is changed.
- [Hallmark custom direction](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/direction.md), read through the actual primary raw document: “Let the idea run the page” and “Let the content build the structure.” The applicable principle is a client-specific idea governing the complete composition, with large meaningful owner-supplied imagery. The usual 6–9 sections, scaffold, font/palette bans and mandatory scripts/reviews are not adopted; the user’s isolated exploration contract controls the work.
- [Hallmark macrostructures](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/macrostructures.md), actual primary document: the index is a vocabulary, not a menu. This composition was authored around its content rather than chosen from the catalogue. Its fingerprint is an overlapping cover headline, asymmetric continuing narrative, negative space in place of card dividers, typographic external actions, a dominant arena plus two unequal portraits, and no reveal pattern.
- [Hallmark responsive](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/responsive.md), actual primary document: fluid display sizes, discrete composition changes, useful picture crops and immediate readable native controls. The study adapts its own content rather than mechanically applying a universal one-column rule.
- Managed cloud runtime skill and network reference were read for environment handling. No external asset, code installer, script or dependency was downloaded or executed.

## Facts and materials

`FACTS.json` is the sole fact palette. The Week 1 opener is upcoming, with no score; this study does not render the unrelated synthetic Week 3/current records. Reaves’ 16–5 and the champion’s 17–4 are explicitly 2025 records. The final is historical (326.0–251.5). Jokić’s 27.7/12.9/10.7 are labelled 2025–26 NBA averages and editorial lookback, not a 2026 weekly award. Dybantsa’s 25.5/6.8/3.7 are labelled 2025–26 BYU college averages, not projected NBA results. NeuralNets’ predecessor’s 1–20 is attributed to the previous manager/QBs Gremlins. Current roster association is not asserted to be past-season ownership. Source checks in the palette are dated Oct 8, 2026; no new live source fetch was used.

Copied only existing approved arena, unchanged white logo and Jokić/Dybantsa portraits. Local Anton/DM Sans fonts are copied from the approved catalogue, with both SIL OFL notices preserved in `assets/`. The arena is an existing league illustration and is not claimed to depict the featured pairing. No generated figurine assets are loaded separately.

## Opening and verification boundary

- Designed: `http://127.0.0.1:4207/qa/homepage-worlds-3/b/`
- Structure: `http://127.0.0.1:4207/qa/homepage-worlds-3/b/?stage=structure`
- Ready hook: `document.documentElement.dataset.worldReady === 'b'`.
- Structure view uses identical HTML, meaningful text and CSS geometry. Only color/image treatment changes; the picture silhouettes remain muted for spatial evaluation.
- This is static semantic HTML/CSS with a ready hook only; no application build, production data call, service or dependency is needed. Root owns the final bounded desktop/phone rendering, captures, reflow/focus checks and any targeted findings. Source is frozen at handoff, subject only to such targeted corrections.

No production edits, shared file writes, commits, pushes, PRs, comments, deployments or publication were made.

## Targeted reflow correction

Root's initial normal desktop/390/320 and structure checks passed. Its corrected 200% text-only stress emulation (snapshot every computed HTML font size, then double it; not native browser zoom) exposed phone overflow in a long headline word, the Jokić headline, historical final group and stat triplet. One targeted CSS correction allows emergency headline word breaks, removes grid-item minimum-content constraints and lets score/stat groups wrap naturally when their enlarged text needs more room. It does not clip content or reduce the chosen font size. Normal authored spacing, typography, images and layout positions remain as before. Root owns the follow-up verification; no new captures or broad suite were run by the author.

The follow-up passed 6/7 cases, with main text reflow corrected. The remaining 320px/2× overflow was the masthead: its unwrapped navigation and automatic column minimums. A second narrowly scoped correction allows nav rows to wrap, gives the logo column a zero minimum and permits the study label to wrap. Link/label font sizes remain unchanged and every navigation item stays visible. Final targeted verification and capture remain root-owned.
