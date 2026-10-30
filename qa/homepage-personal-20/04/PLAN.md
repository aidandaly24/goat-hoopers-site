# Concept 04 — Team review

Discovery complete. No presentation code has been written. Awaiting the root build followup after the early three-site gate.

## Product decision

Make the homepage a useful place to review the team's week. The visitor should read the important state, understand its limits, inspect the supporting player or quote, and still be able to browse the rest of the league. A short team heading introduces actual work immediately; no promotional hero or poster substitutes for the website.

The primary question is: **What can I usefully conclude about my team today, and what should I inspect next?**

The obvious default I rejected is a fixed stack of a giant team portrait, three metric cards, five identical matchup cards, and the same story feed with a swapped team name. It gives incomplete information too much apparent certainty and leaves little space for the useful roster. This concept changes the prominence, order and actions of actual content for each state.

## Three complete homepage states

### Reaves Dropper — inspect the week

- Opening identity: Reaves Dropper, aidandaly20, synthetic 2026 Week 3, record 2–0 and supplied standing 1. Use a compact heading rather than repeating identity in several widgets.
- The main opening area is the matchup against Ware the Hoes At?: current synthetic scores 184.5 and 171, with the derived 13.5-point sample difference clearly distinguished from a final result. The main action is **Inspect matchup**. Its supporting context names both current records.
- The saved estimate sits beside the matchup, not in an unrelated AI promotion: 56% / 44%, returned choice Reaves, confidence 0.35, saved October 26. Keep the estimate's experimental label, sample time and confidence separate from the score. No automatic generation or implied calibrated odds.
- A narrow adjacent **Latest in this sample** list shows the two dated changes, linking directly to the player-evidence section and quote section. Do not call it “since your last visit”; the fixture contains no visit history.
- The next visible section is the five supplied completed-Week-2 player rows, with names, positions and points. The sample period and 5-of-24 coverage are visible before the rows. A player action opens the supplied evidence explanation locally. No sum of these five is presented as the team's full score.
- Then show the full 24-player roster and quotes, with the complete modeled FAAB value 1,095.25, 24/24 coverage and calculation time. No league value rank is available: the fixture does not provide complete comparable quotes for every league roster. “Modeled FAAB” is a unit, not a bank balance. The roster is visible in normal flow, with optional inspection for a row rather than a closed full-roster container.
- Continue into the league's other pairings and full standings, team directory, useful destination links and footer. Personal relevance gives the opening its order; it does not consume the whole website.

### NeuralNets — understand the gaps

- Opening identity: NeuralNets, manager NeuralNets, record 0–2, supplied standing 10. No old-manager history appears as this manager's record.
- Lead with **Six players are unpriced**, not a giant incomplete value. All six missing names appear in a useful visible list: Rasheer Fleming, Ryan Nembhard, Dailyn Swain, AJ Dybantsa, Keaton Wagler and Darryn Peterson. The main action is **Review unpriced players**, which reaches their rows in the complete roster.
- The adjacent matchup names papichooter and prints its genuine sample zero as `0`, while NeuralNets reads **Score unavailable**. An adjacent explanation states that no leader or difference can be determined. **Inspect matchup status** opens the exact supplied facts locally; it is not a refresh or repair control.
- The quote section follows immediately: modeled subtotal 1,622.00 for 16 of 22 players. Do not show a complete team total, value rank, comparative value bar or reconstructed missing prices. An unpriced player remains “Unpriced” wherever encountered.
- Show all 22 roster rows in normal flow, placing the six unpriced rows first for this state with a clear ordering label. The 16 priced players remain visible below, rather than being hidden by the primary action's filter.
- The three supplied completed-Week-2 evidence rows follow the roster, with 3-of-22 sample coverage. The missing saved estimate is one compact explanation within matchup context, not an empty probability diagram or a generation button.
- The same substantial league area, directory and destination access remain available. If the optional previous-season detail is opened, its 2025 record is accompanied by “Under the previous manager as QBs Gremlins” in the same readable block.

### Guest — browse a league, then enter an actual account

