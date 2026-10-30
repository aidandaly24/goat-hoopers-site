# Concept 15 — A personal home you can settle into

Discovery only. No presentation code has been written. This plan is independently authored for the casual returning member question in `briefs/15.md`. I have not opened peer concepts, prior prototype implementations, or the rejected catalog.

## Product decision

Make GOAT feel like a place the member recognizes, then answer the next useful question. The page should reward a two-minute visit without requiring the visitor to interpret a financial terminal or read a long editorial introduction.

The chosen architecture has three unequal parts: a steady left navigation rail; a broad central personal catch-up; and a narrow public league companion. They have different jobs and densities. This is a complete website with identity, navigation, useful local inspection, public context, account entry, and an intentional footer. The left rail belongs to the site, the main column belongs to the visitor, and the companion keeps the visitor connected to their league.

I privately considered three materially different architectures before choosing this one. The obvious default rejected is a wide dashboard of equally weighted score, valuation, AI, news, and standings cards. Equal boxes ask a casual member to perform the prioritization. The chosen page makes that prioritization explicitly and changes it when the available evidence changes.

## Three complete states

### Reaves Dropper: know where this week stands, then inspect something new

The first fold gives the identity, manager, synthetic current record (2–0, first in the supplied standings), and Week 3 pairing with Ware the Hoes At? The score reads 184.5 to 171, labelled **Synthetic current score**, with a factual 13.5-point difference. It does not assert a win or a live clock. A **Look at this matchup** action opens the local pairing inspection.

Immediately below the score, two concise catch-up items say that completed-week player evidence is available and all 24 player quotes are present. These are the fixture's changes, dated to their supplied timestamps; they are not a fabricated notification inbox. Their actions take the reader directly to the relevant main-column content.

The next main section is **A look at last week**, showing all five supplied evidence rows in normal flow: Damian Lillard 42.5, Joel Embiid 38, Tobias Harris 31, Myles Turner 24.5, and Derrick White 22. Each value is counted points from **Synthetic completed Week 2, October 19–25**. The section says that evidence covers 5 of 24 roster players. It does not infer poor play for the other 19, game counts, injuries, improvement, or a best lineup. Joel Embiid's approved portrait is useful identity support; players without portraits retain readable name/position treatment.

**Your roster quote** follows the evidence: 1,095.25 modeled FAAB, coverage 24/24, calculated at the supplied October 30 08:10 UTC instant. A short explanation distinguishes this amount from cash and from performance. Three priced roster anchors are Joel Embiid, Anthony Edwards, and Alperen Şengün. The complete 24-player quote list is a normal-flow disclosure, not a separate reader with its own scrolling. No value rank or trend is supplied.

Saved model context lives beside the matchup inspection, rather than competing as another homepage headline. Reaves' matched saved estimate shows 56% / 44%, its October 26 timestamp, and its synthetic, uncalibrated status. Confidence 0.35 has its own label and never appears as the 56% estimate's confidence interval. Nothing runs a model.

### NeuralNets: establish what is known without making the page feel broken

NeuralNets gets its own coherent central composition. The identity reads 0–2 and tenth in the supplied current standings. **Your team, with the gaps called out** leads with the fixture's two useful updates rather than reproducing Reaves' score-first confidence.

The leading content explains that 16 of 22 quotes are present and names the six unpriced players visibly: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler, and Darryn Peterson. A compact **Inspect the roster quotes** action opens the full list beneath this section. The 1,622.00 amount is subordinate text labelled **Modeled subtotal for 16 priced players**; it never becomes a large complete team value or a comparison with Reaves.

The matchup area pairs NeuralNets with papichooter. NeuralNets reads **Score not returned**; papichooter reads **0 recorded**. There is no numeric zero in NeuralNets' score position, leading team, margin, probability bar, or empty loading skeleton. The local inspection explains both states and says no saved model estimate is supplied. There is no Retry button that cannot change this offline fixture.

The completed-week section remains useful and visible: Giannis Antetokounmpo 45, Kevin Durant 33.5, and Rudy Gobert 29.5, with the same explicit synthetic period and 3-of-22 coverage. This positive, grounded content prevents missing data from consuming the whole home. Giannis' portrait anchors that section. A previous-season reference, if shown in inspection, says **2025: 1–20, tenth — under the previous manager as QBs Gremlins** in the initially visible historical line.

### Guest: join the league's public view without claiming a team

Guest changes the main column to a public home. A modest **Welcome to GOAT Hoopers** title is immediately followed by the five Week 3 pairings and known synthetic scores. **Sign in on GOAT for your own team — leaves this demo** is an ordinary external account link, not a pretend form or a demo-persona claim action.

Below the pairings, a public team directory lists all ten fixture identities, managers, current records, and clear local team-inspection actions. It does not consume member persona quotes, saved AI, change lists, or evidence as guest-private content. The public companion becomes the full league ladder plus a small league-history reference and Arcade entry. A guest can therefore browse the whole public league and inspect useful team context without signing in.

## Website architecture and navigation

