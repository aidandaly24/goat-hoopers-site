# Concept 11 — Your place in the league

Revised independent plan; league-circuit architecture accepted by root for build. Own directory only: `qa/homepage-personal-20/11/`. Product source revision: `0d4564101af5a9267b152ccf08455e87a480ac33`.

## Two alternatives and selection

**Alternative A, selected: league circuit.** Ten openly readable, ranked team positions surround the visitor's current matchup. It answers a manager's useful-minute questions together: where am I in this league, whom am I playing, and how is our game going? Broad roster and league sections continue below. The geometry is a four-column perimeter: ranks 1–4 across its top, 5 at right, 6–9 around the bottom, and 10 at left, with an independent central game. Rank numbers make the clockwise reading order explicit. This is an ordered HTML list and game section, not a radar plot, score visualization or invented distance metric.

**Alternative B: three full-width time chapters.** Current Week 3, completed Week 2 and qualified franchise history could form a chronological home with substantial visible detail in each chapter. I reject it here because it gives past material too much of the visitor's useful minute and weakens the immediate sense of their ten-team competition.

The selected design replaces the earlier pale check-and-tables plan. No compulsory all-roster or standings-table spine remains. There is no side rail, court index, giant portrait introduction, five-pairing opening roll call or three-player-card sequence.

## Complete architecture

The exact GOAT logo anchors a light masthead. A mixed-case navigation row has local Home, Your roster, League games and Explore GOAT links. Home is current. A native **Demo persona** select is clearly separate from an external **Sign in · current site** account link. Query values are `reaves`, `neural`, `guest`; default Reaves. The document persona dataset follows this synthetic state only.

A short title identifies **Your place in the league / Week 3** and the fixed October 30, 2026 sample. The circuit occupies a saturated warm vermilion field with dark readable text; the central matchup is an ink rectangle with light text. Ten team positions are unboxed, with visible rank, complete name, current record and points-for. “Your team” and “Your opponent” text provide the member connections. All facts are visible before clicking. Selecting a team opens supplemental local season/context details, leaving the substantial home intact.

Below the circuit, substantial horizontal sections alternate open neutral reading space and a warm roster surface. Member content includes named players, completed-week points and coverage, modeled prices, exact-period explanations, supplied sample updates, all five current pairings and useful real-site routes. The guest receives public league facts, all five pairings and explanations of the existing league destinations. No section depends on hover, internal scrolling or opening a tab.

At 1440px the circuit perimeter uses four roomy columns and a center spanning the middle two. At 1120px names wrap; if the center or perimeter becomes too narrow, the central game moves ahead of the ordered list. Enlarged text produces the same game-then-list reflow. Nothing is shrunk or removed to preserve the diagram. Rank order remains the HTML order, and the central matchup precedes the ordered list in reading order. This geometry has no relation to the user's unrelated work dashboards.

## Distinct member and guest priorities

**Reaves Dropper:** show its 2–0 record, first-place league position, Ware the Hoes At? matchup and current synthetic 184.5–171 score. The 13.5 margin is a current arithmetic difference, not a result. “Inspect your matchup” is the first local action. The new completed Week 2 breakdown follows the circuit: five named players and points, with five-of-24 coverage and October 19–25 period. The full quote is 1,095.25 modeled FAAB, 24/24 coverage, with selected high-value players visible and an optional all-24 quote disclosure. The saved 56/44 estimate is supplemental matchup context; confidence 0.35, generation date and uncalibrated synthetic status remain separate. The member's full evidence list is visible without interaction.

**NeuralNets:** show its 0–2 record, tenth-place league position and papichooter opponent with a recorded zero against NeuralNets' **Unavailable** score. No leader or margin is inferred. Its first action still serves fantasy league work: inspect its own game. The next broad section is a roster check, with 16/22 quotes, 1,622.00 explicitly a subtotal, the six named unpriced players, and usable player evidence for Giannis Antetokounmpo, Kevin Durant and Rudy Gobert. Absence is explained calmly within the league home; the page does not become a repair console. No saved model estimate exists. History always qualifies the previous manager as QBs Gremlins. Neural's roster/evidence order and first supporting action differ from Reaves.

**Guest:** the center is a public league introduction with ten teams, six playoff places and a local link to the games. All ten ranked teams remain readable around it; none is labelled “your team.” Guest gets public game/identity inspection and the complete five-pairing section. It receives no member quote/evidence summary or saved member model. Sign in is a visibly external real GOAT link, never a fake local form.

