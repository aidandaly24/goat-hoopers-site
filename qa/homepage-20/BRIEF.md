# Blind first round — GOAT homepage

You are one of 20 fresh-context design authors. Author ONE complete, genuinely
distinct visual direction, with responsive desktop and phone layouts, in your
assigned `directions/NN/` folder. Do not inspect any other direction or prior
prototype screenshots before your first submission. The shared data is the same
for every author. Do not spawn agents, commit, change branches, push, comment in
GitHub or edit anything outside your assigned folder. Root owns orchestration,
gallery, captures, independent critique and later iteration. First designs stay.

Read repository AGENTS.md, ARCHITECTURE.md homepage section, DESIGN.md and
.agents/skills/goat-hoopers-design/SKILL.md plus hierarchy/accessibility refs.
Apply their semantic colors, genuine league information and working controls.
User explicitly authorizes materially different composition, typography, density,
court and interaction experiments here, not production changes. Existing Inter
and Geist Mono can be varied by weight, scale, posture and role. No new fonts,
frameworks, external calls, installs, services, accounts or paid assets. Do not
import game/scene/private production runtime. This is a static HTML mock, not
proof of Next/auth/backend behavior. No bland repeated card grid or decorative
button/marketing headline displacing league information.

## Files and running

Create `index.html` (with your own CSS/JS, optionally sibling files) and
`DESIGN.md` explaining question, first action, visual/composition decisions,
responsive states and limitations. Root serves repository root at port4198.
Your URL: `/qa/homepage-20/directions/NN/index.html?view=member` or `?view=public`.
Import data using `import {inventory,data,mode,aiState,esc,money} from '../../data.js'`.
You may link `../../base.css` for tokens/fonts/reset/focus only; it contains NO
component markup or layout. Your markup and composition must be independently
authored. `inventory.json` is the complete readable schema (104KB). All source
portrait/image paths are local `/public/...`. Read the JSON structure before
coding; do not guess field names. Images have useful empty/labelled fallback.

Return your actual written files, design summary and actual verification. A
working visual should be ready without running your own server. Root performs
all bulk captures; use installed Chromium/Playwright only if you choose to check
your page, no new installs. Do not wait for root or ask preference questions.

## Identical data and honesty contract

The inventory comes from #271 benchmark64b9971's pure fixture: actual dated
approved roster identities, portraits and editorial; ALL current records, scores,
prices, form, news, matchup/AI examples are synthetic. A prominent compact label
must say so. Do NOT fabricate any additional quote, trend/history, win chance,
award, player/game statistic or claim. Dated sample editorial is NOT official
current Week2 Stud/Chud. Keep its dates/source/selection basis accessible. A
missing value is not zero: pairing home0.0 is known, away null is Pending.
Incomplete scoring is not final. Stale AI must be visibly stale without opening
details; missing AI is Unavailable. `?ai=stale|missing` changes shared data.
Recorded history is unavailable: show that, no invented line. Power producer is
not connected in this fixture: explicit unavailable, no invented rankings.

## Every direction's information inventory

All must preserve these sections/data/actions somewhere clearly accessible.
Composition/order/disclosures may vary; no hiding essential state to look clean.

1. Recognizable GOAT logo and useful persistent league destinations: Home, News
   (/intel), Stocks, History, Arcade, AI Decides, Teams, Transactions, weekly
   archive; member My team (/team) and View roster (/teams/1#team-roster).
   Include usable public/member comparison links (same index.html query).
2. Featured current pair selected from `data.home.directory` currentMatchup,
   member's own pair for member. Names, managers, records, known/pending scores,
   current week/incomplete status, dated sample/stale edition context. Avoid
   repeating the entire matchup in headline/graphic/desk/caption.
3. Member-only personal identity/roster count/standing/actions; valuation total
   and modeled FAAB basis, priced/unpriced coverage, computation timestamp,
   top3 players plus ALL24 roster values in accessible native details, honest
   history-unavailable state. Use `data.personal.summary` only for members.
4. Scouting notebook: member `summary.playerGuide.watch`, selected league faces
   and dated editorial one-to-watch; player links, separate observed-form vs
   price-vs-editorial basis, periods/sample. Public sees league/player context.
5. Member completed-week performers (`playerGuide.best` and `rough`) with
   points/GP/period/coverage; team news and recent moves, with sample labels.
6. Dated sample player spotlights from `edition.playerSpotlights`: actual stats,
   opinions, source/selection dates; never current official awards.
7. ALL FIVE saved AI pairs (`data.weekly.matchups`) with each actual probability,
   returned choice (never infer from first/largest probability), saved timestamp,
   confidence as separate signal, model/prompt/evidence/input unavailable states
   accessible through provenance. Show unmatched/missing/stale explicitly.
8. ALL TEN faces: team identity, top modeled player, price/player links.
9. League happenings (`edition.happenings`) and editorial sources.
10. Complete directory: ten named teams/managers/records/current opponents,
    every roster player (228 unique references) with actual /player/id links;
    functional search (team/manager/player) and at least one meaningful sort;
    native roster disclosures preserve full lists and prior-manager attribution
    whenever showing the previous-season record.
11. Standings ALL10 rows rank/W/L/PF (pointsFor/100, as source UI), sortable;
    stats honest unavailable, transactions, Power unavailable.
12. Stocks/market, trade-analyzer, Arcade/free-throw links; both weekly archive
    entries with correct date/title/route; useful footer and source explanation.

## Craft and accessibility

Use original `/public/courtside/arena.jpg` and/or
`/public/arcade/free-throw-preview.jpg`, selected logos and real portraits. Court
treatment should support league tasks; no giant generic wallpaper, rejected
figurines, fake tiny 3D ornaments or 20 canvases. No scene runtime required.
Meaningful game link may accompany court art. Avoid text over uncontrolled busy
imagery. Semantic Paper + Slate tokens are in `/src/ui/tokens.css`; palette
experiments should stay within these roles/approved bounded court imagery.
Use open type-led sections, useful aligned figures, varied composition.

At1440,390 and320 CSS px: no page-width overflow, clipping, lost content or
microscopic text. Body16px target, secondary14px, metadata12px minimum. Readable
long team/player names. Keyboard focus immediate and visible, semantic headings,
native details, labelled search/sort, actions at least44px on phones; no modal
unless keyboard containment/close/restoration is implemented. Ordinary links and
native HTML preferred. No auto animation/delays; support reduced motion. Check
200% text independently of320px reflow. No paid data calls or saving.

Use these hooks for honest root verification, on your OWN authored elements:
`data-mock-ready="NN"` on main/body when rendering completes; `data-team-id` on
each directory team's container (exactly10); `data-ai-pair` on each of5 saved
pair rows when available; `data-face` on each of10 faces; `data-roster-values`
around complete member valuation list; `data-personal` around member content.
These hooks do not prescribe your visual layout.

## Comparison

Root will render every initial public/member direction at desktop/phone, create
a labeled contact sheet/gallery, inspect section order/footer and data truth,
and compare clarity/action discovery/identity/readability/mobile against #271.
No subjective design score will be presented as statistical proof. A separate
independent critique follows ALL20 first submissions; strongest diverse concepts
are iterated separately with visible before/after rationale. Do not copy others.