At 1440px, allocate roughly 176px to the quiet navigation rail, 640–700px to the main reading column, and 280–304px to the companion, using flexible tracks and real gaps. The central title is about 36px, not a viewport-sized statement. The opening useful content begins within the first 180px of the document. The companion starts alongside the opening section, not below a giant cover image.

At 1120px, retain the navigation rail and readable main column; move the companion into ordinary flow below the personal content. Preserve all five pairings and the complete ladder. Text enlargement can trigger that rearrangement earlier. There are no fixed-height content panels or shrunk team names. No mobile design or phone captures are planned in this phase.

The rail carries the exact GOAT horizontal logo, current **Home** location, local anchors for **Your week**, **Your players**, and **The league** (guest labels adapt to **This week** and **Teams**). A separate clearly labelled **On the GOAT site — leaves demo** group offers My Team, News, Stocks, and Arcade. This makes the main website destinations visible without a 15-link header. The rail can be sticky on tall desktop viewports but must not trap navigation in an internal scroll area; at short viewport heights it becomes ordinary flow.

The member companion contains:

1. **This week around GOAT**: all five pairing summaries in one coherent list, with the member's pairing marked in text and known/missing score distinctions retained. It is a schedule, not five equal cards. The duplicated member pairing is compact here; the detailed main section is the place to work.
2. **The league right now**: all ten standings positions, names, and win–loss records in a single ordered ladder. Points for are available in local team inspection, avoiding another dense numeric column. The member is labelled **Your team** without reordering the official supplied ranks.
3. A compact Arcade entry with the approved free-throw preview, a specific play description, and an explicitly external GOAT link. Its purpose is a pleasant optional activity after the catch-up.

The semantic footer spans the content area and supplies the remaining discovery paths in understandable groups: **Follow the league** (Teams, Transactions, The Table, News); **Explore and decide** (Stocks, Draft, Intel, AI Decides, Trade Analyzer); **Keep the record** (History, Weekly archive); and **Account** (My Team, Sign in). Home and Arcade remain reachable here too. Exact fixture routes are retained. External destination labels visibly identify the GOAT site; they never land on a local imitation of that service.

The footer also contains the source explanation and a small exact logo. It finishes the website rather than merely repeating a copyright strip. Historical content remains dated and optional; the 2025 final is not recast as a current league event.

## Typography and owned visual identity

Use the already licensed local **Lora** variable font for reading paragraphs and main/section headings. This gives the welcome and explanatory content a human reading rhythm without making data look like a newspaper headline. Paragraphs use approximately 17px/1.6, regular weight, near-zero tracking, and a 48–58ch measure. Section headings use 25–28px/1.2 at weight 600; the page heading uses about 36px/1.12. Normal mixed case is the rule.

Controls and compact identity lists use `Arial, "Liberation Sans", sans-serif` at 15–16px, regular or bold as available. This is a deliberate familiar utility role, not a second display style. Native selects use the same face and scale. Long labels wrap and targets grow vertically; controls have at least 44px target height.

Scores, quotes, record lines, timestamps, and ladder positions also use that sans stack with lining tabular figures. Numeric alignment does not require monospace. Pairing scores use approximately 30–34px, quote headlines 27–30px, and list data 16px. Weight, baseline, units, and alignment establish hierarchy. The full names **Giannis Antetokounmpo**, **Stephon Castle’s Back**, and **Kristaps Porziņģis** must fit through natural wrapping rather than truncation or compressed tracking.

Own the visual language with a pale cool canvas, dark maritime-blue structural rail and headings, quiet warm-white reading surfaces, and one fresh chartreuse accent for the active personal area and primary local action. Exact shades remain an implementation/contrast decision. There are no gradients, ornamental graphs, grain, floating sports objects, or repeated shadowed cards. Rounded corners belong to the principal matchup surface and buttons; the majority of text stays on open page space. The logo, named league members, occasional approved player portraits, and restrained basketball preview provide GOAT identity. The court does not become background wallpaper.

Only the existing Lora file will be referenced; its OFL notice stays intact in the shared licensed asset directory. No downloads, dependencies, or font installations are needed. No DM Sans, Georgia/Verdana pairing, or monospace data default is planned.

## Useful local flows

- **Catch-up to evidence:** a change item targets the visible completed-week section; focus moves to its heading. Each player has an inline disclosure with the supplied counted points, position, exact source period, coverage explanation, and an explicitly external actual-player-profile link. There are no invented box scores or game counts.
- **Inspect quotes:** a native disclosure opens the full roster list directly in document flow. A labelled name filter and a labelled sort select support Name / Highest known quote; null quotes always retain **Unpriced** and a predictable final position. Neural's missing names remain visible before expansion. Closing the disclosure returns to its summary; content has no max-height reader.
- **Inspect matchup:** a short native dialog shows both team identities, current record lines, supplied scores or explicit missing state, source instant, and the relevant saved estimate only when provided for that member. Close and Escape restore focus to the opening control. A local hash identifies the pairing; Back closes the inspector and Forward reopens it. Normal content is already present on the home before this inspection.
- **Inspect team:** names in public lists open a short local team dialog using only `fixture.teams`, `standings`, and `matchups`: identity, manager, current record, points for, pairing, and dated previous-season line. For teams without supplied roster data, no roster is invented. The route to the actual public team page is clearly an external GOAT link. The same close, Back/Forward, and focus rules apply.
- **Choose demo persona:** an explicitly labelled native **Demo persona** select near the synthetic label navigates among `?persona=reaves`, `?persona=neural`, and `?persona=guest`. Reaves is the default. The document dataset matches the query. Changing persona closes inspection and returns to the page heading. It is never labelled as membership, login, or account switching.