## Typography and identity

- Reading copy: local **DM Sans**, 16–17px / 1.5, weights 400 and 600. Short paragraphs are limited to roughly 60 characters. This differs from the old Lora reading voice and is chosen for rounded, conversational sports copy.
- Controls: local **Barlow Condensed**, 18px minimum / 1.2, normal mixed case, normal tracking. Labels wrap and controls grow. No shrinking long labels. Navigation is 19px.
- Quantities: local **IBM Plex Mono**, 14–16px / 1.5 with tabular figures; center scores about 34px. It differs from the already used Verdana/Space Mono pairing elsewhere. Values, units and unknown words are explicit.
- Short week labels: local **Graduate**, 28–36px. It supplies a limited athletic accent; team names use DM Sans 600 at useful reading sizes rather than a novelty face.

Use the exact supplied black/white GOAT logo. Local portraits belong to named player rows, with sensible initials for missing images. The existing free-throw preview supports the Arcade destination further down the page. The opening needs no large arena image. Existing font bytes and OFL notices remain unchanged; no downloads or new dependencies.

## Navigation and footer

Local page anchors support ordinary navigation and browser Back. “Explore GOAT” is a visible route directory, with every current-site exit labelled. Group destinations by purpose:

- Follow the league: Home, News, Teams, The Table, Transactions, Weekly archive, History.
- Make a decision: Stocks, Intel, AI Decides, Trade Analyzer, Draft.
- Play and account: Arcade, My Team, Sign in.

Links map to the fixture's exact existing routes. Contextual Stocks and AI Decides exits sit with relevant member sections. The semantic footer contains the intact logo, fixed synthetic sample explanation, source disclosure, current-site route groups and Back to top. Synthetic demo is visible near the masthead and the page explains identities, constructed current numbers and historical qualifications accessibly.

## Local actions, Back and focus

1. **Inspect your matchup:** a native modal shows known scores, both identities, exact sample context, and saved model details only where supplied. Matchup facts are already visible in the home. The dialog has a named heading, Close, Escape, contained focus, restored trigger focus, and URL hash state so Back closes it.
2. **Inspect a circuit team:** a team-name button opens the same local inspector with that public team's record, current opponent/score and qualified 2025 result. The home remains in place. A separately labelled current-site profile exit is available. Guest can complete this task without simulated login.
3. **Inspect player/quote context:** every visible player row has a local inspector for supplied price/evidence/period. Reaves can inspect its five completed-week rows immediately; Neural can inspect three, including Giannis' 45 points. Missing quotes remain unpriced. A native all-roster disclosure exposes the complete supplied quote list with no remote request.

Only disclosures and inspectors change local state. There are no lineup saves, trades, subscriptions, login simulation, refresh promises or model-generation controls. No history line or Lineup Power is fabricated.

## Actual source applications

The prior verified source reads stand. Read the complete assigned Hallmark `references/redesign.md` raw document, especially preservation, app-screen scope and inventory sections: https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md . Its concrete effects are retained facts/destinations/logo and a useful working opening. No Hallmark scripts, theme or approval workflow is imported.

Read the assigned pbakaus adapt article's usage context, desktop, content-driven layout, input method and verification sections: https://www.ui-skills.com/skills/pbakaus/adapt . Its effects are simultaneous visible content, a game-first reflow when perimeter labels stop fitting, controls that do not require hover and accurately bounded browser evidence. No installation or mobile scope expansion.

Read complete `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, `src/ui/siteDestinations.ts`, both briefs, product inventory and shared data fixture. Read relevant architecture/design/access guidance and font catalog. Their effects are server-only real membership, synthetic-only persona state, partial/unknown truth, preserved evidence periods and all existing exits. No peer source or old prototype was read.

## Build and checks

Build only this author's HTML/CSS/JS and NOTES. Import only the shared data fixture, not presentation helpers. Set `dataset.personalStudyReady = '11'` after fonts/content settle. `?stage=structure` removes color/imagery while keeping content and geometry. Verify the first three local journeys with real browser interaction, all personas, 1440px/1120px, enlarged text, Back/focus, structure parity and missing/zero/partial truth. Record selectors, expected results and actual evidence in NOTES. Root owns final captures and packaging; freeze after checks. No shared, production, dependency, git or publication changes.
