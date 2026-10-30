# Concept 11 — a useful minute, with the full page behind it

Discovery only. Author 11 owns `qa/homepage-personal-20/11/`. No presentation code has been written. The inspected product revision is `0d4564101af5a9267b152ccf08455e87a480ac33`.

## Product decision

The returning visitor's first question is “What deserves my attention before I leave?” The page should answer that with a current matchup, the most consequential supplied update, and one useful inspection action. A person staying longer should find the supporting roster, evidence, league table and team directory by scrolling normally.

I will compose a compact opening check followed by substantial, open working sections. Hierarchy comes from row alignment, reading order and a small number of stronger headings. The first screen will contain team identity, opponent, known/unknown score, period, current record, a relevant update and a working local action. A court photograph is optional down-page context; it does not take the first screen away from those tasks.

The obvious default I rejected is a row of equally prominent score, price, AI and standings cards. Those quantities answer different questions, carry different certainty, and do not deserve equal emphasis. The visitor's most useful next action will depend on the selected demo team.

## Three complete views

### Reaves Dropper: check the game, then inspect the new evidence

The opening names Reaves Dropper and manager `aidandaly20`, shows the synthetic 2–0 record and first-place standing, and pairs the team with Ware the Hoes At?. Current demo scores are 184.5 and 171. The derived 13.5-point margin may be stated beside the scores as a current margin; it is not a result or forecast. The date is the fixed sample check, October 30, 2026, 08:30 UTC.

The prominent update is that five players now have completed-week evidence. “Inspect Week 2 points” moves to the open evidence section. Damian Lillard's 42.5 points, Joel Embiid's 38, Tobias Harris's 31, Myles Turner's 24.5 and Derrick White's 22 appear with the exact synthetic completed Week 2 period, October 19–25. The denominator is visible: five of 24 roster players have evidence. The other 19 are unknown in this sample. These points never explain the current Week 3 matchup score.

The second update is complete modeled quote coverage: 24/24 players and 1,095.25 modeled FAAB. Its action reaches the full roster quote table. The saved model estimate is subordinate matchup context: 56% Reaves / 44% opponent, saved October 26, with confidence 0.35 separately labelled. It is an explicitly synthetic, uncalibrated model estimate, never live odds or a probability inferred from the score.

Page order after the check: **Completed-week evidence → Your roster quotes → The league this week → Teams → Continue on GOAT / footer**.

### NeuralNets: understand the gaps, then inspect what is available

The opening names NeuralNets and its manager, the synthetic 0–2 record and tenth-place standing. Its opponent is papichooter. papichooter's recorded score is 0; NeuralNets' score reads “Unavailable.” The page states that a leader cannot be determined. No symmetrical 0–0 treatment, margin, progress line or winner is created.

The prominent update is quote coverage: 16 of 22 players priced, with a **1,622.00 modeled FAAB subtotal**. The same line says that six players are unpriced and this is not a complete team value. “Review six missing quotes” moves to the roster section's visible missing-quote list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. A complete quote table remains visible underneath. The number receives less display emphasis than coverage; it is never compared with Reaves' complete total.

The second update explains the missing matchup score. “Inspect matchup status” opens the adjacent readable status disclosure. A short line says that no saved model estimate exists for this sample; there is no empty probability graphic or Run AI control.

Completed-week evidence follows the quote section, rather than occupying Reaves' lead position. It shows Giannis Antetokounmpo at 45 points, Kevin Durant at 33.5 and Rudy Gobert at 29.5, with three of 22 players covered and the same exact Week 2 period. No unsupported form judgments, participation claims or game counts are added.

Page order after the check: **Your roster quotes and missing coverage → Completed-week evidence → The league this week → Teams → Continue on GOAT / footer**.

### Guest: make public browsing useful immediately

The opening is “GOAT Hoopers, Week 3” and states that this is public league context. It has no selected member, private roster summary or implied ownership. All five synthetic pairings form the opening working list, including the explicit zero/unavailable distinction in papichooter–NeuralNets. “Explore the league table” is the local primary action; “Sign in on GOAT — current site” is an ordinary external link to the real account entry.

The full ten-team standings table follows, then a public team directory and a short explanation of what GOAT's existing destinations offer. The guest does not receive either member's saved estimate or personalized evidence/value summary. Public team inspection uses the supplied identity, manager, current record and qualified previous-season record. The other eight rosters are not fabricated.

Guest page order: **Public pairings → League table → Teams → Explore GOAT → Footer**. This is a complete browsing homepage, without a large sign-in wall.

## Site architecture and navigation

Use the exact supplied horizontal GOAT logo, with a clearly labelled Home link and current-page state. The masthead includes a native selector labelled **Demo persona**: Reaves Dropper, NeuralNets, Guest. It sets `?persona=reaves|neural|guest` and `document.documentElement.dataset.persona`; it never resembles membership or login. Reaves is the default.