- Opening is **Week 3 around the league**, with a short public league introduction and all five synthetic pairings already visible. There is no implied personal team, private change list, private roster total or “your players” copy.
- A small account entry beside that introduction explains that actual personal membership is available by signing in on the existing GOAT site. **Sign in on GOAT — leaves prototype** is a real external destination, not a simulated form.
- Pairing rows support local inspection of both public identities/current records and the available score or explicit missing score. Only m1 has a saved model result in this fixture; other pairings must not inherit one.
- Follow with the full ten-team standings and team directory. Opening a team shows public current/qualified previous-season facts. The two supplied sample rosters can be inspected locally; other teams explicitly have no roster supplied here and offer a separately labelled external profile exit.
- Give Stocks, Intel, History and the playable Arcade a short task-oriented discovery area. A small existing free-throw preview is useful here; it is not a full-width decorative scene. Weekly archive and account entry remain easy to find in the footer.

## Navigation, sections and footer

The exact approved horizontal GOAT mark anchors a compact top bar. **Home** has `aria-current="page"`. The bar exposes local jumps to Matchups, Roster/Evidence for members, and League table, plus an explicit **GOAT site destinations** link to the footer. A separately labelled native demo-persona select exposes Reaves / NeuralNets / Guest and changes `?persona=` only. Default is Reaves; the document's `data-persona` follows the selected synthetic state. It never represents authentication.

At desktop width the initial work area uses a broad reading column and a narrower contextual column. Full-width table sections below establish a different rhythm; the whole page is not a grid of repeated boxes. Primary content is present in the initial document flow. A modest quiet rule tracks table rows; type and spacing separate larger sections.

Member order: compact identity → state-specific opening work → evidence then roster for Reaves / roster then evidence for NeuralNets → remaining week pairings → full table and team directory → destinations/Arcade → footer. Guest order: league introduction/account entry → all pairings → full table and directory → destination discovery → footer. These orders are independent product choices, not a rendering of the fixture's example priorities. Showing the roster here is deliberate: the visitor can relate coverage and evidence to the actual supplied names without opening a separate reader.

The semantic footer is a useful sitemap with labelled groups, not a small legal afterthought:

- **Follow the league:** Home (local top), News, Transactions, Teams, The Table, Weekly archive.
- **Make a decision:** Stocks, Intel, AI Decides, Trade Analyzer, Draft.
- **Off the court:** History, Arcade.
- **Your account on GOAT:** My Team and Sign in.

Every fixture destination remains discoverable. External destinations use their fixture paths on the existing GOAT origin and visibly say that they leave this prototype. Internal inspection links and external production profile links are distinct actions. The footer also contains the full synthetic-source explanation and an accessible Back to top link.

## Typography and visual character

The reading and data roles are deliberately different:

| Role | Planned face and treatment | Reason |
| --- | --- | --- |
| Team/page and section headings | Existing licensed Barlow Condensed, mixed case, regular; page 40–44px/1.08, sections 28–30px/1.15 | Compact breadth makes room for the league's actual long names without filling a viewport. No condensed body paragraphs. |
| Explanatory reading | Georgia, 17px/1.55, normal; maximum 60–65 characters | Gives sample explanations a calm reading texture and avoids another default sans body. Most explanations are one or two sentences. |
| Navigation, control labels, table names | Tahoma, Arial fallback; 15–16px/1.4; controls and column headings bold | Direct, sturdy small text for repeated scanning. Long names such as Giannis Antetokounmpo and Stephon Castle’s Back wrap intrinsically. Controls are sentence case and self-explanatory. |
| Scores and numeric columns | Existing licensed IBM Plex Mono; 14–15px table values, 34–40px matchup score, tabular figures and aligned decimals | Keeps columns comparable without making player names monospace or turning the page into a terminal. Units remain adjacent and readable. |
| Provenance | Tahoma, at least 14px/1.45; ordinary sentence case | Source and coverage limits are consequential information, not tiny decorative captions. |

No DM Sans. Do not apply a display face to all text or shrink long labels to fit. Prefer 48–56px roster rows with natural growth, ordinary weight names, clear numeric alignment and a separately named Inspect control. The build may tune these ranges against actual text; role choices are settled.

Visual direction is a pale lilac working canvas with dark plum type, a deeper plum navigation band and restrained warm action accents. Open table areas carry most of the information; filled surfaces distinguish only the opening decision context or a local inspector. Verify actual contrast before freezing colors. The mark remains exact. Portraits, when supplied, remain small identity aids in evidence rows. Do not invent missing portraits, NBA team labels or new assets. Existing OFL files stay in place.

## Primary local inspection flows

