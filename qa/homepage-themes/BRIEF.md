# GOAT: genuinely divergent visual themes

You are ONE of twenty new fresh-context design authors. Build one complete responsive homepage theme in your assigned `directions/NN/`. The earlier #272 round was rejected for identical cream-paper colors and styling. Do NOT view or copy it, #271, any other author's files, screenshots or markup. Your first submission is blind. Your own complete markup, styles and interaction code must be independently authored. Do not spawn agents or modify Git/PRs. Edit only your assigned folder.

Read AGENTS.md, ARCHITECTURE.md's homepage section, DESIGN.md and `.agents/skills/goat-hoopers-design/SKILL.md` plus its hierarchy/accessibility references. **The latest explicit user instruction supersedes Paper + Slate/Inter-only visual restrictions for this isolated QA experiment.** Each theme MUST have its own palette, typography, density, shape language, atmosphere, composition and court/image treatment. This is not permission to change production tokens, DESIGN.md or anything outside your folder. Preserve data/architecture/accessibility principles. Root will apply a pairwise visual similarity gate; a near duplicate will be rejected for rework.

There is NO shared CSS, component template, section renderer or design token set. Only data, local asset provenance and functional/a11y requirements are common. Do not import `/src/ui/tokens.css` or the old `base.css`. Name semantic colors within your own styles. No giant generic marketing headline or decorative nonfunctional buttons. A complete, useful homepage should express your assigned theme in every section, not just a differently colored hero above the same white dashboard.

## Your own files and local preview

Create `index.html` with independently authored CSS/JS and `DESIGN.md` describing your theme in concrete terms, user question, primary action, wide/narrow composition, missing states, actual checks and limitations. You may add sibling assets/style files only in your folder. Data import: `import {inventory,data,mode,aiState,esc,money} from '../../data.js'`.

Read `../../inventory.json` to understand the data; do not guess field names. All source image paths are local `/public/...`. `../../font-catalog.json` lists optional locally downloaded official Google Fonts with their OFL licenses and paths. Use your assigned display family and an appropriate readable body stack; declare your own @font-face. Existing local Inter/Geist files are also available at `/public/design-preview/neutral-courtside/assets/`. Fonts are data assets, not a shared style. No external runtime requests, installs, scripts, packages, services, credentials or paid assets. No new canvas/WebGL runtime. Original CSS/SVG illustrations/court geometry are allowed and should be your own original markup. You may use the existing arena/game/portraits but are NOT required to use the same image/crop or let it dictate your palette. Preserve a recognizable selected GOAT logo. No invented photo, figurines, official awards or fake game controls.

Root serves this worktree at http://127.0.0.1:4206/ . Your page is `/qa/homepage-themes/directions/NN/index.html?view=member` (default) or `?view=public`; use `?ai=stale` or `?ai=missing`. Use installed Chromium/Playwright if you choose, no installs. Root owns the complete bulk captures; do not spend time writing screenshot infrastructure. Stop editing and return a source-ready message when done.

## Identical facts and truthfulness

The common fixture contains approved dated team/player identities, full rosters, portraits and dated editorial. ALL current records, scores, prices, form, news, moves and AI examples are synthetic. Show a compact visible synthetic-fixture label and keep complete source details accessible. Do not invent another fact, quote, trend/history, record, player statistic, win probability or award. Keep known 0.0 separate from null Pending, incomplete separate from final, dated sample editorial separate from current official Week 2 content. No recorded value-history series or Power producer is connected: show honest unavailable states, never draw a fake chart/ranking.

The supplied first saved AI returned choice is the 35% away team even though the other team has65%. Preserve the actual returned choice, both probabilities, independent confidence and saved provenance. Stale output must be visibly stale without opening details. Missing output is Unavailable, not zero. Do not change the fixture or call APIs.

## Every theme must preserve this complete information and action inventory

1. Recognizable GOAT identity; real destinations Home, News(`/intel`), Stocks, History, Arcade, AI Decides, Teams, Transactions, weekly archive and trade analyzer. Member My team(`/team`) and View roster(`/teams/1#team-roster`). Public/member comparison links and usable navigation.
2. Current featured pair (member's own pair in member view) from directory currentMatchup, with both names/managers/records/scores/week/incomplete status. Dated editorial sample context stays clear. Do not repeat the entire pairing in three places.
3. Member personal identity, roster count, standing, actions; modeled FAAB total/basis, priced/unpriced coverage, computation timestamp, top three plus all24 roster values in accessible details, history unavailable.
4. Scouting notebook: member playerGuide.watch, league faces, dated editorial watch; actual player links, periods, separate observed form/price/editorial bases. Public keeps useful league context.
5. Member completed-week best/rough players with points/GP/period/coverage; team news and recent moves. Label synthetic; not current official awards.
6. Dated edition player spotlights with actual supplied stats/opinions/selection/source dates, league happenings and sources.
7. All five saved AI matchups, actual returned choice/probabilities/confidence/timestamp, accessible model/prompt/input/evidence provenance, stale/missing/unmatched states.
8. All ten league faces: team, top modeled player, price and actual profile/price links. You can integrate them into another useful section; no compulsory separate card gallery.
9. Full ten-team directory: managers, current records/opponents, all228 unique roster player links with position/NBA team in full rosters, functional team/manager/player search, meaningful sort, prior-manager attribution when showing prior-season record.
10. All ten standings rows, rank/W/L/PF(pointsFor/100), functional sort; league stats and Power unavailable; transactions.
11. Useful Stocks/market, trade analyzer and actual Arcade/free-throw links; both archive entries with dates/titles/routes; footer/source explanation.

These may be open rows, disclosure sections, cultural player cards, boards, papers, panels or another coherent form appropriate to YOUR theme. The theme must alter the complete composition and atmosphere while keeping the full page accessible. Do not erase content to make a short screenshot.

## Access and responsive requirements

Full desktop at1440, phone390 and narrow320 CSS px. No page-level overflow/clipping, lost controls, unreadable names or microscopic text. Use root-relative type so200% root enlargement actually doubles text; body roughly16px, secondary14px, metadata at least12px normally. Typography may be materially different and expressive; long reading and data remain readable. Numeric alignment and units clear. Theme shapes/textures may not compromise contrast.

Semantic headings, labelled controls, native links/details preferred, visible keyboard focus, target44px on phone for actions. Navigation Enter opens, Escape closes/restores focus. No modal unless full close/containment/restoration works. Reduced-motion and save-data do not remove information; no autonomous/staggered motion or fake Live claims. Use opaque/translucent contrast surfaces thoughtfully over photos. Observe entire page/footer and opened disclosures, not just the hero.

On YOUR elements provide these audit hooks (they do not prescribe a design): `data-mock-ready="NN"` once rendered; exactly ten directory containers `data-team-id`; five ready/stale saved rows `data-ai-pair`; ten modeled faces `data-face`; complete member value list `data-roster-values`; member-only areas `data-personal`. Missing saved AI may have no saved-row hooks while current matchups remain visible.

Root will produce complete public/member desktop/phone captures and independent pairwise visual review. First submissions are preserved. Near duplicates are reworked, NOT declared different just because agents were separate. No shortlist is chosen until all20 themes are visibly compared; Aidan's taste signal precedes a large convergence round. Return your files, exact hash and honest checks. No source/route/database/configuration/credential/production/Muse-lane changes; no commit, merge or deployment.