A compact local navigation row provides anchors to the sections present in the current view: Your check, Evidence, Roster quotes, League, Teams. Guest receives Pairings, League table, Teams and Explore GOAT. All primary content is already in document flow; these links accelerate movement. Header and navigation can wrap and grow. Sticky behavior is unnecessary for the initial build, avoiding hidden anchor targets when text enlarges.

The member opening uses two unequal columns: the matchup with the primary inspection action, and a shorter ordered list titled “Latest in this sample.” Updates retain their supplied timestamps; the label does not claim a last-visit history. Below it, broad horizontal sections support real tables and readable prose. There are no nested scrolling readers, full-page tab panels or required carousel steps.

The league section keeps all five pairings and all ten standings visible. Current standings are not re-sorted around the viewer; a text “Your team” marker identifies the member. Current scores and points-for use different column labels. A six-team playoff rule can be stated as league context, but no qualification odds or clinching claim is inferred.

The Teams section is a compact ten-team directory with names, managers and current records. A native disclosure per team reveals its 2025 result and a clearly identified external profile link. NeuralNets' 2025 information always includes “Under the previous manager as QBs Gremlins.” A 2025 finish never appears as the present standing. No dedicated champion promotion is needed.

The footer is a useful destination directory, visibly titled **Continue on the current GOAT site**. Each group is explicitly marked as leaving this prototype; individual link text or an adjacent visible “Current site” suffix keeps the destination clear wherever it is repeated.

| Footer group | Existing destinations retained |
| --- | --- |
| Read and browse | Home `/`, News `/news`, Teams `/teams`, The Table `/table`, History `/history`, Weekly archive `/weekly` |
| Work with your league | Stocks `/stocks`, Transactions `/transactions`, Draft `/draft`, Intel `/intel`, AI Decides `/ai-decides`, Trade Analyzer `/trade-analyzer` |
| Play and account | Arcade `/arcade`, My Team `/team`, Sign in `/login` |

Contextual links also appear beside relevant content: Stocks beside quotes, AI Decides beside the saved-estimate explanation, The Table beside standings, and Teams beside the directory. The footer additionally includes “About this synthetic demo,” its fixed sample date and “Back to top.” It does not claim a functioning subscription, contact service or notification system.

## Typography, composition and identity

- **Short identity headings:** local Archivo Black, regular, approximately 30–38px with 1.12 line height. Use normal mixed case and let long team names wrap. Section headings use Lora 600 at 24–28px, creating clear levels without oversized promotional copy.
- **Reading text:** local variable Lora, 16px/1.55 at weight 400; 600 for short leads. Explanations stay around 52–65 characters per line. Its job is comfortable source and status reading; it is not used for narrow numeric columns or control labels.
- **Controls, navigation and roster names:** Arial/Helvetica/system sans, 15px/1.35, weights 400/600. Familiar compact letterforms keep repeated names and actions readable. “Giannis Antetokounmpo,” “Kristaps Porziņģis” and “Stephon Castle’s Back” are wrapping test cases; none is clipped to initials or ellipsized as the only identity.
- **Quantities:** existing local IBM Plex Mono regular, 14–15px/1.5 with tabular figures and right alignment. Scores can rise to 30–34px. Units stay attached through labels and column headings. Missing values are words, rather than a numeric dash that could mean zero.

Use approximately 1,300px maximum page width, 32–48px outer gutters, 24–32px between working columns and 40–56px between major sections. Start from actual content, not an arbitrary fixed height. At 1120px the main section remains wide enough for names and four useful table columns; secondary explanation moves below its table if its measure becomes too narrow. At enlarged text, controls and sections grow and columns stack. No typography is reduced to preserve a screenshot.

The visual identity will use the unchanged GOAT logo, deep ink, a light neutral ground and one restrained strong accent for actionable emphasis. Thin section rules and aligned baselines organize the page. There will be no enormous arena backdrop, ornamental ticket/jersey shape or repeated framed metric grid. Approved player portraits may assist identification in evidence rows at a modest size, with names still doing the work. Missing portraits use labelled initials. No new fonts or assets will be downloaded; the existing OFL files remain intact.

## Useful local action flows