1. **Reaves:** Inspect matchup reaches the visible matchup section and opens its additional provenance beneath the current score. The visitor can then follow **View Week 2 evidence** to the already-visible player rows, inspect a row, read its period/participation/points and quote, close it, and remain at the row.
2. **NeuralNets:** Review unpriced players reaches the six already-visible roster rows. Inspecting AJ Dybantsa, for example, states that the quote and completed-week evidence are unavailable; it does not turn either value into zero. Close returns focus to that row's control. Matchup inspection separately retains papichooter's zero and NeuralNets' missing score.
3. **Guest:** Inspect a pairing reveals public facts beneath its row. Inspect team opens current and clearly qualified historical context and the supplied roster availability. The actual GOAT profile exit remains explicitly separate.

Use ordinary anchors for movement and native buttons/details for additional explanation. Row expansions have proper names and expanded state; keep visible data in place. A close control restores focus to its opener. If hashes represent an opened inspection, Back/Forward must restore the open state and focus appropriately; do not create a fake internal page stack. Avoid modal readers, nested scrolling, tooltips carrying essential data, hover-only controls and hidden bulk content. No submit/save/refresh/login/notification action is simulated.

## Sources actually read and their concrete applications

These are design references, not installed skills or permission to execute their scripts. Both assigned references opened successfully. The source log below will be retained in NOTES.md during the authorized build phase.

- [Emil Kowalski, Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): opened the assigned GitHub file, then read the full raw SKILL.md (597 rendered lines), including Core Philosophy, Animation Decision Framework, Component Building Principles, CSS transforms, gestures, performance, Accessibility, Sonner principles and review checklist. The useful effects here are immediate feedback for inspection, stable controls, and a decision to omit entrance/stagger motion from frequently revisited data. Keyboard expansion is immediate. If pointer feedback is animated at all, it is brief, property-specific and removable with reduced motion. I did not adopt the reference's decorative 3D, drag or reveal examples: they do not help this homepage's work.
- [Addy Osmani, Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): read the displayed skill body in full, from Evidence-led audit workflow through Perceivable, Operable, Understandable, Robust, Testing checklist and Common issues by impact (page lines 21–409). Linked subordinate pattern files and the external WCAG reference were not read. Concrete effects are native inspection controls, a skip link, visible focus, explicit labels, a semantic table and footer, text beside unavailable states, deliberate focus restoration, intrinsic name wrapping, and no sticky chrome that can cover an anchor or focused row. The future checks distinguish source inspection, keyboard behavior, enlarged text and screen-reader evidence; automated scores will not be reported as conformance.

Local sources read: assigned 04 brief; AUTHOR-BRIEF; PRODUCT-INVENTORY; shared fixture JSON (including both full supplied player arrays) and data-only JS export; AGENTS; ARCHITECTURE's one-way data flow, homepage/weekly archive, personalized home, missing-data, recorded-quote, surface/access and UI contracts; all five requested homepage contracts (`page.tsx`, complete `CourtsideHome.tsx`, `personalized-home.ts`, `home-viewer.ts`, `siteDestinations.ts`); relevant DESIGN guidance on truthful data/access/ownership and the project design skill's navigation/accessibility reference; existing local font catalog. Production palette, fonts and fixed section sequence are not this QA concept's constraints. No peer prototype, prior study source, rejected catalog, old editorial edition or unrelated screenshot was inspected.

## Build boundaries and future verification

Only `qa/homepage-personal-20/04/` is owned. Future build will contain its own HTML/CSS/JS, use only the shared data import, label **Synthetic demo** visibly, and expose the full provenance explanation accessibly. No live API, storage, auth, pricing, AI or mutation calls. No recorded history series or Lineup Power is supplied, so neither gets a chart or invented metric. Only historical context actually used will be rendered, with its season and previous-manager qualification.

The layout must work at 1440 and 1120 CSS px. At the narrower desktop width, contextual columns may stack while table names wrap; text is never reduced to preserve a rigid arrangement. Enlarged text grows rows and navigation. Structure mode will remove image/color emphasis while retaining identical content and geometry. Readiness will be set to `data-personal-study-ready="04"` only after fonts/content settle.

Planned bounded checks after build: all three persona URLs, all destination discovery, local opening/closing and focus return, null-versus-zero rendering, quoted coverage, long names at both desktop widths, enlarged text, reduced motion and structure mode. Root owns final captures. No browser, device, live-data or accessibility audit has been performed during discovery, and no such validation is claimed.