## Data, accessibility, and implementation limits

Use only the data export in `../fixture.js`; no shared presentation imports. Show **Synthetic demo** near the opening and a keyboard-accessible **About these numbers** disclosure explaining the as-of instant, synthetic current quantities, authorized identity references, historical qualifications, and absence of live services. Dates are fixed source dates, not a clock that starts advancing.

Semantic `header`/`nav`/`main`/`aside`/`footer`, one H1, sequential headings, a skip link, native controls, visible focus, explicit labels, and text status accompany the composition. Text and focus contrast require measured implementation checks. Reduced-motion users get identical tasks and content; the default can be still, with immediate control feedback. No content waits for an entrance animation.

No lineup edits, saved lineup, trades, simulated login, notifications, AI generation, current history line, value rank, Lineup Power, or fake news will be added. Source absence is explained locally at the relevant task. Core league browsing remains available in every persona.

Build followup would create only this directory's HTML/CSS/JS and NOTES. It would retain full geometry/content under `?stage=structure` while neutralizing color/images, then set `data-personal-study-ready` through `document.documentElement.dataset.personalStudyReady = "15"` after content and fonts settle. Checks should cover all three personas, 1440/1120 layouts, text enlargement, keyboard inspection and restoration, Back/Forward, missing/zero differences, and source/exit labels. No build or browser/visual checks are claimed at discovery stage.

## Source reads and concrete applications

### Assigned public references

- [Addy Osmani, Frontend UI Engineering](https://github.com/addyosmani/agent-skills/blob/main/skills/frontend-ui-engineering/SKILL.md) — partial relevant read: Component Architecture and State Management; Reference-led UI quality; Avoid the AI Aesthetic; Spacing/Layout; Typography; Accessibility, including Keyboard Navigation, Labels, Focus Management, and Meaningful Empty/Error States; Responsive Design; Loading/Transitions; Red Flags and Verification. Applied by writing this design contract first, assigning unequal areas to different visitor tasks, using local URL state for inspection, and giving missing data meaningful content. I did not adopt its component scaffolding or install scripts. Its generic mobile-first and project-style guidance does not override the explicitly desktop-only, independently styled QA assignment.
- [Emil Kowalski, Apple Design](https://www.ui-skills.com/skills/emilkowalski/apple-design) — partial relevant read: §7 Spatial consistency; §12 Materials and depth; §14 Reduced motion and accessibility; §15 Typography; the visible opening of §16 Design foundations. Applied by keeping inspection attached to a named origin with a predictable return, varying leading and weight by reading role, allowing layout to grow with text, and making still interaction complete. I declined gesture physics, translucent layers, and animated depth: this homepage's work is reading, selection, and inspection. The assigned source opened successfully; no alternative or source index was substituted.

### Actual project and fixture

- `AGENTS.md`; `ARCHITECTURE.md` directory map, weekly evidence, recorded-only team history, Courtside home/archive, Personalized team front page, data flow, contracts, responsive and caching sections. The source architecture explains the production boundaries; this experiment keeps them untouched.
- `src/app/page.tsx`, `src/surfaces/season-hub/CourtsideHome.tsx`, `src/domain/personalized-home.ts`, `src/data/home-viewer.ts`, and `src/ui/siteDestinations.ts` read directly. These established server-resolved private membership, fail-soft public access, explicit historical periods, saved-model matching, and the actual route inventory. The prototype's labelled persona is intentionally only local test state.
- `DESIGN.md` relevant sections: What each view should accomplish; Tables, controls and accessible behavior; Content voice and weekly workflow; Personalized team edition. Applied its honest access/data/ownership and interaction guidance. The production palette, fonts, fixed section order, and shared presentation primitives were not treated as this QA concept's visual constraints.
- `qa/homepage-personal-20/AUTHOR-BRIEF.md`, `PRODUCT-INVENTORY.md`, `briefs/15.md`, full data-only `fixture.json`, and the `fixture.js` export shape. Independently checked both roster counts, priced counts, known-price sums, and evidence counts: Reaves 24/24, 1,095.25, five evidence rows; Neural 16/22, 1,622.00, three evidence rows. All match the supplied summary fields.
- Local font catalog plus Lora's existing font/license presence and the approved courtside asset inventory. No assets or fonts were downloaded. No prototype presentation source was inspected.

## Status

Discovery complete. Deliverable is this plan only. Awaiting root's build followup; no known discovery blocker.