1. **Quick check to player evidence:** activate the opening evidence link; navigate to `#evidence` with ordinary browser history; focus the section heading when appropriate. Every supplied eligible row is visible. Its “Inspect evidence” native disclosure adds the exact period, supplied points, participation label and the sample limitation. Closing returns to the row's summary; browser Back returns through the anchor. There are no invented games or scoring components.
2. **Coverage to individual quote:** Reaves' “Inspect all 24 quotes” reaches the full table; NeuralNets' “Review six missing quotes” reaches the visible named coverage list immediately before its table. Every roster player and supplied quote is present in normal flow. “Quote details” reveals modeled status, fixed check time and the distinction between modeled value and cash. An unpriced row explains that no quote is supplied. An optional native labelled search filters only this already loaded table, reports the result count, and has Clear; it never hides the missing-coverage explanation.
3. **Matchup inspection:** the check offers a named native disclosure containing both team identities, recorded values and fixed sample provenance. Reaves can expand saved-estimate details here, with probability, returned choice, confidence and save time distinct. NeuralNets instead gets the exact missing-score and absent-model explanations. No simulated refresh or generation button appears.
4. **Public team inspection:** each directory row discloses its source-backed season context locally. The external `/teams/:id` link is separately labelled. Guest can complete a useful identity/history inspection without pretending to authenticate.

Native summaries provide keyboard opening and closing without a modal focus trap. All state-changing controls have explicit labels, visible focus and approximately 44px targets. Links navigate; disclosures reveal. No whole-row click target contains other interactive elements. Expansions grow the page. Core tasks do not rely on hover, animation or color.

## Source applications and limits

### Assigned primary references actually read

**Hallmark, `references/redesign.md`: full 76-line raw document read**, after opening the assigned GitHub page. Primary URLs: [assigned file](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md), [raw content](https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/redesign.md). Sections used: “What a redesign keeps,” “Depth,” “Before,” “The plan,” and “After.” Its inventory discipline caused the explicit destination mapping, fact/period preservation and unchanged-logo requirement above. Its app-screen distinction supported a working first screen rather than a separate hero performance. I used these principles as reading material; I did not install Hallmark, run its scripts, adopt its theme mechanism or follow its external approval workflow. The experiment's explicit permission for independent QA composition governs the palette, type and ordering. This source supplied no visual prescription.

**pbakaus `adapt`: relevant article sections read directly on the assigned page**, including “Assess Adaptation Challenge,” “Desktop Adaptation,” responsive layout/content/navigation guidance, “Verify Adaptations,” and the inline references on content-driven breakpoints, input method and testing. Primary URL: [adapt](https://www.ui-skills.com/skills/pbakaus/adapt). Its usage-context question made the one-minute and longer-reading modes simultaneous on the same page. Its desktop content guidance led to open evidence, quotes and league tables, with disclosures limited to supplemental detail. Its content-driven sizing guidance led to wrapping headers, moving explanations below tables and retaining type size at 1120px. Its input-method and evidence distinctions require keyboard-complete controls and honest later reporting about browser versus physical-device checks. Mobile-only recommendations do not extend this desktop assignment. No source installation occurred.

### Product and project source reads

Read the assigned author brief, complete `AUTHOR-BRIEF.md`, complete `PRODUCT-INVENTORY.md`, the complete data-only fixture (including both member rosters, guest, destinations, limits and assets), and the local font catalog. Confirmed that fixture JSON and JavaScript export represent the same data. Summing supplied priced rows gives exactly 1,095.25 for Reaves and 1,622.00 for NeuralNets; this check does not turn the latter into a total.

Read complete `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts` and `src/ui/siteDestinations.ts`. These establish the current product capability inventory and the server-only real membership boundary. Their effect here is a visibly synthetic persona selector, no public private-summary claim, source-specific fallback behavior, and retained destinations. Their production component sequence and styling are not copied.

Read repository `AGENTS.md`; relevant `ARCHITECTURE.md` sections on repository shape, homepage, personalized projection, data flow/contracts, caching and accounts; and relevant `DESIGN.md` guidance on data, controls, content voice and personalized states. Also read the project GOAT design skill and its hierarchy/access references. These keep quote coverage, unknown scores, evidence periods, history qualifications, native semantics and ownership explicit. This isolated QA work changes none of those production files or contracts.

## Build handoff and verification boundary

Await the root build followup before creating HTML, CSS, JavaScript or `NOTES.md`. Carry this source ledger into build notes then. Build files, if requested, remain entirely in this author's directory, with only the data import from `../fixture.js` and approved existing asset/font references. Set the assigned readiness marker only after content/fonts settle. A later `?stage=structure` will neutralize imagery and colors while preserving this full geometry and content.

Later checks should cover all three query states at 1440px and 1120px; long names; enlarged text; keyboard disclosure/search/anchor behavior; Back behavior; external-exit labels; and the absent/zero/partial/complete distinctions. Contrast must be measured on the actual rendered pairs. No visual, browser, screen-reader, physical-device, live-data or authentication check has been performed in this discovery phase. Source review, fixture equality and arithmetic checks are the evidence completed so far. There is no unresolved discovery blocker.
