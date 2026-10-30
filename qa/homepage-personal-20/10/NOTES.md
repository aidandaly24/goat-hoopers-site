# Concept 10 — source-ready, frozen

Entry: `http://127.0.0.1:4207/qa/homepage-personal-20/10/`. Default Reaves; explicit `?persona=reaves`, `?persona=neural`, `?persona=guest`. Root owns the final matched captures and package. Only this author directory was written.

The implemented homepage follows the accepted roster-composition architecture: five position groups, a proportional ribbon of known modeled quotes, named holdings, in-flow position/player inspection, compact team/game context, open league pairings/competition, full site destinations and a semantic source footer. Reaves first inspects its fully quoted centers; Neural first explores its six power forwards, including the three unpriced players. Guest has a public five-game home and public team context.

## Data and scope

All display values derive from the shared data-only fixture. Position groups sum integer cents; the allocation widths use those unrounded group cents. Every displayed share has the basis **known modeled subtotal**. Unpriced players are separate named text with no numeric segment. There is no cash, real-asset, performance, legal-lineup, history or value-rank implication. Competition position is explicitly labeled standings position.

Read-only reconciliation confirmed Reaves 24/24 = 1,095.25 and Neural 16/22 = 1,622.00. Position subtotals and shares are recorded in PLAN.md. Neural's missing score stays Not returned against papichooter's recorded 0.0; neither leader nor tie is inferred. Completed-week evidence, current modeled quotes and saved model estimates remain separately labeled and dated. Neural's 2025 history names the previous manager/QBs Gremlins.

No backend, auth, market, AI, storage, subscription, mutation, live refresh or production call. No dependencies, new downloads, git actions or publication. External GOAT links visibly identify the current site/exit; the synthetic persona selector never claims membership authorization.

## Typography and imagery

- Arial reading text; Space Grotesk controls/navigation; Space Mono numeric data; Barlow Condensed headings. The actual browser resolved these roles as Arial / StudyControls / StudyData. Long names wrap rather than truncate.
- Existing local licensed font files only, referenced in place; existing OFL notices remain intact. Exact supplied SVG logo, small approved player portraits, labeled initials when absent, and the existing free-throw preview by the real Arcade link.
- No arena scene, hero cutout, figurines, canvas or portrait comparison. Muted position colors encode the allocation and have visible text equivalents.

## Actual primary-source reads and applications

These are retained verified discovery reads, not installed skills or executed reference scripts. No peer source or rejected prototype was inspected.

[Emil Kowalski, Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), also read through its raw primary file: **partial read**, Core Philosophy/Unseen details compound, Animation Decision Framework, component principles for responsive buttons, origins and interruptible transitions. Applied: frequent position/player inspection is immediate; the overview stays available; adjacent detail preserves context; closing returns focus; allocation values do not animate or count up. No motion library or decorative transition was justified.

[Addy Osmani, Accessibility](https://www.ui-skills.com/skills/addyosmani/accessibility): **partial read**, evidence-led audit, text alternatives, contrast/non-color cues, native keyboard controls, focus/obstruction, skip links, targets, reduced motion, navigation/labels/live regions and testing checklist. Applied: a real skip link and landmarks, readable allocation equivalent, native team disclosures, explicit unknown states, controlled/focused inspection regions, keyboard Close/Escape/Back behavior and 44px button targets. Repository guidance supplies the correctly stated large-text contrast thresholds; the reference's shorthand px thresholds were not adopted.

Product reads included the assigned brief/inventory/complete fixture, required homepage/personalization/viewer/destination files, targeted roster-value/current-quote/value/action code, and relevant AGENTS/ARCHITECTURE/DESIGN contracts on access, source ownership and data meaning. Those reads established the distinction between request-private membership, public league access, a current modeled quote, recorded history and dated saved AI. The website structure and visual system are this author's choices.

## Bounded actual browser evidence

`verify.mjs` uses the existing system Chromium at `/usr/bin/chromium` through installed Playwright. The unavailable managed headless-shell path was replaced with this existing binary; nothing was installed. Final recorded run passed and is stored in `browser-evidence.json`.

The run covered all three personas at **1440×1000 and 1120×1000**, checking readiness/persona, no horizontal page overflow, visible button targets of at least 44px and loaded images. Actual position → player → browser Back → Back → Forward, Close and Escape flows passed for both members, with expected heading/origin focus. Actual guest matchup and qualified team-history inspection passed. Reaves model split/confidence and Neural null-versus-zero context were checked in rendered text.

All three personas also passed **200% root text at 1120px** without horizontal overflow or right-edge offenders. Reduced motion was enabled for the recorded run. A keyboard pass used Tab to reveal Skip to content, Enter to focus main, Enter to activate the primary position, and Escape to return to its trigger. Structure mode retained the exact measured Neural overview width/height and five allocation segments. No browser page errors or HTTP error responses occurred; all requests stayed on the existing local static server.

Two member viewport PNGs from the final run and one additional guest viewport PNG were visually inspected locally. The separate guest check found no duplicate IDs, confirmed resolved font roles and 33 visibly identified GOAT exit links. A direct `?persona=neural#player-4866` load displayed AJ Dybantsa as Unpriced with no evidence; Close safely focused the roster heading.

These checks are bounded evidence, not a claim of WCAG conformance, a screen-reader audit, production behavior, browser zoom testing or mobile verification. Enlarged text used root font size 200%, not a browser zoom shortcut. Root retains ownership of final full-page captures.

## First three tasks and capture contracts

Machine-readable selectors, actions and expected outcomes are in `TASKS.json`. For each member: `#primary-position`, `#lead-player`, `#primary-matchup`. For guest: `#primary-matchup`, `#matchup-m4`, `[data-team-disclosure="8"] summary`. These are stable selectors in each initial view. Browser Back/Forward supports inspection hashes; Close/Escape restore the original visible trigger, or the roster heading for a direct link.

Ready selector: `html[data-personal-study-ready="10"]`, set after local fonts resolve and two animation frames. Resolved persona is `html[data-persona]`. Append `&stage=structure` to a persona URL to neutralize palette/images while keeping the same content and geometry. No primary content depends on hover or motion.

Source syntax check: `node --check qa/homepage-personal-20/10/app.js` passed. No production typecheck/build was run because no production application file changed. Source is frozen for parent capture/review; no remaining blocker.

## Final label-only cleanup

Removed decorative 01/02 prefixes from member Roster composition, guest League scoreboard, and shared Around the league labels. An aria-hidden figure-space spacer preserves the previous label placement and geometry; the meaningful text remains unchanged. No task, data, navigation or styling redesign was made.

The focused three-persona Chromium comparison at 1440×1000 confirmed exact matching label text bounds and overview bounds before/after, with zero remaining section-number elements. Evidence: `prefix-cleanup-evidence.json`. The current app.js syntax check passed. The earlier 68-assertion journey evidence predates this label-only change; the unchanged full suite was not rerun, as requested. Current source hashes are in `SOURCE-SHA256.txt`. Frozen again for root recapture/recompilation; no blocker.
